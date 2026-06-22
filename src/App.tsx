import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, Trash2, Volume2, Play, Pause, Square, RotateCcw, 
  Settings as SettingsIcon, Download, RefreshCw, AlertTriangle, 
  CheckCircle, PlusCircle, VolumeX, Sparkles, HelpCircle, 
  FileText, Activity, Layers, ArrowLeft
} from "lucide-react";
import { AnalysisResult, HistoryItem, SpeechSettings } from "./types";
import { PixelDoctor } from "./components/PixelDoctor";
import { AudioWaveform } from "./components/AudioWaveform";
import { SettingsPanel } from "./components/SettingsPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { jsPDF } from "jspdf";

const SAMPLE_PRESETS = [
  {
    name: "Dry, Scaly Patches",
    category: "Skin",
    desc: "A simulation of dehydrated scaling with mild pink coloration, typical of eczema or general irritation.",
    mimeType: "image/svg+xml",
    data: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGRkJCODQiLz48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI0ZGODI4MiIgb3BhY2l0eT0iMC42Ii8+PHJlY3QgeD0iMzAiIHk9IjMwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNGRjRCNCIgb3BhY2l0eT0iMC43Ii8+PC9zdmc+"
  },
  {
    name: "Visible Red Swelling",
    category: "Joints",
    desc: "A simulated local inflammatory response showing a warm swollen surface on joint regions.",
    mimeType: "image/svg+xml",
    data: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGRkV4QzQiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMCIgZmlsbD0iI0ZGNjI2MiIgb3BhY2l0eT0iMC42Ii8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiNGRjIyMjIiIG9wYWNpdHk9IjAuNyIvPjwvc3ZnPg=="
  },
  {
    name: "Discolored Nail Bed",
    category: "Nails",
    desc: "A simulated nail surface discoloration, suggesting possible fungal wear or mechanical pressure trauma.",
    mimeType: "image/svg+xml",
    data: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNFMkU4RjAiLz48cmVjdCB4PSIyNCIgeT0iMTAiIHdpZHRoPSI1MiIgaGVpZ2h0PSI4MCIgZmlsbD0iI0ZGREJDNyIgY2g9IjEyIi8+PHJlY3QgeD0iMzAiIHk9IjMwIiB3aWR0aD0iNDAiIGhlaWdodD0iNTAiIGZpbGw9IiNEOEEyN0UiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg=="
  }
];

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function addWavHeader(samples: Uint8Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw pcm) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true); // mono
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true); // Mono 16-bit block align = 2
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true); // channelCount (1) * bytesPerSample (2)
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length, true);
  
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(samples, 44);
  return wavBytes;
}

export default function App() {
  const [currentStep, setCurrentStep] = useState<"landing" | "upload" | "analysis">("landing");
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [showConfig, setShowConfig] = useState(false);
  
  // App settings & Theme states
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("disease-detector-theme");
      return saved === "dark";
    }
    return false;
  });

  const [settings, setSettings] = useState<SpeechSettings>(() => {
    const defaultSettings: SpeechSettings = {
      selectedVoice: "Kore",
      speechRate: 1.0,
      autoSpeak: true,
      volume: 0.9,
      useAiVoice: true,
    };
    try {
      const saved = localStorage.getItem("disease-detector-speech-settings");
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("disease-detector-history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Analysis result loading and reporting state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);

  // Text-To-Speech (audio engines) state
  const [audioStatus, setAudioStatus] = useState<"not_started" | "speaking" | "paused" | "finished">("not_started");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isGeneratingTts, setIsGeneratingTts] = useState<boolean>(false);

  // Audio elements references
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const textSentencesRef = useRef<string[]>([]);
  const currentUtteranceIndexRef = useRef<number>(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync Dark/Light Mode Tailwind class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("disease-detector-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("disease-detector-theme", "light");
    }
  }, [isDarkMode]);

  // Persist settings changes
  useEffect(() => {
    localStorage.setItem("disease-detector-speech-settings", JSON.stringify(settings));
  }, [settings]);

  // Initialize SpeechSynthesis reference
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopSpeaking();
    };
  }, []);

  // Keyboard accessibility listeners (Space -> Play/Pause, Esc -> Stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "SELECT") {
        return;
      }
      if (currentStep === "analysis" && activeResult) {
        if (e.code === "Space") {
          e.preventDefault();
          if (audioStatus === "speaking") {
            pauseSpeaking();
          } else {
            startSpeaking();
          }
        } else if (e.code === "Escape") {
          e.preventDefault();
          stopSpeaking();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentStep, activeResult, audioStatus, settings]);

  // Sync speech volume/rate with native HTML5 audio if loaded
  useEffect(() => {
    if (nativeAudioRef.current) {
      nativeAudioRef.current.playbackRate = settings.speechRate;
      nativeAudioRef.current.volume = settings.volume;
    }
  }, [settings.speechRate, settings.volume]);

  // Prepare segmented spoken list
  const getSpeechSegments = (res: AnalysisResult) => {
    return [
      `Visible health condition analyzed: possible condition is ${res.possible_condition}. Analysis is based only on visible parameters.`,
      `Explanation matches: ${res.what_it_might_be}. Potential reasons might include ${res.possible_causes.join(", ")}.`,
      `Common signs: ${res.common_signs.join(", ")}.`,
      `Patient care next steps: ${res.next_steps.join(". ")}. Always follow the instructions: ${res.medical_attention}`,
      `Safety notice warning: ${res.disclaimer}`
    ];
  };

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid JPEG, PNG, or WEBP image file.");
      return;
    }
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result);
        setCurrentStep("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleLoadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setSelectedImage(preset.data);
    setImageMimeType(preset.mimeType);
    setCurrentStep("upload");
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    stopSpeaking();

    const base64Data = selectedImage.split(",")[1];

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          mimeType: imageMimeType,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "The analytical service encountered an issue.");
      }

      const result: AnalysisResult = payload.data;
      setActiveResult(result);
      setCurrentStep("analysis");

      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        image: selectedImage,
        result: result,
      };

      const updatedHistory = [newHistoryItem, ...history.filter(h => h.image !== selectedImage)].slice(0, 40);
      setHistory(updatedHistory);
      localStorage.setItem("disease-detector-history", JSON.stringify(updatedHistory));

      if (settings.autoSpeak) {
        setTimeout(() => {
          triggerAutoSpeak(result);
        }, 1200);
      }

    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Network request failed. Please check backend server setup.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerAutoSpeak = (res: AnalysisResult) => {
    if (settings.useAiVoice) {
      speakViaAiVoice(res);
    } else {
      speakViaBrowserTts(res);
    }
  };

  const speakViaAiVoice = async (resultObj: AnalysisResult) => {
    stopSpeaking();
    setIsGeneratingTts(true);
    setAudioStatus("speaking");

    const spokenText = resultObj.spoken_summary || getSpeechSegments(resultObj).join("  ");

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: spokenText,
          voice: settings.selectedVoice,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Speaks generator failed to connect.");
      }

      const base64Audio = payload.audio;
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const wavBytes = addWavHeader(bytes, 24000);
      const blob = new Blob([wavBytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAiAudioUrl(url);

      const audio = new Audio(url);
      audio.playbackRate = settings.speechRate;
      audio.volume = settings.volume;
      nativeAudioRef.current = audio;

      audio.onplay = () => {
        setAudioStatus("speaking");
        setHighlightedIndex(0);
      };

      audio.onpause = () => {
        setAudioStatus("paused");
      };

      audio.onended = () => {
        setAudioStatus("finished");
        setHighlightedIndex(-1);
      };

      audio.onerror = (e) => {
        console.error("Audio Playback Error:", e);
        speakViaBrowserTts(resultObj);
      };

      audio.play();

    } catch (err: any) {
      console.warn("Gemini TTS connection failed, falling back to Web Speech API: ", err.message);
      speakViaBrowserTts(resultObj);
    } finally {
      setIsGeneratingTts(false);
    }
  };

  const speakViaBrowserTts = (resultObj: AnalysisResult) => {
    stopSpeaking();
    if (!synthRef.current) return;

    const segments = getSpeechSegments(resultObj);
    textSentencesRef.current = segments;
    currentUtteranceIndexRef.current = 0;

    setAudioStatus("speaking");

    const speakNextSegment = () => {
      if (!synthRef.current) return;
      const idx = currentUtteranceIndexRef.current;

      if (idx >= segments.length) {
        setAudioStatus("finished");
        setHighlightedIndex(-1);
        return;
      }

      setHighlightedIndex(idx);
      const val = segments[idx];
      const utterance = new SpeechSynthesisUtterance(val);
      
      utterance.rate = settings.speechRate;
      utterance.volume = settings.volume;

      if (settings.selectedVoice) {
        const voices = synthRef.current.getVoices();
        const found = voices.find((v) => v.name === settings.selectedVoice);
        if (found) {
          utterance.voice = found;
        }
      }

      utterance.onend = () => {
        currentUtteranceIndexRef.current += 1;
        setTimeout(() => {
          if (audioStatus === "speaking" || synthRef.current?.speaking) {
            speakNextSegment();
          }
        }, 800);
      };

      utterance.onerror = (e) => {
        console.error("UTTERANCE ERROR:", e);
        setAudioStatus("finished");
        setHighlightedIndex(-1);
      };

      synthUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    };

    speakNextSegment();
  };

  const startSpeaking = () => {
    if (!activeResult) return;

    if (audioStatus === "paused") {
      if (settings.useAiVoice && nativeAudioRef.current) {
        nativeAudioRef.current.play();
        setAudioStatus("speaking");
      } else if (!settings.useAiVoice && synthRef.current) {
        synthRef.current.resume();
        setAudioStatus("speaking");
      }
    } else {
      triggerAutoSpeak(activeResult);
    }
  };

  const pauseSpeaking = () => {
    if (settings.useAiVoice && nativeAudioRef.current) {
      nativeAudioRef.current.pause();
      setAudioStatus("paused");
    } else if (!settings.useAiVoice && synthRef.current) {
      synthRef.current.pause();
      setAudioStatus("paused");
    }
  };

  const stopSpeaking = () => {
    setAudioStatus("not_started");
    setHighlightedIndex(-1);

    if (nativeAudioRef.current) {
      nativeAudioRef.current.pause();
      nativeAudioRef.current.currentTime = 0;
      nativeAudioRef.current = null;
    }

    if (synthRef.current) {
      synthRef.current.cancel();
    }

    if (aiAudioUrl) {
      URL.revokeObjectURL(aiAudioUrl);
      setAiAudioUrl(null);
    }
  };

  const handleReplay = () => {
    stopSpeaking();
    setTimeout(() => {
      startSpeaking();
    }, 100);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setSelectedImage(item.image);
    setActiveResult(item.result);
    setCurrentStep("analysis");
    stopSpeaking();
  };

  const handleRemoveHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("disease-detector-history", JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to delete all saved scanner logs?")) {
      setHistory([]);
      localStorage.removeItem("disease-detector-history");
    }
  };

  const handleDownloadPDF = () => {
    if (!activeResult) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    doc.setFillColor(90, 103, 255);
    doc.rect(0, 0, 210, 12, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(34, 34, 34);
    doc.text("Disease Detector AI", 15, 30);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  AI Educational Service`, 15, 35);

    doc.setDrawColor(200, 200, 200);
    doc.line(15, 38, 195, 38);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(90, 103, 255);
    doc.text("Visible Concern Details", 15, 48);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    doc.text(`Suspected Exhibit: ${activeResult.possible_condition}`, 15, 55);

    doc.setFont("Helvetica", "normal");
    doc.text(`Confidence Index: ${activeResult.confidence}`, 15, 60);
    doc.text(`Safety Status: ${activeResult.urgency_level}`, 15, 65);

    doc.setFont("Helvetica", "bold");
    doc.text("Analysis Details:", 15, 75);
    doc.setFont("Helvetica", "normal");
    const introText = doc.splitTextToSize(activeResult.what_it_might_be, 180);
    doc.text(introText, 15, 80);

    let currentY = 80 + (introText.length * 5) + 5;

    doc.setFont("Helvetica", "bold");
    doc.text("Potential Causes:", 15, currentY);
    doc.setFont("Helvetica", "normal");
    currentY += 5;
    activeResult.possible_causes.forEach((cause) => {
      doc.text(`• ${cause}`, 20, currentY);
      currentY += 5;
    });

    currentY += 5;

    doc.setFont("Helvetica", "bold");
    doc.text("Observable Reference Symptoms:", 15, currentY);
    doc.setFont("Helvetica", "normal");
    currentY += 5;
    activeResult.common_signs.forEach((sign) => {
      doc.text(`- ${sign}`, 20, currentY);
      currentY += 5;
    });

    currentY += 5;

    doc.setFont("Helvetica", "bold");
    doc.text("Suggested Next Steps:", 15, currentY);
    doc.setFont("Helvetica", "normal");
    currentY += 5;
    activeResult.next_steps.forEach((step) => {
      const stepLines = doc.splitTextToSize(`• ${step}`, 175);
      doc.text(stepLines, 20, currentY);
      currentY += (stepLines.length * 5);
    });

    currentY += 5;
    doc.setFont("Helvetica", "bold");
    doc.text("Physician Attention Guidance:", 15, currentY);
    doc.setFont("Helvetica", "normal");
    currentY += 5;
    const alertMessage = doc.splitTextToSize(activeResult.medical_attention, 180);
    doc.text(alertMessage, 15, currentY);
    currentY += (alertMessage.length * 5) + 8;

    doc.setFillColor(243, 244, 246);
    doc.rect(14, currentY, 182, 22, "F");
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.rect(14, currentY, 182, 22);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text("Disclaimer:", 18, currentY + 5);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const disclaimerLines = doc.splitTextToSize(activeResult.disclaimer, 175);
    doc.text(disclaimerLines, 18, currentY + 11);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Disease Detector AI performs educational matching and does not substitute professional medical care.", 15, 285);

    doc.save(`Disease-AI-Report-${activeResult.possible_condition.replace(/\s+/g, "-")}.pdf`);
  };

  const getUrgencyColor = (level: "Green" | "Yellow" | "Red") => {
    switch (level) {
      case "Red":
        return {
          border: "border-red-500",
          bg: "bg-red-50 dark:bg-red-950/20",
          badge: "bg-red-500 text-white",
          accentText: "text-red-700 dark:text-red-400",
          label: "Seek Emergency Medical Attention"
        };
      case "Yellow":
        return {
          border: "border-amber-500",
          bg: "bg-amber-50 dark:bg-amber-950/20",
          badge: "bg-amber-500 text-zinc-900",
          accentText: "text-amber-700 dark:text-amber-400",
          label: "Schedule Clinical Practitioner Consultation"
        };
      default:
        return {
          border: "border-green-500",
          bg: "bg-green-50 dark:bg-green-950/20",
          badge: "bg-green-500 text-white",
          accentText: "text-green-700 dark:text-green-400",
          label: "Monitor Symptoms Close Range"
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] dark:bg-zinc-950 text-[#222] dark:text-zinc-100 font-sans selection:bg-[#8B9DFF]/40 transition-colors duration-300 pb-16">
      
      {/* HEADER BANNER */}
      <nav className="no-print bg-white dark:bg-zinc-900 border-b-4 border-zinc-900 dark:border-zinc-800 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            onClick={() => { stopSpeaking(); setCurrentStep("landing"); }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#5A67FF] dark:bg-[#8B9DFF] border-2 border-zinc-900 dark:border-zinc-100 rounded flex items-center justify-center text-white font-pixel font-bold text-lg shadow-[2px_2px_0px_#222] dark:shadow-[2px_2px_0px_#fff]">
              ➕
            </div>
            <div>
              <h1 className="font-pixel text-xl sm:text-2xl font-bold tracking-tight text-[#5A67FF] dark:text-[#8B9DFF]">
                DISEASE DETECTOR AI
              </h1>
              <p className="text-[10px] sm:text-xs font-mono text-zinc-500 dark:text-zinc-400 tracking-wider">
                EDU_RECON_MODEL_V3.5_SECURE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              aria-label="System Settings"
              className={`p-2 border-2 rounded-lg transition focus:outline-none ${
                showConfig ? "bg-[#5A67FF] text-white border-[#5A67FF]" : "border-zinc-900 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle Night Mode"
              className="p-2 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition focus:outline-none"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => {
                stopSpeaking();
                if (currentStep !== "upload") {
                  setCurrentStep("upload");
                }
              }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#5A67FF] hover:bg-[#8B9DFF] text-white font-pixel text-xs border-2 border-zinc-900 dark:border-zinc-700 shadow-[3px_3px_0px_#222] rounded transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> START SCAN
            </button>
          </div>
        </div>
      </nav>

      {/* BODY CONTEXT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* Global configuration modal overlay slide */}
        {showConfig && (
          <div className="mb-6">
            <SettingsPanel 
              settings={settings} 
              onChange={setSettings} 
              isDarkMode={isDarkMode} 
              onThemeToggle={() => setIsDarkMode(!isDarkMode)} 
            />
          </div>
        )}

        {/* STEP 1: LANDING HERO */}
        {currentStep === "landing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6 sm:py-12">
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/50 border-2 border-amber-900/10 text-amber-800 dark:text-amber-400 font-mono text-xs rounded-full font-bold">
                ⚠️ Medical Education & Awareness System
              </span>

              <h2 className="font-pixel text-4xl sm:text-5xl lg:text-6xl text-[#222] dark:text-white leading-tight">
                Upload. <br />
                <span className="text-[#5A67FF] dark:text-brand-secondary">Analyze.</span> Learn.
              </h2>

              <p className="text-lg text-zinc-600 dark:text-zinc-300 max-w-xl font-sans">
                AI-powered image analysis providing comprehensive educational insights regarding external skin rashes, blemishes, minor swelling, or visible concerns.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => setCurrentStep("upload")}
                  className="px-8 py-4 bg-[#5A67FF] hover:bg-[#8B9DFF] text-white font-pixel text-sm border-4 border-zinc-900 dark:border-zinc-300 rounded-xl pixel-shadow flex items-center justify-center gap-2 transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <Upload className="w-4 h-4" /> Start Analysis
                </button>
                <a
                  href="#history"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("saved-logs-panel")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-8 py-4 bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-300 text-zinc-800 dark:text-zinc-100 font-pixel text-sm rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> View Logs
                </a>
              </div>

              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-800 rounded-xl flex items-start gap-3 max-w-xl">
                <AlertTriangle className="w-5 h-5 text-[#FFB84D] shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-bold block text-zinc-700 dark:text-zinc-300 mb-0.5">Disclaimers & Limits</span>
                  This system uses high-confidence schema parsing to analyze superficial concerns. It CANNOT diagnose pathology or prescribe cures. Use with professional supervision.
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] p-6 bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-100 rounded-2xl pixel-shadow flex flex-col items-center">
                <div className="absolute -top-3 -right-3 px-3 py-1 bg-[#39C07F] text-white font-pixel text-[10px] border-2 border-zinc-900 rounded shadow-sm">
                  ONLINE AID
                </div>
                <PixelDoctor className="w-48 h-48" animating={true} />
                <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-center w-full border-2 border-zinc-300 dark:border-zinc-700">
                  <p className="font-pixel text-[11px] text-[#5A67FF] dark:text-[#8B9DFF]">MASCOT DOC_AL</p>
                  <p className="font-mono text-[9px] text-zinc-500 dark:text-zinc-400 mt-1">"Ready to inspect visible files. Choose custom prompt or browse presets below."</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SCAN/UPLOAD PANELS */}
        {currentStep === "upload" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { stopSpeaking(); setCurrentStep("landing"); }}
                className="p-2 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="font-pixel text-xl font-bold">UPLOAD DIAGNOSTIC SCAN AREA</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div className="p-4 bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-700 rounded-xl">
                  <h4 className="font-pixel text-xs text-zinc-500 dark:text-zinc-400 uppercase mb-3">⚡ Rapid Preset Labs</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">No actual photo on hand? Select synthetic illustrations below to try out analysis immediately:</p>
                  <div className="space-y-2">
                    {SAMPLE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleLoadPreset(preset)}
                        className={`w-full p-2.5 text-left border-2 rounded-lg text-xs hover:border-[#5A67FF] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition flex items-start gap-2.5 ${selectedImage === preset.data ? "border-[#5A67FF] dark:border-[#8B9DFF] bg-[#5A67FF]/10" : "border-zinc-300 dark:border-zinc-700"}`}
                      >
                        <div className="w-8 h-8 rounded border dark:border-zinc-600 bg-white grid place-items-center shrink-0">
                          <img src={preset.data} className="w-6 h-6 object-cover pixelated" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-800 dark:text-zinc-100">{preset.name}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{preset.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#FFB84D]/10 dark:bg-[#FFB84D]/5 border-2 border-[#FFB84D] rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#FFB84D] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium font-sans">To maintain security, never upload highly sensitive medical document prints or close-up personal identifiers.</p>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative p-8 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] transition-all ${
                    dragActive
                      ? "border-[#5A67FF] bg-[#5A67FF]/5 bg-opacity-70"
                      : "border-zinc-400 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-900"
                  }`}
                >
                  <input
                    type="file"
                    id="file-scanner-input"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileInput}
                  />

                  {selectedImage ? (
                    <div className="space-y-4 w-full flex flex-col items-center">
                      <div className="relative w-48 h-48 border-4 border-zinc-900 rounded-lg overflow-hidden pixel-shadow">
                        <img 
                          src={selectedImage} 
                          alt="Uploaded concern snippet preview" 
                          className="w-full h-full object-cover pixelated"
                        />
                        {isAnalyzing && (
                          <div className="absolute inset-x-0 h-1.5 bg-[#5A67FF] shadow-[0_0_12px_#5A67FF] animate-bounce top-0" style={{ animationDuration: "2s" }} />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">EXHIBIT SNIPPET RECEIVED</p>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1">Ready for educational verification</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 mx-auto rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-zinc-900 dark:border-zinc-700">
                        <Upload className="w-6 h-6 text-zinc-600 dark:text-zinc-300 animate-pulse" />
                      </div>
                      <div>
                        <p className="font-pixel text-sm text-[#5A67FF] dark:text-[#8B9DFF]">BROWSE SCAN IMAGE</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 font-mono">DRAG & DROP JPG, PNG, WEBP (MAX 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {selectedImage && (
                    <button
                      onClick={() => { setSelectedImage(null); }}
                      className="px-4 py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 rounded-xl text-xs font-bold transition font-mono border-2 border-zinc-900 dark:border-zinc-700"
                    >
                      CLEAR FILE
                    </button>
                  )}

                  <button
                    disabled={!selectedImage || isAnalyzing}
                    onClick={handleAnalyzeImage}
                    className={`flex-1 py-3 px-6 rounded-xl font-pixel text-xs text-white border-4 border-zinc-900 dark:border-zinc-300 pixel-shadow flex items-center justify-center gap-2 transition-all ${
                      !selectedImage ? "bg-zinc-400 opacity-60 cursor-not-allowed shadow-none" : "bg-[#5A67FF] hover:bg-[#8B9DFF] active:translate-x-0.5 active:translate-y-0.5"
                    }`}
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-white" />
                        <span>INTERROGATING SCANNER...</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span>INITIATE EDU_DIAGNOSTIC SCAN</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {analysisError && (
              <div className="p-4 bg-red-100 dark:bg-red-950/40 border-2 border-red-500 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-800 dark:text-red-400 block text-xs">Diagnostic pipeline failed</span>
                  <p className="text-xs text-red-700 dark:text-red-300/90 mt-1">{analysisError}</p>
                  <button 
                    onClick={handleAnalyzeImage}
                    className="mt-3 text-xs font-mono font-bold text-red-900 dark:text-red-300 bg-red-200 dark:bg-red-900/50 hover:bg-red-300 px-3 py-1 rounded border border-red-700 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" /> RETRY PROCESS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ANALYSIS DETAILED SCREEN REPORTS */}
        {currentStep === "analysis" && activeResult && (
          <div className="space-y-6">
            
            <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { stopSpeaking(); setCurrentStep("upload"); }}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Reset / Try Another
                </button>
                <span className="text-xs text-zinc-400 font-mono tracking-wider">
                  REPORT_ID: {activeResult.possible_condition.replace(/\s+/g, "_").toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-pixel text-xs border-2 border-zinc-900 shadow-[2px_2px_0px_#222] rounded flex items-center gap-2 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Download className="w-3.5 h-3.5" /> DOWNLOAD REPORT (PDF)
                </button>
              </div>
            </div>

            {/* AI SPEAK CONTROLLER BAR */}
            <div className="no-print p-4 bg-[#5A67FF]/10 dark:bg-zinc-900 border-4 border-[#5A67FF] dark:border-zinc-700 rounded-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 self-start md:self-center w-full md:w-auto">
                  <div className="p-2.5 bg-[#5A67FF] text-white rounded-lg border-2 border-zinc-900">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-pixel text-sm text-[#5A67FF] dark:text-[#8B9DFF]">🔊 Speak Analysis</h4>
                      <span className={`px-2 py-0.5 text-[9px] font-mono rounded border ${
                        audioStatus === "speaking" ? "bg-green-100 border-green-400 text-green-700 animate-pulse" :
                        audioStatus === "paused" ? "bg-amber-100 border-amber-400 text-amber-700" :
                        "bg-zinc-200 border-zinc-400 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                      }`}>
                        {audioStatus === "speaking" ? "Speaking..." :
                         audioStatus === "paused" ? "Paused" :
                         audioStatus === "finished" ? "Finished" : "Reader Standby"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-purple-500 inline" />
                      Active Voice: <span className="font-bold">{settings.selectedVoice}</span> ({settings.useAiVoice ? "Premium AI Natural Audio" : "Browser Synth"})
                    </p>
                  </div>
                </div>

                <AudioWaveform isPlaying={audioStatus === "speaking"} className="shrink-0 scale-90" />

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={startSpeaking}
                    disabled={isGeneratingTts || audioStatus === "speaking"}
                    aria-label="Play sound"
                    className="p-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg border-2 border-zinc-900 shadow-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={pauseSpeaking}
                    disabled={audioStatus !== "speaking"}
                    aria-label="Pause sound"
                    className="p-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-900 rounded-lg border-2 border-zinc-900 shadow-sm transition-all"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={stopSpeaking}
                    disabled={audioStatus === "not_started"}
                    aria-label="Stop sound"
                    className="p-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg border-2 border-zinc-900 shadow-sm transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={handleReplay}
                    disabled={isGeneratingTts}
                    aria-label="Replay sound"
                    className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 rounded-lg border-2 border-zinc-900 dark:border-zinc-600 shadow-sm transition-all"
                  >
                    <RotateCcw className="w-4 h-4 animate-pulse" />
                  </button>
                </div>
              </div>

              {audioStatus === "speaking" && !settings.useAiVoice && highlightedIndex >= 0 && (
                <div className="mt-3 p-3 bg-white dark:bg-zinc-800 border-2 border-[#5A67FF] rounded-lg">
                  <p className="text-xs uppercase font-pixel tracking-wide text-[#5A67FF] mb-1">Synthesizer Text Segment Highlight:</p>
                  <p className="font-sans text-sm font-semibold text-[#5A67FF] dark:text-[#8B9DFF]">
                    {textSentencesRef.current[highlightedIndex]}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-6">
                <div className="p-4 bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-700 rounded-xl pixel-shadow flex flex-col items-center">
                  <span className="font-pixel text-[11px] text-zinc-500 uppercase tracking-widest mb-3">CONCERN PHOTOGRAPH SCAN</span>
                  <div className="relative w-full aspect-square border-4 border-zinc-900 dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50">
                    <img 
                      src={selectedImage || SAMPLE_PRESETS[0].data} 
                      alt={activeResult.possible_condition} 
                      className="w-full h-full object-cover pixelated"
                    />
                  </div>
                  <div className="mt-4 text-center w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded border-2 border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    SCANNED AT: {new Date().toLocaleTimeString()}
                  </div>
                </div>

                {(() => {
                  const urgColor = getUrgencyColor(activeResult.urgency_level);
                  return (
                    <div className={`p-5 rounded-2xl border-4 ${urgColor.border} ${urgColor.bg} pixel-shadow space-y-3`}>
                      <div className="flex items-center justify-between">
                        <span className="font-pixel text-xs text-zinc-500 uppercase">SAFETY URGENCY STATUS</span>
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-pixel ${urgColor.badge}`}>
                          {activeResult.urgency_level} ALERT
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className={`font-sans text-lg font-bold ${urgColor.accentText}`}>
                          {urgColor.label}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          This indicator determines advice timeline based on superficial visual concerns. Read below for physical caution.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="lg:col-span-8 space-y-6">
                
                {/* A. Possible Condition */}
                <div 
                  className={`p-6 bg-white dark:bg-zinc-900 border-4 rounded-2xl transition-all ${
                    highlightedIndex === 0 
                      ? "border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/20 shadow-md transform -translate-y-0.5" 
                      : "border-zinc-900 dark:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-pixel text-lg text-[#5A67FF] dark:text-[#8B9DFF] mb-3 flex items-center gap-2">
                      <span>🩺</span> POSSIBLE NOXIOUS MATCH
                    </h3>
                    <div className="px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 font-mono text-xs text-zinc-600 dark:text-zinc-300 rounded font-bold">
                      Confidence: {activeResult.confidence}
                    </div>
                  </div>
                  
                  <h4 className="font-sans text-2xl font-bold text-zinc-800 dark:text-white pb-3 border-b-2 border-zinc-100 dark:border-zinc-800">
                    {activeResult.possible_condition}
                  </h4>

                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 font-mono leading-relaxed">
                    Note: Match parameters represent standard pattern guidelines and do not equal diagnostic certainties.
                  </p>
                </div>

                {/* B. What Might Cause This */}
                <div 
                  className={`p-6 bg-white dark:bg-zinc-900 border-4 rounded-2xl transition-all ${
                    highlightedIndex === 1 
                      ? "border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/20 shadow-md transform -translate-y-0.5" 
                      : "border-zinc-900 dark:border-zinc-700"
                  }`}
                >
                  <h3 className="font-pixel text-sm text-[#FFB84D] mb-3 flex items-center gap-2">
                    <span>💡</span> WHAT MIGHT CAUSE THIS DISPLAY
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 mb-4">
                    {activeResult.what_it_might_be}
                  </p>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 block uppercase">Typical matches:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeResult.possible_causes.map((cause, i) => (
                        <li key={i} className="text-xs bg-zinc-50 dark:bg-zinc-850 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 flex gap-2">
                          <span className="text-[#5A67FF] font-bold">#</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-sans">{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* C. Common Signs */}
                <div 
                  className={`p-6 bg-white dark:bg-zinc-900 border-4 rounded-2xl transition-all ${
                    highlightedIndex === 2 
                      ? "border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/20 shadow-md transform -translate-y-0.5" 
                      : "border-zinc-900 dark:border-zinc-700"
                  }`}
                >
                  <h3 className="font-pixel text-sm text-[#5A67FF] dark:text-[#8B9DFF] mb-3 flex items-center gap-2">
                    <span>📖</span> ASSOCIATED OBSERVABLE SIGNS
                  </h3>
                  <ul className="space-y-2 font-sans">
                    {activeResult.common_signs.map((sign, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <span className="text-[#39C07F] text-base shrink-0 select-none">✔</span>
                        <span>{sign}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* D. Suggested Next Steps */}
                <div 
                  className={`p-6 bg-white dark:bg-zinc-900 border-4 rounded-2xl transition-all ${
                    highlightedIndex === 3 
                      ? "border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/20 shadow-md transform -translate-y-0.5" 
                      : "border-zinc-900 dark:border-zinc-700"
                  }`}
                >
                  <h3 className="font-pixel text-sm text-[#39C07F] mb-3 flex items-center gap-2">
                    <span>🏥</span> SELF-CARE & NEXT STEPS
                  </h3>
                  <div className="space-y-4 font-sans text-sm">
                    <ul className="space-y-2">
                      {activeResult.next_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                          <span className="text-zinc-400 select-none font-pixel">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <span className="font-bold text-xs uppercase font-mono text-zinc-500 block mb-1">When to consult practitioner:</span>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">{activeResult.medical_attention}</p>
                    </div>
                  </div>
                </div>

                {/* F. Disclaimer Card */}
                <div 
                  className={`p-6 bg-red-50 dark:bg-red-950/20 border-4 border-red-500 dark:border-red-900 rounded-2xl transition-all ${
                    highlightedIndex === 4 
                      ? "ring-4 ring-red-400/20 shadow-md" 
                      : ""
                  }`}
                >
                  <h3 className="font-pixel text-sm text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <span>🛑</span> MEDICAL COMPLIANCE DISCLAIMER
                  </h3>
                  <p className="font-sans text-xs leading-relaxed text-red-800 dark:text-red-300">
                    {activeResult.disclaimer}
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* PERSISTENT HISTORY LOGGER */}
        <section id="saved-logs-panel" className="no-print mt-12 max-w-4xl mx-auto">
          <HistoryPanel 
            history={history} 
            onSelectItem={handleSelectHistoryItem} 
            onRemoveItem={handleRemoveHistoryItem} 
            onClearHistory={handleClearHistory} 
          />
        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t-2 border-zinc-200 dark:border-zinc-800 pt-8 text-center text-xs text-zinc-500 dark:text-zinc-500">
        <p className="font-pixel text-sm uppercase tracking-wide">Disease Detector AI Platform v1.0.1</p>
        <p className="font-sans mt-2 max-w-md mx-auto leading-relaxed">
          This system matching leverages the Gemini AI educational visual model to map skin, nail, or visible Joint patterns. Result prints should be evaluated with clinically certified professionals.
        </p>
        <p className="mt-4 font-mono text-[9px] text-zinc-400">© 2026 Google AI Studio Build system. Secure TLS sandboxed sandbox.</p>
      </footer>

    </div>
  );
}
