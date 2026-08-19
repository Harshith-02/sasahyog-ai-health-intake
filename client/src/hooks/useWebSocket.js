import { useState, useEffect, useRef, useCallback } from 'react';
import { audioPlayer } from '../services/audioPlayer';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('IDLE');
  const [sessionId, setSessionId] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');

  const socketRef = useRef(null);
  const ttsTimeoutRef = useRef(null);

  // Initialize AudioPlayer callbacks
  useEffect(() => {
    audioPlayer.setCallbacks({
      onStart: () => setStatus('SPEAKING'),
      onEnd: () => setStatus('IDLE')
    });
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('CONNECTING');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Auto-detect local vs deployed remote WebSocket endpoint
    let wsUrl;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      wsUrl = `ws://localhost:3001`;
    } else if (import.meta.env.VITE_WS_URL) {
      wsUrl = import.meta.env.VITE_WS_URL;
    } else {
      // Connect Vercel deployment to live cloud server endpoint
      wsUrl = `wss://ef36b1449a56e707-183-83-239-52.serveousercontent.com`;
    }

    console.log(`[useWebSocket] Connecting to ${wsUrl}...`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[useWebSocket] Connected to WebSocket server');
      setIsConnected(true);
      setStatus('IDLE');
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const { event: evt, data } = JSON.parse(event.data);

        switch (evt) {
          case 'CALL_STARTED':
            setSessionId(data.sessionId);
            setLanguage(data.language);
            setReport(null);
            setTranscripts([]);
            if (data.audioPayload?.audioBase64) {
              audioPlayer.play(data.audioPayload.audioBase64, data.audioPayload.mimeType);
            } else if (data.initialMessage) {
              audioPlayer.speakText(data.initialMessage, data.language);
            }
            break;

          case 'STATUS':
            if (!audioPlayer.isPlaying || data.status === 'GENERATING_REPORT' || data.status === 'COMPLETED') {
              setStatus(data.status);
            }
            break;

          case 'TRANSCRIPT_UPDATE':
            setTranscripts((prev) => [...prev, data]);
            break;

          case 'AGENT_TEXT':
            if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
            ttsTimeoutRef.current = setTimeout(() => {
              if (!audioPlayer.isPlaying && data.text) {
                audioPlayer.speakText(data.text, language);
              }
            }, 600);
            break;

          case 'AGENT_AUDIO':
            if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
            if (data.audioBase64) {
              audioPlayer.play(data.audioBase64, data.mimeType || 'audio/mp3');
            }
            break;

          case 'REPORT_GENERATED':
            console.log('[useWebSocket] Report received:', data.report);
            setReport(data.report);
            break;

          case 'CALL_ENDED':
            setSessionId(null);
            audioPlayer.stop();
            break;

          case 'ERROR':
            console.error('[useWebSocket] Server Error:', data.message);
            setError(data.message);
            setStatus('ERROR');
            break;

          default:
            console.log('[useWebSocket] Event:', evt, data);
        }
      } catch (err) {
        console.error('[useWebSocket] Message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[useWebSocket] Disconnected');
      setIsConnected(false);
      setStatus('IDLE');
    };

    ws.onerror = (err) => {
      console.error('[useWebSocket] Connection Error:', err);
      setError('Failed to connect to AI server. Please make sure the backend is running.');
      setIsConnected(false);
      setStatus('ERROR');
    };
  }, [language]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendEvent = useCallback((event, data = {}) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ event, data }));
    } else {
      console.warn('[useWebSocket] Cannot send message, socket not connected.');
      setError('Connection lost. Reconnecting...');
      connect();
    }
  }, [connect]);

  const startCall = useCallback((lang = 'en') => {
    setError(null);
    setReport(null);
    setTranscripts([]);
    setLanguage(lang);
    sendEvent('START_CALL', { language: lang });
  }, [sendEvent]);

  const startAudioTurn = useCallback((mimeType = 'audio/webm') => {
    sendEvent('AUDIO_START', { mimeType });
  }, [sendEvent]);

  const sendAudioChunk = useCallback((base64Chunk) => {
    sendEvent('AUDIO_CHUNK', { audio: base64Chunk });
  }, [sendEvent]);

  const endAudioTurn = useCallback(() => {
    sendEvent('AUDIO_END');
  }, [sendEvent]);

  const endCall = useCallback(() => {
    sendEvent('END_CALL');
  }, [sendEvent]);

  return {
    isConnected,
    status,
    sessionId,
    transcripts,
    report,
    error,
    language,
    startCall,
    startAudioTurn,
    sendAudioChunk,
    endAudioTurn,
    endCall,
    clearError: () => setError(null),
  };
}
