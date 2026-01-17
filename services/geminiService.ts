
import { GoogleGenAI } from "@google/genai";
import { Manifest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  analyzeManifests: async (manifests: Manifest[]): Promise<string> => {
    if (manifests.length === 0) return "Nenhum dado para analisar no momento.";

    const summary = manifests.map(m => ({
      data: m.date,
      totalNotas: m.invoices.length,
      valorTotal: m.invoices.reduce((acc, inv) => acc + inv.value, 0),
      freteTotal: m.invoices.reduce((acc, inv) => acc + inv.freight, 0)
    }));

    const prompt = `Analise os seguintes dados de romaneios de transporte e forneça um resumo executivo curto (máximo 3 parágrafos) em Português do Brasil. Identifique tendências, o dia com maior volume financeiro e dê uma sugestão operacional para otimização de custos de frete baseado nos dados: ${JSON.stringify(summary)}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Não foi possível gerar a análise no momento.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Erro ao processar análise inteligente.";
    }
  }
};
