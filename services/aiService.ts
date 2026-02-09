
import { GoogleGenAI, Type } from "@google/genai";
import { WordAnalysis, SentenceAnalysis, AIProvider } from "../types";

async function callDeepSeek(prompt: string, apiKey: string) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a professional English teacher. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'DeepSeek API Error');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

function extractSources(response: any): { title: string; url: string }[] {
  const sources: { title: string; url: string }[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks && Array.isArray(chunks)) {
    chunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        sources.push({
          title: chunk.web.title || "参考来源",
          url: chunk.web.uri
        });
      }
    });
  }
  
  // Deduplicate sources by URL
  return Array.from(new Map(sources.map(s => [s.url, s])).values());
}

// Fixed ocrImage to use correct multimodal content structure
export async function ocrImage(base64Data: string, mimeType: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data.split(',')[1] || base64Data,
            mimeType: mimeType
          }
        },
        {
          text: "Please transcribe all English text from this image accurately. Maintain the paragraph structure. Output only the transcribed text, nothing else."
        }
      ]
    }
  });
  return response.text || "";
}

export async function analyzeWord(word: string, provider: AIProvider, deepseekKey?: string): Promise<WordAnalysis> {
  const prompt = `Analyze the English word: "${word}". Return a JSON object with: word, phonetic, partOfSpeech, meaning (EN), chineseMeaning, examples (string[]), synonyms (string[]). Provide modern usage and context if possible.`;

  if (provider === 'deepseek' && deepseekKey) {
    const jsonStr = await callDeepSeek(prompt, deepseekKey);
    return JSON.parse(jsonStr);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
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

  const analysis = JSON.parse(response.text);
  analysis.sources = extractSources(response);
  return analysis;
}

export async function analyzeSentence(sentence: string, provider: AIProvider, deepseekKey?: string): Promise<SentenceAnalysis> {
  const prompt = `Analyze this sentence: "${sentence}". Return JSON with: original, translation (CN), structure (array: {part, explanation}), grammarPoints (string[]), keyVocabulary (array: {word, meaning}). Search for context if this looks like a quote or famous passage.`;

  if (provider === 'deepseek' && deepseekKey) {
    const jsonStr = await callDeepSeek(prompt, deepseekKey);
    return JSON.parse(jsonStr);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
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
                part: { type: Type.STRING },
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

  const analysis = JSON.parse(response.text);
  analysis.sources = extractSources(response);
  return analysis;
}
