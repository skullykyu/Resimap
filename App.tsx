import React, { useState, useEffect } from 'react';
import { MOCK_TENANTS, DEFAULT_RESIDENCE_CONFIG, DEFAULT_ORIGIN_OPTIONS, EMBEDDED_FIREBASE_CONFIG } from './constants';
import { Tenant, ResidenceConfig, PersonStatus, OriginOptions, FirebaseConfig, EntityType, OriginMetadata } from './types';
import Dashboard from './components/Dashboard';
import TenantForm from './components/TenantForm';
import RelationshipMap from './components/RelationshipMap';
import MarketingAdvisor from './components/MarketingAdvisor';
import Settings from './components/Settings';
import AdvancedStats from './components/AdvancedStats'; // Import du nouveau composant
import { initFirebase, subscribeToData, saveToFirebase, isFirebaseInitialized } from './services/firebase';
import { LayoutDashboard, Network, Users, Plus, BrainCircuit, Building2, Settings as SettingsIcon, Trash2, UserCheck, UserPlus, Cloud, CloudOff, RefreshCw, AlertTriangle, Clock, Lock, Globe, Users2, Pencil, PieChart as PieChartIcon, Search } from 'lucide-react';

enum Tab {
  DASHBOARD = 'tableau_de_bord',
  MAP = 'carte',
  STATS = 'statistiques_croisees', // Nouvel onglet
  DATA = 'donnees',
  AI = 'conseiller',
  SETTINGS = 'parametres'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);

  // --- State Initialization ---

  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('resimap_tenants');
    return saved ? JSON.parse(saved) : MOCK_TENANTS;
  });

  const [residenceConfig, setResidenceConfig] = useState<ResidenceConfig[]>(() => {
    const saved = localStorage.getItem('resimap_config');
    return saved ? JSON.parse(saved) : DEFAULT_RESIDENCE_CONFIG;
  });

  const [originOptions, setOriginOptions] = useState<OriginOptions>(() => {
    const saved = localStorage.getItem('resimap_origins');
    return saved ? JSON.parse(saved) : DEFAULT_ORIGIN_OPTIONS;
  });

  const [originMetadata, setOriginMetadata] = useState<OriginMetadata>(() => {
    const saved = localStorage.getItem('resimap_metadata');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [dataViewMode, setDataViewMode] = useState<PersonStatus>(PersonStatus.TENANT);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const configToUse = EMBEDDED_FIREBASE_CONFIG;
    if (configToUse && initFirebase(configToUse)) {
        setCloudConnected(true);
    }
  }, []);

  useEffect(() => {
    if (!cloudConnected) return;

    const handleDataUpdate = (data: any, type: 'tenants' | 'config' | 'origins' | 'metadata') => {
      setLastSyncTime(new Date());
      setSyncError(null);
      
      if (!data && type !== 'origins' && type !== 'metadata') return; 
      
      if (type === 'tenants') setTenants(data || []);
      if (type === 'config') setResidenceConfig(data);
      if (type === 'origins') {
        setOriginOptions({
          schools: data?.schools || [],
          internships: data?.internships || [],
          studyFields: data?.studyFields || DEFAULT_ORIGIN_OPTIONS.studyFields
        });
      }
      if (type === 'metadata') {
        setOriginMetadata(data || {});
      }
    };

    const handleError = (error: any) => {
      setSyncError("Erreur de synchronisation.");
    };

    const unsubTenants = subscribeToData('tenants', (data) => handleDataUpdate(data, 'tenants'), handleError);
    const unsubConfig = subscribeToData('config', (data) => handleDataUpdate(data, 'config'), handleError);
    const unsubOrigins = subscribeToData('origins', (data) => handleDataUpdate(data, 'origins'), handleError);
    const unsubMetadata = subscribeToData('metadata', (data) => handleDataUpdate(data, 'metadata'), handleError);

    return () => {
      unsubTenants();
      unsubConfig();
      unsubOrigins();
      unsubMetadata();
    };
  }, [cloudConnected]);

  useEffect(() => {
    localStorage.setItem('resimap_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('resimap_config', JSON.stringify(residenceConfig));
  }, [residenceConfig]);

  useEffect(() => {
    localStorage.setItem('resimap_origins', JSON.stringify(originOptions));
  }, [originOptions]);

  useEffect(() => {
    localStorage.setItem('resimap_metadata', JSON.stringify(originMetadata));
  }, [originMetadata]);

  const handleCloudConnect = (config: FirebaseConfig) => {
     if (initFirebase(config)) {
       setCloudConnected(true);
       window.location.reload();
     }
  };

  const safeSave = async (path: string, data: any) => {
    if (!cloudConnected) return;
    try {
      await saveToFirebase(path, data);
      setSyncError(null);
      setLastSyncTime(new Date());
    } catch (e: any) {
      setSyncError("Échec de l'enregistrement.");
    }
  };

  const handleForcePushToCloud = async () => {
    if (!cloudConnected) return;
    if (window.confirm("Écraser les données partagées ?")) {
      setIsPushing(true);
      try {
        await Promise.all([
          saveToFirebase('tenants', tenants),
          saveToFirebase('config', residenceConfig),
          saveToFirebase('origins', originOptions),
          saveToFirebase('metadata', originMetadata)
        ]);
        setLastSyncTime(new Date());
        setSyncError(null);
      } catch (e: any) {
        setSyncError("Erreur d'envoi.");
      } finally {
        setIsPushing(false);
      }
    }
  };

  const handleCloudDisconnect = () => {
    window.location.reload(); 
  };

  const checkAndSaveNewOptions = (tenant: Tenant) => {
    let updatedOptions = { ...originOptions };
    let hasChanges = false;
    const cleanCursus = tenant.cursus ? tenant.cursus.trim() : '';
    if (cleanCursus && !updatedOptions.studyFields.includes(cleanCursus)) {
      updatedOptions.studyFields = [...updatedOptions.studyFields, cleanCursus].sort();
      hasChanges = true;
    }
    const listKey = tenant.originType === EntityType.SCHOOL ? 'schools' : 'internships';
    const cleanOrigin = tenant.originName ? tenant.originName.trim() : '';
    const currentList = updatedOptions[listKey] || [];
    if (cleanOrigin && !currentList.includes(cleanOrigin)) {
      updatedOptions[listKey] = [...currentList, cleanOrigin].sort();
      hasChanges = true;
    }
    if (hasChanges) {
      setOriginOptions(updatedOptions);
      safeSave('origins', updatedOptions);
    }
  };

  const addTenant = (newTenant: Tenant) => {
    checkAndSaveNewOptions(newTenant);
    const updated = [...tenants, newTenant];
    setTenants(updated); 
    safeSave('tenants', updated);
  };

  const updateTenant = (updatedTenant: Tenant) => {
    checkAndSaveNewOptions(updatedTenant);
    const updatedList = tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t);
    setTenants(updatedList);
    safeSave('tenants', updatedList);
    setEditingTenant(null);
  };

  const handleEditClick = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setActiveTab(Tab.DATA);
    setDataViewMode(tenant.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTenant = (id: string) => {
    if (window.confirm("Supprimer cette fiche définitivement ?")) {
      const updated = tenants.filter(t => t.id !== id);
      setTenants(updated);
      safeSave('tenants', updated);
      if (editingTenant?.id === id) setEditingTenant(null);
    }
  };

  const handleRenameOption = (type: 'schools' | 'internships' | 'studyFields', oldName: string, newName: string) => {
    if (!newName || !newName.trim() || oldName === newName) return;
    const cleanNewName = newName.trim();

    // 1. Update Options
    const updatedOptions = { ...originOptions };
    updatedOptions[type] = updatedOptions[type].map(n => n === oldName ? cleanNewName : n).sort();
    
    // 2. Cascade update to Tenants
    const updatedTenants = tenants.map(t => {
      if (type === 'studyFields' && t.cursus === oldName) {
        return { ...t, cursus: cleanNewName };
      }
      if ((type === 'schools' || type === 'internships') && t.originName === oldName) {
        return { ...t, originName: cleanNewName };
      }
      return t;
    });

    // 3. Migrate Metadata
    let updatedMetadata = { ...originMetadata };
    if (originMetadata[oldName]) {
      updatedMetadata[cleanNewName] = { ...originMetadata[oldName] };
      delete updatedMetadata[oldName];
    }

    // Apply & Save all
    setOriginOptions(updatedOptions);
    setTenants(updatedTenants);
    setOriginMetadata(updatedMetadata);
    
    safeSave('origins', updatedOptions);
    safeSave('tenants', updatedTenants);
    safeSave('metadata', updatedMetadata);
  };

  const updateConfig = (newConfig: ResidenceConfig[]) => {
    setResidenceConfig(newConfig);
    safeSave('config', newConfig);
  };

  const updateOriginOptions = (newOptions: OriginOptions) => {
    setOriginOptions(newOptions);
    safeSave('origins', newOptions);
  };

  const updateOriginMetadata = (newMetadata: OriginMetadata) => {
    setOriginMetadata(newMetadata);
    safeSave('metadata', newMetadata);
  };

  const handleResetAll = () => {
    if (window.confirm("Effacer TOUTES les données ?")) {
      setTenants(MOCK_TENANTS);
      setResidenceConfig(DEFAULT_RESIDENCE_CONFIG);
      setOriginOptions(DEFAULT_ORIGIN_OPTIONS);
      setOriginMetadata({});
      if (cloudConnected) {
        safeSave('tenants', MOCK_TENANTS);
        safeSave('config', DEFAULT_RESIDENCE_CONFIG);
        safeSave('origins', DEFAULT_ORIGIN_OPTIONS);
        safeSave('metadata', {});
      }
    }
  };

  const handleImportData = (data: any) => {
    try {
      if (data.tenants) { setTenants(data.tenants); safeSave('tenants', data.tenants); }
      if (data.config) { setResidenceConfig(data.config); safeSave('config', data.config); }
      if (data.origins) { setOriginOptions(data.origins); safeSave('origins', data.origins); }
      if (data.metadata) { setOriginMetadata(data.metadata); safeSave('metadata', data.metadata); }
      alert("Import réussi !");
    } catch (e) { alert("Erreur import."); }
  };

  const getResColor = (id: string) => residenceConfig.find(r => r.id === id)?.color || '#ccc';
  const getResName = (id: string) => residenceConfig.find(r => r.id === id)?.name || id;

  const activeTenants = tenants.filter(t => t.status === PersonStatus.TENANT);
  const prospects = tenants.filter(t => t.status === PersonStatus.PROSPECT);
  
  const filteredByStatus = dataViewMode === PersonStatus.TENANT ? activeTenants : prospects;
  const displayList = filteredByStatus.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10 transition-all duration-300">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <Building2 className="w-8 h-8 text-indigo-500 flex-shrink-0" />
          <span className="ml-3 font-bold text-white text-lg hidden lg:block tracking-tight">ResiMap</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button onClick={() => setActiveTab(Tab.DASHBOARD)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.DASHBOARD ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" /><span className="ml-3 font-medium hidden lg:block">Tableau de Bord</span>
          </button>
          <button onClick={() => setActiveTab(Tab.MAP)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.MAP ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <Network className="w-5 h-5 flex-shrink-0" /><span className="ml-3 font-medium hidden lg:block">Carte des Flux</span>
          </button>
          <button onClick={() => setActiveTab(Tab.STATS)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.STATS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <PieChartIcon className="w-5 h-5 flex-shrink-0" /><span className="ml-3 font-medium hidden lg:block">Statistiques Croisées</span>
          </button>
          <button onClick={() => setActiveTab(Tab.AI)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.AI ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
            <BrainCircuit className="w-5 h-5 flex-shrink-0" /><span className="ml-3 font-medium hidden lg:block">Conseiller IA</span>
          </button>
          <div className="pt-4 border-t border-slate-800 mt-4">
             <button onClick={() => setActiveTab(Tab.DATA)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.DATA ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
              <Users className="w-5 h-5 flex-shrink-0" /><span className="ml-3 font-medium hidden lg:block">Données & Saisie</span>
            </button>
            <button onClick={() => setActiveTab(Tab.SETTINGS)} className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.SETTINGS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
              <SettingsIcon className="w-5 h-5 flex-shrink-0" /><span className="ml-3 font-medium hidden lg:block">Paramètres</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        <header className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">
                {activeTab === Tab.DASHBOARD && 'Vue d\'ensemble'}
                {activeTab === Tab.MAP && 'Cartographie des Relations'}
                {activeTab === Tab.STATS && 'Analyses & Statistiques Croisées'}
                {activeTab === Tab.AI && 'Stratégie Marketing (Gemini)'}
                {activeTab === Tab.DATA && 'Gestion des Données'}
                {activeTab === Tab.SETTINGS && 'Paramètres Généraux'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex gap-2">
                <span className="text-indigo-600">{activeTenants.length} Locs.</span>
                <span className="text-slate-300">|</span>
                <span className="text-amber-600">{prospects.length} Contacts</span>
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === Tab.DASHBOARD && <Dashboard tenants={activeTenants} residenceConfig={residenceConfig} />}
          {activeTab === Tab.MAP && <div className="h-[600px]"><RelationshipMap tenants={activeTenants} residenceConfig={residenceConfig} originMetadata={originMetadata} /></div>}
          {activeTab === Tab.STATS && <AdvancedStats tenants={tenants} residenceConfig={residenceConfig} />}
          {activeTab === Tab.AI && <MarketingAdvisor tenants={activeTenants} residenceConfig={residenceConfig} />}
          {activeTab === Tab.SETTINGS && (
               <Settings 
                 config={residenceConfig} onUpdateConfig={updateConfig} 
                 originOptions={originOptions} onUpdateOriginOptions={updateOriginOptions}
                 onRenameOption={handleRenameOption}
                 onResetAll={handleResetAll} tenants={tenants} onImportData={handleImportData}
                 onConnectCloud={handleCloudConnect} onDisconnectCloud={handleCloudDisconnect}
                 onForcePush={handleForcePushToCloud} isCloudConnected={cloudConnected}
                 originMetadata={originMetadata} onUpdateMetadata={updateOriginMetadata}
               />
          )}
          {activeTab === Tab.DATA && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TenantForm onAddTenant={addTenant} onUpdateTenant={updateTenant} editingTenant={editingTenant} onCancelEdit={() => setEditingTenant(null)} residenceConfig={residenceConfig} originOptions={originOptions} />
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 relative">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex border-b">
                  <button onClick={() => setDataViewMode(PersonStatus.TENANT)} className={`flex-1 py-3 text-sm font-medium ${dataViewMode === PersonStatus.TENANT ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'text-slate-500'}`}>Locataires ({activeTenants.length})</button>
                  <button onClick={() => setDataViewMode(PersonStatus.PROSPECT)} className={`flex-1 py-3 text-sm font-medium ${dataViewMode === PersonStatus.PROSPECT ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50/50' : 'text-slate-500'}`}>Contacts ({prospects.length})</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-900 font-medium">
                      <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Résidence</th><th className="px-4 py-3">Provenance</th><th className="px-4 py-3 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...displayList].reverse().map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 group">
                          <td className="px-4 py-3 font-medium">{t.name}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs border" style={{ backgroundColor: `${getResColor(t.residenceId)}20`, color: getResColor(t.residenceId), borderColor: `${getResColor(t.residenceId)}40` }}>{getResName(t.residenceId)}</span></td>
                          <td className="px-4 py-3 text-xs">{t.originName} <span className="text-slate-400">({t.cursus})</span></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                              <button onClick={() => handleEditClick(t)} className="p-1.5 text-slate-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => deleteTenant(t.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;