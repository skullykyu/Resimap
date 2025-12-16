import React, { useState } from 'react';
import { Tenant, ResidenceID, EntityType, ResidenceConfig } from '../types';
import { PlusCircle, Save } from 'lucide-react';

interface TenantFormProps {
  onAddTenant: (tenant: Tenant) => void;
  residenceConfig: ResidenceConfig[];
}

const TenantForm: React.FC<TenantFormProps> = ({ onAddTenant, residenceConfig }) => {
  const [name, setName] = useState('');
  const [residenceId, setResidenceId] = useState<ResidenceID>(ResidenceID.NORTH);
  const [originName, setOriginName] = useState('');
  const [originType, setOriginType] = useState<EntityType>(EntityType.SCHOOL);
  const [studyYear, setStudyYear] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !originName) return;

    const newTenant: Tenant = {
      id: Date.now().toString(),
      name,
      residenceId,
      originName,
      originType,
      studyYear,
      duration: duration || undefined
    };

    onAddTenant(newTenant);
    
    // Reset
    setName('');
    setOriginName('');
    setStudyYear('');
    setDuration('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-600" />
        Nouvel Enregistrement
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Nom du Locataire</label>
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
          <label className="text-sm font-medium text-slate-700">Résidence</label>
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
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="originType" 
                checked={originType === EntityType.SCHOOL} 
                onChange={() => setOriginType(EntityType.SCHOOL)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 text-sm">École</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="originType" 
                checked={originType === EntityType.INTERNSHIP} 
                onChange={() => setOriginType(EntityType.INTERNSHIP)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-700 text-sm">Entreprise / Stage</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Nom École / Entreprise</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder={originType === EntityType.SCHOOL ? "Ex: Université Lyon 3" : "Ex: Sanofi"}
            value={originName}
            onChange={(e) => setOriginName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Année d'étude / Poste</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Ex: Master 1, Alternant RH..."
            value={studyYear}
            onChange={(e) => setStudyYear(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Durée (Optionnel)</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder="Ex: 9 mois, 3 ans..."
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Enregistrer le locataire
          </button>
        </div>

      </form>
    </div>
  );
};

export default TenantForm;