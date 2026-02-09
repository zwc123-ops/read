
import { GoogleGenAI, Type } from "@google/genai";
import { WordAnalysis, SentenceAnalysis } from "../types";

export async function analyzeWord(word: string): Promise<WordAnalysis> {
  // Always initialize GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the English word: "${word}". Provide a detailed breakdown in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          partOfSpeech: { type: Type.STRING },
          meaning: { type: Type.STRING },
          chineseMeaning: { type: Type.STRING },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } },
          synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["word", "partOfSpeech", "meaning", "chineseMeaning", "examples"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function analyzeSentence(sentence: string): Promise<SentenceAnalysis> {
  // Always initialize GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    // Use gemini-3-pro-preview for complex sentence structure and grammar analysis
    model: 'gemini-3-pro-preview',
    contents: `Analyze the English sentence: "${sentence}". Provide structural breakdown and grammar analysis in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          translation: { type: Type.STRING },
          structure: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                part: { type: Type.STRING, description: "Component of the sentence like Subject, Verb, Object" },
                explanation: { type: Type.STRING }
              }
            }
          },
          grammarPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyVocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                meaning: { type: Type.STRING }
              }
            }
          }
        },
        required: ["original", "translation", "structure", "grammarPoints"],
      },
    },
  });

  return JSON.parse(response.text);
}
