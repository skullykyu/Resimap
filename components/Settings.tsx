import React, { useState, useRef } from 'react';
import { ResidenceConfig, ResidenceID, OriginOptions, Tenant, FirebaseConfig, OriginMetadata } from '../types';
import { Settings as SettingsIcon, Trash2, Plus, School, Building, Download, Upload, FileJson, Copy, Check, Cloud, Wifi, WifiOff, GraduationCap, X, MapPin, PencilLine, Save } from 'lucide-react';

interface SettingsProps {
  config: ResidenceConfig[];
  onUpdateConfig: (newConfig: ResidenceConfig[]) => void;
  originOptions: OriginOptions;
  onUpdateOriginOptions: (newOptions: OriginOptions) => void;
  onRenameOption: (type: 'schools' | 'internships' | 'studyFields', oldName: string, newName: string) => void;
  onResetAll: () => void;
  tenants: Tenant[];
  onImportData: (data: any) => void;
  onConnectCloud: (config: FirebaseConfig) => void;
  onDisconnectCloud: () => void;
  onForcePush: () => void;
  isCloudConnected: boolean;
  originMetadata?: OriginMetadata;
  onUpdateMetadata?: (metadata: OriginMetadata) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  config, onUpdateConfig, originOptions, onUpdateOriginOptions, onRenameOption,
  onResetAll, tenants, onImportData, onForcePush, isCloudConnected,
  originMetadata = {}, onUpdateMetadata
}) => {
  // Config Management
  const handleChangeConfig = (id: ResidenceID, field: keyof ResidenceConfig, value: string | number) => {
    const newConfig = config.map(c => c.id === id ? { ...c, [field]: value } : c);
    onUpdateConfig(newConfig);
  };

  const [newSchool, setNewSchool] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newCursus, setNewCursus] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [editingOrigin, setEditingOrigin] = useState<string | null>(null);
  const [tempDistances, setTempDistances] = useState<Record<string, string>>({});

  // States for inline renaming
  const [inlineEditing, setInlineEditing] = useState<{type: string, oldName: string, value: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSchool = () => {
    if (newSchool.trim()) {
      onUpdateOriginOptions({ ...originOptions, schools: [...(originOptions.schools || []), newSchool.trim()].sort() });
      setNewSchool('');
    }
  };

  const addCompany = () => {
    if (newCompany.trim()) {
      onUpdateOriginOptions({ ...originOptions, internships: [...(originOptions.internships || []), newCompany.trim()].sort() });
      setNewCompany('');
    }
  };

  const addCursus = () => {
    if (newCursus.trim()) {
      onUpdateOriginOptions({ ...originOptions, studyFields: [...(originOptions.studyFields || []), newCursus.trim()].sort() });
      setNewCursus('');
    }
  };

  const removeOption = (type: 'schools' | 'internships' | 'studyFields', valueToRemove: string) => {
    const currentList = originOptions[type] || [];
    if (window.confirm(`Supprimer "${valueToRemove}" ? (Les locataires existants garderont leur donnée, mais l'option disparaîtra du formulaire)`)) {
      onUpdateOriginOptions({ ...originOptions, [type]: currentList.filter(item => item !== valueToRemove) });
    }
  };

  const startInlineEdit = (type: 'schools' | 'internships' | 'studyFields', name: string) => {
    setInlineEditing({ type, oldName: name, value: name });
  };

  const cancelInlineEdit = () => {
    setInlineEditing(null);
  };

  const submitInlineEdit = () => {
    if (inlineEditing && inlineEditing.value.trim() && inlineEditing.value.trim() !== inlineEditing.oldName) {
      onRenameOption(inlineEditing.type as any, inlineEditing.oldName, inlineEditing.value.trim());
    }
    setInlineEditing(null);
  };

  const handleExport = () => {
    const data = { tenants, config, origins: originOptions, metadata: originMetadata, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resimap_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleCopyToClipboard = () => {
    const data = { tenants, config, origins: originOptions, metadata: originMetadata };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openEditModal = (originName: string) => {
    setTempDistances({ ...(originMetadata[originName]?.distances || {}) });
    setEditingOrigin(originName);
  };

  const saveMetadata = () => {
    if (editingOrigin && onUpdateMetadata) {
      onUpdateMetadata({ ...originMetadata, [editingOrigin]: { distances: tempDistances, notes: originMetadata[editingOrigin]?.notes || '' } });
    }
    setEditingOrigin(null);
  };

  const renderOptionList = (type: 'schools' | 'internships' | 'studyFields', list: string[], Icon: any, placeholder: string, addFn: () => void, val: string, setVal: (v: string) => void) => (
    <div className="p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Icon className="w-4 h-4 text-indigo-500" /> {placeholder}s</h3>
      <div className="flex gap-2 mb-4">
        <input type="text" value={val} onChange={(e) => setVal(e.target.value)} placeholder={`Ajouter ${placeholder.toLowerCase()}...`} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
        <button onClick={addFn} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"><Plus className="w-5 h-5" /></button>
      </div>
      <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {list.map((name, idx) => {
          const isEditingThis = inlineEditing?.type === type && inlineEditing?.oldName === name;
          return (
            <li key={idx} className={`flex justify-between items-center text-sm p-2 rounded-md group transition-all ${isEditingThis ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'bg-slate-50 border border-transparent'}`}>
              {isEditingThis ? (
                <div className="flex items-center gap-2 w-full">
                  <input 
                    autoFocus
                    type="text" 
                    className="flex-1 bg-white border border-indigo-300 px-2 py-1 rounded text-sm outline-none ring-2 ring-indigo-100" 
                    value={inlineEditing.value}
                    onChange={(e) => setInlineEditing({...inlineEditing, value: e.target.value})}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitInlineEdit();
                      if (e.key === 'Escape') cancelInlineEdit();
                    }}
                  />
                  <button onClick={submitInlineEdit} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelInlineEdit} className="p-1 text-slate-400 hover:bg-slate-200 rounded transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <span className="truncate pr-2 font-medium text-slate-700">{name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startInlineEdit(type, name)} className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded" title="Modifier l'orthographe"><PencilLine className="w-4 h-4" /></button>
                    {(type === 'schools' || type === 'internships') && (
                      <button onClick={() => openEditModal(name)} className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded" title="Gérer les distances"><MapPin className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => removeOption(type, name)} className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded" title="Supprimer de la liste"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 mb-8 relative">
      {/* Modal for Distances */}
      {editingOrigin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
             <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-600" /> Distances : {editingOrigin}</h3>
                <button onClick={() => setEditingOrigin(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500 mb-2">Temps de trajet vers les résidences :</p>
                {config.map(res => (
                  <div key={res.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: res.color }}>{res.name.charAt(0)}</div>
                    <div className="flex-grow">
                       <label className="text-xs font-semibold text-slate-500 uppercase">{res.name}</label>
                       <input type="text" placeholder="Ex: 15 min" className="w-full px-3 py-2 border rounded-lg text-sm" value={tempDistances[res.id] || ''} onChange={(e) => setTempDistances({...tempDistances, [res.id]: e.target.value})} />
                    </div>
                  </div>
                ))}
             </div>
             <div className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-3">
                <button onClick={() => setEditingOrigin(null)} className="px-4 py-2 text-sm text-slate-600">Annuler</button>
                <button onClick={saveMetadata} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Enregistrer</button>
             </div>
          </div>
        </div>
      )}

      {/* Residence Config */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><SettingsIcon className="w-6 h-6" /></div>
          <div><h2 className="text-xl font-bold text-slate-800">Configuration des Résidences</h2></div>
        </div>
        <div className="p-6 space-y-4">
            {config.map((res) => (
              <div key={res.id} className="flex flex-col lg:flex-row gap-4 items-end p-4 border rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex-grow space-y-1 w-full"><label className="text-xs font-semibold text-slate-500">Nom</label><input type="text" value={res.name} onChange={(e) => handleChangeConfig(res.id, 'name', e.target.value)} className="w-full px-4 py-2 border rounded-lg font-medium outline-none focus:ring-2 focus:ring-indigo-100" /></div>
                <div className="w-full lg:w-32"><label className="text-xs font-semibold text-slate-500">Capacité</label><input type="number" value={res.capacity || 0} onChange={(e) => handleChangeConfig(res.id, 'capacity', parseInt(e.target.value) || 0)} className="w-full px-4 py-2 border rounded-lg text-right" /></div>
                <div><label className="text-xs font-semibold text-slate-500">Couleur</label><input type="color" value={res.color} onChange={(e) => handleChangeConfig(res.id, 'color', e.target.value)} className="h-10 w-20 rounded border bg-white p-1 cursor-pointer" /></div>
              </div>
            ))}
        </div>
      </div>

      {/* Lists Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><School className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Gestion des Listes & Correction</h2>
            <p className="text-sm text-slate-500">Modifiez l'écriture pour corriger les erreurs sur tous les locataires.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
          {renderOptionList('schools', originOptions.schools || [], School, 'École', addSchool, newSchool, setNewSchool)}
          {renderOptionList('studyFields', originOptions.studyFields || [], GraduationCap, 'Cursus', addCursus, newCursus, setNewCursus)}
          {renderOptionList('internships', originOptions.internships || [], Building, 'Entreprise', addCompany, newCompany, setNewCompany)}
        </div>
      </div>

      {/* Synchronization Status */}
      <div className={`rounded-xl shadow-sm border p-6 flex items-center gap-4 ${isCloudConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
        <Cloud className={`w-8 h-8 ${isCloudConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
        <div className="flex-grow">
          <h2 className="font-bold text-lg">Statut Cloud : {isCloudConnected ? 'Connecté' : 'Déconnecté'}</h2>
          <p className="text-sm opacity-80">{isCloudConnected ? 'Les données sont synchronisées en temps réel via Firebase.' : 'Mode local uniquement. Connectez-vous via App.tsx pour activer le cloud.'}</p>
        </div>
        {isCloudConnected ? <Wifi className="w-6 h-6 text-emerald-600" /> : <WifiOff className="w-6 h-6 text-slate-400" />}
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center gap-3">
          <FileJson className="w-6 h-6 text-slate-600" />
          <h2 className="text-xl font-bold">Sauvegarde & Export</h2>
        </div>
        <div className="p-6 flex flex-wrap gap-4">
            <button onClick={handleCopyToClipboard} className="flex-1 px-4 py-3 border rounded-lg font-medium bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">{copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} {copied ? 'Copié' : 'Copier JSON'}</button>
            <button onClick={handleExport} className="flex-1 px-4 py-3 border rounded-lg font-medium bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export (.json)</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 px-4 py-3 border rounded-lg font-medium bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Import</button>
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const json = JSON.parse(ev.target?.result as string);
                  if (window.confirm("Écraser les données ?")) onImportData(json);
                } catch (err) { alert("Fichier JSON invalide."); }
              };
              reader.readAsText(file);
              e.target.value = '';
            }} accept=".json" className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default Settings;