import React, { useState, useRef, useEffect } from 'react';
import { ResidenceConfig, ResidenceID, OriginOptions, Tenant, FirebaseConfig } from '../types';
import { Settings as SettingsIcon, Trash2, Plus, School, Building, AlertOctagon, Download, Upload, FileJson, Copy, Check, Info, Cloud, Wifi, WifiOff, RefreshCw, ExternalLink, MousePointerClick, XCircle, CheckCircle } from 'lucide-react';

interface SettingsProps {
  config: ResidenceConfig[];
  onUpdateConfig: (newConfig: ResidenceConfig[]) => void;
  originOptions: OriginOptions;
  onUpdateOriginOptions: (newOptions: OriginOptions) => void;
  onResetAll: () => void;
  tenants: Tenant[];
  onImportData: (data: any) => void;
  
  // Cloud Props
  onConnectCloud: (config: FirebaseConfig) => void;
  onDisconnectCloud: () => void;
  onForcePush: () => void;
  isCloudConnected: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  config, 
  onUpdateConfig, 
  originOptions, 
  onUpdateOriginOptions, 
  onResetAll,
  tenants,
  onImportData,
  onConnectCloud,
  onDisconnectCloud,
  onForcePush,
  isCloudConnected
}) => {
  // Config Management
  const handleChangeConfig = (id: ResidenceID, field: keyof ResidenceConfig, value: string) => {
    const newConfig = config.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    onUpdateConfig(newConfig);
  };

  // Origin List Management Inputs
  const [newSchool, setNewSchool] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Check if using default bad config
  const isDemoConfig = (() => {
    const saved = localStorage.getItem('resimap_firebase_config');
    if (!saved) return true; // Default is demo
    try {
        const parsed = JSON.parse(saved);
        // Assuming the demo project ID is what we hardcoded in constants
        return parsed.projectId === 'resimap63000';
    } catch { return false; }
  })();

  // Cloud Config State - Auto open if in demo mode
  const [firebaseConfigInput, setFirebaseConfigInput] = useState('');
  const [showCloudForm, setShowCloudForm] = useState(false);
  
  // LIVE VALIDATION
  const isInputForbidden = firebaseConfigInput.includes('resimap63000');
  const isInputValidLooking = firebaseConfigInput.includes('projectId') && !isInputForbidden && firebaseConfigInput.includes('apiKey');

  // Initialize form state based on demo status
  useEffect(() => {
    if (isDemoConfig) {
        setShowCloudForm(true);
    }
  }, [isDemoConfig]);

  // Load existing config into input for viewing
  useEffect(() => {
    const savedConfig = localStorage.getItem('resimap_firebase_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setFirebaseConfigInput(JSON.stringify(parsed, null, 2));
      } catch (e) {
        setFirebaseConfigInput(savedConfig);
      }
    } else {
        setFirebaseConfigInput(""); // Clear by default
    }
  }, [isCloudConnected]);
  
  // File Import Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSchool = () => {
    if (newSchool.trim()) {
      onUpdateOriginOptions({
        ...originOptions,
        schools: [...originOptions.schools, newSchool.trim()].sort()
      });
      setNewSchool('');
    }
  };

  const addCompany = () => {
    if (newCompany.trim()) {
      onUpdateOriginOptions({
        ...originOptions,
        internships: [...originOptions.internships, newCompany.trim()].sort()
      });
      setNewCompany('');
    }
  };

  const removeOption = (type: 'schools' | 'internships', valueToRemove: string) => {
    onUpdateOriginOptions({
      ...originOptions,
      [type]: originOptions[type].filter(item => item !== valueToRemove)
    });
  };

  // --- Cloud Logic ---
  const handleConnect = () => {
    try {
      let input = firebaseConfigInput.trim();
      // Simple cleaning of JS object syntax to JSON if needed
      if (!input.startsWith('{')) {
        const configMatch = input.match(/firebaseConfig\s*=\s*({[\s\S]*?})(?:;|$)/);
        if (configMatch && configMatch[1]) {
           input = configMatch[1];
        } else {
            // Try finding first brace
            const firstBrace = input.indexOf('{');
            const lastBrace = input.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
              input = input.substring(firstBrace, lastBrace + 1);
            }
        }
      }

      // Allow loose JSON (keys without quotes) via Function constructor
      let configObj;
      try {
        configObj = new Function('return ' + input)();
      } catch (e) {
        // Fallback to JSON parse
        try {
            configObj = JSON.parse(input);
        } catch (jsonErr) {
            throw new Error("Format invalide. Copiez exactement le code fourni par Firebase.");
        }
      }

      if (!configObj.apiKey || !configObj.projectId) {
         alert("La configuration est incomplète (il manque apiKey ou projectId).");
         return;
      }

      // SECURITY CHECK: Prevent user from pasting the demo config manually
      if (configObj.projectId === 'resimap63000') {
         alert("🛑 Ce code est celui de la démo publique.\n\nVous devez créer votre PROPRE projet sur Firebase pour avoir votre propre code. Suivez les instructions affichées à l'écran.");
         return;
      }
      
      onConnectCloud(configObj);
      setShowCloudForm(false);
    } catch (e: any) {
      console.error(e);
      alert("Erreur de lecture : " + e.message);
    }
  };

  // --- Export / Import Logic ---
  
  const getExportData = () => {
    return {
      tenants,
      config,
      origins: originOptions,
      exportDate: new Date().toISOString()
    };
  };
  
  const handleExport = () => {
    const jsonString = JSON.stringify(getExportData(), null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `resimap_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
    const jsonString = JSON.stringify(getExportData(), null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (window.confirm("Vous allez importer des données qui écraseront les données actuelles si des conflits existent. Voulez-vous continuer ?")) {
          onImportData(json);
        }
      } catch (err) {
        alert("Fichier invalide");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 mb-8">
      
      {/* CLOUD SYNC SECTION */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${!isDemoConfig ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b flex items-center gap-3 ${!isDemoConfig ? 'border-indigo-100 bg-indigo-100/50' : 'border-slate-100 bg-slate-50'}`}>
          <div className={`p-2 rounded-lg ${!isDemoConfig ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h2 className={`text-xl font-bold ${!isDemoConfig ? 'text-indigo-900' : 'text-slate-800'}`}>
              Synchronisation Cloud (Multi-Utilisateurs)
            </h2>
            <p className={`${!isDemoConfig ? 'text-indigo-700' : 'text-slate-500'} text-sm`}>
              {!isDemoConfig 
                ? 'Vos données sont privées et synchronisées en temps réel.' 
                : 'Connectez votre propre base de données pour sécuriser et partager vos données.'}
            </p>
          </div>
          <div>
            {!isDemoConfig ? (
              <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200">
                <Wifi className="w-4 h-4" /> Connecté (Privé)
              </span>
            ) : (
               <span className="flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wide border border-amber-200">
                <WifiOff className="w-4 h-4" /> Non Configuré
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-6">
            
            {isDemoConfig && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-lg">
                    <AlertOctagon className="w-6 h-6" />
                    IMPORTANT : Obtenir votre code privé
                  </div>
                  
                  <div className="text-sm text-amber-900">
                     <p className="mb-2">Le code "resimap63000" est celui de la démo publique. Ne l'utilisez pas.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 p-4 rounded-lg border border-amber-200">
                      <div className="space-y-2">
                         <p className="font-bold border-b border-amber-200 pb-1">1. Ouvrir votre Projet</p>
                         <ul className="space-y-1 list-disc list-inside pl-2">
                           <li>Retournez sur <a href="https://console.firebase.google.com" target="_blank" className="underline font-bold inline-flex items-center gap-1" rel="noreferrer">Firebase Console <ExternalLink className="w-3 h-3" /></a></li>
                           <li><strong>Cliquez sur le projet</strong> que vous avez déjà créé (ex: "MonImmo").</li>
                           <li><em>(Si pas fait : Créez-en un, puis allez dans "Realtime Database" et activez le "Mode Test").</em></li>
                         </ul>
                      </div>
                      <div className="space-y-2">
                         <p className="font-bold border-b border-amber-200 pb-1">2. Retrouver le Code</p>
                         <ul className="space-y-1 list-disc list-inside pl-2">
                           <li>Cliquez sur la <strong>Roue dentée ⚙️</strong> (haut gauche) {'>'} Paramètres du projet.</li>
                           <li>Descendez <strong>tout en bas</strong> de la page.</li>
                           <li>Si vous voyez "SDK setup and configuration", cochez "Config".</li>
                           <li>Sinon, cliquez sur le bouton rond <strong><code>{'</>'}</code></strong> pour générer le code.</li>
                           <li><strong>Copiez le code</strong> (Vérifiez que projectId n'est PAS "resimap63000").</li>
                         </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isDemoConfig && isCloudConnected && (
              <div className="flex gap-4 items-center flex-wrap">
                 <button 
                  onClick={onForcePush}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Forcer l'envoi de MES données vers le Cloud
                </button>
                <p className="text-xs text-slate-500 italic max-w-sm">
                  Utilisez ceci si votre collègue ne voit pas vos modifications instantanément.
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 mt-2">
              {(!showCloudForm && !isDemoConfig) && (
                <button 
                  onClick={() => setShowCloudForm(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                >
                  Afficher la configuration technique
                </button>
              )}
              
              {showCloudForm && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-indigo-600" />
                    Collez votre NOUVEAU code ici (Clic droit {'>'} Coller) :
                  </label>
                  <div className="relative">
                    <textarea
                      value={firebaseConfigInput}
                      onChange={(e) => setFirebaseConfigInput(e.target.value)}
                      className={`w-full h-48 p-3 font-mono text-xs border-2 rounded-lg focus:ring-2 outline-none shadow-inner transition-colors ${
                        isInputForbidden 
                          ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' 
                          : isInputValidLooking 
                            ? 'border-green-500 bg-green-50 text-green-900 focus:ring-green-500'
                            : 'border-indigo-200 bg-white text-slate-600 focus:ring-indigo-500'
                      }`}
                      placeholder={`const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "NOM_DE_VOTRE_PROJET", // << C'est ici qu'il faut vérifier !
  // ...
};`}
                    />
                    
                    {/* Visual Feedback Badges inside Textarea area */}
                    {isInputForbidden && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold bg-red-600 text-white px-3 py-1 rounded-full shadow-lg animate-pulse">
                        <XCircle className="w-4 h-4" />
                        Code Interdit (Démo)
                      </div>
                    )}
                    {isInputValidLooking && (
                       <div className="absolute top-2 right-2 flex items-center gap-1 text-xs font-bold bg-green-600 text-white px-3 py-1 rounded-full shadow-lg animate-in fade-in zoom-in">
                        <CheckCircle className="w-4 h-4" />
                        Code Valide !
                      </div>
                    )}
                  </div>

                  {isInputForbidden ? (
                    <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg text-red-800 text-sm font-bold flex items-start gap-2 animate-in slide-in-from-top-2">
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p>ATTENTION : Vous avez collé le code de démonstration (resimap63000).</p>
                        <p className="font-normal mt-1">Regardez la ligne <code>projectId</code>. Elle doit contenir le nom de votre projet, pas "resimap63000".</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 mt-4">
                       <button 
                        onClick={handleConnect}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2 rounded-lg text-sm font-bold shadow-sm"
                      >
                        {isCloudConnected && !isDemoConfig ? 'Mettre à jour' : 'VALIDER LA CONNEXION'}
                      </button>
                      <button 
                        onClick={onDisconnectCloud}
                        className="text-red-600 hover:text-red-700 px-4 py-2 text-sm font-medium border border-transparent hover:border-red-100 rounded-lg"
                      >
                        Déconnexion
                      </button>
                      {!isDemoConfig && (
                        <button 
                          onClick={() => setShowCloudForm(false)}
                          className="text-slate-500 hover:text-slate-700 px-4 py-2 text-sm font-medium"
                        >
                          Masquer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 0. Data Sharing / Backup (Local) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <FileJson className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Sauvegarde Manuelle (Fichiers)</h2>
            <p className="text-slate-500 text-sm">Utile pour faire des copies de sécurité.</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button 
              onClick={handleCopyToClipboard}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm border ${
                copied 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié !' : 'Copier les données'}
            </button>
            
            <button 
              onClick={handleExport}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-5 h-5" />
              Télécharger (.json)
            </button>
            
            <button 
              onClick={handleImportClick}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Upload className="w-5 h-5" />
              Importer
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden" 
            />
          </div>
        </div>
      </div>

      {/* 1. Residence Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Configuration des Résidences</h2>
            <p className="text-slate-500 text-sm">Personnalisez les noms et couleurs de vos 4 résidences.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {config.map((res) => (
              <div key={res.id} className="flex flex-col md:flex-row gap-4 items-start md:items-end p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex-grow space-y-1 w-full">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Nom de la résidence ({res.id.replace('RES_', '')})
                  </label>
                  <input
                    type="text"
                    value={res.name}
                    onChange={(e) => handleChangeConfig(res.id, 'name', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-800"
                  />
                </div>
                
                <div className="space-y-1">
                   <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Couleur</label>
                   <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={res.color}
                        onChange={(e) => handleChangeConfig(res.id, 'color', e.target.value)}
                        className="h-10 w-20 rounded cursor-pointer border border-slate-300"
                      />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Database Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <School className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Base de Données Écoles & Entreprises</h2>
            <p className="text-slate-500 text-sm">Gérez les listes déroulantes proposées lors de la saisie.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* Schools List */}
          <div className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <School className="w-4 h-4 text-indigo-500" />
              Liste des Écoles
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newSchool}
                onChange={(e) => setNewSchool(e.target.value)}
                placeholder="Nouvelle école..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && addSchool()}
              />
              <button 
                onClick={addSchool}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {originOptions.schools.map((school, idx) => (
                <li key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-md group hover:bg-slate-100 transition-colors">
                  <span className="text-slate-700">{school}</span>
                  <button 
                    onClick={() => removeOption('schools', school)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Companies List */}
          <div className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              Liste des Entreprises
            </h3>

            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Nouvelle entreprise..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && addCompany()}
              />
              <button 
                onClick={addCompany}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {originOptions.internships.map((company, idx) => (
                <li key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-md group hover:bg-slate-100 transition-colors">
                  <span className="text-slate-700">{company}</span>
                  <button 
                    onClick={() => removeOption('internships', company)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Settings;