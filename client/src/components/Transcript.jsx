import React, { useEffect, useRef } from 'react';
import { User, Bot, Sparkles } from 'lucide-react';

export function Transcript({ transcripts, status }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, status]);

  return (
    <div className="w-full flex-1 min-h-[300px] max-h-[460px] overflow-y-auto p-4 rounded-2xl glass-panel flex flex-col gap-3.5 shadow-inner">
      {transcripts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <div className="p-3 rounded-full bg-slate-900 border border-slate-800 mb-3">
            <Sparkles className="w-6 h-6 text-teal-400/60" />
          </div>
          <p className="text-sm font-medium text-slate-400">Live Voice Transcript</p>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Start a call and hold the "Speak" button to converse with the AI Health Intake Assistant.
          </p>
        </div>
      ) : (
        <>
          {transcripts.map((item, idx) => {
            const isUser = item.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[10px] font-semibold text-slate-400">
                    <span>{isUser ? 'You' : 'Sasahyog AI'}</span>
                    <span>•</span>
                    <span>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                  <p>{item.text}</p>
                </div>
              </div>
            );
          })}

          {status === 'PROCESSING' && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center text-xs text-teal-400 animate-pulse bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <Bot className="w-4 h-4 animate-spin text-teal-400" />
              <span>AI is thinking & processing your audio...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}
