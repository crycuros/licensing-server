import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

// License interfaces
export interface License {
  id: string;
  licenseKey: string;
  plan: LicensePlan;
  status: LicenseStatus;
  domain: string | null;
  customerEmail: string;
  customerName: string | null;
  expiresAt: Date | null;
  isLifetime: boolean;
  isTrial: boolean;
  maxUsers: number;
  maxServices: number;
  maxOrders: number;
  features: string[];
  activatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type LicensePlan = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'RESELLER';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'PENDING';

export interface CreateLicenseDto {
  plan: LicensePlan;
  customerEmail: string;
  customerName?: string;
  domain?: string;
  durationMonths?: number;
  isLifetime?: boolean;
  isTrial?: boolean;
  maxUsers?: number;
  maxServices?: number;
  maxOrders?: number;
}

export interface UpdateLicenseDto {
  licenseId: string;
  action: 'suspend' | 'activate' | 'revoke' | 'extend' | 'update';
  durationMonths?: number;
  plan?: LicensePlan;
  customerEmail?: string;
  customerName?: string;
  domain?: string;
  maxUsers?: number;
  maxServices?: number;
  maxOrders?: number;
}

// Plan details
const PLAN_DETAILS: Record<LicensePlan, { 
  name: string; 
  maxUsers: number; 
  maxServices: number; 
  maxOrders: number; 
  features: string[]; 
  price: number;
}> = {
  BASIC: {
    name: 'Basic',
    maxUsers: 1,
    maxServices: 100,
    maxOrders: 1000,
    features: ['Basic Services', 'Email Support', 'Basic Analytics'],
    price: 29,
  },
  STANDARD: {
    name: 'Standard',
    maxUsers: 3,
    maxServices: 500,
    maxOrders: 10000,
    features: ['All Basic Features', 'Priority Support', 'Advanced Analytics', 'API Access'],
    price: 79,
  },
  PREMIUM: {
    name: 'Premium',
    maxUsers: 10,
    maxServices: 2000,
    maxOrders: 50000,
    features: ['All Standard Features', 'White Label', 'Custom Domain', 'Dedicated Support', 'Multi-admin'],
    price: 149,
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxUsers: -1,
    maxServices: -1,
    maxOrders: -1,
    features: ['All Premium Features', 'Unlimited Everything', 'Custom Development', '24/7 Phone Support', 'SLA Guarantee', 'Source Code'],
    price: 299,
  },
  RESELLER: {
    name: 'Reseller',
    maxUsers: 50,
    maxServices: -1,
    maxOrders: -1,
    features: ['All Enterprise Features', 'Reseller Panel', 'Client Management', 'Revenue Share', 'Custom Pricing'],
    price: 499,
  },
};

// In-memory storage (replace with database in production)
const licenses: Map<string, License> = new Map();

// Initialize with demo license
const demoLicense: License = {
  id: 'demo-license',
  licenseKey: 'DEMO-DEMO-DEMO-DEMO-DEMO',
  plan: 'ENTERPRISE',
  status: 'ACTIVE',
  domain: 'localhost',
  customerEmail: 'demo@example.com',
  customerName: 'Demo User',
  expiresAt: null,
  isLifetime: true,
  isTrial: false,
  maxUsers: -1,
  maxServices: -1,
  maxOrders: -1,
  features: PLAN_DETAILS.ENTERPRISE.features,
  activatedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};
licenses.set(demoLicense.licenseKey, demoLicense);

@Injectable()
export class LicenseService {
  private readonly chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  // Generate a random license key
  generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 5; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
      }
      segments.push(segment);
    }
    return segments.join('-');
  }

  // Generate a unique ID
  generateLicenseId(): string {
    return 'LIC-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  // Validate license key format
  isValidLicenseKeyFormat(licenseKey: string): boolean {
    const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    return pattern.test(licenseKey);
  }

  // Check if license is expired
  isLicenseExpired(expiresAt: Date | null, isLifetime: boolean): boolean {
    if (isLifetime) return false;
    if (!expiresAt) return true;
    return new Date() > new Date(expiresAt);
  }

  // Calculate expiration date
  calculateExpiration(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  }

  // Get all licenses
  findAll(filters?: { status?: LicenseStatus; plan?: LicensePlan; search?: string }): License[] {
    let result = Array.from(licenses.values());

    if (filters?.status) {
      result = result.filter(l => l.status === filters.status);
    }
    if (filters?.plan) {
      result = result.filter(l => l.plan === filters.plan);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(l => 
        l.licenseKey.toLowerCase().includes(searchLower) ||
        l.customerEmail.toLowerCase().includes(searchLower) ||
        l.customerName?.toLowerCase().includes(searchLower) ||
        l.domain?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  // Find license by key
  findByKey(licenseKey: string): License | undefined {
    return licenses.get(licenseKey.toUpperCase());
  }

  // Find license by ID
  findById(licenseId: string): License | undefined {
    return Array.from(licenses.values()).find(l => l.id === licenseId);
  }

  // Create a new license
  create(data: CreateLicenseDto): License {
    const planDetails = PLAN_DETAILS[data.plan];
    const licenseKey = this.generateLicenseKey();
    const licenseId = this.generateLicenseId();

    let expiresAt: Date | null = null;
    if (!data.isLifetime && data.durationMonths) {
      expiresAt = this.calculateExpiration(data.durationMonths);
    }

    const license: License = {
      id: licenseId,
      licenseKey,
      plan: data.plan,
      status: 'ACTIVE',
      domain: data.domain || null,
      customerEmail: data.customerEmail,
      customerName: data.customerName || null,
      expiresAt,
      isLifetime: data.isLifetime || false,
      isTrial: data.isTrial || false,
      maxUsers: data.maxUsers ?? planDetails.maxUsers,
      maxServices: data.maxServices ?? planDetails.maxServices,
      maxOrders: data.maxOrders ?? planDetails.maxOrders,
      features: planDetails.features,
      activatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    licenses.set(licenseKey, license);
    return license;
  }

  // Update license
  update(data: UpdateLicenseDto): License | null {
    const license = this.findById(data.licenseId);
    if (!license) return null;

    switch (data.action) {
      case 'suspend':
        license.status = 'SUSPENDED';
        break;
      case 'activate':
        license.status = 'ACTIVE';
        break;
      case 'revoke':
        license.status = 'REVOKED';
        break;
      case 'extend':
        if (data.durationMonths) {
          const currentExp = license.expiresAt ? new Date(license.expiresAt) : new Date();
          currentExp.setMonth(currentExp.getMonth() + data.durationMonths);
          license.expiresAt = currentExp;
          license.isLifetime = false;
        }
        break;
      case 'update':
        if (data.plan) {
          const planDetails = PLAN_DETAILS[data.plan];
          license.plan = data.plan;
          license.maxUsers = data.maxUsers ?? planDetails.maxUsers;
          license.maxServices = data.maxServices ?? planDetails.maxServices;
          license.maxOrders = data.maxOrders ?? planDetails.maxOrders;
          license.features = planDetails.features;
        }
        if (data.customerEmail) license.customerEmail = data.customerEmail;
        if (data.customerName) license.customerName = data.customerName;
        if (data.domain !== undefined) license.domain = data.domain;
        if (data.maxUsers !== undefined) license.maxUsers = data.maxUsers;
        if (data.maxServices !== undefined) license.maxServices = data.maxServices;
        if (data.maxOrders !== undefined) license.maxOrders = data.maxOrders;
        break;
    }

    license.updatedAt = new Date();
    licenses.set(license.licenseKey, license);
    return license;
  }

  // Delete license
  delete(licenseId: string): boolean {
    const license = this.findById(licenseId);
    if (!license) return false;
    return licenses.delete(license.licenseKey);
  }

  // Validate license
  validate(licenseKey: string, domain?: string): { 
    valid: boolean; 
    message: string; 
    license?: Partial<License>;
  } {
    if (!this.isValidLicenseKeyFormat(licenseKey)) {
      return { valid: false, message: 'Invalid license key format' };
    }

    const license = this.findByKey(licenseKey);
    if (!license) {
      return { valid: false, message: 'License not found' };
    }

    if (license.status === 'SUSPENDED') {
      return { valid: false, message: 'License has been suspended' };
    }

    if (license.status === 'REVOKED') {
      return { valid: false, message: 'License has been revoked' };
    }

    if (license.status === 'PENDING') {
      return { valid: false, message: 'License is pending activation' };
    }

    if (this.isLicenseExpired(license.expiresAt, license.isLifetime)) {
      return { 
        valid: false, 
        message: 'License has expired',
        license: { ...license, status: 'EXPIRED' }
      };
    }

    // Domain validation
    if (domain && license.domain && license.domain !== domain) {
      return { valid: false, message: 'License is bound to a different domain' };
    }

    return {
      valid: true,
      message: 'License is valid',
      license: {
        licenseKey: license.licenseKey,
        plan: license.plan,
        status: license.status,
        expiresAt: license.expiresAt,
        isLifetime: license.isLifetime,
        isTrial: license.isTrial,
        features: license.features,
        maxUsers: license.maxUsers,
        maxServices: license.maxServices,
        maxOrders: license.maxOrders,
      }
    };
  }

  // Get statistics
  getStats(): {
    total: number;
    active: number;
    expired: number;
    suspended: number;
    byPlan: Record<string, number>;
  } {
    const allLicenses = Array.from(licenses.values());
    
    const stats = {
      total: allLicenses.length,
      active: 0,
      expired: 0,
      suspended: 0,
      byPlan: {} as Record<string, number>,
    };

    for (const license of allLicenses) {
      switch (license.status) {
        case 'ACTIVE':
          stats.active++;
          break;
        case 'EXPIRED':
          stats.expired++;
          break;
        case 'SUSPENDED':
        case 'REVOKED':
          stats.suspended++;
          break;
      }
      stats.byPlan[license.plan] = (stats.byPlan[license.plan] || 0) + 1;
    }

    return stats;
  }
}
