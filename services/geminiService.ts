import { GoogleGenAI } from "@google/genai";
import { Tenant, ResidenceConfig } from "../types";

// Helper to format data for the prompt
const formatDataForPrompt = (tenants: Tenant[], config: ResidenceConfig[]): string => {
  const summary: Record<string, string[]> = {};
  const configMap = new Map(config.map(c => [c.id, c.name]));

  tenants.forEach(t => {
    const residenceName = configMap.get(t.residenceId) || t.residenceId;
    if (!summary[residenceName]) {
      summary[residenceName] = [];
    }
    summary[residenceName].push(`${t.originName} (${t.originType})`);
  });

  let promptData = "Données actuelles des locataires par résidence :\n";
  Object.entries(summary).forEach(([res, origins]) => {
    // Count occurrences
    const counts: Record<string, number> = {};
    origins.forEach(o => counts[o] = (counts[o] || 0) + 1);
    
    const topOrigins = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `- ${name}: ${count} étudiants`)
      .join('\n');

    promptData += `\n### ${res}\n${topOrigins}\n`;
  });

  return promptData;
};

export const getMarketingAnalysis = async (tenants: Tenant[], config: ResidenceConfig[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Clé API manquante. Veuillez configurer process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const dataContext = formatDataForPrompt(tenants, config);
  
  const systemInstruction = `Tu es un expert en stratégie marketing immobilière spécialisé dans le logement étudiant. 
  Ton objectif est d'analyser la provenance des étudiants (écoles, lieux de stage) pour chaque résidence et de proposer des actions concrètes (partenariats, publicité ciblée) pour optimiser le remplissage.
  Sois structuré, professionnel et concis. Fais des recommandations spécifiques par résidence.`;

  const prompt = `Voici les données de mes 4 résidences étudiantes situées dans la même ville mais dans des secteurs différents.
  
  ${dataContext}
  
  Analyse ces flux et propose :
  1. Une analyse rapide des profils dominants pour chaque résidence (ex: "La résidence Nord attire les ingénieurs").
  2. Deux actions marketing ciblées par résidence pour capter plus d'étudiants similaires ou diversifier.
  3. Une suggestion de partenariat stratégique global.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster basic analysis
      }
    });

    return response.text || "Désolé, je n'ai pas pu générer d'analyse pour le moment.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Une erreur est survenue lors de la communication avec l'assistant IA.";
  }
};