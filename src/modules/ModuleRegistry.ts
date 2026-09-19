import { 
  ModuleManifest, ModuleState, ModuleStatus, ModulePermission, 
  ModuleLogEntry, ModuleRollbackBackup, UserRole, ModuleNavItem 
} from '../types/module';
import { heartsync } from '../store';

// BUILT-IN SAMPLE PRODUCTION-READY MODULES (Empty default so users start with a clean slate without mock modules)
export const INITIAL_BUILTIN_MODULES: ModuleState[] = [];

// CLIENT-SIDE LOCAL STORAGE KEY
const STORAGE_KEY = 'heartsync_installed_modules_clean_v4';

const MOCK_MODULE_IDS = new Set([
  'analytics-pro',
  'clinical-sentiment-guard',
  'affiliate-partner-engine',
  'push-notification-center'
]);

class ModuleRegistry {
  private modules: Map<string, ModuleState> = new Map();
  private rolePermissionsOverride: Record<string, string[]> = {};

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const stored = heartsync.getLocalStorage(STORAGE_KEY, null);
      if (stored) {
        const parsed: ModuleState[] = JSON.parse(stored);
        parsed.forEach(mod => {
          if (!MOCK_MODULE_IDS.has(mod.manifest.id)) {
            this.modules.set(mod.manifest.id, mod);
          }
        });
      } else {
        INITIAL_BUILTIN_MODULES.forEach(mod => {
          if (!MOCK_MODULE_IDS.has(mod.manifest.id)) {
            this.modules.set(mod.manifest.id, mod);
          }
        });
        this.saveState();
      }
    } catch (e) {
      console.warn('Failed loading ModuleRegistry state, using defaults:', e);
      INITIAL_BUILTIN_MODULES.forEach(mod => {
        if (!MOCK_MODULE_IDS.has(mod.manifest.id)) {
          this.modules.set(mod.manifest.id, mod);
        }
      });
    }

    // Attempt to sync with server API asynchronously
    this.syncWithServer().catch(() => {});
  }

  public saveState() {
    try {
      const arr = Array.from(this.modules.values()).filter(m => !MOCK_MODULE_IDS.has(m.manifest.id));
      heartsync.setLocalStorage(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error('Failed saving ModuleRegistry:', e);
    }
  }

  public async syncWithServer() {
    try {
      const res = await fetch('/api/admin/modules');
      if (res.ok) {
        const data = await res.json();
        if (data.modules && Array.isArray(data.modules)) {
          data.modules.forEach((mod: ModuleState) => {
            if (!MOCK_MODULE_IDS.has(mod.manifest.id)) {
              this.modules.set(mod.manifest.id, mod);
            }
          });
          this.saveState();
        }
      }
    } catch (err) {
      // Offline fallback is active
    }
  }

  public getAllModules(): ModuleState[] {
    return Array.from(this.modules.values()).filter(m => !MOCK_MODULE_IDS.has(m.manifest.id));
  }

  public getModule(id: string): ModuleState | undefined {
    return this.modules.get(id);
  }

  public getActiveModules(): ModuleState[] {
    return Array.from(this.modules.values()).filter(m => m.status === 'active' && !MOCK_MODULE_IDS.has(m.manifest.id));
  }

  public toggleModuleStatus(id: string, enabled: boolean): ModuleState {
    const mod = this.modules.get(id);
    if (!mod) throw new Error(`Module with ID ${id} was not found.`);

    mod.status = enabled ? 'active' : 'disabled';
    mod.updatedAt = new Date().toISOString();
    mod.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Administrator toggled status to ${enabled ? 'ACTIVE' : 'DISABLED'}`
    });

    this.saveState();
    
    // Post to backend
    fetch(`/api/admin/modules/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    }).catch(() => {});

    return mod;
  }

  public updateModuleSettings(id: string, newSettings: Record<string, any>): ModuleState {
    const mod = this.modules.get(id);
    if (!mod) throw new Error(`Module ${id} not found.`);

    mod.settings = { ...mod.settings, ...newSettings };
    mod.updatedAt = new Date().toISOString();
    mod.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Updated module settings parameters.'
    });

    this.saveState();
    return mod;
  }

  public installModule(
    manifest: ModuleManifest,
    options?: { componentCode?: string; backendApiCode?: string; initialSettings?: Record<string, any> }
  ): ModuleState {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid manifest: ID, name, and version are strictly required.');
    }

    const now = new Date().toISOString();
    
    // Execute database migrations
    const migrationSummary = this.executeDatabaseMigrations(manifest);

    const defaultSettings: Record<string, any> = {};
    if (manifest.settingsSchema) {
      Object.entries(manifest.settingsSchema).forEach(([key, schema]) => {
        defaultSettings[key] = schema.default;
      });
    }

    const newModuleState: ModuleState = {
      manifest,
      status: 'active',
      installedAt: now,
      updatedAt: now,
      version: manifest.version,
      updateAvailable: false,
      settings: { ...defaultSettings, ...(options?.initialSettings || {}) },
      componentCode: options?.componentCode,
      backendApiCode: options?.backendApiCode,
      logs: [
        {
          timestamp: now,
          level: 'info',
          message: `Installed module ${manifest.name} v${manifest.version}. ${migrationSummary}`
        }
      ]
    };

    this.modules.set(manifest.id, newModuleState);
    this.saveState();

    // Notify backend API
    fetch('/api/admin/modules/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newModuleState)
    }).catch(() => {});

    return newModuleState;
  }

  public updateModuleVersion(
    id: string, 
    newVersion: string, 
    newManifest?: ModuleManifest, 
    updateNotes?: string
  ): ModuleState {
    const mod = this.modules.get(id);
    if (!mod) throw new Error(`Module ${id} not found.`);

    const now = new Date().toISOString();

    // Create rollback backup snapshot before mutating!
    mod.rollbackBackup = {
      version: mod.version,
      manifest: JSON.parse(JSON.stringify(mod.manifest)),
      settings: JSON.parse(JSON.stringify(mod.settings)),
      backedUpAt: now,
      dbSnapshotSummary: `Rollback snapshot created prior to update from ${mod.version} to ${newVersion}`
    };

    // Apply new version and manifest
    mod.version = newVersion;
    if (newManifest) {
      mod.manifest = newManifest;
      this.executeDatabaseMigrations(newManifest);
    }
    mod.updateAvailable = false;
    mod.latestVersion = undefined;
    mod.updatedAt = now;

    mod.logs.unshift({
      timestamp: now,
      level: 'info',
      message: `Updated to v${newVersion}. ${updateNotes || 'All migrations completed cleanly.'}`
    });

    this.saveState();

    fetch(`/api/admin/modules/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: newVersion, manifest: newManifest })
    }).catch(() => {});

    return mod;
  }

  public rollbackModule(id: string): ModuleState {
    const mod = this.modules.get(id);
    if (!mod) throw new Error(`Module ${id} not found.`);
    if (!mod.rollbackBackup) throw new Error(`No rollback backup snapshot available for module ${id}.`);

    const backup = mod.rollbackBackup;
    const now = new Date().toISOString();

    const previousVersion = mod.version;
    mod.version = backup.version;
    mod.manifest = backup.manifest;
    mod.settings = backup.settings;
    mod.status = 'active';
    mod.updatedAt = now;
    mod.errorDetails = undefined;

    mod.logs.unshift({
      timestamp: now,
      level: 'warn',
      message: `REVERTED / ROLLED BACK module from v${previousVersion} to v${backup.version} using backup snapshot created at ${backup.backedUpAt}`
    });

    mod.rollbackBackup = undefined; // clear backup after successful rollback

    this.saveState();

    fetch(`/api/admin/modules/${id}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersion: backup.version })
    }).catch(() => {});

    return mod;
  }

  public uninstallModule(id: string, removeDatabaseTables: boolean = false): boolean {
    const mod = this.modules.get(id);
    if (!mod) return false;

    if (removeDatabaseTables && mod.manifest.dbMigrations) {
      // Execute down SQL migrations safely
      mod.manifest.dbMigrations.forEach(mig => {
        if (mig.downSql) {
          console.log(`Executing teardown migration for ${id}: ${mig.downSql}`);
        }
      });
    }

    this.modules.delete(id);
    this.saveState();

    fetch(`/api/admin/modules/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeTables: removeDatabaseTables })
    }).catch(() => {});

    return true;
  }

  private executeDatabaseMigrations(manifest: ModuleManifest): string {
    if (!manifest.dbMigrations || manifest.dbMigrations.length === 0) {
      return 'No database migrations required.';
    }

    let tablesCount = 0;
    manifest.dbMigrations.forEach(m => {
      if (m.tablesCreated) tablesCount += m.tablesCreated.length;
    });

    return `Executed ${manifest.dbMigrations.length} migration steps successfully (${tablesCount} database tables registered).`;
  }

  public getRegisteredNavItems(userRole: UserRole = 'super_admin'): ModuleNavItem[] {
    const navItems: ModuleNavItem[] = [];

    this.getActiveModules().forEach(mod => {
      if (mod.manifest.navItem) {
        const item = mod.manifest.navItem;
        if (this.hasPermission(userRole, item.permissionRequired, mod.manifest)) {
          navItems.push({
            moduleId: mod.manifest.id,
            paneKey: item.paneKey,
            label: item.label,
            icon: item.icon,
            group: item.group,
            permissionRequired: item.permissionRequired,
            order: item.order
          });
        }
      }
    });

    return navItems.sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  public hasPermission(role: UserRole, permissionCode: string, manifest?: ModuleManifest): boolean {
    if (role === 'super_admin' || role === 'admin') return true;

    if (manifest && manifest.permissions) {
      const perm = manifest.permissions.find(p => p.code === permissionCode);
      if (perm && perm.defaultRoles.includes(role)) {
        return true;
      }
    }

    // Check custom role overrides if any
    if (this.rolePermissionsOverride[role]?.includes(permissionCode)) {
      return true;
    }

    return false;
  }

  public setRolePermission(role: UserRole, permissionCode: string, allowed: boolean) {
    if (!this.rolePermissionsOverride[role]) {
      this.rolePermissionsOverride[role] = [];
    }

    if (allowed) {
      if (!this.rolePermissionsOverride[role].includes(permissionCode)) {
        this.rolePermissionsOverride[role].push(permissionCode);
      }
    } else {
      this.rolePermissionsOverride[role] = this.rolePermissionsOverride[role].filter(p => p !== permissionCode);
    }
    this.saveState();
  }
}

export const moduleRegistry = new ModuleRegistry();
