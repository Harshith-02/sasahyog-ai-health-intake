import React from 'react';
import { Phone, PhoneOff, Mic, Square, Volume2, Loader2 } from 'lucide-react';

export function CallControls({
  status,
  isCallActive,
  isRecording,
  recordingDuration = 0,
  onStartCall,
  onEndCall,
  onToggleRecord,
  disabled
}) {
  const isBusy = status === 'PROCESSING' || status === 'SPEAKING' || status === 'GENERATING_REPORT';

  // Format elapsed seconds as M:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {!isCallActive ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onStartCall}
          className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-base rounded-2xl shadow-lg shadow-teal-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Phone className="w-5 h-5" />
          <span>Start Voice Health Screening</span>
        </button>
      ) : (
        <div className="flex items-center gap-4 w-full justify-center">
          {/* Main User-Friendly Microphone Toggle Button */}
          <button
            type="button"
            disabled={isBusy}
            onClick={onToggleRecord}
            className={`relative flex-1 max-w-sm flex items-center justify-center gap-3 px-6 py-4 font-bold text-sm rounded-2xl border transition-all duration-300 shadow-xl cursor-pointer ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 border-rose-400 text-white shadow-rose-500/30 scale-105 animate-pulse'
                : isBusy
                ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-400 border-teal-400 text-slate-950 shadow-teal-500/20 hover:scale-[1.02]'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5 fill-current text-white animate-bounce" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-extrabold">Stop & Send ({formatDuration(recordingDuration)})</span>
                  <span className="text-[10px] text-rose-100 font-normal">Click when finished speaking</span>
                </div>
              </>
            ) : status === 'SPEAKING' ? (
              <>
                <Volume2 className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span>AI Speaking...</span>
              </>
            ) : status === 'PROCESSING' ? (
              <>
                <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                <span>AI Processing Speech...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 text-slate-950" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-extrabold text-slate-950">Click to Speak</span>
                  <span className="text-[10px] text-slate-800 font-medium">Tap button to start recording</span>
                </div>
              </>
            )}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={onEndCall}
            className="flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 font-semibold text-sm rounded-2xl transition-all duration-200 cursor-pointer shadow-lg"
            title="End call and generate intake report"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      )}
    </div>
  );
}
