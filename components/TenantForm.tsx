import React, { useState, useEffect } from 'react';
import { Tenant, ResidenceID, EntityType, ResidenceConfig, PersonStatus, OriginOptions } from '../types';
import { PlusCircle, Save, UserPlus, UserCheck, School, Building } from 'lucide-react';

interface TenantFormProps {
  onAddTenant: (tenant: Tenant) => void;
  residenceConfig: ResidenceConfig[];
  originOptions: OriginOptions;
}

const TenantForm: React.FC<TenantFormProps> = ({ onAddTenant, residenceConfig, originOptions }) => {
  const [status, setStatus] = useState<PersonStatus>(PersonStatus.TENANT);
  const [name, setName] = useState('');
  const [residenceId, setResidenceId] = useState<ResidenceID>(ResidenceID.NORTH);
  
  // Origin management
  const [originType, setOriginType] = useState<EntityType>(EntityType.SCHOOL);
  const [selectedOrigin, setSelectedOrigin] = useState(''); // Stores the select value
  const [customOrigin, setCustomOrigin] = useState('');     // Stores input value if 'OTHER'

  const [studyYear, setStudyYear] = useState('');
  const [duration, setDuration] = useState('');

  // Reset selected origin when switching type
  useEffect(() => {
    setSelectedOrigin('');
    setCustomOrigin('');
  }, [originType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine final origin name
    const finalOriginName = selectedOrigin === 'OTHER' ? customOrigin : selectedOrigin;
    
    if (!name || !finalOriginName) return;

    const newTenant: Tenant = {
      id: Date.now().toString(),
      name,
      residenceId,
      originName: finalOriginName,
      originType,
      studyYear,
      // Use the string value directly (even if empty) to satisfy Firebase
      duration: duration, 
      status: status
    };

    onAddTenant(newTenant);
    
    // Reset basic fields
    setName('');
    setSelectedOrigin('');
    setCustomOrigin('');
    setStudyYear('');
    setDuration('');
  };

  const currentOptions = originType === EntityType.SCHOOL ? originOptions.schools : originOptions.internships;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
      <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-600" />
        Ajouter une personne
      </h3>

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
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200 flex-1 justify-center hover:bg-slate-100 transition-colors">
              <input 
                type="radio" 
                name="originType" 
                checked={originType === EntityType.SCHOOL} 
                onChange={() => setOriginType(EntityType.SCHOOL)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 text-sm font-medium flex items-center gap-1">
                <School className="w-4 h-4" /> École
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200 flex-1 justify-center hover:bg-slate-100 transition-colors">
              <input 
                type="radio" 
                name="originType" 
                checked={originType === EntityType.INTERNSHIP} 
                onChange={() => setOriginType(EntityType.INTERNSHIP)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 text-sm font-medium flex items-center gap-1">
                <Building className="w-4 h-4" /> Entreprise
              </span>
            </label>
          </div>
        </div>

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

          {/* Conditional Input for "Other" */}
          {selectedOrigin === 'OTHER' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
              <input
                type="text"
                required
                autoFocus
                className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder={originType === EntityType.SCHOOL ? "Nom de l'école..." : "Nom de l'entreprise..."}
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
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

        <div className="pt-2">
          <button
            type="submit"
            className={`w-full text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
              status === PersonStatus.TENANT 
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {status === PersonStatus.TENANT ? 'Enregistrer Locataire' : 'Enregistrer Contact'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default TenantForm;