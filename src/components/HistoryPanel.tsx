import React from "react";
import { HistoryItem } from "../types";
import { Calendar, Trash2, ChevronRight, Activity, AlertCircle } from "lucide-react";

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelectItem,
  onRemoveItem,
  onClearHistory,
  className = "",
}) => {
  // Helpers to color map
  const getUrgencyBadge = (level: "Green" | "Yellow" | "Red") => {
    switch (level) {
      case "Red":
        return { bg: "bg-red-100 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", label: "Urgent" };
      case "Yellow":
        return { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", label: "Consult" };
      default:
        return { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-700 dark:text-green-400", label: "Monitor" };
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className={`p-6 bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-100 rounded-xl pixel-shadow text-[#222] dark:text-zinc-100 ${className}`}>
      <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-4 mb-4">
        <h3 className="flex items-center gap-2 font-pixel text-lg font-bold tracking-tight text-[#5A67FF] dark:text-brand-secondary">
          <Activity className="w-5 h-5 animate-pulse text-[#39C07F]" />
          ANALYSIS SCAN LOGGER
        </h3>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs font-mono font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
          <AlertCircle className="w-10 h-10 mx-auto mb-2 text-zinc-400 dark:text-zinc-600 animate-pulse" />
          <p className="font-pixel text-sm text-zinc-500 dark:text-zinc-400">LOG TOKENS EMPTY</p>
          <p className="font-sans text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-[250px] mx-auto">
            Analysis session logs will appear here upon completion of diagnostic scans.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {history.map((item) => {
            const urgency = getUrgencyBadge(item.result.urgency_level);
            return (
              <div
                key={item.id}
                className="group relative flex items-center justify-between p-3 border-2 border-zinc-900 dark:border-zinc-700 hover:border-[#5A67FF] hover:dark:border-[#8B9DFF] rounded-lg bg-zinc-50 dark:bg-zinc-800/50 transition-all shadow-sm hover:-translate-y-0.5"
              >
                {/* Thumbnail and content */}
                <button
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="flex items-center gap-3 text-left flex-1"
                >
                  <img
                    src={item.image}
                    alt={item.result.possible_condition}
                    className="w-12 h-12 rounded object-cover border border-zinc-300 dark:border-zinc-600 pixelated bg-zinc-200"
                  />
                  <div>
                    <h4 className="font-sans text-sm font-bold line-clamp-1 text-zinc-800 dark:text-zinc-100">
                      {item.result.possible_condition}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.timestamp)}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] uppercase font-mono ${urgency.bg} ${urgency.text}`}>
                        {urgency.label}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Controls */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    aria-label="Delete logged scan"
                    className="p-1 px-2 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onSelectItem(item)}
                    aria-label="View report"
                    className="p-1 text-zinc-400 group-hover:text-[#5A67FF] group-hover:translate-x-0.5 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
