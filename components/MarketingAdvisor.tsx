import React, { useState } from 'react';
import { Tenant, ResidenceConfig } from '../types';
import { getMarketingAnalysis } from '../services/geminiService';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarketingAdvisorProps {
  tenants: Tenant[];
  residenceConfig: ResidenceConfig[];
}

const MarketingAdvisor: React.FC<MarketingAdvisorProps> = ({ tenants, residenceConfig }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (tenants.length === 0) {
      setError("Veuillez ajouter des locataires avant de lancer l'analyse.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await getMarketingAnalysis(tenants, residenceConfig);
      setAnalysis(result);
    } catch (err) {
      setError("Erreur lors de l'analyse.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-indigo-50 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Assistant Stratégique IA
          </h2>
          <p className="text-indigo-700 text-sm mt-1">
            Utilisez l'intelligence artificielle pour détecter des opportunités de ciblage.
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyse en cours...' : 'Générer une stratégie'}
        </button>
      </div>

      <div className="p-6 min-h-[300px]">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {!analysis && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Sparkles className="w-12 h-12 mb-3 opacity-20" />
            <p>Cliquez sur le bouton pour analyser vos données locataires.</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 text-indigo-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="animate-pulse font-medium">L'IA analyse vos flux de locataires...</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="prose prose-indigo max-w-none bg-slate-50 p-6 rounded-xl border border-slate-100">
             <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingAdvisor;