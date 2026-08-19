import React from 'react';
import { Mic, Loader2, Volume2, CheckCircle2, AlertCircle, Phone } from 'lucide-react';

export function StatusIndicator({ status }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'CONNECTING':
        return {
          label: 'Connecting to AI Server...',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400 animate-ping',
          icon: <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        };
      case 'LISTENING':
        return {
          label: 'Listening... (Speak Now)',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-400 animate-pulse',
          icon: <Mic className="w-4 h-4 text-emerald-400 animate-bounce" />
        };
      case 'PROCESSING':
        return {
          label: 'AI is thinking & analyzing...',
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
          dot: 'bg-teal-400 animate-pulse',
          icon: <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
        };
      case 'SPEAKING':
        return {
          label: 'AI Assistant Speaking...',
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
          dot: 'bg-cyan-400 animate-ping',
          icon: <Volume2 className="w-4 h-4 text-cyan-400" />
        };
      case 'GENERATING_REPORT':
        return {
          label: 'Generating Health Intake Summary...',
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
          dot: 'bg-purple-400 animate-spin',
          icon: <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
        };
      case 'COMPLETED':
        return {
          label: 'Intake Completed',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        };
      case 'ERROR':
        return {
          label: 'Connection / Processing Issue',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />
        };
      case 'IDLE':
      default:
        return {
          label: 'Ready — Hold "Speak" to talk',
          bg: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
          dot: 'bg-teal-500',
          icon: <Phone className="w-3.5 h-3.5 text-teal-400" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all duration-300 ${config.bg}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot.split(' ')[0]}`} />
      </span>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
