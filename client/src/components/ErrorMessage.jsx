import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ErrorMessage({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start justify-between gap-3 animate-fadeIn backdrop-blur-md">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-rose-300">Notice: </span>
          <span>{message}</span>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-200 p-0.5 rounded-lg hover:bg-rose-500/20 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
