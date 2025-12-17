import React, { useState, useEffect } from 'react';
import { MOCK_TENANTS, DEFAULT_RESIDENCE_CONFIG, DEFAULT_ORIGIN_OPTIONS, EMBEDDED_FIREBASE_CONFIG } from './constants';
import { Tenant, ResidenceConfig, PersonStatus, OriginOptions, FirebaseConfig, EntityType } from './types';
import Dashboard from './components/Dashboard';
import TenantForm from './components/TenantForm';
import RelationshipMap from './components/RelationshipMap';
import MarketingAdvisor from './components/MarketingAdvisor';
import Settings from './components/Settings';
import AdvancedStats from './components/AdvancedStats'; // Import du nouveau composant
import { initFirebase, subscribeToData, saveToFirebase, isFirebaseInitialized } from './services/firebase';
import { LayoutDashboard, Network, Users, Plus, BrainCircuit, Building2, Settings as SettingsIcon, Trash2, UserCheck, UserPlus, Cloud, CloudOff, RefreshCw, AlertTriangle, Clock, Lock, Globe, Users2, Pencil, PieChart as PieChartIcon } from 'lucide-react';

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
    // Try local storage for instant load, will be overwritten by cloud sync immediately
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
  
  // State for Data View sub-tab
  const [dataViewMode, setDataViewMode] = useState<PersonStatus>(PersonStatus.TENANT);
  
  // EDIT MODE STATE
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // --- Cloud Logic (Auto-Connect) ---

  useEffect(() => {
    // Force connection using the embedded config for Shared Mode
    const configToUse = EMBEDDED_FIREBASE_CONFIG;

    if (configToUse && initFirebase(configToUse)) {
        setCloudConnected(true);
        console.log("Mode Partagé : Connecté à", configToUse.projectId);
    }
  }, []);

  // Listen for Cloud Updates
  useEffect(() => {
    if (!cloudConnected) return;

    const handleDataUpdate = (data: any, type: 'tenants' | 'config' | 'origins') => {
      setLastSyncTime(new Date());
      setSyncError(null); // Clear error if we successfully receive data
      
      if (!data && type !== 'origins') return; // Ignore null data for main lists unless explicitly handled
      
      if (type === 'tenants') setTenants(data || []);
      if (type === 'config') setResidenceConfig(data);
      if (type === 'origins') {
        // PROTECTION CRITIQUE : Si 'schools' ou 'internships' est vide en base, Firebase ne renvoie rien.
        // On force des tableaux vides [] pour éviter les crashs "map of undefined".
        setOriginOptions({
          schools: data?.schools || [],
          internships: data?.internships || [],
          studyFields: data?.studyFields || DEFAULT_ORIGIN_OPTIONS.studyFields // Init Cursus too
        });
      }
    };

    const handleError = (error: any) => {
      console.error("Sync Error:", error);
      let msg = "Erreur de synchronisation inconnue.";
      if (error.code === 'PERMISSION_DENIED') {
        msg = "Accès refusé. Avez-vous mis les règles de la base de données sur 'true' ?";
      } else if (error.code === 'NETWORK_ERROR') {
        msg = "Erreur réseau : Vérifiez votre connexion internet.";
      }
      setSyncError(msg);
    };

    const unsubTenants = subscribeToData('tenants', (data) => handleDataUpdate(data, 'tenants'), handleError);
    const unsubConfig = subscribeToData('config', (data) => handleDataUpdate(data, 'config'), handleError);
    const unsubOrigins = subscribeToData('origins', (data) => handleDataUpdate(data, 'origins'), handleError);

    return () => {
      unsubTenants();
      unsubConfig();
      unsubOrigins();
    };
  }, [cloudConnected]);

  // --- Persistence Logic (Hybrid) ---

  useEffect(() => {
    localStorage.setItem('resimap_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('resimap_config', JSON.stringify(residenceConfig));
  }, [residenceConfig]);

  useEffect(() => {
    localStorage.setItem('resimap_origins', JSON.stringify(originOptions));
  }, [originOptions]);

  // --- Handlers (With Cloud Sync) ---

  // Needed for Settings component interface, even if we auto-connect
  const handleCloudConnect = (config: FirebaseConfig) => {
     // No-op in shared mode usually, but allow override if needed
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
      console.error("Save failed", e);
      setSyncError("Échec de l'enregistrement : " + (e.message || "Erreur inconnue"));
    }
  };

  const handleForcePushToCloud = async () => {
    if (!cloudConnected) return;
    
    if (window.confirm("⚠️ ATTENTION : Vous allez écraser les données partagées avec votre version locale. Continuer ?")) {
      setIsPushing(true);
      try {
        await Promise.all([
          saveToFirebase('tenants', tenants),
          saveToFirebase('config', residenceConfig),
          saveToFirebase('origins', originOptions)
        ]);
        alert("✅ Succès ! Données mises à jour pour tout le monde.");
        setLastSyncTime(new Date());
        setSyncError(null);
      } catch (e: any) {
        alert("❌ Erreur : " + e.message);
        setSyncError("Erreur d'envoi : " + e.message);
      } finally {
        setIsPushing(false);
      }
    }
  };

  const handleCloudDisconnect = () => {
    // In shared mode, "disconnect" just reloads, but since it's hardcoded it will reconnect.
    // We could implement a "Go Offline" mode if needed, but for now simple reload.
    window.location.reload(); 
  };

  // --- AUTO-SAVE NEW OPTIONS LOGIC ---
  const checkAndSaveNewOptions = (tenant: Tenant) => {
    let updatedOptions = { ...originOptions };
    let hasChanges = false;
    
    // 1. Cursus / Formation (Nettoyage et ajout si inexistant)
    const cleanCursus = tenant.cursus ? tenant.cursus.trim() : '';
    if (cleanCursus && !updatedOptions.studyFields.includes(cleanCursus)) {
      updatedOptions.studyFields = [...updatedOptions.studyFields, cleanCursus].sort();
      hasChanges = true;
    }

    // 2. Écoles / Entreprises (Nettoyage et ajout si inexistant)
    const listKey = tenant.originType === EntityType.SCHOOL ? 'schools' : 'internships';
    const cleanOrigin = tenant.originName ? tenant.originName.trim() : '';
    const currentList = updatedOptions[listKey] || [];
    
    if (cleanOrigin && !currentList.includes(cleanOrigin)) {
      updatedOptions[listKey] = [...currentList, cleanOrigin].sort();
      hasChanges = true;
    }

    // Sauvegarde globale si modifications détectées
    if (hasChanges) {
      setOriginOptions(updatedOptions);
      safeSave('origins', updatedOptions);
    }
  };

  const addTenant = (newTenant: Tenant) => {
    // Étape 1 : Vérifier et ajouter les nouvelles options aux listes globales
    checkAndSaveNewOptions(newTenant);

    // Étape 2 : Ajouter le locataire
    const updated = [...tenants, newTenant];
    setTenants(updated); 
    safeSave('tenants', updated);
  };

  const updateTenant = (updatedTenant: Tenant) => {
    // Étape 1 : Vérifier et ajouter les nouvelles options aux listes globales
    checkAndSaveNewOptions(updatedTenant);

    // Étape 2 : Mettre à jour le locataire
    const updatedList = tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t);
    setTenants(updatedList);
    safeSave('tenants', updatedList);
    setEditingTenant(null); // Exit edit mode
  };

  const handleEditClick = (tenant: Tenant) => {
    setEditingTenant(tenant);
    // Ensure we are on the data tab to see the form
    setActiveTab(Tab.DATA);
    // Ensure we are viewing the correct list (Tenant vs Prospect) based on the item being edited
    setDataViewMode(tenant.status);
    
    // Scroll to top of form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTenant = (id: string) => {
    if (window.confirm("Supprimer cette fiche définitivement pour tout le monde ?")) {
      const updated = tenants.filter(t => t.id !== id);
      setTenants(updated);
      safeSave('tenants', updated);
      
      if (editingTenant?.id === id) {
        setEditingTenant(null);
      }
    }
  };

  const updateConfig = (newConfig: ResidenceConfig[]) => {
    setResidenceConfig(newConfig);
    safeSave('config', newConfig);
  };

  const updateOriginOptions = (newOptions: OriginOptions) => {
    setOriginOptions(newOptions);
    safeSave('origins', newOptions);
  };

  const handleResetAll = () => {
    if (window.confirm("⚠️ ATTENTION : Cela va effacer TOUTES les données partagées. Êtes-vous certain ?")) {
      setTenants(MOCK_TENANTS);
      setResidenceConfig(DEFAULT_RESIDENCE_CONFIG);
      setOriginOptions(DEFAULT_ORIGIN_OPTIONS);
      
      if (cloudConnected) {
        safeSave('tenants', MOCK_TENANTS);
        safeSave('config', DEFAULT_RESIDENCE_CONFIG);
        safeSave('origins', DEFAULT_ORIGIN_OPTIONS);
      }
    }
  };

  const handleImportData = (data: any) => {
    try {
      if (data.tenants) {
        setTenants(data.tenants);
        safeSave('tenants', data.tenants);
      }
      if (data.config) {
        setResidenceConfig(data.config);
        safeSave('config', data.config);
      }
      if (data.origins) {
        setOriginOptions(data.origins);
        safeSave('origins', data.origins);
      }
      alert("Données importées avec succès !");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'importation.");
    }
  };

  const getResColor = (id: string) => residenceConfig.find(r => r.id === id)?.color || '#ccc';
  const getResName = (id: string) => residenceConfig.find(r => r.id === id)?.name || id;

  // Filtered lists
  const activeTenants = tenants.filter(t => t.status === PersonStatus.TENANT);
  const prospects = tenants.filter(t => t.status === PersonStatus.PROSPECT);
  
  // Determine which list to show in Data View
  const displayList = dataViewMode === PersonStatus.TENANT ? activeTenants : prospects;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-10 transition-all duration-300">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <Building2 className="w-8 h-8 text-indigo-500 flex-shrink-0" />
          <span className="ml-3 font-bold text-white text-lg hidden lg:block tracking-tight">ResiMap</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          
          <button
            onClick={() => setActiveTab(Tab.DASHBOARD)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.DASHBOARD ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-medium hidden lg:block">Tableau de Bord</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.MAP)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.MAP ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Network className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-medium hidden lg:block">Carte des Flux</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.STATS)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.STATS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <PieChartIcon className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-medium hidden lg:block">Statistiques Croisées</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.AI)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.AI ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <BrainCircuit className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-medium hidden lg:block">Conseiller IA</span>
          </button>

          <div className="pt-4 border-t border-slate-800 mt-4">
             <button
              onClick={() => setActiveTab(Tab.DATA)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.DATA ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 font-medium hidden lg:block">Données & Saisie</span>
            </button>
            <button
              onClick={() => setActiveTab(Tab.SETTINGS)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.SETTINGS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <SettingsIcon className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 font-medium hidden lg:block">Paramètres</span>
            </button>
          </div>

        </nav>
        
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center lg:text-left hidden lg:block">
          &copy; 2024 ResiMap Corp.
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        <header className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {activeTab === Tab.DASHBOARD && 'Vue d\'ensemble'}
                {activeTab === Tab.MAP && 'Cartographie des Relations'}
                {activeTab === Tab.STATS && 'Analyses & Statistiques Croisées'}
                {activeTab === Tab.AI && 'Stratégie Marketing (Gemini)'}
                {activeTab === Tab.DATA && 'Gestion des Données'}
                {activeTab === Tab.SETTINGS && 'Paramètres Généraux'}
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <span>Gérez vos 4 résidences et analysez vos cibles.</span>
              </p>
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-2">
              {/* Status Bar */}
              <div className="flex items-center gap-2">
                {cloudConnected ? (
                   <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm ${syncError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {syncError ? <AlertTriangle className="w-3.5 h-3.5" /> : <Users2 className="w-3.5 h-3.5" />}
                        {syncError ? "Erreur Synchro" : "Site Partagé (En Ligne)"}
                    </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                      <CloudOff className="w-3.5 h-3.5" />
                      Mode Hors-Ligne
                  </div>
                )}
                
                {lastSyncTime && !syncError && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Sync : {lastSyncTime.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Force Push Button */}
                {cloudConnected && (
                  <button 
                    onClick={handleForcePushToCloud}
                    disabled={isPushing}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm ${isPushing ? 'opacity-70 cursor-wait' : ''}`}
                    title="Sauvegarder immédiatement"
                  >
                    <RefreshCw className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
                    {isPushing ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                )}

                <span className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 shadow-sm flex gap-2">
                  <span className="text-indigo-600">{activeTenants.length} Locs.</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-amber-600">{prospects.length} Contacts</span>
                </span>
                <button 
                  onClick={() => setActiveTab(Tab.DATA)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {syncError && cloudConnected && (
             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-in slide-in-from-top-2">
               <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold">Problème d'accès aux données :</p>
                 <p>{syncError}</p>
                 <p className="mt-1 font-semibold underline">
                    Action requise : Allez dans la console Firebase &gt; Build &gt; Realtime Database &gt; Règles, et mettez '.read': true et '.write': true.
                 </p>
               </div>
             </div>
          )}
        </header>

        {/* Content Views */}
        <div className="max-w-7xl mx-auto">
          
          {/* Dashboard only uses confirmed TENANTS to avoid skewing stats */}
          {activeTab === Tab.DASHBOARD && (
            <Dashboard tenants={activeTenants} residenceConfig={residenceConfig} />
          )}

          {/* Map only uses confirmed TENANTS for now */}
          {activeTab === Tab.MAP && (
            <div className="h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RelationshipMap tenants={activeTenants} residenceConfig={residenceConfig} />
            </div>
          )}

          {activeTab === Tab.STATS && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdvancedStats tenants={activeTenants} residenceConfig={residenceConfig} />
            </div>
          )}

          {activeTab === Tab.AI && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <MarketingAdvisor tenants={activeTenants} residenceConfig={residenceConfig} />
            </div>
          )}

          {activeTab === Tab.SETTINGS && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Settings 
                 config={residenceConfig} 
                 onUpdateConfig={updateConfig} 
                 originOptions={originOptions}
                 onUpdateOriginOptions={updateOriginOptions}
                 onResetAll={handleResetAll}
                 tenants={tenants}
                 onImportData={handleImportData}
                 onConnectCloud={handleCloudConnect}
                 onDisconnectCloud={handleCloudDisconnect}
                 onForcePush={handleForcePushToCloud}
                 isCloudConnected={cloudConnected}
               />
            </div>
          )}

          {activeTab === Tab.DATA && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="lg:col-span-1">
                <TenantForm 
                  onAddTenant={addTenant} 
                  onUpdateTenant={updateTenant}
                  editingTenant={editingTenant}
                  onCancelEdit={() => setEditingTenant(null)}
                  residenceConfig={residenceConfig} 
                  originOptions={originOptions}
                />
              </div>
              
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                
                {/* Sub-tabs for Tenant vs Prospect Table */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setDataViewMode(PersonStatus.TENANT)}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                      dataViewMode === PersonStatus.TENANT 
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    Locataires Actifs ({activeTenants.length})
                  </button>
                  <button
                    onClick={() => setDataViewMode(PersonStatus.PROSPECT)}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors border-b-2 ${
                      dataViewMode === PersonStatus.PROSPECT
                      ? 'border-amber-500 text-amber-700 bg-amber-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    Nouveaux Contacts ({prospects.length})
                  </button>
                </div>

                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-medium">
                      <tr>
                        <th className="px-4 py-3">Nom</th>
                        <th className="px-4 py-3">Résidence</th>
                        <th className="px-4 py-3">Provenance</th>
                        <th className="px-4 py-3">Cursus</th>
                        {dataViewMode === PersonStatus.TENANT && <th className="px-4 py-3">Durée</th>}
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                            Aucune donnée trouvée dans cette catégorie.
                          </td>
                        </tr>
                      )}
                      {[...displayList].reverse().map((t) => (
                        <tr key={t.id} className={`transition-colors group ${editingTenant?.id === t.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-3 font-medium text-slate-900">
                             {t.name}
                             {editingTenant?.id === t.id && <span className="ml-2 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">Édition</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                              style={{ 
                                backgroundColor: `${getResColor(t.residenceId)}20`,
                                color: getResColor(t.residenceId),
                                borderColor: `${getResColor(t.residenceId)}40`
                              }}
                            >
                              {getResName(t.residenceId)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{t.originName}</td>
                          <td className="px-4 py-3">
                            {t.cursus ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 border border-slate-200">
                                {t.cursus}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-xs">Non renseigné</span>
                            )}
                          </td>
                          {dataViewMode === PersonStatus.TENANT && (
                             <td className="px-4 py-3 text-xs text-slate-500">
                              {t.duration || <span className="text-slate-300 italic">N/A</span>}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditClick(t)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                title="Modifier"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTenant(t.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                title="Supprimer la fiche"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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