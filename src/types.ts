export interface AnalysisResult {
  possible_condition: string;
  confidence: "Low" | "Medium" | "High";
  what_it_might_be: string;
  possible_causes: string[];
  common_signs: string[];
  next_steps: string[];
  urgency_level: "Green" | "Yellow" | "Red";
  medical_attention: string;
  disclaimer: string;
  spoken_summary?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  image: string; // Base64 data string
  result: AnalysisResult;
}

export interface SpeechSettings {
  selectedVoice: string; // Voice name
  speechRate: number;    // Multiplier, e.g. 1.0, 0.9, 1.2
  autoSpeak: boolean;    // Speak immediately upon completion
  volume: number;        // From 0 to 1
  useAiVoice: boolean;   // Use True AI voice generation via Gemini-TTS vs Local synthesis
}
