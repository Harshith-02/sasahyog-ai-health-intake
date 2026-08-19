import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { CallScreen } from './components/CallScreen';
import { HealthReport } from './components/HealthReport';
import { Stethoscope, Heart } from 'lucide-react';

export function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const {
    isConnected,
    status,
    sessionId,
    transcripts,
    report,
    error,
    startCall,
    startAudioTurn,
    sendAudioChunk,
    endAudioTurn,
    endCall,
    clearError
  } = useWebSocket();

  const handleStartCall = (lang) => {
    setSelectedLanguage(lang);
    startCall(lang);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* App Header Bar */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/30">
            <Stethoscope className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Sasahyog <span className="text-teal-400">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-semibold text-slate-400">
            {isConnected ? 'Server Connected' : 'Server Connecting...'}
          </span>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex items-center justify-center w-full my-4">
        {report ? (
          <HealthReport
            report={report}
            onResetCall={() => handleStartCall(selectedLanguage)}
          />
        ) : (
          <CallScreen
            status={status}
            sessionId={sessionId}
            transcripts={transcripts}
            error={error}
            language={selectedLanguage}
            setLanguage={setSelectedLanguage}
            startCall={handleStartCall}
            startAudioTurn={startAudioTurn}
            sendAudioChunk={sendAudioChunk}
            endAudioTurn={endAudioTurn}
            endCall={endCall}
            clearError={clearError}
          />
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="w-full max-w-4xl mx-auto text-center pt-6 border-t border-slate-900 text-xs text-slate-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5 text-slate-400">
          <span>Built for Sasahyog Technologies Technical Assessment</span>
          <span>•</span>
          <Heart className="w-3 h-3 text-teal-400 inline" />
        </p>
        <p className="text-[11px] text-slate-600">
          Sasahyog AI Health Intake is a preliminary health information gathering tool and does not provide medical diagnoses or treatment plans.
        </p>
      </footer>
    </div>
  );
}

export default App;
