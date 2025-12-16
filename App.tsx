import React, { useState } from 'react';
import { MOCK_TENANTS, DEFAULT_RESIDENCE_CONFIG } from './constants';
import { Tenant, ResidenceConfig } from './types';
import Dashboard from './components/Dashboard';
import TenantForm from './components/TenantForm';
import RelationshipMap from './components/RelationshipMap';
import MarketingAdvisor from './components/MarketingAdvisor';
import Settings from './components/Settings';
import { LayoutDashboard, Network, Users, Plus, BrainCircuit, Building2, Settings as SettingsIcon } from 'lucide-react';

enum Tab {
  DASHBOARD = 'tableau_de_bord',
  MAP = 'carte',
  DATA = 'donnees',
  AI = 'conseiller',
  SETTINGS = 'parametres'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [residenceConfig, setResidenceConfig] = useState<ResidenceConfig[]>(DEFAULT_RESIDENCE_CONFIG);

  const addTenant = (newTenant: Tenant) => {
    setTenants(prev => [...prev, newTenant]);
  };

  const updateConfig = (newConfig: ResidenceConfig[]) => {
    setResidenceConfig(newConfig);
  };

  const getResColor = (id: string) => residenceConfig.find(r => r.id === id)?.color || '#ccc';
  const getResName = (id: string) => residenceConfig.find(r => r.id === id)?.name || id;

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
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === Tab.DASHBOARD && 'Vue d\'ensemble'}
              {activeTab === Tab.MAP && 'Cartographie des Relations'}
              {activeTab === Tab.AI && 'Stratégie Marketing (Gemini)'}
              {activeTab === Tab.DATA && 'Gestion des Données'}
              {activeTab === Tab.SETTINGS && 'Paramètres Généraux'}
            </h1>
            <p className="text-slate-500 mt-1">
              Gérez vos 4 résidences et analysez vos cibles.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <span className="bg-white px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
              {tenants.length} Locataires Actifs
            </span>
            <button 
              onClick={() => setActiveTab(Tab.DATA)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau
            </button>
          </div>
        </header>

        {/* Content Views */}
        <div className="max-w-7xl mx-auto">
          
          {activeTab === Tab.DASHBOARD && (
            <Dashboard tenants={tenants} residenceConfig={residenceConfig} />
          )}

          {activeTab === Tab.MAP && (
            <div className="h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <RelationshipMap tenants={tenants} residenceConfig={residenceConfig} />
            </div>
          )}

          {activeTab === Tab.AI && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <MarketingAdvisor tenants={tenants} residenceConfig={residenceConfig} />
            </div>
          )}

          {activeTab === Tab.SETTINGS && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Settings config={residenceConfig} onUpdateConfig={updateConfig} />
            </div>
          )}

          {activeTab === Tab.DATA && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="lg:col-span-1">
                <TenantForm onAddTenant={addTenant} residenceConfig={residenceConfig} />
              </div>
              
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-semibold text-slate-800">Liste des Locataires</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-medium">
                      <tr>
                        <th className="px-4 py-3">Nom</th>
                        <th className="px-4 py-3">Résidence</th>
                        <th className="px-4 py-3">Provenance</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Durée</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...tenants].reverse().map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                          <td className="px-4 py-3">
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                              style={{ 
                                backgroundColor: `${getResColor(t.residenceId)}20`, // 20 hex for low opacity
                                color: getResColor(t.residenceId),
                                borderColor: `${getResColor(t.residenceId)}40`
                              }}
                            >
                              {getResName(t.residenceId)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{t.originName}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{t.originType}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {t.duration || <span className="text-slate-300 italic">N/A</span>}
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