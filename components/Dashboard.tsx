import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tenant, ChartData, ResidenceConfig } from '../types';
import { Filter, List, Building, GraduationCap } from 'lucide-react';

interface DashboardProps {
  tenants: Tenant[];
  residenceConfig: ResidenceConfig[];
}

const Dashboard: React.FC<DashboardProps> = ({ tenants, residenceConfig }) => {
  const [filterId, setFilterId] = useState<string>('ALL');

  // Filter tenants based on selection
  const filteredTenants = filterId === 'ALL' 
    ? tenants 
    : tenants.filter(t => t.residenceId === filterId);

  // Compute Stats on FILTERED data
  const totalTenants = filteredTenants.length;
  
  // Data for Pie Chart (Distribution per Residence) - filtered
  const residenceStats: ChartData[] = residenceConfig.map(conf => ({
    name: conf.name.length > 15 ? conf.name.substring(0, 15) + '...' : conf.name,
    fullName: conf.name,
    value: filteredTenants.filter(t => t.residenceId === conf.id).length,
    fill: conf.color
  })).filter(d => d.value > 0);

  // --- TOP 5 CHARTS DATA ---
  const originCounts: Record<string, number> = {};
  filteredTenants.forEach(t => {
    originCounts[t.originName] = (originCounts[t.originName] || 0) + 1;
  });
  
  const topSchoolsData = Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ 
      name, 
      value: count,
      percentage: totalTenants > 0 ? ((count / totalTenants) * 100).toFixed(1) : '0'
    }));

  // --- FULL LIST DATA (SCHOOLS) ---
  const fullSchoolsList = Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1]) // Sort descending
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalTenants > 0 ? ((count / totalTenants) * 100).toFixed(1) : '0'
    }));

  // --- FULL LIST DATA (CURSUS) ---
  const cursusCounts: Record<string, number> = {};
  filteredTenants.forEach(t => {
    if (t.cursus) {
      cursusCounts[t.cursus] = (cursusCounts[t.cursus] || 0) + 1;
    }
  });

  const fullCursusList = Object.entries(cursusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalTenants > 0 ? ((count / totalTenants) * 100).toFixed(1) : '0'
    }));


  // Calculate actual capacity based on configuration
  let capacityBase = 0;
  
  if (filterId === 'ALL') {
    // Sum capacity of all residences
    capacityBase = residenceConfig.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
  } else {
    // Get capacity of selected residence
    const selectedRes = residenceConfig.find(r => r.id === filterId);
    capacityBase = selectedRes?.capacity || 0;
  }
  
  // Prevent division by zero
  if (capacityBase === 0) capacityBase = 1;

  const fillRate = (totalTenants / capacityBase * 100).toFixed(0);

  // Custom Tooltip for the Bar Chart to show percentage
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <div className="flex flex-col gap-1">
            <span className="text-indigo-600 font-semibold">
              {data.value} étudiant{data.value > 1 ? 's' : ''}
            </span>
            <span className="text-slate-500 text-xs">
              Représente {data.percentage}% des locataires
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Filter Bar */}
      <div className="flex justify-end">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filtrer :</span>
          <select 
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="text-sm font-semibold text-slate-900 bg-transparent outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les résidences</option>
            {residenceConfig.map(res => (
              <option key={res.id} value={res.id}>{res.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">
            Total Locataires ({filterId === 'ALL' ? 'Global' : 'Sélection'})
          </p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalTenants}</h3>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Taux Remplissage Réel</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-slate-800">{fillRate}%</h3>
            <span className="text-sm text-slate-400 font-medium">/ 100%</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Sur {capacityBase} logements disponibles</p>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Top Provenance</p>
          <h3 className="text-xl font-bold text-slate-800 mt-2 truncate">
            {topSchoolsData[0]?.name || 'N/A'}
          </h3>
          {topSchoolsData[0] && (
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {topSchoolsData[0].percentage}%
              </span>
              <span className="text-xs text-slate-400">des effectifs</span>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribution by Residence */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
          <h3 className="font-semibold text-slate-800 mb-4">Répartition par Résidence</h3>
          <div className="flex-grow w-full min-h-0">
            {residenceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={residenceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={filterId === 'ALL' ? 5 : 0}
                    dataKey="value"
                  >
                    {residenceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Aucune donnée pour cette sélection
              </div>
            )}
          </div>
        </div>

        {/* Top Schools */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[350px]">
          <h3 className="font-semibold text-slate-800 mb-4">Top 5 Écoles & Entreprises (%)</h3>
          <div className="flex-grow w-full min-h-0">
            {topSchoolsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSchoolsData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Aucune donnée pour cette sélection
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED LISTS SECTION */}
      <div className="mt-8">
         <div className="flex items-center gap-2 mb-4">
           <List className="w-5 h-5 text-indigo-600" />
           <h3 className="text-lg font-bold text-slate-800">Détails Complets des Effectifs</h3>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* SCHOOLS FULL LIST */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[500px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 sticky top-0">
               <Building className="w-4 h-4 text-slate-500" />
               <h4 className="font-semibold text-slate-700">Toutes les Écoles / Entreprises</h4>
             </div>
             <div className="overflow-y-auto p-0 flex-grow">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 shadow-sm">
                   <tr>
                     <th className="px-4 py-2">Nom</th>
                     <th className="px-4 py-2 text-right">Nb.</th>
                     <th className="px-4 py-2 text-right">%</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {fullSchoolsList.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">Aucune donnée</td></tr>
                    )}
                    {fullSchoolsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-800 font-medium">{item.name}</td>
                        <td className="px-4 py-2 text-right text-indigo-600 font-bold">{item.count}</td>
                        <td className="px-4 py-2 text-right text-slate-500 text-xs">{item.percentage}%</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </div>

           {/* CURSUS FULL LIST */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[500px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 sticky top-0">
               <GraduationCap className="w-4 h-4 text-slate-500" />
               <h4 className="font-semibold text-slate-700">Tous les Cursus / Filières</h4>
             </div>
             <div className="overflow-y-auto p-0 flex-grow">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 shadow-sm">
                   <tr>
                     <th className="px-4 py-2">Intitulé</th>
                     <th className="px-4 py-2 text-right">Nb.</th>
                     <th className="px-4 py-2 text-right">%</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {fullCursusList.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic">Aucune donnée</td></tr>
                    )}
                    {fullCursusList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-800 font-medium">{item.name}</td>
                        <td className="px-4 py-2 text-right text-indigo-600 font-bold">{item.count}</td>
                        <td className="px-4 py-2 text-right text-slate-500 text-xs">{item.percentage}%</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
           </div>

         </div>
      </div>
    </div>
  );
};

export default Dashboard;