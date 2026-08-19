import { sessionManager } from '../state/sessionManager.js';
import { transcribeAudio } from '../services/sttService.js';
import { generateIntakeResponse } from '../services/llmService.js';
import { synthesizeSpeech } from '../services/ttsService.js';
import { generateHealthReport } from '../services/reportService.js';

/**
 * Attaches WebSocket event handlers to a client connection.
 * @param {WebSocket} ws 
 */
export function handleWebSocketConnection(ws) {
  let activeSessionId = null;
  let audioChunks = [];
  let currentMimeType = 'audio/webm';

  console.log('[WebSocket] Client connected.');

  // Helper helper to send JSON messages
  const send = (event, data = {}) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  };

  // Helper to send status updates
  const sendStatus = (status) => {
    send('STATUS', { status });
  };

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      const { event, data } = parsed;

      switch (event) {
        case 'START_CALL': {
          const language = data?.language || 'en';
          const session = sessionManager.createSession(language);
          activeSessionId = session.sessionId;

          console.log(`[WebSocket] Call started for session ${activeSessionId} (${language})`);

          const initialGreeting = language === 'hi'
            ? 'नमस्ते! मैं आपका स्वास्थ्य सहायक हूँ। क्या मैं आपका नाम जान सकता हूँ?'
            : "Hello! I am your health screening assistant. May I please know your name?";

          sessionManager.addTranscriptMessage(activeSessionId, 'assistant', initialGreeting);

          // Synthesize initial greeting speech
          const ttsResult = await synthesizeSpeech(initialGreeting, language);

          send('CALL_STARTED', {
            sessionId: activeSessionId,
            language: session.language,
            initialMessage: initialGreeting,
            audioPayload: ttsResult
          });

          send('TRANSCRIPT_UPDATE', {
            role: 'assistant',
            text: initialGreeting,
            timestamp: new Date().toISOString()
          });

          if (ttsResult) {
            send('AGENT_AUDIO', ttsResult);
            sendStatus('SPEAKING');
          } else {
            sendStatus('IDLE');
          }
          break;
        }

        case 'AUDIO_START': {
          if (!activeSessionId) {
            send('ERROR', { message: 'No active session found. Please start call first.' });
            return;
          }
          currentMimeType = data?.mimeType || 'audio/webm';
          audioChunks = [];
          sendStatus('LISTENING');
          break;
        }

        case 'AUDIO_CHUNK': {
          if (data?.audio) {
            audioChunks.push(data.audio);
          }
          break;
        }

        case 'AUDIO_END': {
          if (!activeSessionId) return;

          sendStatus('PROCESSING');

          if (audioChunks.length === 0) {
            send('ERROR', { message: 'No audio data received' });
            sendStatus('IDLE');
            return;
          }

          const combinedBase64 = audioChunks.join('');
          audioChunks = []; // Clear buffer

          const session = sessionManager.getSession(activeSessionId);
          if (!session) {
            send('ERROR', { message: 'Session lost.' });
            return;
          }

          let userTranscript = '';
          try {
            userTranscript = await transcribeAudio(combinedBase64, currentMimeType, session.language);
          } catch (sttErr) {
            console.error('[WebSocket] STT Error:', sttErr.message);
            const fallbackMsg = session.language === 'hi'
              ? 'माफ़ कीजिए, मुझे आपकी आवाज़ साफ़ सुनाई नहीं दी। क्या आप दोहरा सकते हैं?'
              : "Sorry, I didn't catch that clearly. Could you please repeat?";

            send('TRANSCRIPT_UPDATE', { role: 'assistant', text: fallbackMsg, timestamp: new Date().toISOString() });
            const fallbackAudio = await synthesizeSpeech(fallbackMsg, session.language);
            if (fallbackAudio) send('AGENT_AUDIO', fallbackAudio);
            sendStatus('IDLE');
            return;
          }

          if (!userTranscript || userTranscript.trim().length === 0) {
            const emptyMsg = session.language === 'hi'
              ? 'मुझे कोई आवाज़ नहीं मिली। कृपया दोबारा बोलने के लिए "Speak" दबाएं।'
              : "I couldn't hear any speech. Please press 'Speak' and try again.";

            send('TRANSCRIPT_UPDATE', { role: 'assistant', text: emptyMsg, timestamp: new Date().toISOString() });
            const emptyAudio = await synthesizeSpeech(emptyMsg, session.language);
            if (emptyAudio) send('AGENT_AUDIO', emptyAudio);
            sendStatus('IDLE');
            return;
          }

          // 1. Send user transcript to UI
          send('TRANSCRIPT_UPDATE', {
            role: 'user',
            text: userTranscript,
            timestamp: new Date().toISOString()
          });
          sessionManager.addTranscriptMessage(activeSessionId, 'user', userTranscript);

          // 2. Query LLM for structured intake response
          let llmResponse;
          try {
            llmResponse = await generateIntakeResponse(session);
          } catch (llmErr) {
            console.error('[WebSocket] LLM Error:', llmErr.message);
            send('ERROR', { message: 'AI processing issue. Please try speaking again.' });
            sendStatus('IDLE');
            return;
          }

          // 3. Update session state with extracted entities
          sessionManager.updateCollectedData(activeSessionId, llmResponse.extracted);
          sessionManager.addTranscriptMessage(activeSessionId, 'assistant', llmResponse.response);

          // 4. Send Agent Text
          send('AGENT_TEXT', {
            text: llmResponse.response,
            stage: session.currentStage,
            extracted: session.collectedData,
            isComplete: llmResponse.isComplete
          });

          send('TRANSCRIPT_UPDATE', {
            role: 'assistant',
            text: llmResponse.response,
            timestamp: new Date().toISOString()
          });

          // 5. Synthesize speech and send Audio Payload
          const audioResult = await synthesizeSpeech(llmResponse.response, session.language);
          if (audioResult) {
            send('AGENT_AUDIO', audioResult);
            sendStatus('SPEAKING');
          } else {
            sendStatus('IDLE');
          }

          break;
        }

        case 'END_CALL': {
          if (!activeSessionId) {
            send('ERROR', { message: 'No call in progress.' });
            return;
          }

          console.log(`[WebSocket] End Call received for session ${activeSessionId}`);
          sendStatus('GENERATING_REPORT');

          const session = sessionManager.endSession(activeSessionId);
          const report = await generateHealthReport(session);

          send('REPORT_GENERATED', { report });
          sendStatus('COMPLETED');
          send('CALL_ENDED', { sessionId: activeSessionId });

          activeSessionId = null;
          break;
        }

        default:
          console.warn(`[WebSocket] Unknown event received: ${event}`);
      }
    } catch (error) {
      console.error('[WebSocket Processing Error]:', error);
      send('ERROR', { message: 'Server communication error: ' + error.message });
      sendStatus('ERROR');
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Client disconnected. Session: ${activeSessionId || 'none'}`);
    if (activeSessionId) {
      sessionManager.deleteSession(activeSessionId);
    }
  });

  ws.on('error', (err) => {
    console.error('[WebSocket Socket Error]:', err.message);
  });
}
