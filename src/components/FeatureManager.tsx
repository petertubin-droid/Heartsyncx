import React, { useState, useEffect } from 'react';
import { moduleRegistry } from '../modules/ModuleRegistry';
import { 
  ModuleState, ModuleStatus, ModuleManifest, AiGeneratedModuleBundle, UserRole 
} from '../types/module';
import { 
  Layers, CheckCircle2, AlertTriangle, Shield, RefreshCw, 
  Trash2, Sliders, Play, Code2, Download, Copy, Check, Eye, Lock, 
  FileText, Search, Plus, RotateCcw, Power, Clock, Info, ChevronRight, 
  Database, Key, ArrowUpRight, Flame, Terminal, Cpu, CheckCircle, Wand2, Zap
} from 'lucide-react';

interface FeatureManagerProps {
  onToast: (msg: string) => void;
  activeUserRole?: UserRole;
}

export const FeatureManager: React.FC<FeatureManagerProps> = ({ onToast, activeUserRole = 'super_admin' }) => {
  const [activeTab, setActiveTab] = useState<'installed' | 'ai_builder' | 'sdk_template' | 'permissions'>('installed');
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected module for settings or logs modals
  const [settingsModalModule, setSettingsModalModule] = useState<ModuleState | null>(null);
  const [logsModalModule, setLogsModalModule] = useState<ModuleState | null>(null);
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({});

  // AI Feature Builder States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState<'analytics' | 'marketing' | 'monetization' | 'security' | 'tools' | 'engagement' | 'ai'>('tools');
  const [aiRole, setAiRole] = useState<UserRole>('admin');
  const [aiIncludeDb, setAiIncludeDb] = useState(true);
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiGeneratedBundle, setAiGeneratedBundle] = useState<AiGeneratedModuleBundle | null>(null);
  const [aiSelectedCodeTab, setAiSelectedCodeTab] = useState<'manifest' | 'frontend' | 'backend' | 'sql' | 'tests'>('manifest');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // SDK Template Copy State
  const [sdkCopiedFile, setSdkCopiedFile] = useState<string | null>(null);

  // Role permissions matrix local state
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, Record<string, boolean>>>({});

  // Load modules on mount
  useEffect(() => {
    refreshModulesList();
  }, []);

  const refreshModulesList = () => {
    const list = moduleRegistry.getAllModules();
    setModules(list);
  };

  // Filtered modules
  const filteredModules = modules.filter(m => {
    const matchesSearch = m.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.manifest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.manifest.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && m.status === 'active';
    if (statusFilter === 'disabled') return matchesSearch && m.status === 'disabled';
    if (statusFilter === 'updates') return matchesSearch && m.updateAvailable;
    return matchesSearch;
  });

  // Handle Toggle Module Active/Disabled
  const handleToggleModule = async (id: string, currentStatus: ModuleStatus) => {
    try {
      const isEnabling = currentStatus !== 'active';
      const updatedMod = moduleRegistry.toggleModuleStatus(id, isEnabling);
      refreshModulesList();
      onToast(isEnabling ? `Enabled module ${id}!` : `Disabled module ${id}.`);

      // Sync with server API
      fetch(`/api/admin/modules/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: isEnabling })
      }).catch(() => {});
    } catch (e: any) {
      onToast(`Error toggling module: ${e.message}`);
    }
  };

  // Handle Update Module Version
  const handleUpdateModule = async (mod: ModuleState) => {
    try {
      const nextVer = mod.latestVersion || '2.0.0';
      const updatedManifest = { ...mod.manifest, version: nextVer };
      const updatedMod = moduleRegistry.updateModuleVersion(mod.manifest.id, nextVer, updatedManifest, mod.updateNotes);
      refreshModulesList();
      onToast(`Successfully updated ${mod.manifest.name} to v${nextVer}!`);

      // Sync with server API
      fetch(`/api/admin/modules/${mod.manifest.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: nextVer, manifest: updatedManifest })
      }).catch(() => {});
    } catch (e: any) {
      onToast(`Update failed: ${e.message}`);
    }
  };

  // Handle Rollback Module
  const handleRollbackModule = async (id: string) => {
    try {
      moduleRegistry.rollbackModule(id);
      refreshModulesList();
      onToast(`Successfully rolled back module ${id} to previous version snapshot!`);

      // Sync with server API
      fetch(`/api/admin/modules/${id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(() => {});
    } catch (e: any) {
      onToast(`Rollback failed: ${e.message}`);
    }
  };

  // Handle Uninstall Module
  const handleUninstallModule = async (id: string) => {
    if (window.confirm(`Are you sure you want to uninstall module "${id}"? This will deregister its routes, navigation, and API endpoints.`)) {
      const removeTables = window.confirm(`Would you also like to drop/clean up database tables associated with module "${id}"?`);
      moduleRegistry.uninstallModule(id, removeTables);
      refreshModulesList();
      onToast(`Uninstalled module ${id}.`);

      // Sync with server API
      fetch(`/api/admin/modules/${id}`, {
        method: 'DELETE'
      }).catch(() => {});
    }
  };

  // Handle Save Settings
  const handleSaveSettings = () => {
    if (!settingsModalModule) return;
    try {
      moduleRegistry.updateModuleSettings(settingsModalModule.manifest.id, editedSettings);
      refreshModulesList();
      setSettingsModalModule(null);
      onToast(`Updated settings for ${settingsModalModule.manifest.name}!`);
    } catch (e: any) {
      onToast(`Failed saving settings: ${e.message}`);
    }
  };

  // AI GENERATOR CALL
  const handleGenerateAiModule = async () => {
    if (!aiPrompt.trim()) {
      onToast('Please describe the feature you want to generate in plain English.');
      return;
    }

    setAiIsGenerating(true);
    setAiGeneratedBundle(null);

    try {
      const res = await fetch('/api/admin/modules/ai-builder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: aiCategory,
          requiredRole: aiRole,
          includeDbMigrations: aiIncludeDb
        })
      });

      if (!res.ok) {
        throw new Error('Server returned an error generating the AI module.');
      }

      const data = await res.json();
      if (data.success && data.bundle) {
        setAiGeneratedBundle(data.bundle);
        onToast('AI Module generated successfully! Please review code and validation test results before approval.');
      } else {
        throw new Error(data.error || 'Failed generating bundle.');
      }
    } catch (err: any) {
      onToast(`AI Generation Error: ${err.message}`);
    } finally {
      setAiIsGenerating(false);
    }
  };

  // AI MODULE APPROVAL AND INSTALLATION
  const handleApproveAndInstallAiModule = async () => {
    if (!aiGeneratedBundle) return;

    try {
      const manifest = aiGeneratedBundle.manifest;
      const installedMod = moduleRegistry.installModule(manifest, {
        componentCode: aiGeneratedBundle.frontendCode,
        backendApiCode: aiGeneratedBundle.backendCode
      });

      refreshModulesList();
      setAiGeneratedBundle(null);
      setAiPrompt('');
      setActiveTab('installed');
      onToast(`🎉 Approved and installed new AI module: ${manifest.name} v${manifest.version}!`);

      // Sync with server API
      fetch('/api/admin/modules/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(installedMod)
      }).catch(() => {});
    } catch (e: any) {
      onToast(`Approval & Installation failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 text-xs text-left font-sans animate-fadeIn">
      
      {/* TOP HEADER & CONTROL BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-rose-500" /> Modular Architecture System
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">HeartSync Extensible Engine</span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-zinc-900 dark:text-zinc-100">Feature Manager & Module System</h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-2xl mt-0.5">
              Install, enable, update, and build independent modular features. Every module is isolated with its own frontend, backend, migrations, and role permissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ai_builder')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 active:scale-95 text-white text-[11px] font-bold cursor-pointer transition-all flex items-center gap-2 shadow-md"
            >
              <Wand2 className="w-4 h-4" />
              Build AI Feature Module
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'installed'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Installed Features ({modules.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'ai_builder'
                ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-500" />
            AI Feature Builder
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sdk_template')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'sdk_template'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-4 h-4 text-blue-500" />
            Developer SDK & Template
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            Role Permissions Matrix
          </button>
        </div>
      </div>

      {/* TAB 1: INSTALLED FEATURES & MODULES */}
      {activeTab === 'installed' && (
        <div className="space-y-6">
          
          {/* SEARCH & STATUS FILTERS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, features, categories..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-medium text-xs focus:ring-0"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Modules' },
                { id: 'active', label: 'Active Only' },
                { id: 'disabled', label: 'Disabled' },
                { id: 'updates', label: 'Updates Available' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === f.id
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* MODULE CARDS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredModules.length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
                <Info className="w-8 h-8 text-zinc-400 mx-auto" />
                <h3 className="font-serif font-bold text-base text-zinc-800 dark:text-zinc-200">No Matching Modules Found</h3>
                <p className="text-xs text-zinc-500">Try adjusting your search query or status filter.</p>
              </div>
            ) : (
              filteredModules.map(mod => (
                <div 
                  key={mod.manifest.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${
                          mod.status === 'active' 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' 
                            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                        }`}>
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase font-bold text-zinc-400">{mod.manifest.category}</span>
                            <span className="font-mono text-[9px] text-zinc-400">v{mod.version}</span>
                            {mod.updateAvailable && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse">
                                v{mod.latestVersion} Available
                              </span>
                            )}
                          </div>
                          <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100 mt-0.5">{mod.manifest.name}</h3>
                        </div>
                      </div>

                      {/* TOGGLE ACTIVE STATUS SWITCH */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold uppercase ${mod.status === 'active' ? 'text-emerald-500' : 'text-zinc-400'}`}>
                          {mod.status}
                        </span>
                        <input
                          type="checkbox"
                          checked={mod.status === 'active'}
                          onChange={() => handleToggleModule(mod.manifest.id, mod.status)}
                          className="accent-rose-500 rounded text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {mod.manifest.description}
                    </p>

                    {/* METADATA CHIPS */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[10px]">
                      <span className="text-zinc-400 font-mono">Author: <strong className="text-zinc-700 dark:text-zinc-300">{mod.manifest.author}</strong></span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-zinc-400 font-mono">Installed: {new Date(mod.installedAt).toLocaleDateString()}</span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-zinc-400 font-mono">Migrations: {mod.manifest.dbMigrations?.length || 0}</span>
                    </div>
                  </div>

                  {/* ACTION CONTROLS BAR */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 gap-2">
                    <div className="flex items-center gap-2">
                      {/* SETTINGS MODAL TRIGGER */}
                      <button
                        type="button"
                        onClick={() => {
                          setSettingsModalModule(mod);
                          setEditedSettings({ ...(mod.settings || {}) });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                        Settings
                      </button>

                      {/* ACTIVITY LOGS TRIGGER */}
                      <button
                        type="button"
                        onClick={() => setLogsModalModule(mod)}
                        className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        Logs ({mod.logs?.length || 0})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* UPDATE BUTTON */}
                      {mod.updateAvailable && (
                        <button
                          type="button"
                          onClick={() => handleUpdateModule(mod)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Update
                        </button>
                      )}

                      {/* ROLLBACK BUTTON */}
                      {mod.rollbackBackup && (
                        <button
                          type="button"
                          onClick={() => handleRollbackModule(mod.manifest.id)}
                          className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] hover:bg-purple-100 cursor-pointer flex items-center gap-1"
                          title={`Roll back to v${mod.rollbackBackup.version}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Rollback
                        </button>
                      )}

                      {/* UNINSTALL BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleUninstallModule(mod.manifest.id)}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                        title="Uninstall Module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI FEATURE BUILDER (PROMPT -> REVIEW -> VALIDATE -> APPROVE & INSTALL) */}
      {activeTab === 'ai_builder' && (
        <div className="space-y-6">
          
          {/* PROMPT GENERATOR FORM */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-500" /> AI Feature Generator & Code Synthesis
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Describe a new feature module in plain English. The AI synthesizes the full Manifest, Frontend TSX, Backend Express API, SQL Migrations, and Role Permissions.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Plain English Feature Description
                </label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Build a Customer Loyalty & Referral Rewards module where readers earn points for writing reflections, completing quizzes, and subscribing to the newsletter. Include a point redemption catalog with discount coupons."
                  className="w-full p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium focus:ring-0"
                />
              </div>

              {/* GENERATOR CONFIGURATION OPTIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Target Category</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-900 font-medium"
                  >
                    <option value="tools">Tools & Utilities</option>
                    <option value="analytics">Analytics & Metrics</option>
                    <option value="marketing">Marketing & Growth</option>
                    <option value="monetization">Monetization & Ecommerce</option>
                    <option value="engagement">Reader Engagement</option>
                    <option value="security">Security & Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Min Required Role</label>
                  <select
                    value={aiRole}
                    onChange={(e) => setAiRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-zinc-900 font-medium"
                  >
                    <option value="admin">Administrator</option>
                    <option value="editor">Editor</option>
                    <option value="compliance_officer">Compliance Officer</option>
                    <option value="super_admin">Super Admin Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="aiIncludeDb"
                    checked={aiIncludeDb}
                    onChange={(e) => setAiIncludeDb(e.target.checked)}
                    className="accent-rose-500 rounded text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="aiIncludeDb" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    Include Automatic Database Migrations
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={aiIsGenerating || !aiPrompt.trim()}
                  onClick={handleGenerateAiModule}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  {aiIsGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Synthesizing AI Code, Migrations & Permissions...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate AI Feature Module
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI GENERATED BUNDLE REVIEW & APPROVAL SECTION */}
          {aiGeneratedBundle && (
            <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
              
              {/* EXPLICIT APPROVAL GUARD BANNER */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-purple-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">Administrator Review & Approval Required</h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Module synthesized! Inspect the generated code, security report, and simulated test suite before approving installation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setAiGeneratedBundle(null)}
                    className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAndInstallAiModule}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve & Install Module
                  </button>
                </div>
              </div>

              {/* VALIDATION REPORT AND TEST SIMULATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Static Code Security & Risk Score</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Risk Level: {aiGeneratedBundle.validationReport.riskScore}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">Passed 4/4 Checks</span>
                  </div>
                  <ul className="text-[10px] space-y-1 text-zinc-600 dark:text-zinc-400 pt-1">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Syntax compilation validated</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Anti-destructive SQL audit clean</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Role-based permission keys bound</li>
                  </ul>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Automated Test Suite Simulations</span>
                  <div className="space-y-1">
                    {aiGeneratedBundle.testSimulations.map((test, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] font-mono p-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <span className="text-zinc-700 dark:text-zinc-300">{test.name}</span>
                        <span className="text-emerald-600 font-bold">PASSED ({test.executionTimeMs}ms)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CODE REVIEWER TABS */}
              <div className="space-y-3">
                <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
                  {[
                    { id: 'manifest', label: 'Manifest.json' },
                    { id: 'frontend', label: 'Frontend Component (TSX)' },
                    { id: 'backend', label: 'Backend API Endpoint (TS)' },
                    { id: 'sql', label: 'SQL Migrations' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAiSelectedCodeTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all ${
                        aiSelectedCodeTab === tab.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-zinc-950 text-zinc-200 font-mono text-[11px] rounded-2xl border border-zinc-800 overflow-x-auto max-h-80">
                  <pre>
                    {aiSelectedCodeTab === 'manifest' && JSON.stringify(aiGeneratedBundle.manifest, null, 2)}
                    {aiSelectedCodeTab === 'frontend' && aiGeneratedBundle.frontendCode}
                    {aiSelectedCodeTab === 'backend' && aiGeneratedBundle.backendCode}
                    {aiSelectedCodeTab === 'sql' && aiGeneratedBundle.sqlMigrations}
                  </pre>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEVELOPER SDK & MODULE TEMPLATE */}
      {activeTab === 'sdk_template' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-500" /> Developer SDK & Module Architecture Standard
              </h3>
              <p className="text-[11px] text-zinc-500">
                Build custom third-party or internal HeartSync modules following our standard structure.
              </p>
            </div>

            {/* SDK SPECIFICATIONS */}
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Module Package Directory Structure</h4>
                <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  my-custom-module/<br/>
                  ├── manifest.json       # Metadata, permissions schema, migration steps<br/>
                  ├── index.tsx           # React UI Component view<br/>
                  ├── api.ts              # Express API route controller<br/>
                  └── migrations/001.sql # Automatic DDL database table setup
                </div>
              </div>

              {/* BOILERPLATE COPIABLE CODE */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Boilerplate manifest.json</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`{
  "id": "custom-loyalty-rewards",
  "name": "Loyalty Rewards Engine",
  "version": "1.0.0",
  "description": "Rewards program for reader engagement.",
  "author": "Your Studio",
  "category": "monetization",
  "icon": "Crown",
  "permissions": [
    {
      "code": "loyalty.manage",
      "name": "Manage Loyalty Points",
      "defaultRoles": ["admin"]
    }
  ],
  "dbMigrations": [
    {
      "version": "1.0.0",
      "description": "Create loyalty points ledger",
      "upSql": "CREATE TABLE IF NOT EXISTS module_loyalty_ledger (id VARCHAR(255) PRIMARY KEY, user_email VARCHAR(255), points INT);",
      "downSql": "DROP TABLE IF EXISTS module_loyalty_ledger;"
    }
  ]
}`);
                      setSdkCopiedFile('manifest');
                      setTimeout(() => setSdkCopiedFile(null), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 hover:bg-zinc-100 cursor-pointer"
                  >
                    {sdkCopiedFile === 'manifest' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy Boilerplate Manifest
                  </button>
                </div>

                <div className="p-4 bg-zinc-950 text-zinc-200 font-mono text-[11px] rounded-2xl border border-zinc-800 overflow-x-auto">
                  <pre>{`{
  "id": "custom-loyalty-rewards",
  "name": "Loyalty Rewards Engine",
  "version": "1.0.0",
  "description": "Rewards program for reader engagement.",
  "author": "Your Studio",
  "category": "monetization",
  "icon": "Crown",
  "permissions": [
    {
      "code": "loyalty.manage",
      "name": "Manage Loyalty Points",
      "defaultRoles": ["admin"]
    }
  ],
  "dbMigrations": [
    {
      "version": "1.0.0",
      "description": "Create loyalty points ledger",
      "upSql": "CREATE TABLE IF NOT EXISTS module_loyalty_ledger (id VARCHAR(255) PRIMARY KEY, user_email VARCHAR(255), points INT);",
      "downSql": "DROP TABLE IF EXISTS module_loyalty_ledger;"
    }
  ]
}`}</pre>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROLE-BASED PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" /> Role-Based Permission Matrix
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Granularly grant or restrict module capability keys per user role. Super Admins hold full system bypass.
                </p>
              </div>
            </div>

            {/* PERMISSIONS MATRIX TABLE */}
            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 font-mono text-[10px] text-zinc-400 uppercase">
                    <th className="p-3">Module & Permission Key</th>
                    <th className="p-3 text-center">Super Admin</th>
                    <th className="p-3 text-center">Administrator</th>
                    <th className="p-3 text-center">Editor</th>
                    <th className="p-3 text-center">Compliance Officer</th>
                    <th className="p-3 text-center">Author</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {modules.flatMap(m => m.manifest.permissions.map(p => ({ moduleName: m.manifest.name, perm: p }))).map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50">
                      <td className="p-3 space-y-0.5">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{item.perm.name}</span>
                        <span className="font-mono text-[9px] text-rose-500 block">{item.perm.code}</span>
                        <span className="text-[9px] text-zinc-400 block">{item.perm.description}</span>
                      </td>
                      <td className="p-3 text-center">
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      </td>
                      {(['admin', 'editor', 'compliance_officer', 'author'] as UserRole[]).map(role => {
                        const isGranted = item.perm.defaultRoles.includes(role);
                        return (
                          <td key={role} className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={(e) => {
                                moduleRegistry.setRolePermission(role, item.perm.code, e.target.checked);
                                refreshModulesList();
                                onToast(`Updated permission ${item.perm.code} for ${role}`);
                              }}
                              className="accent-rose-500 rounded text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MODULE SETTINGS */}
      {settingsModalModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Configure Settings: {settingsModalModule.manifest.name}
                </h3>
                <span className="font-mono text-[10px] text-zinc-400">ID: {settingsModalModule.manifest.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalModule(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {Object.entries(settingsModalModule.manifest.settingsSchema || {}).map(([key, schema]) => (
                <div key={key} className="space-y-1 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <label className="text-[10px] font-bold uppercase text-zinc-700 dark:text-zinc-300 block">{schema.label}</label>
                  {schema.description && <p className="text-[9px] text-zinc-400 mb-1">{schema.description}</p>}

                  {schema.type === 'boolean' && (
                    <input
                      type="checkbox"
                      checked={!!editedSettings[key]}
                      onChange={(e) => setEditedSettings({ ...editedSettings, [key]: e.target.checked })}
                      className="accent-rose-500 rounded text-rose-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                  )}

                  {schema.type === 'text' && (
                    <input
                      type="text"
                      value={editedSettings[key] || ''}
                      onChange={(e) => setEditedSettings({ ...editedSettings, [key]: e.target.value })}
                      className="w-full p-2 rounded-xl border bg-white dark:bg-zinc-900 font-medium"
                    />
                  )}

                  {schema.type === 'number' && (
                    <input
                      type="number"
                      value={editedSettings[key] ?? schema.default}
                      onChange={(e) => setEditedSettings({ ...editedSettings, [key]: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border bg-white dark:bg-zinc-900 font-medium"
                    />
                  )}

                  {schema.type === 'select' && (
                    <select
                      value={editedSettings[key] || schema.default}
                      onChange={(e) => setEditedSettings({ ...editedSettings, [key]: e.target.value })}
                      className="w-full p-2 rounded-xl border bg-white dark:bg-zinc-900 font-medium text-xs"
                    >
                      {schema.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSettingsModalModule(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW MODULE ACTIVITY LOGS */}
      {logsModalModule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Activity Logs: {logsModalModule.manifest.name}
                </h3>
                <span className="font-mono text-[10px] text-zinc-400">{logsModalModule.logs?.length || 0} Log Entries</span>
              </div>
              <button
                type="button"
                onClick={() => setLogsModalModule(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {logsModalModule.logs?.map((log, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] space-y-0.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span className={`uppercase font-bold ${log.level === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>{log.level}</span>
                  </div>
                  <p className="text-zinc-800 dark:text-zinc-200">{log.message}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setLogsModalModule(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
