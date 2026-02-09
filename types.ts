
export interface WordAnalysis {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  meaning: string;
  chineseMeaning: string;
  examples: string[];
  synonyms: string[];
  sources?: { title: string; url: string }[];
}

export interface SentenceAnalysis {
  original: string;
  translation: string;
  structure: {
    part: string;
    explanation: string;
  }[];
  grammarPoints: string[];
  keyVocabulary: { word: string; meaning: string }[];
  sources?: { title: string; url: string }[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  type: 'txt' | 'epub' | 'md' | 'pdf' | 'image';
  cover?: string;
  originalImage?: string; // Base64 image data for image-based books
}

export interface SavedItem {
  id: string;
  type: 'word' | 'sentence';
  content: string;
  translation: string;
  timestamp: number;
  details: AnalysisResult['data'];
}

export type AnalysisResult = {
  type: 'word';
  data: WordAnalysis;
} | {
  type: 'sentence';
  data: SentenceAnalysis;
};

export type AIProvider = 'gemini' | 'deepseek';

export interface AppSettings {
  aiProvider: AIProvider;
  deepseekApiKey?: string;
}

export interface BookProgress {
  [bookId: string]: number; // 0 to 100
}
