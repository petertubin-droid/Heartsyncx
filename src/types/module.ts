export type ModuleStatus = 'active' | 'disabled' | 'error' | 'installing' | 'updating';
export type ModuleCategory = 'analytics' | 'marketing' | 'monetization' | 'security' | 'tools' | 'engagement' | 'ai';
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'author' | 'reader' | 'compliance_officer';

export interface ModulePermission {
  code: string;
  name: string;
  description: string;
  defaultRoles: UserRole[];
}

export interface ModuleMigration {
  version: string;
  description: string;
  upSql: string;
  downSql: string;
  tablesCreated?: string[];
}

export interface ModuleSettingSchema {
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'secret';
  default: any;
  options?: string[];
  description?: string;
}

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: ModuleCategory;
  icon: string; // Lucide icon identifier
  minAdminVersion: string;
  permissions: ModulePermission[];
  dbMigrations: ModuleMigration[];
  settingsSchema: Record<string, ModuleSettingSchema>;
  dependencies?: string[];
  navItem?: {
    paneKey: string;
    label: string;
    icon: string;
    group: 'CONTENT' | 'MEDIA' | 'ENGAGEMENT' | 'MONETIZATION' | 'MARKETING' | 'INTEGRATIONS' | 'SETTINGS' | 'PLUGINS';
    permissionRequired: string;
    order?: number;
  };
}

export interface ModuleLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

export interface ModuleRollbackBackup {
  version: string;
  manifest: ModuleManifest;
  settings: Record<string, any>;
  backedUpAt: string;
  dbSnapshotSummary?: string;
}

export interface ModuleState {
  manifest: ModuleManifest;
  status: ModuleStatus;
  installedAt: string;
  updatedAt: string;
  version: string;
  updateAvailable: boolean;
  latestVersion?: string;
  updateNotes?: string;
  errorDetails?: string;
  settings: Record<string, any>;
  rollbackBackup?: ModuleRollbackBackup;
  logs: ModuleLogEntry[];
  componentCode?: string;
  backendApiCode?: string;
}

export interface ModuleNavItem {
  moduleId: string;
  paneKey: string;
  label: string;
  icon: string;
  group: 'CONTENT' | 'MEDIA' | 'ENGAGEMENT' | 'MONETIZATION' | 'MARKETING' | 'INTEGRATIONS' | 'SETTINGS' | 'PLUGINS';
  permissionRequired: string;
  order?: number;
}

export interface ModuleApiEndpoint {
  moduleId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requiredPermission: string;
  handlerName: string;
}

export interface AiGeneratedModuleBundle {
  manifest: ModuleManifest;
  frontendCode: string;
  backendCode: string;
  sqlMigrations: string;
  validationReport: {
    passedSyntaxCheck: boolean;
    passedSecurityAudit: boolean;
    passedSchemaValidation: boolean;
    passedTestSuite: boolean;
    issuesFound: string[];
    riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  testSimulations: {
    name: string;
    passed: boolean;
    executionTimeMs: number;
    details: string;
  }[];
}
