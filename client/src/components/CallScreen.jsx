import React from 'react';
import { StatusIndicator } from './StatusIndicator';
import { VoiceVisualizer } from './VoiceVisualizer';
import { CallControls } from './CallControls';
import { Transcript } from './Transcript';
import { LanguageSelector } from './LanguageSelector';
import { ErrorMessage } from './ErrorMessage';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { ShieldCheck, HeartPulse } from 'lucide-react';

export function CallScreen({
  status,
  sessionId,
  transcripts,
  error,
  language,
  setLanguage,
  startCall,
  startAudioTurn,
  sendAudioChunk,
  endAudioTurn,
  endCall,
  clearError
}) {
  const isCallActive = Boolean(sessionId);

  const { isRecording, recordingDuration, toggleRecording } = useAudioRecorder({
    onAudioStart: (mimeType) => {
      startAudioTurn(mimeType);
    },
    onAudioChunk: (base64Chunk) => {
      sendAudioChunk(base64Chunk);
    },
    onAudioEnd: () => {
      endAudioTurn();
    },
    onError: (errMessage) => {
      console.error('[CallScreen] Audio Recorder Error:', errMessage);
    }
  });

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="w-full glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400">
            <HeartPulse className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">Sasahyog AI Health Intake</h1>
              <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold tracking-wide uppercase border border-teal-500/30">
                Voice Assistant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Preliminary voice health-intake interview for patients
            </p>
          </div>
        </div>

        {/* Language Selector & Medical Safety Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
            disabled={isCallActive}
          />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Intake Only • Not a Diagnosis</span>
          </div>
        </div>
      </div>

      {/* Error Message Banner */}
      <ErrorMessage message={error} onDismiss={clearError} />

      {/* Main Call Interface Container */}
      <div className="w-full glass-panel rounded-3xl p-6 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
        {/* Status Indicator Badge */}
        <StatusIndicator status={status} />

        {/* Voice Visualizer Canvas */}
        <VoiceVisualizer status={status} />

        {/* Live Conversation Transcript */}
        <Transcript transcripts={transcripts} status={status} />

        {/* Call Action Controls */}
        <CallControls
          status={status}
          isCallActive={isCallActive}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          onStartCall={() => startCall(language)}
          onEndCall={endCall}
          onToggleRecord={toggleRecording}
          disabled={status === 'CONNECTING' || status === 'GENERATING_REPORT'}
        />
      </div>
    </div>
  );
}
