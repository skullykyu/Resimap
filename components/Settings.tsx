import React, { useState, useRef, useEffect } from 'react';
import { ResidenceConfig, ResidenceID, OriginOptions, Tenant, FirebaseConfig } from '../types';
import { Settings as SettingsIcon, Trash2, Plus, School, Building, AlertOctagon, Download, Upload, FileJson, Copy, Check, Info, Cloud, Wifi, WifiOff } from 'lucide-react';

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
  
  // Cloud Config State
  const [firebaseConfigInput, setFirebaseConfigInput] = useState('');
  const [showCloudForm, setShowCloudForm] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('resimap_firebase_config');
    if (savedConfig) {
      try {
        setFirebaseConfigInput(JSON.stringify(JSON.parse(savedConfig), null, 2));
      } catch (e) {
        setFirebaseConfigInput(savedConfig);
      }
    }
  }, []);
  
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

      // 1. Nettoyage intelligent : On cherche l'objet { ... } à l'intérieur du texte collé
      const configMatch = input.match(/firebaseConfig\s*=\s*({[\s\S]*?})(?:;|$)/);
      if (configMatch && configMatch[1]) {
        input = configMatch[1];
      } else {
        // Si on ne trouve pas "const...", on essaie de trouver juste le premier { et le dernier }
        const firstBrace = input.indexOf('{');
        const lastBrace = input.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          input = input.substring(firstBrace, lastBrace + 1);
        }
      }

      // 2. Parsing souple
      let configObj;
      try {
        configObj = new Function('return ' + input)();
      } catch (e) {
        throw new Error("Impossible de lire la configuration. Vérifiez que vous avez copié tout le bloc.");
      }

      // 3. Vérification des champs requis
      if (!configObj.apiKey || !configObj.projectId) {
         alert("La configuration semble incomplète. Il manque l'apiKey ou le projectId.");
         return;
      }
      
      // 4. Ajout automatique de databaseURL si manquante (cas fréquent)
      if (!configObj.databaseURL) {
        // Tentative de deviner l'URL pour l'Europe (West 1 - Belgique) car utilisateur francophone
        const euUrl = `https://${configObj.projectId}-default-rtdb.europe-west1.firebasedatabase.app`;
        // Fallback pour US (Legacy)
        const usUrl = `https://${configObj.projectId}.firebaseio.com`;

        // On assigne l'URL Europe par défaut
        configObj.databaseURL = euUrl;

        alert(`Info : Votre code Firebase ne contenait pas l'adresse de la base de données.\n\nJ'ai ajouté automatiquement l'adresse standard pour l'Europe :\n${euUrl}\n\nSi la connexion échoue (message d'erreur rouge), c'est que votre base est peut-être aux USA. Dans ce cas, contactez le support.`);
      }

      onConnectCloud(configObj);
    } catch (e) {
      console.error(e);
      alert("Erreur de lecture du code. Assurez-vous d'avoir copié tout le bloc 'const firebaseConfig = { ... };'");
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
      <div className={`rounded-xl shadow-sm border overflow-hidden ${isCloudConnected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b flex items-center gap-3 ${isCloudConnected ? 'border-indigo-100 bg-indigo-100/50' : 'border-slate-100 bg-slate-50'}`}>
          <div className={`p-2 rounded-lg ${isCloudConnected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h2 className={`text-xl font-bold ${isCloudConnected ? 'text-indigo-900' : 'text-slate-800'}`}>
              Synchronisation Cloud (Multi-Utilisateurs)
            </h2>
            <p className={`${isCloudConnected ? 'text-indigo-700' : 'text-slate-500'} text-sm`}>
              {isCloudConnected 
                ? 'Vos données sont synchronisées en temps réel avec Firebase.' 
                : 'Connectez une base de données Firebase pour partager les données avec vos collègues.'}
            </p>
          </div>
          <div>
            {isCloudConnected ? (
              <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200">
                <Wifi className="w-4 h-4" /> Connecté
              </span>
            ) : (
               <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wide border border-slate-200">
                <WifiOff className="w-4 h-4" /> Hors Ligne
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {isCloudConnected ? (
            <div className="flex flex-col gap-4">
              <div className="bg-white p-4 rounded-lg border border-indigo-100 text-sm text-indigo-800">
                <p><strong>Félicitations !</strong> Votre application est connectée au cloud.</p>
                <p className="mt-2">Pour que vos collègues accèdent aux mêmes données :</p>
                <ol className="list-decimal ml-5 mt-1 space-y-1">
                  <li>Envoyez-leur le lien de cette application (Netlify).</li>
                  <li>Donnez-leur la configuration ci-dessous.</li>
                </ol>
              </div>
              
              <div className="relative">
                <textarea
                    readOnly
                    value={firebaseConfigInput}
                    className="w-full h-24 p-3 font-mono text-xs border border-indigo-200 bg-indigo-50/50 rounded-lg text-indigo-800 focus:outline-none"
                  />
                  <div className="absolute top-2 right-2">
                     <button onClick={() => {navigator.clipboard.writeText(firebaseConfigInput); alert('Copié !')}} className="p-1 bg-white rounded shadow text-xs">Copier</button>
                  </div>
              </div>

              <button 
                onClick={onDisconnectCloud}
                className="self-start px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
              >
                Déconnecter / Changer de base de données
              </button>
            </div>
          ) : (
            <div>
              {!showCloudForm ? (
                 <button 
                  onClick={() => setShowCloudForm(true)}
                  className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Cloud className="w-4 h-4" />
                  Configurer la connexion Firebase
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="text-sm text-slate-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="font-semibold text-blue-800 mb-1">Collez votre code Firebase ici :</p>
                    <p className="text-blue-800/80 mb-2">
                      Copiez tout le contenu que vous avez vu (les lignes <code>import</code>, <code>const firebaseConfig</code>, etc.). Je ferai le tri automatiquement.
                    </p>
                  </div>
                  <textarea
                    value={firebaseConfigInput}
                    onChange={(e) => setFirebaseConfigInput(e.target.value)}
                    placeholder={'// Import the functions...\nconst firebaseConfig = {\n  apiKey: "AIza...",\n  ...\n};'}
                    className="w-full h-48 p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={handleConnect}
                      className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Connecter au Cloud
                    </button>
                    <button 
                      onClick={() => setShowCloudForm(false)}
                      className="bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
            <p className="text-slate-500 text-sm">Utile si vous n'utilisez pas le mode Cloud.</p>
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