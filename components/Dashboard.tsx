import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tenant, ChartData, ResidenceConfig } from '../types';
import { Filter } from 'lucide-react';

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

  // Data for Bar Chart (Top Schools) - filtered
  const originCounts: Record<string, number> = {};
  filteredTenants.forEach(t => {
    originCounts[t.originName] = (originCounts[t.originName] || 0) + 1;
  });
  
  const topSchoolsData = Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, value: count }));

  // Calculate estimated capacity percentage (simple logic based on mocked capacity of 20 per res)
  // If ALL: 80 total capacity. If Single: 20 capacity.
  const capacityBase = filterId === 'ALL' ? 80 : 20;
  const fillRate = (totalTenants / capacityBase * 100).toFixed(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
          <p className="text-sm font-medium text-slate-500">Taux Remplissage Est.</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">{fillRate}%</h3>
          <p className="text-xs text-slate-400 mt-1">Basé sur cap. est. de {capacityBase}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Top Provenance</p>
          <h3 className="text-xl font-bold text-slate-800 mt-2 truncate">
            {topSchoolsData[0]?.name || 'N/A'}
          </h3>
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
          <h3 className="font-semibold text-slate-800 mb-4">Top 5 Écoles & Entreprises</h3>
          <div className="flex-grow w-full min-h-0">
            {topSchoolsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSchoolsData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
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
    </div>
  );
};

export default Dashboard;