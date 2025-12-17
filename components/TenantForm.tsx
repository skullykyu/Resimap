import React, { useState, useEffect } from 'react';
import { Tenant, ResidenceID, EntityType, ResidenceConfig, PersonStatus, OriginOptions, Gender } from '../types';
import { PlusCircle, Save, UserPlus, UserCheck, School, Building, GraduationCap, X, Pencil, User } from 'lucide-react';

interface TenantFormProps {
  onAddTenant: (tenant: Tenant) => void;
  // Modification props
  onUpdateTenant?: (tenant: Tenant) => void;
  editingTenant?: Tenant | null;
  onCancelEdit?: () => void;
  
  residenceConfig: ResidenceConfig[];
  originOptions: OriginOptions;
}

const TenantForm: React.FC<TenantFormProps> = ({ 
  onAddTenant, 
  onUpdateTenant,
  editingTenant,
  onCancelEdit,
  residenceConfig, 
  originOptions 
}) => {
  const [status, setStatus] = useState<PersonStatus>(PersonStatus.TENANT);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined); // New State
  const [residenceId, setResidenceId] = useState<ResidenceID>(ResidenceID.NORTH);
  
  // Origin management
  const [originType, setOriginType] = useState<EntityType>(EntityType.SCHOOL);
  const [selectedOrigin, setSelectedOrigin] = useState(''); // Stores the select value
  const [customOrigin, setCustomOrigin] = useState('');     // Stores input value if 'OTHER'

  // Cursus Management
  const [selectedCursus, setSelectedCursus] = useState(''); 
  const [customCursus, setCustomCursus] = useState('');

  const [studyYear, setStudyYear] = useState('');
  const [duration, setDuration] = useState('');

  // Safe fallback to [] if lists are undefined
  const currentOptions = (originType === EntityType.SCHOOL ? originOptions.schools : originOptions.internships) || [];
  const cursusOptions = originOptions.studyFields || [];

  // --- Logic to sync state with editingTenant ---
  useEffect(() => {
    if (editingTenant) {
      // 1. Basic Fields
      setStatus(editingTenant.status);
      setName(editingTenant.name);
      setGender(editingTenant.gender); // Set gender
      setResidenceId(editingTenant.residenceId);
      setOriginType(editingTenant.originType);
      setStudyYear(editingTenant.studyYear);
      setDuration(editingTenant.duration || '');

      // 2. Complex Origin Logic
      const optionsForType = editingTenant.originType === EntityType.SCHOOL ? originOptions.schools : originOptions.internships;
      const safeOptions = optionsForType || [];
      
      if (safeOptions.includes(editingTenant.originName)) {
        setSelectedOrigin(editingTenant.originName);
        setCustomOrigin('');
      } else {
        setSelectedOrigin('OTHER');
        setCustomOrigin(editingTenant.originName);
      }

      // 3. Complex Cursus Logic
      if (cursusOptions.includes(editingTenant.cursus)) {
        setSelectedCursus(editingTenant.cursus);
        setCustomCursus('');
      } else {
         if (editingTenant.cursus) {
           setSelectedCursus('OTHER');
           setCustomCursus(editingTenant.cursus);
         } else {
           setSelectedCursus('');
           setCustomCursus('');
         }
      }

    } else {
      // RESET FORM (Create Mode)
      setName('');
      setGender(undefined);
      setSelectedOrigin('');
      setCustomOrigin('');
      setSelectedCursus('');
      setCustomCursus('');
      setStudyYear('');
      setDuration('');
    }
  }, [editingTenant, originOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine final origin name
    const rawOriginName = selectedOrigin === 'OTHER' ? customOrigin : selectedOrigin;
    const rawCursus = selectedCursus === 'OTHER' ? customCursus : selectedCursus;
    
    const finalOriginName = rawOriginName.trim();
    const finalCursus = rawCursus.trim();
    const finalName = name.trim();

    if (!finalName || !finalOriginName || !finalCursus) return;

    const tenantData: Tenant = {
      id: editingTenant ? editingTenant.id : Date.now().toString(),
      name: finalName,
      gender: gender, // Add gender to object
      residenceId,
      originName: finalOriginName,
      originType,
      cursus: finalCursus,
      studyYear,
      duration: duration, 
      status: status
    };

    if (editingTenant && onUpdateTenant) {
      onUpdateTenant(tenantData);
    } else {
      onAddTenant(tenantData);
    }
    
    if (!editingTenant) {
        setName('');
        setGender(undefined);
        setSelectedOrigin('');
        setCustomOrigin('');
        setSelectedCursus('');
        setCustomCursus('');
        setStudyYear('');
        setDuration('');
    }
  };

  const toggleGender = (selected: Gender) => {
    if (gender === selected) {
      setGender(undefined); // Deselect if already selected
    } else {
      setGender(selected);
    }
  };

  const isEditing = !!editingTenant;

  return (
    <div className={`rounded-xl shadow-sm border p-6 sticky top-6 transition-colors ${isEditing ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
      
      <div className="flex justify-between items-start mb-6">
        <h3 className={`font-bold text-lg flex items-center gap-2 ${isEditing ? 'text-indigo-800' : 'text-slate-800'}`}>
          {isEditing ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5 text-indigo-600" />}
          {isEditing ? 'Modifier la fiche' : 'Ajouter une personne'}
        </h3>
        
        {isEditing && onCancelEdit && (
          <button 
            onClick={onCancelEdit}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Annuler modification"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
        <button
          type="button"
          onClick={() => setStatus(PersonStatus.TENANT)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            status === PersonStatus.TENANT 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Locataire
        </button>
        <button
          type="button"
          onClick={() => setStatus(PersonStatus.PROSPECT)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
            status === PersonStatus.PROSPECT 
              ? 'bg-white text-amber-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Nouveau Contact
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Nom Complet</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="Ex: Jean Dupont"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* GENDER SELECTION (Optional) */}
        <div className="space-y-1">
           <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
             <User className="w-4 h-4 text-slate-500" />
             Sexe <span className="text-slate-400 font-normal text-xs">(Facultatif)</span>
           </label>
           <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleGender(Gender.MALE)}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                  gender === Gender.MALE
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Homme
              </button>
              <button
                type="button"
                onClick={() => toggleGender(Gender.FEMALE)}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                  gender === Gender.FEMALE
                  ? 'bg-pink-50 text-pink-700 border-pink-300 ring-1 ring-pink-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Femme
              </button>
               <button
                type="button"
                onClick={() => toggleGender(Gender.OTHER)}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                  gender === Gender.OTHER
                  ? 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Autre
              </button>
           </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Résidence Visée / Actuelle</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            value={residenceId}
            onChange={(e) => setResidenceId(e.target.value as ResidenceID)}
          >
            {residenceConfig.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Type de Provenance</label>
          <div className="flex gap-4 mt-1 mb-2">
            <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border flex-1 justify-center transition-colors ${originType === EntityType.SCHOOL ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
              <input 
                type="radio" 
                name="originType" 
                checked={originType === EntityType.SCHOOL} 
                onChange={() => {
                  setOriginType(EntityType.SCHOOL);
                  if (!isEditing) setSelectedOrigin('');
                }}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 text-sm font-medium flex items-center gap-1">
                <School className="w-4 h-4" /> École
              </span>
            </label>
            <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border flex-1 justify-center transition-colors ${originType === EntityType.INTERNSHIP ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
              <input 
                type="radio" 
                name="originType" 
                checked={originType === EntityType.INTERNSHIP} 
                onChange={() => {
                  setOriginType(EntityType.INTERNSHIP);
                  if (!isEditing) setSelectedOrigin('');
                }}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 text-sm font-medium flex items-center gap-1">
                <Building className="w-4 h-4" /> Entreprise
              </span>
            </label>
          </div>
        </div>

        {/* 1. SCHOOL / COMPANY SELECTION */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            {originType === EntityType.SCHOOL ? "Établissement" : "Lieu de stage / Entreprise"}
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            required
          >
            <option value="" disabled>-- Sélectionner --</option>
            {currentOptions.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
            <option value="OTHER" className="font-semibold text-indigo-600">+ Autre (Saisir manuellement)</option>
          </select>

          {selectedOrigin === 'OTHER' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder={originType === EntityType.SCHOOL ? "Nom de l'école..." : "Nom de l'entreprise..."}
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* 2. CURSUS SELECTION */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
             <GraduationCap className="w-4 h-4 text-slate-500" />
             Cursus / Filière
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
            value={selectedCursus}
            onChange={(e) => setSelectedCursus(e.target.value)}
            required
          >
            <option value="" disabled>-- Sélectionner --</option>
            {cursusOptions.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
            <option value="OTHER" className="font-semibold text-indigo-600">+ Autre (Saisir manuellement)</option>
          </select>

          {selectedCursus === 'OTHER' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Ex: Architecture, Marketing Digital..."
                value={customCursus}
                onChange={(e) => setCustomCursus(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Année d'étude / Poste</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Ex: Master 1, Alternant..."
            value={studyYear}
            onChange={(e) => setStudyYear(e.target.value)}
          />
        </div>

        {status === PersonStatus.TENANT && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-medium text-slate-700">Durée du bail</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Ex: 9 mois, 3 ans..."
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        )}

        <div className="pt-2 flex gap-3">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 bg-white border border-slate-300 text-slate-700 font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            className={`flex-1 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              status === PersonStatus.TENANT 
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Modifier' : (status === PersonStatus.TENANT ? 'Enregistrer' : 'Ajouter Contact')}
          </button>
        </div>

      </form>
    </div>
  );
};

export default TenantForm;