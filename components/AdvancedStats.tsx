import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tenant, ResidenceConfig, Gender, PersonStatus } from '../types';
import { Filter, Users, Clock, GraduationCap, BarChart3, Info, List, Building } from 'lucide-react';

interface AdvancedStatsProps {
  tenants: Tenant[];
  residenceConfig: ResidenceConfig[];
}

// Helper to parse "2 ans", "9 mois" etc into months
const parseDurationString = (durationStr?: string): number => {
  if (!durationStr) return 0;
  
  const str = durationStr.toLowerCase().trim();
  const match = str.match(/(\d+)/);
  if (!match) return 0;
  
  const value = parseInt(match[0], 10);
  
  if (str.includes('an') || str.includes('année')) {
    return value * 12;
  }
  return value; // Assume months by default if number found
};

// Nouvelle fonction qui calcule le nombre de mois depuis une date donnée
const calculateMonthsSince = (startDateStr: string): number => {
  const start = new Date(startDateStr);
  const now = new Date();
  
  // Basic validation
  if (isNaN(start.getTime())) return 0;

  // Différence en mois
  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += now.getMonth();
  
  // On s'assure d'avoir au moins 0, voire 1 si c'est le mois en cours
  return Math.max(0, months) + (now.getDate() >= start.getDate() ? 0 : -1) + (months === 0 ? 1 : 0);
};

// Nouvelle fonction qui calcule la durée entre deux dates
const calculateMonthsBetween = (startStr: string, endStr: string): number => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();
  
  // On s'assure d'avoir au moins 0, voire 1 si c'est le mois en cours
  return Math.max(0, months) + (end.getDate() >= start.getDate() ? 0 : -1) + (months === 0 ? 1 : 0);
};

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ tenants, residenceConfig }) => {
  const [filterId, setFilterId] = useState<string>('ALL');

  // 1. Filtering Logic
  const filteredTenants = useMemo(() => {
    let list = tenants.filter(t => t.status === PersonStatus.TENANT); // Only active tenants
    if (filterId !== 'ALL') {
      list = list.filter(t => t.residenceId === filterId);
    }
    return list;
  }, [tenants, filterId]);

  // --- PREPARE DATA FOR DETAILED TABLES (Schools & Cursus) ---
  const totalFiltered = filteredTenants.length;

  const { fullSchoolsList, fullCursusList } = useMemo(() => {
    // 1. Schools / Origins Counts
    const originCounts: Record<string, number> = {};
    filteredTenants.forEach(t => {
      originCounts[t.originName] = (originCounts[t.originName] || 0) + 1;
    });

    const schoolsList = Object.entries(originCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalFiltered > 0 ? ((count / totalFiltered) * 100).toFixed(1) : '0'
      }));

    // 2. Cursus Counts
    const cursusCounts: Record<string, number> = {};
    filteredTenants.forEach(t => {
      if (t.cursus) {
        cursusCounts[t.cursus] = (cursusCounts[t.cursus] || 0) + 1;
      }
    });

    const cursusList = Object.entries(cursusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalFiltered > 0 ? ((count / totalFiltered) * 100).toFixed(1) : '0'
      }));

    return { fullSchoolsList: schoolsList, fullCursusList: cursusList };
  }, [filteredTenants, totalFiltered]);


  // Helper to determine the effective duration for a tenant
  const getEffectiveDuration = (t: Tenant): number => {
    // Priority 1: Real calculation if Start AND End dates exist
    if (t.startDate && t.endDate) {
      const exactMonths = calculateMonthsBetween(t.startDate, t.endDate);
      if (exactMonths > 0) return exactMonths;
    }

    // Priority 2: Real-time calculation from Start Date (if still active/no end date)
    if (t.startDate) {
      const realMonths = calculateMonthsSince(t.startDate);
      // Si la durée calculée est cohérente (>0), on l'utilise
      if (realMonths > 0) return realMonths;
    }
    
    // Fallback: Static string duration
    return parseDurationString(t.duration);
  };

  // 2. Data Processing: Gender Distribution
  const genderData = useMemo(() => {
    const counts = { [Gender.MALE]: 0, [Gender.FEMALE]: 0, [Gender.OTHER]: 0, 'Non précisé': 0 };
    filteredTenants.forEach(t => {
      if (t.gender === Gender.MALE) counts[Gender.MALE]++;
      else if (t.gender === Gender.FEMALE) counts[Gender.FEMALE]++;
      else if (t.gender === Gender.OTHER) counts[Gender.OTHER]++;
      else counts['Non précisé']++;
    });

    return [
      { name: 'Hommes', value: counts[Gender.MALE], fill: '#3b82f6' }, // Blue
      { name: 'Femmes', value: counts[Gender.FEMALE], fill: '#ec4899' }, // Pink
      { name: 'Autre', value: counts[Gender.OTHER], fill: '#a855f7' }, // Purple
      { name: 'Non précisé', value: counts['Non précisé'], fill: '#cbd5e1' } // Slate
    ].filter(d => d.value > 0);
  }, [filteredTenants]);

  // 3. Data Processing: Average Duration by Cursus
  const durationByCursusData = useMemo(() => {
    const cursusStats: Record<string, { totalMonths: number, count: number }> = {};
    
    filteredTenants.forEach(t => {
      const months = getEffectiveDuration(t);
      if (months > 0 && t.cursus) {
        if (!cursusStats[t.cursus]) {
          cursusStats[t.cursus] = { totalMonths: 0, count: 0 };
        }
        cursusStats[t.cursus].totalMonths += months;
        cursusStats[t.cursus].count++;
      }
    });

    return Object.entries(cursusStats)
      .map(([name, stats]) => ({
        name,
        avgDuration: parseFloat((stats.totalMonths / stats.count).toFixed(1)),
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration) // Sort by duration
      .slice(0, 8); // Top 8 to avoid clutter
  }, [filteredTenants]);

   // 4. Data Processing: Average Duration by Gender
  const durationByGenderData = useMemo(() => {
    const genderStats: Record<string, { totalMonths: number, count: number }> = {};
    
    filteredTenants.forEach(t => {
      const months = getEffectiveDuration(t);
      if (months > 0) {
        const key = t.gender === Gender.MALE ? 'Hommes' 
                  : t.gender === Gender.FEMALE ? 'Femmes' 
                  : t.gender === Gender.OTHER ? 'Autre' 
                  : 'Non précisé';
        
        if (!genderStats[key]) {
          genderStats[key] = { totalMonths: 0, count: 0 };
        }
        genderStats[key].totalMonths += months;
        genderStats[key].count++;
      }
    });

     return Object.entries(genderStats)
      .map(([name, stats]) => ({
        name,
        avgDuration: parseFloat((stats.totalMonths / stats.count).toFixed(1)),
      }));
  }, [filteredTenants]);


  // Custom Tooltip for Duration
  const DurationTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-indigo-600 font-semibold">
            Moyenne : {payload[0].value} mois
          </p>
          {payload[0].payload.count && (
            <p className="text-slate-500 text-xs">
              Basé sur {payload[0].payload.count} locataires
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Filter Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-indigo-900">
           <BarChart3 className="w-5 h-5" />
           <h2 className="font-bold text-lg">Analyses Croisées</h2>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 hidden sm:inline">Périmètre :</span>
          <select 
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="ALL">Toutes les résidences</option>
            {residenceConfig.map(res => (
              <option key={res.id} value={res.id}>{res.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Note sur les calculs :</strong> L'ancienneté (durée de bail) est désormais calculée de manière précise si les dates d'entrée et de sortie sont renseignées.
          Le système privilégie ces dates réelles sur la durée déclarative.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: DURATION VS CURSUS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
               <Clock className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800">Ancienneté / Durée Moyenne par Cursus</h3>
               <p className="text-xs text-slate-500">Les étudiants de quelles filières restent le plus longtemps ?</p>
             </div>
          </div>
          
          <div className="flex-grow w-full min-h-0">
             {durationByCursusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationByCursusData} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" unit=" mois" stroke="#94a3b8" fontSize={12} />
                  {/* Modification width de 140 à 230 pour éviter le chevauchement */}
                  <YAxis dataKey="name" type="category" width={230} tick={{fontSize: 11, fill: '#475569'}} />
                  <Tooltip content={<DurationTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="avgDuration" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                 Pas assez de données de durée pour l'analyse.
               </div>
             )}
          </div>
        </div>

        {/* CHART 2: GENDER DISTRIBUTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
           <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
               <Users className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800">Répartition par Genre</h3>
               <p className="text-xs text-slate-500">Répartition démographique de vos locataires.</p>
             </div>
          </div>

          <div className="flex-grow w-full min-h-0">
             {genderData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                 Aucune donnée de genre renseignée.
               </div>
             )}
          </div>
        </div>

        {/* CHART 3: DURATION VS GENDER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[300px] lg:col-span-2">
           <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
               <GraduationCap className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800">Fidélité Locative par Genre</h3>
               <p className="text-xs text-slate-500">Comparaison de la durée moyenne de séjour.</p>
             </div>
          </div>
          
           <div className="flex-grow w-full min-h-0">
             {durationByGenderData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={durationByGenderData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis unit=" mois" stroke="#94a3b8" />
                    <Tooltip content={<DurationTooltip />} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="avgDuration" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40}>
                      {
                        durationByGenderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Femmes' ? '#ec4899' : entry.name === 'Hommes' ? '#3b82f6' : '#cbd5e1'} />
                        ))
                      }
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                 Pas assez de données pour comparer les durées.
               </div>
             )}
           </div>
        </div>
      </div>

      {/* DETAILED LISTS SECTION (COPIED FROM DASHBOARD) */}
      <div className="mt-8 pb-8">
         <div className="flex items-center gap-2 mb-4">
           <List className="w-5 h-5 text-indigo-600" />
           <h3 className="text-lg font-bold text-slate-800">Détails Complets des Effectifs (Selon filtres)</h3>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* SCHOOLS FULL LIST */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[500px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 sticky top-0">
               <Building className="w-4 h-4 text-slate-500" />
               <h4 className="font-semibold text-slate-700">Répartition par École / Entreprise</h4>
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
               <h4 className="font-semibold text-slate-700">Répartition par Cursus / Filière</h4>
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

export default AdvancedStats;