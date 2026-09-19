import React, { Component, ErrorInfo, ReactNode, useState } from 'react';
import { moduleRegistry } from './ModuleRegistry';
import { ModuleState, UserRole } from '../types/module';
import { 
  BarChart3, Shield, DollarSign, BellDot, AlertTriangle, 
  RefreshCw, CheckCircle, Layers, Sliders, Database, Key, Info, Zap, Download, Wand2
} from 'lucide-react';

interface ErrorBoundaryProps {
  moduleId: string;
  moduleName: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// REACT ERROR BOUNDARY ISOLATING MODULE FAILURES
export class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Module Isolation Boundary caught crash in module [${this.props.moduleId}]:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-3xl space-y-4 text-left">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-serif font-bold text-base">Module Exception Intercepted</h3>
              <p className="text-xs text-red-500 font-sans">
                The module <strong className="font-mono">{this.props.moduleName}</strong> encountered a runtime error, but the rest of the admin dashboard remains completely functional.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/50 rounded-2xl text-[11px] font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
            {this.state.error?.message || 'Unknown runtime error'}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Component Load
            </button>
            <button
              type="button"
              onClick={() => {
                moduleRegistry.toggleModuleStatus(this.props.moduleId, false);
                window.location.reload();
              }}
              className="px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/50 cursor-pointer"
            >
              Disable Module Safely
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// GENERIC MODULE RENDERER COMPONENT
interface ModuleViewRendererProps {
  paneKey: string;
  userRole?: UserRole;
  onToast?: (msg: string) => void;
}

export const ModuleViewRenderer: React.FC<ModuleViewRendererProps> = ({ paneKey, userRole = 'super_admin', onToast }) => {
  const activeModules = moduleRegistry.getActiveModules();
  const matchedModule = activeModules.find(m => m.manifest.navItem?.paneKey === paneKey);

  if (!matchedModule) {
    return (
      <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
        <Info className="w-8 h-8 text-zinc-400 mx-auto" />
        <h3 className="font-serif font-bold text-lg text-zinc-800 dark:text-zinc-200">Module View Not Found or Disabled</h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          The requested module pane <code className="font-mono">{paneKey}</code> is either uninstalled or disabled in the Feature Manager.
        </p>
      </div>
    );
  }

  // Permission Check
  const requiredPerm = matchedModule.manifest.navItem?.permissionRequired;
  if (requiredPerm && !moduleRegistry.hasPermission(userRole, requiredPerm, matchedModule.manifest)) {
    return (
      <div className="p-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-3xl text-center space-y-3">
        <Shield className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-serif font-bold text-base text-amber-900 dark:text-amber-200">Access Restricted by Role Permission</h3>
        <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
          Your active account role (<code className="font-mono">{userRole}</code>) does not hold the required permission key: <code className="font-mono">{requiredPerm}</code>.
        </p>
      </div>
    );
  }

  return (
    <ModuleErrorBoundary moduleId={matchedModule.manifest.id} moduleName={matchedModule.manifest.name}>
      {renderBuiltInOrCustomModuleContent(matchedModule, onToast)}
    </ModuleErrorBoundary>
  );
};

// BUILT-IN AND CUSTOM MODULE CONTENT RENDERER
function renderBuiltInOrCustomModuleContent(mod: ModuleState, onToast?: (msg: string) => void) {
  const id = mod.manifest.id;

  if (id === 'analytics-pro') {
    return <AnalyticsProModuleView mod={mod} onToast={onToast} />;
  }

  if (id === 'clinical-sentiment-guard') {
    return <SentimentGuardModuleView mod={mod} onToast={onToast} />;
  }

  if (id === 'affiliate-partner-engine') {
    return <AffiliateEngineModuleView mod={mod} onToast={onToast} />;
  }

  if (id === 'push-notification-center') {
    return <PushNotificationModuleView mod={mod} onToast={onToast} />;
  }

  // Custom AI-Built or Third-Party Module Generic Interface
  return <GenericCustomModuleView mod={mod} onToast={onToast} />;
}

// 1. ANALYTICS PRO BUILT-IN VIEW
const AnalyticsProModuleView: React.FC<{ mod: ModuleState; onToast?: (msg: string) => void }> = ({ mod, onToast }) => {
  return (
    <div className="space-y-6 text-xs text-left animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Active Module v{mod.version}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">ID: {mod.manifest.id}</span>
              </div>
              <h2 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100">{mod.manifest.name}</h2>
              <p className="text-[11px] text-zinc-500">{mod.manifest.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToast?.('Exported Analytics Pro Cohort CSV!')}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:scale-102 transition-transform"
          >
            <Download className="w-4 h-4" /> Export Cohorts CSV
          </button>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Reader Retention Rate</span>
            <p className="font-serif font-bold text-2xl text-emerald-600 dark:text-emerald-400">78.4%</p>
            <span className="text-[9px] text-emerald-500 font-mono">↑ +4.2% vs last month</span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Avg. Article Scroll Depth</span>
            <p className="font-serif font-bold text-2xl text-rose-600 dark:text-rose-400">82.1%</p>
            <span className="text-[9px] text-zinc-400 font-mono">High engagement threshold</span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Active Reader Sessions</span>
            <p className="font-serif font-bold text-2xl text-purple-600 dark:text-purple-400">14,290</p>
            <span className="text-[9px] text-purple-500 font-mono">Live telemetry active</span>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Somatic Exercise Triggers</span>
            <p className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400">3,891</p>
            <span className="text-[9px] text-amber-500 font-mono">Completed audio loops</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. SENTIMENT GUARD BUILT-IN VIEW
const SentimentGuardModuleView: React.FC<{ mod: ModuleState; onToast?: (msg: string) => void }> = ({ mod, onToast }) => {
  return (
    <div className="space-y-6 text-xs text-left animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Active Module v{mod.version}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">ID: {mod.manifest.id}</span>
              </div>
              <h2 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100">{mod.manifest.name}</h2>
              <p className="text-[11px] text-zinc-500">{mod.manifest.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToast?.('Ran Sentiment Guard Incident Audit!')}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:scale-102 transition-transform"
          >
            <Zap className="w-4 h-4" /> Run Live Incident Audit
          </button>
        </div>

        {/* INCIDENTS TABLE */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Flagged Emotional Distress Logs
          </h4>
          <div className="space-y-2">
            {[
              { id: 'flag-1', entity: 'Comment #9482', risk: 85, trigger: 'Extreme distress during breakup reflection', status: 'Held for Moderation' },
              { id: 'flag-2', entity: 'Chat Session #8301', risk: 72, trigger: 'Anxious attachment panic loop', status: 'Crisis Hotline Notice Shown' }
            ].map(log => (
              <div key={log.id} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{log.entity}</span>
                  <span className="text-[10px] text-zinc-400">{log.trigger}</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 block mb-1">
                    Risk Score: {log.risk}/100
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. AFFILIATE ENGINE BUILT-IN VIEW
const AffiliateEngineModuleView: React.FC<{ mod: ModuleState; onToast?: (msg: string) => void }> = ({ mod, onToast }) => {
  return (
    <div className="space-y-6 text-xs text-left animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Active Module v{mod.version}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">ID: {mod.manifest.id}</span>
              </div>
              <h2 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100">{mod.manifest.name}</h2>
              <p className="text-[11px] text-zinc-500">{mod.manifest.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToast?.('Generated new therapist affiliate code!')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:scale-102 transition-transform"
          >
            + New Partner Code
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Active Partners</span>
            <p className="font-serif font-bold text-2xl text-amber-600 dark:text-amber-400">24 Therapists</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Total Conversions</span>
            <p className="font-serif font-bold text-2xl text-emerald-600 dark:text-emerald-400">$12,490.00</p>
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Pending Payouts</span>
            <p className="font-serif font-bold text-2xl text-rose-600 dark:text-rose-400">$2,498.00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. PUSH NOTIFICATION BUILT-IN VIEW
const PushNotificationModuleView: React.FC<{ mod: ModuleState; onToast?: (msg: string) => void }> = ({ mod, onToast }) => {
  return (
    <div className="space-y-6 text-xs text-left animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <BellDot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Status: {mod.status}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">ID: {mod.manifest.id}</span>
              </div>
              <h2 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100">{mod.manifest.name}</h2>
              <p className="text-[11px] text-zinc-500">{mod.manifest.description}</p>
            </div>
          </div>
        </div>

        <p className="text-zinc-500">
          Send push broadcasts to active subscribers across mobile and desktop browser push tokens.
        </p>
      </div>
    </div>
  );
};

// 5. GENERIC CUSTOM AI-BUILT OR THIRD-PARTY MODULE VIEW
const GenericCustomModuleView: React.FC<{ mod: ModuleState; onToast?: (msg: string) => void }> = ({ mod, onToast }) => {
  return (
    <div className="space-y-6 text-xs text-left animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Installed Custom Module v{mod.version}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">Author: {mod.manifest.author}</span>
              </div>
              <h2 className="font-serif font-bold text-xl text-zinc-900 dark:text-zinc-100">{mod.manifest.name}</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{mod.manifest.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToast?.(`Saved ${mod.manifest.name} settings!`)}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Save Module State
          </button>
        </div>

        {/* MANIFEST SPECIFICATIONS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-rose-500" /> Database Migrations
            </span>
            <p className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
              {mod.manifest.dbMigrations?.length || 0} Registered
            </p>
            <p className="text-[10px] text-zinc-500">Auto-applied during installation.</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-purple-500" /> Role Permissions
            </span>
            <p className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
              {mod.manifest.permissions?.length || 0} Guard Keys
            </p>
            <p className="text-[10px] text-zinc-500">Scoped to role-based security matrix.</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-500" /> Active Settings
            </span>
            <p className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
              {Object.keys(mod.settings || {}).length} Parameters
            </p>
            <p className="text-[10px] text-zinc-500">Persisted in database singleton.</p>
          </div>
        </div>

        {/* COMPONENT CODE PREVIEW IF AVAILABLE */}
        {mod.componentCode && (
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Registered Component Source Code</h4>
            <div className="p-4 bg-zinc-900 text-zinc-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-60 border border-zinc-800">
              <pre>{mod.componentCode}</pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
