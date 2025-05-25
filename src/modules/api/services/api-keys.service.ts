// src/modules/api/services/api-keys.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ApiKey } from '../entities/api-key.entity';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeysRepository: Repository<ApiKey>,
  ) {}

  async create(userId: string, tenantId: string | undefined, name: string, permissions: Record<string, any> = {}): Promise<ApiKey> {
    if (!tenantId) {
      console.warn('[ApiKeysService] Warning: tenantId is missing in create');
      throw new BadRequestException('Tenant ID is required');
    }
    const key = this.generateApiKey();
    
    const apiKey = this.apiKeysRepository.create({
      userId,
      ...(tenantId ? { tenantId } : {}),
      name,
      key,
      permissions,
      active: true,
    });
    
    return this.apiKeysRepository.save(apiKey);
  }

  async findAll(userId: string, tenantId?: string): Promise<ApiKey[]> {
    if (!tenantId) {
      console.warn('[ApiKeysService] Warning: tenantId is missing in findAll');
      throw new BadRequestException('Tenant ID is required');
    }
    const query: any = { userId };
    
    if (tenantId) {
      query.tenantId = tenantId;
    }
    
    return this.apiKeysRepository.find({ 
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findOne({ 
      where: { id, userId } 
    });
    
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }
    
    return apiKey;
  }

  async findByKey(key: string): Promise<ApiKey | null> {
    return this.apiKeysRepository.findOne({ 
      where: { key, active: true } 
    });
  }

  async update(id: string, userId: string, updates: Partial<ApiKey>): Promise<ApiKey> {
    // Make sure the key exists and belongs to the user
    const apiKey = await this.findOne(id, userId);
    
    // Prevent updating the key itself
    if (updates.key) {
      throw new ForbiddenException('API key cannot be modified');
    }
    
    // Apply updates
    Object.assign(apiKey, updates);
    
    return this.apiKeysRepository.save(apiKey);
  }

  async revoke(id: string, userId: string): Promise<void> {
    const apiKey = await this.findOne(id, userId);
    
    apiKey.active = false;
    
    await this.apiKeysRepository.save(apiKey);
  }

  async delete(id: string, userId: string): Promise<void> {
    const apiKey = await this.findOne(id, userId);
    
    await this.apiKeysRepository.remove(apiKey);
  }

  private generateApiKey(): string {
    // Generate a UUID and remove hyphens
    const uuid = uuidv4().replace(/-/g, '');
    
    // Create a prefixed API key for easier identification
    return `ak_${uuid}`;
  }

  async validatePermissions(key: string, requiredPermissions: string[]): Promise<boolean> {
    const apiKey = await this.findByKey(key);
    
    if (!apiKey) {
      return false;
    }
    
    // Check if the API key has all required permissions
    for (const permission of requiredPermissions) {
      if (!apiKey.permissions[permission]) {
        return false;
      }
    }
    
    return true;
  }
}