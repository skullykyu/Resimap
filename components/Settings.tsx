import React, { useState, useRef } from 'react';
import { ResidenceConfig, ResidenceID, OriginOptions, Tenant } from '../types';
import { Settings as SettingsIcon, Trash2, Plus, School, Building, AlertOctagon, Download, Upload, FileJson } from 'lucide-react';

interface SettingsProps {
  config: ResidenceConfig[];
  onUpdateConfig: (newConfig: ResidenceConfig[]) => void;
  originOptions: OriginOptions;
  onUpdateOriginOptions: (newOptions: OriginOptions) => void;
  onResetAll: () => void;
  tenants: Tenant[]; // Need full list for export
  onImportData: (data: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  config, 
  onUpdateConfig, 
  originOptions, 
  onUpdateOriginOptions, 
  onResetAll,
  tenants,
  onImportData
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
  
  const handleExport = () => {
    const dataToExport = {
      tenants,
      config,
      origins: originOptions,
      exportDate: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `resimap_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 mb-8">
      
      {/* 0. Data Sharing / Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-slate-200 rounded-lg">
            <FileJson className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Partage & Sauvegarde</h2>
            <p className="text-slate-500 text-sm">Exportez vos données pour les partager avec vos collègues ou créer une sauvegarde.</p>
          </div>
        </div>
        <div className="p-6 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleExport}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-5 h-5" />
            Exporter les données (.json)
          </button>
          
          <button 
            onClick={handleImportClick}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Upload className="w-5 h-5" />
            Importer une sauvegarde
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

      {/* 3. Data Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
        <div className="p-6 border-b border-red-50 bg-red-50/50 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-red-100">
            <AlertOctagon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800">Zone de Danger</h2>
            <p className="text-red-600/80 text-sm">Actions irréversibles sur vos données locales.</p>
          </div>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            <p className="font-semibold">Réinitialiser l'application</p>
            <p>Cela effacera toutes les données enregistrées sur cet ordinateur et remettra les données de démonstration.</p>
          </div>
          <button
            onClick={onResetAll}
            className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Tout effacer et réinitialiser
          </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;