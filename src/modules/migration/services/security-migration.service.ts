import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export interface SecurityMigrationResult {
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  privilegesCreated: number;
  policiesCreated: number;
  groupsAssigned: number;
}

@Injectable()
export class SecurityMigrationService {
  private readonly logger = new Logger(SecurityMigrationService.name);

  // Core system privileges
  private readonly SYSTEM_PRIVILEGES = [
    // User Management
    { code: 'USER_VIEW', name: 'View Users', category: 'User Management' },
    { code: 'USER_CREATE', name: 'Create Users', category: 'User Management' },
    { code: 'USER_EDIT', name: 'Edit Users', category: 'User Management' },
    { code: 'USER_DELETE', name: 'Delete Users', category: 'User Management' },
    { code: 'USER_MANAGE_ROLES', name: 'Manage User Roles', category: 'User Management' },
    
    // Account Management
    { code: 'ACCOUNT_VIEW', name: 'View Account', category: 'Account Management' },
    { code: 'ACCOUNT_EDIT', name: 'Edit Account', category: 'Account Management' },
    { code: 'ACCOUNT_BILLING', name: 'Manage Billing', category: 'Account Management' },
    { code: 'ACCOUNT_SETTINGS', name: 'Manage Settings', category: 'Account Management' },
    
    // Security
    { code: 'SECURITY_VIEW_AUDIT', name: 'View Audit Logs', category: 'Security' },
    { code: 'SECURITY_MANAGE_GROUPS', name: 'Manage Security Groups', category: 'Security' },
    { code: 'SECURITY_MANAGE_POLICIES', name: 'Manage Security Policies', category: 'Security' },
    { code: 'SECURITY_VIEW_SESSIONS', name: 'View Active Sessions', category: 'Security' },
    { code: 'SECURITY_REVOKE_SESSIONS', name: 'Revoke Sessions', category: 'Security' },
    
    // API Management
    { code: 'API_KEY_VIEW', name: 'View API Keys', category: 'API Management' },
    { code: 'API_KEY_CREATE', name: 'Create API Keys', category: 'API Management' },
    { code: 'API_KEY_REVOKE', name: 'Revoke API Keys', category: 'API Management' },
    
    // System
    { code: 'SYSTEM_ADMIN', name: 'System Administration', category: 'System' },
    { code: 'SYSTEM_MODULES', name: 'Manage Modules', category: 'System' },
    { code: 'SYSTEM_SETTINGS', name: 'Manage System Settings', category: 'System' },
  ];

  // Policy groups mapping old roles to new privileges
  private readonly POLICY_GROUPS = {
    ADMIN: {
      name: 'Administrator',
      description: 'Full administrative access',
      privileges: [
        'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE', 'USER_MANAGE_ROLES',
        'ACCOUNT_VIEW', 'ACCOUNT_EDIT', 'ACCOUNT_BILLING', 'ACCOUNT_SETTINGS',
        'SECURITY_VIEW_AUDIT', 'SECURITY_MANAGE_GROUPS', 'SECURITY_MANAGE_POLICIES',
        'SECURITY_VIEW_SESSIONS', 'SECURITY_REVOKE_SESSIONS',
        'API_KEY_VIEW', 'API_KEY_CREATE', 'API_KEY_REVOKE',
        'SYSTEM_ADMIN', 'SYSTEM_MODULES', 'SYSTEM_SETTINGS',
      ],
    },
    USER: {
      name: 'Standard User',
      description: 'Basic user access',
      privileges: [
        'USER_VIEW', // Can view other users in same account
        'ACCOUNT_VIEW', // Can view account info
        'SECURITY_VIEW_SESSIONS', // Can view own sessions
        'API_KEY_VIEW', // Can view own API keys
      ],
    },
  };

  constructor(private dataSource: DataSource) {}

  async setupSecurity(options: {
    dryRun: boolean;
  }): Promise<SecurityMigrationResult> {
    const result: SecurityMigrationResult = {
      totalRecords: 0,
      processedRecords: 0,
      failedRecords: 0,
      privilegesCreated: 0,
      policiesCreated: 0,
      groupsAssigned: 0,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      if (!options.dryRun) {
        await queryRunner.startTransaction();
      }

      // Step 1: Create system privileges
      this.logger.log('Creating system privileges...');
      const privilegeMap = await this.createPrivileges(queryRunner, options.dryRun);
      result.privilegesCreated = privilegeMap.size;

      // Step 2: Create security policy groups
      this.logger.log('Creating security policy groups...');
      const policyGroupMap = await this.createPolicyGroups(queryRunner, privilegeMap, options.dryRun);
      result.policiesCreated = policyGroupMap.size;

      // Step 3: Assign policies to account management groups
      this.logger.log('Assigning policies to account groups...');
      const assigned = await this.assignPoliciesToGroups(queryRunner, policyGroupMap, options.dryRun);
      result.groupsAssigned = assigned;

      // Step 4: Create privilege routes (API endpoint mappings)
      this.logger.log('Creating privilege routes...');
      await this.createPrivilegeRoutes(queryRunner, privilegeMap, options.dryRun);

      if (!options.dryRun) {
        await queryRunner.commitTransaction();
      }

      result.totalRecords = result.privilegesCreated + result.policiesCreated + result.groupsAssigned;
      result.processedRecords = result.totalRecords;

      this.logger.log('Security setup completed successfully');
    } catch (error) {
      if (!options.dryRun) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  private async createPrivileges(
    queryRunner: QueryRunner,
    dryRun: boolean
  ): Promise<Map<string, string>> {
    const privilegeMap = new Map<string, string>();

    for (const privilege of this.SYSTEM_PRIVILEGES) {
      const id = uuidv4();
      privilegeMap.set(privilege.code, id);

      if (!dryRun) {
        await queryRunner.query(
          `INSERT INTO security_privileges 
           (id, code, name, description, category, is_system, is_active, 
            date_created, created_by, is_deleted)
           VALUES ($1, $2, $3, $4, $5, true, true, NOW(), 'migration', false)
           ON CONFLICT (code) DO UPDATE SET 
             name = EXCLUDED.name,
             category = EXCLUDED.category`,
          [
            id,
            privilege.code,
            privilege.name,
            `System privilege: ${privilege.name}`,
            privilege.category,
          ]
        );
      }
    }

    return privilegeMap;
  }

  private async createPolicyGroups(
    queryRunner: QueryRunner,
    privilegeMap: Map<string, string>,
    dryRun: boolean
  ): Promise<Map<string, string>> {
    const policyGroupMap = new Map<string, string>();

    for (const [key, policy] of Object.entries(this.POLICY_GROUPS)) {
      const groupId = uuidv4();
      policyGroupMap.set(key, groupId);

      if (!dryRun) {
        // Create policy group
        await queryRunner.query(
          `INSERT INTO security_policy_groups
           (id, name, description, is_system, is_active,
            date_created, created_by, is_deleted)
           VALUES ($1, $2, $3, true, true, NOW(), 'migration', false)`,
          [groupId, policy.name, policy.description]
        );

        // Assign privileges to policy group
        for (const privCode of policy.privileges) {
          const privId = privilegeMap.get(privCode);
          if (!privId) {
            this.logger.warn(`Privilege ${privCode} not found`);
            continue;
          }

          await queryRunner.query(
            `INSERT INTO security_policy_group_permissions
             (id, security_policy_group_id, security_privilege_id,
              date_created, created_by, is_deleted)
             VALUES ($1, $2, $3, NOW(), 'migration', false)`,
            [uuidv4(), groupId, privId]
          );
        }
      }
    }

    return policyGroupMap;
  }

  private async assignPoliciesToGroups(
    queryRunner: QueryRunner,
    policyGroupMap: Map<string, string>,
    dryRun: boolean
  ): Promise<number> {
    let assigned = 0;

    // Get all account management groups
    const groups = await queryRunner.query(`
      SELECT id, account_id, name 
      FROM account_management_groups 
      WHERE is_deleted = false
    `);

    for (const group of groups) {
      // Determine which policy to assign based on group name
      let policyKey: string;
      if (group.name.toLowerCase().includes('admin')) {
        policyKey = 'ADMIN';
      } else {
        policyKey = 'USER';
      }

      const policyGroupId = policyGroupMap.get(policyKey);
      if (!policyGroupId) {
        this.logger.warn(`Policy group ${policyKey} not found`);
        continue;
      }

      if (!dryRun) {
        // Create policy group access (assigns policy to account group)
        await queryRunner.query(
          `INSERT INTO security_policy_group_access
           (id, security_policy_group_id, account_id, account_management_group_id,
            date_created, created_by, is_deleted)
           VALUES ($1, $2, $3, $4, NOW(), 'migration', false)
           ON CONFLICT DO NOTHING`,
          [uuidv4(), policyGroupId, group.account_id, group.id]
        );

        // Also assign individual privileges to the management group
        const privileges = await queryRunner.query(
          `SELECT sp.id
           FROM security_privileges sp
           JOIN security_policy_group_permissions spgp ON spgp.security_privilege_id = sp.id
           WHERE spgp.security_policy_group_id = $1 AND spgp.is_deleted = false`,
          [policyGroupId]
        );

        for (const priv of privileges) {
          await queryRunner.query(
            `INSERT INTO account_management_group_privileges
             (id, account_management_group_id, security_privilege_id,
              date_created, created_by, is_deleted)
             VALUES ($1, $2, $3, NOW(), 'migration', false)
             ON CONFLICT DO NOTHING`,
            [uuidv4(), group.id, priv.id]
          );
        }
      }

      assigned++;
    }

    return assigned;
  }

  private async createPrivilegeRoutes(
    queryRunner: QueryRunner,
    privilegeMap: Map<string, string>,
    dryRun: boolean
  ): Promise<void> {
    // Map privileges to API routes
    const routeMappings = [
      { privilege: 'USER_VIEW', method: 'GET', route: '/api/v*/users' },
      { privilege: 'USER_VIEW', method: 'GET', route: '/api/v*/users/:id' },
      { privilege: 'USER_CREATE', method: 'POST', route: '/api/v*/users' },
      { privilege: 'USER_EDIT', method: 'PUT', route: '/api/v*/users/:id' },
      { privilege: 'USER_EDIT', method: 'PATCH', route: '/api/v*/users/:id' },
      { privilege: 'USER_DELETE', method: 'DELETE', route: '/api/v*/users/:id' },
      { privilege: 'USER_MANAGE_ROLES', method: 'POST', route: '/api/v*/users/:id/roles' },
      
      { privilege: 'ACCOUNT_VIEW', method: 'GET', route: '/api/v*/accounts/:id' },
      { privilege: 'ACCOUNT_EDIT', method: 'PUT', route: '/api/v*/accounts/:id' },
      { privilege: 'ACCOUNT_BILLING', method: 'GET', route: '/api/v*/accounts/:id/billing' },
      { privilege: 'ACCOUNT_BILLING', method: 'POST', route: '/api/v*/accounts/:id/billing' },
      { privilege: 'ACCOUNT_SETTINGS', method: 'GET', route: '/api/v*/accounts/:id/settings' },
      { privilege: 'ACCOUNT_SETTINGS', method: 'PUT', route: '/api/v*/accounts/:id/settings' },
      
      { privilege: 'SECURITY_VIEW_AUDIT', method: 'GET', route: '/api/v*/audit-logs' },
      { privilege: 'SECURITY_VIEW_SESSIONS', method: 'GET', route: '/api/v*/sessions' },
      { privilege: 'SECURITY_REVOKE_SESSIONS', method: 'DELETE', route: '/api/v*/sessions/:id' },
      
      { privilege: 'API_KEY_VIEW', method: 'GET', route: '/api/v*/api-keys' },
      { privilege: 'API_KEY_CREATE', method: 'POST', route: '/api/v*/api-keys' },
      { privilege: 'API_KEY_REVOKE', method: 'DELETE', route: '/api/v*/api-keys/:id' },
    ];

    if (!dryRun) {
      for (const mapping of routeMappings) {
        const privilegeId = privilegeMap.get(mapping.privilege);
        if (!privilegeId) continue;

        await queryRunner.query(
          `INSERT INTO security_privilege_routes
           (id, security_privilege_id, http_method, route_pattern, is_active,
            date_created, created_by, is_deleted)
           VALUES ($1, $2, $3, $4, true, NOW(), 'migration', false)
           ON CONFLICT DO NOTHING`,
          [uuidv4(), privilegeId, mapping.method, mapping.route]
        );
      }
    }
  }

  async validateSecurityMigration(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check privileges created
      const [privCount] = await queryRunner.query(
        'SELECT COUNT(*) FROM security_privileges WHERE is_system = true'
      );
      if (parseInt(privCount.count) < this.SYSTEM_PRIVILEGES.length) {
        errors.push(
          `Expected ${this.SYSTEM_PRIVILEGES.length} system privileges, found ${privCount.count}`
        );
      }

      // Check policy groups created
      const [policyCount] = await queryRunner.query(
        'SELECT COUNT(*) FROM security_policy_groups WHERE is_system = true'
      );
      if (parseInt(policyCount.count) < Object.keys(this.POLICY_GROUPS).length) {
        errors.push(
          `Expected ${Object.keys(this.POLICY_GROUPS).length} policy groups, found ${policyCount.count}`
        );
      }

      // Check all management groups have privileges
      const [groupsWithoutPrivs] = await queryRunner.query(`
        SELECT COUNT(*) FROM account_management_groups amg
        WHERE NOT EXISTS (
          SELECT 1 FROM account_management_group_privileges amgp
          WHERE amgp.account_management_group_id = amg.id
        ) AND amg.is_deleted = false
      `);
      if (parseInt(groupsWithoutPrivs.count) > 0) {
        warnings.push(`Found ${groupsWithoutPrivs.count} management groups without privileges`);
      }

      // Check privilege routes
      const [routeCount] = await queryRunner.query(
        'SELECT COUNT(*) FROM security_privilege_routes'
      );
      if (parseInt(routeCount.count) === 0) {
        warnings.push('No privilege routes found - API authorization may not work');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } finally {
      await queryRunner.release();
    }
  }
}