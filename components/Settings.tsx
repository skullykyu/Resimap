import React from 'react';
import { ResidenceConfig, ResidenceID } from '../types';
import { Settings as SettingsIcon, Save } from 'lucide-react';

interface SettingsProps {
  config: ResidenceConfig[];
  onUpdateConfig: (newConfig: ResidenceConfig[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig }) => {
  const handleChange = (id: ResidenceID, field: keyof ResidenceConfig, value: string) => {
    const newConfig = config.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    onUpdateConfig(newConfig);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <div className="p-2 bg-slate-200 rounded-lg">
          <SettingsIcon className="w-6 h-6 text-slate-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Paramètres des Résidences</h2>
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
                  onChange={(e) => handleChange(res.id, 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-800"
                />
              </div>
              
              <div className="space-y-1">
                 <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Couleur</label>
                 <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={res.color}
                      onChange={(e) => handleChange(res.id, 'color', e.target.value)}
                      className="h-10 w-20 rounded cursor-pointer border border-slate-300"
                    />
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
          <p><strong>Note :</strong> Les modifications sont appliquées instantanément sur le tableau de bord, la carte et les analyses.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;