import { faker } from '@faker-js/faker';
import { Tenant } from '../../src/modules/tenants/entities/tenant.entity';
import { DeepPartial } from 'typeorm';

export class TenantFactory {
  static create(overrides?: DeepPartial<Tenant>): Tenant {
    const tenant = new Tenant();
    
    tenant.id = overrides?.id || faker.string.uuid();
    tenant.name = overrides?.name || faker.company.name();
    tenant.slug = overrides?.slug || faker.helpers.slugify(tenant.name).toLowerCase();
    tenant.description = overrides?.description || faker.company.catchPhrase();
    tenant.logo = overrides?.logo || faker.image.url();
    tenant.website = overrides?.website || faker.internet.url();
    tenant.settings = overrides?.settings || {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
    };
    tenant.isActive = overrides?.isActive !== undefined ? overrides.isActive : true;
    tenant.maxUsers = overrides?.maxUsers || 100;
    tenant.currentUsers = overrides?.currentUsers || 0;
    tenant.createdAt = overrides?.createdAt || new Date();
    tenant.updatedAt = overrides?.updatedAt || new Date();
    
    return tenant;
  }

  static createMany(count: number, overrides?: DeepPartial<Tenant>): Tenant[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createInactive(overrides?: DeepPartial<Tenant>): Tenant {
    return this.create({
      ...overrides,
      isActive: false,
    });
  }

  static createAtCapacity(overrides?: DeepPartial<Tenant>): Tenant {
    const maxUsers = overrides?.maxUsers || 10;
    return this.create({
      ...overrides,
      maxUsers,
      currentUsers: maxUsers,
    });
  }
}