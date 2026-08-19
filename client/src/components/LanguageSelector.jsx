import React from 'react';
import { Globe } from 'lucide-react';

export function LanguageSelector({ language, setLanguage, disabled }) {
  return (
    <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl p-1.5 backdrop-blur-md">
      <div className="flex items-center gap-1.5 px-2.5 text-xs font-medium text-slate-400">
        <Globe className="w-3.5 h-3.5 text-teal-400" />
        <span>Language:</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
            language === 'en'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          English
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setLanguage('hi')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
            language === 'hi'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          हिंदी (Hindi)
        </button>
      </div>
    </div>
  );
}
