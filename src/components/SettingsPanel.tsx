import React, { useEffect, useState } from "react";
import { SpeechSettings } from "../types";
import { Volume2, Settings, Sparkles, VolumeX, Eye, Info } from "lucide-react";

interface SettingsPanelProps {
  settings: SpeechSettings;
  onChange: (settings: SpeechSettings) => void;
  className?: string;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChange,
  className = "",
  isDarkMode,
  onThemeToggle,
}) => {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available system voices for the browser speechSynthesis
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setBrowserVoices(voices.filter((v) => v.lang.includes("en") || v.lang.startsWith("en-")));
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleVoiceTypeChange = (useAi: boolean) => {
    onChange({
      ...settings,
      useAiVoice: useAi,
      selectedVoice: useAi ? "Kore" : browserVoices[0]?.name || "",
    });
  };

  const geminiVoices = ["Kore", "Puck", "Charon", "Fenrir", "Zephyr"];

  return (
    <div className={`p-6 bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-100 rounded-xl pixel-shadow text-[#222] dark:text-zinc-100 ${className}`}>
      <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-4 mb-4">
        <h3 className="flex items-center gap-2 font-pixel text-xl font-bold tracking-tight text-[#5A67FF] dark:text-brand-secondary">
          <Settings className="w-5 h-5 animate-spin-slow" />
          SYSTEM CONFIG
        </h3>
        
        {/* Simple Theme Toggle */}
        <button
          onClick={onThemeToggle}
          aria-label="Toggle Theme"
          className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-600 rounded font-pixel text-xs hover:bg-[#8B9DFF] hover:dark:bg-[#5A67FF] transition-colors focus:outline-none"
        >
          {isDarkMode ? "☀️ SYSTEM LIGHT" : "🌙 SCANNER DARK"}
        </button>
      </div>

      <div className="space-y-5 font-sans">
        {/* Voice Engine selection */}
        <div>
          <label className="block text-sm font-bold font-mono tracking-wide uppercase mb-2 text-zinc-600 dark:text-zinc-400">
            🤖 Speech Voice Engine
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleVoiceTypeChange(true)}
              className={`flex items-center justify-center gap-2 px-3 py-2 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg text-sm font-bold transition-all ${
                settings.useAiVoice
                  ? "bg-[#5A67FF] text-white border-[#5A67FF] shadow-[2px_2px_0px_#222]"
                  : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Gemini AI Voice
            </button>
            <button
              type="button"
              onClick={() => handleVoiceTypeChange(false)}
              className={`flex items-center justify-center gap-2 px-3 py-2 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg text-sm font-bold transition-all ${
                !settings.useAiVoice
                  ? "bg-[#5A67FF] text-white border-[#5A67FF] shadow-[2px_2px_0px_#222]"
                  : "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Volume2 className="w-4 h-4" />
              Browser Synth
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 inline" />
            {settings.useAiVoice 
              ? "Generates high fidelity custom audio via Gemini tts-preview Model." 
              : "Uses standard instant web page speechSynthesis engine."}
          </p>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-bold font-mono tracking-wide uppercase mb-1.5 text-zinc-600 dark:text-zinc-400">
            🎙️ Selected Speaker Profile
          </label>
          {settings.useAiVoice ? (
            <select
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg text-sm font-semibold outline-none focus:border-[#5A67FF]"
              value={settings.selectedVoice}
              onChange={(e) => onChange({ ...settings, selectedVoice: e.target.value })}
            >
              {geminiVoices.map((voice) => (
                <option key={voice} value={voice}>
                  AI voice: {voice} ({voice === "Kore" ? "Sincere & Calm" : voice === "Zephyr" ? "Cheerful" : "Professional"})
                </option>
              ))}
            </select>
          ) : (
            <select
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg text-sm font-semibold outline-none focus:border-[#5A67FF]"
              value={settings.selectedVoice}
              onChange={(e) => onChange({ ...settings, selectedVoice: e.target.value })}
            >
              {browserVoices.length > 0 ? (
                browserVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))
              ) : (
                <option value="">Default System Voice</option>
              )}
            </select>
          )}
        </div>

        {/* Volume & Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="flex items-center justify-between text-sm font-bold font-mono tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-1">
              <span>🔊 Volume</span>
              <span>{Math.round(settings.volume * 100)}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => onChange({ ...settings, volume: parseFloat(e.target.value) })}
              className="w-full accent-[#5A67FF] cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
            />
          </div>
          <div>
            <span className="flex items-center justify-between text-sm font-bold font-mono tracking-wide uppercase text-zinc-600 dark:text-zinc-400 mb-1">
              <span>⚡ Pace Speed</span>
              <span>{settings.speechRate.toFixed(2)}x</span>
            </span>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={settings.speechRate}
              onChange={(e) => onChange({ ...settings, speechRate: parseFloat(e.target.value) })}
              className="w-full accent-[#5A67FF] cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Auto Speak Toggle */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              ⚡ Auto-Speak Results
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Automatically read analysis aloud immediately
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...settings, autoSpeak: !settings.autoSpeak })}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              settings.autoSpeak ? "bg-[#39C07F]" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.autoSpeak ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
