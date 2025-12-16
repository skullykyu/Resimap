import React, { useState, useRef, useEffect } from 'react';
import { ResidenceConfig, ResidenceID, OriginOptions, Tenant, FirebaseConfig } from '../types';
import { Settings as SettingsIcon, Trash2, Plus, School, Building, Download, Upload, FileJson, Copy, Check, Cloud, Wifi, WifiOff, RefreshCw } from 'lucide-react';

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
      <div className={`rounded-xl shadow-sm border overflow-hidden ${isCloudConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`p-6 border-b flex items-center gap-3 ${isCloudConnected ? 'border-emerald-100 bg-emerald-100/50' : 'border-slate-100 bg-slate-100'}`}>
          <div className={`p-2 rounded-lg ${isCloudConnected ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <h2 className={`text-xl font-bold ${isCloudConnected ? 'text-emerald-900' : 'text-slate-800'}`}>
              Site Partagé (Synchronisation Automatique)
            </h2>
            <p className={`${isCloudConnected ? 'text-emerald-700' : 'text-slate-500'} text-sm`}>
               Toutes les modifications sont enregistrées sur le projet <strong>resimap63000</strong> et visibles par tous.
            </p>
          </div>
          <div>
            {isCloudConnected ? (
              <span className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-200">
                <Wifi className="w-4 h-4" /> En Ligne
              </span>
            ) : (
               <span className="flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide border border-slate-300">
                <WifiOff className="w-4 h-4" /> Hors Ligne
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
            {isCloudConnected && (
              <div className="flex gap-4 items-center flex-wrap">
                 <button 
                  onClick={onForcePush}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Forcer la sauvegarde (Manuel)
                </button>
                <p className="text-xs text-slate-500 italic max-w-sm">
                  Normalement inutile, la sauvegarde est automatique à chaque modification.
                </p>
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
            <h2 className="text-xl font-bold text-slate-800">Export / Import (Fichiers)</h2>
            <p className="text-slate-500 text-sm">Utile pour faire des copies de sécurité sur votre ordinateur.</p>
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