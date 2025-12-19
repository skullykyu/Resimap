import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tenant, ResidenceConfig, Gender, PersonStatus } from '../types';
import { Filter, Users, Clock, GraduationCap, BarChart3, Info, List, Building, CalendarDays, UserCheck } from 'lucide-react';

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

const calculateMonthsSince = (startDateStr: string): number => {
  const start = new Date(startDateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return 0;
  let months = (now.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += now.getMonth();
  return Math.max(0, months) + (now.getDate() >= start.getDate() ? 0 : -1) + (months === 0 ? 1 : 0);
};

const calculateMonthsBetween = (startStr: string, endStr: string): number => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months -= start.getMonth();
  months += end.getMonth();
  return Math.max(0, months) + (end.getDate() >= start.getDate() ? 0 : -1) + (months === 0 ? 1 : 0);
};

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ tenants, residenceConfig }) => {
  const [filterId, setFilterId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  // 1. Filtering Logic (Residence + Population Status)
  const filteredTenants = useMemo(() => {
    let list = [...tenants];
    
    // Population Filter
    if (statusFilter === 'ACTIVE') {
      list = list.filter(t => t.status === PersonStatus.TENANT);
    }

    // Residence Filter
    if (filterId !== 'ALL') {
      list = list.filter(t => t.residenceId === filterId);
    }
    
    return list;
  }, [tenants, filterId, statusFilter]);

  const totalFiltered = filteredTenants.length;

  // 2. Data Processing for Tables
  const { fullSchoolsList, fullCursusList } = useMemo(() => {
    const originCounts: Record<string, number> = {};
    const cursusCounts: Record<string, number> = {};

    filteredTenants.forEach(t => {
      if (t.originName) {
        originCounts[t.originName] = (originCounts[t.originName] || 0) + 1;
      }
      if (t.cursus) {
        cursusCounts[t.cursus] = (cursusCounts[t.cursus] || 0) + 1;
      }
    });

    const schoolsList = Object.entries(originCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalFiltered > 0 ? ((count / totalFiltered) * 100).toFixed(1) : '0'
      }));

    const cursusList = Object.entries(cursusCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalFiltered > 0 ? ((count / totalFiltered) * 100).toFixed(1) : '0'
      }));

    return { fullSchoolsList: schoolsList, fullCursusList: cursusList };
  }, [filteredTenants, totalFiltered]);

  // 3. New Lease per Year Logic
  const bailsPerYearData = useMemo(() => {
    const yearCounts: Record<string, number> = {};
    filteredTenants.forEach(t => {
      if (t.startDate) {
        const year = new Date(t.startDate).getFullYear().toString();
        if (year !== "NaN") {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      }
    });

    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [filteredTenants]);

  // 4. Helper for Durations
  const getEffectiveDuration = (t: Tenant): number => {
    if (t.startDate && t.endDate) {
      const exactMonths = calculateMonthsBetween(t.startDate, t.endDate);
      if (exactMonths > 0) return exactMonths;
    }
    if (t.startDate) {
      const realMonths = calculateMonthsSince(t.startDate);
      if (realMonths > 0) return realMonths;
    }
    return parseDurationString(t.duration);
  };

  // 5. Gender Data
  const genderData = useMemo(() => {
    const counts = { [Gender.MALE]: 0, [Gender.FEMALE]: 0, [Gender.OTHER]: 0, 'Non précisé': 0 };
    filteredTenants.forEach(t => {
      if (t.gender === Gender.MALE) counts[Gender.MALE]++;
      else if (t.gender === Gender.FEMALE) counts[Gender.FEMALE]++;
      else if (t.gender === Gender.OTHER) counts[Gender.OTHER]++;
      else counts['Non précisé']++;
    });

    return [
      { name: 'Hommes', value: counts[Gender.MALE], fill: '#3b82f6' },
      { name: 'Femmes', value: counts[Gender.FEMALE], fill: '#ec4899' },
      { name: 'Autre', value: counts[Gender.OTHER], fill: '#a855f7' },
      { name: 'Non précisé', value: counts['Non précisé'], fill: '#cbd5e1' }
    ].filter(d => d.value > 0);
  }, [filteredTenants]);

  // 6. Cursus Duration Data
  const durationByCursusData = useMemo(() => {
    const cursusStats: Record<string, { totalMonths: number, count: number }> = {};
    filteredTenants.forEach(t => {
      const months = getEffectiveDuration(t);
      if (months > 0 && t.cursus) {
        if (!cursusStats[t.cursus]) cursusStats[t.cursus] = { totalMonths: 0, count: 0 };
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
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 8);
  }, [filteredTenants]);

  // 7. Gender Duration Data
  const durationByGenderData = useMemo(() => {
    const genderStats: Record<string, { totalMonths: number, count: number }> = {};
    filteredTenants.forEach(t => {
      const months = getEffectiveDuration(t);
      if (months > 0) {
        const key = t.gender === Gender.MALE ? 'Hommes' : t.gender === Gender.FEMALE ? 'Femmes' : t.gender === Gender.OTHER ? 'Autre' : 'Non précisé';
        if (!genderStats[key]) genderStats[key] = { totalMonths: 0, count: 0 };
        genderStats[key].totalMonths += months;
        genderStats[key].count++;
      }
    });
    return Object.entries(genderStats).map(([name, stats]) => ({ name, avgDuration: parseFloat((stats.totalMonths / stats.count).toFixed(1)) }));
  }, [filteredTenants]);

  const DurationTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-indigo-600 font-semibold">Moyenne : {payload[0].value} mois</p>
          {payload[0].payload.count && <p className="text-slate-500 text-xs">Basé sur {payload[0].payload.count} personnes</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center gap-2 text-indigo-900">
           <BarChart3 className="w-5 h-5" />
           <h2 className="font-bold text-lg">Analyses Croisées</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Population Status Filter */}
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">Population :</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ACTIVE' | 'ALL')}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="ACTIVE">Locataires Actifs</option>
              <option value="ALL">Tous (Locs + Prospects)</option>
            </select>
          </div>

          {/* Residence Filter */}
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">Périmètre :</span>
            <select 
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="ALL">Toutes les résidences</option>
              {residenceConfig.map(res => <option key={res.id} value={res.id}>{res.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 text-indigo-800 p-4 rounded-lg flex items-start gap-3 text-sm border border-indigo-100">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Analyse en cours :</strong> Affichage des données pour <strong>{statusFilter === 'ACTIVE' ? 'les locataires en place' : 'toutes les personnes enregistrées (contacts inclus)'}</strong>. 
          {statusFilter === 'ALL' && " Note : Les prospects n'ayant pas de date d'entrée, ils ne sont pas visibles sur les graphiques chronologiques."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: DURATION VS CURSUS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Clock className="w-5 h-5" /></div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">Fidélité par Cursus (Moyenne)</h3>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Mois de présence</p>
             </div>
          </div>
          <div className="flex-grow w-full min-h-0">
             {durationByCursusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationByCursusData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" unit=" m" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="name" type="category" width={180} tick={{fontSize: 10, fill: '#475569'}} />
                  <Tooltip content={<DurationTooltip />} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="avgDuration" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
             ) : <div className="h-full flex items-center justify-center text-slate-400 italic text-sm text-center">Pas assez de données de durée <br/> pour générer ce graphique.</div>}
          </div>
        </div>

        {/* CHART 2: GENDER DISTRIBUTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
           <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Users className="w-5 h-5" /></div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">Démographie (Genre)</h3>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Répartition active</p>
             </div>
          </div>
          <div className="flex-grow w-full min-h-0">
             {genderData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
             ) : <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">Pas de données.</div>}
          </div>
        </div>

        {/* CHART 3: NEW LEASES PER YEAR */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CalendarDays className="w-5 h-5" /></div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">Volumes d'entrées par Année</h3>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Baux signés (Uniquement Locataires)</p>
             </div>
          </div>
          <div className="flex-grow w-full min-h-0">
             {bailsPerYearData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bailsPerYearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="count" name="Signatures" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
             ) : <div className="h-full flex items-center justify-center text-slate-400 italic text-sm text-center px-4">Aucune date de début renseignée <br/> ou aucun locataire actif.</div>}
          </div>
        </div>

        {/* CHART 4: DURATION BY GENDER */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
           <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><GraduationCap className="w-5 h-5" /></div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">Fidélité Locative par Genre</h3>
               <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Durée moyenne (mois)</p>
             </div>
          </div>
           <div className="flex-grow w-full min-h-0">
             {durationByGenderData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={durationByGenderData} margin={{top: 10, right: 10, left: -20, bottom: 5}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis unit=" m" stroke="#94a3b8" fontSize={11} />
                    <Tooltip content={<DurationTooltip />} cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="avgDuration" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40}>
                      {durationByGenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Femmes' ? '#ec4899' : entry.name === 'Hommes' ? '#3b82f6' : '#cbd5e1'} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">Pas assez de données.</div>}
           </div>
        </div>

      </div>

      {/* TABLES SECTION */}
      <div className="mt-8 pb-8">
         <div className="flex items-center gap-2 mb-4">
           <List className="w-5 h-5 text-indigo-600" />
           <h3 className="text-lg font-bold text-slate-800">Détails Complets des Effectifs ({statusFilter === 'ACTIVE' ? 'Actifs' : 'Global'})</h3>
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[400px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 sticky top-0">
               <Building className="w-4 h-4 text-slate-500" />
               <h4 className="font-semibold text-slate-700 text-sm">Répartition par Établissement</h4>
             </div>
             <div className="overflow-y-auto p-0 flex-grow custom-scrollbar">
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
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Aucune donnée trouvée</td></tr>
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
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[400px]">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 sticky top-0">
               <GraduationCap className="w-4 h-4 text-slate-500" />
               <h4 className="font-semibold text-slate-700 text-sm">Répartition par Filière</h4>
             </div>
             <div className="overflow-y-auto p-0 flex-grow custom-scrollbar">
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
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">Aucune donnée trouvée</td></tr>
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