import { v4 as uuidv4 } from 'uuid';

/**
 * In-Memory Session Manager for tracking active voice call state.
 */

const STAGES = [
  'GREETING',
  'NAME',
  'CHIEF_COMPLAINT',
  'DURATION',
  'SEVERITY',
  'ASSOCIATED_SYMPTOMS',
  'FOLLOW_UP',
  'COMPLETED'
];

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(language = 'en', customId = null) {
    const sessionId = customId || uuidv4();
    const session = {
      sessionId,
      language: language === 'hi' ? 'hi' : 'en',
      currentStage: 'GREETING',
      collectedData: {
        patientName: null,
        chiefComplaint: null,
        duration: null,
        severity: null,
        associatedSymptoms: [],
        followUp: null
      },
      transcriptHistory: [],
      isProcessing: false,
      callStartedAt: new Date().toISOString(),
      callEndedAt: null
    };

    this.sessions.set(sessionId, session);
    console.log(`[SessionManager] Created new session ${sessionId} (${session.language})`);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  updateCollectedData(sessionId, extracted = {}) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    if (extracted.patientName && !session.collectedData.patientName) {
      session.collectedData.patientName = extracted.patientName;
    }
    if (extracted.chiefComplaint && !session.collectedData.chiefComplaint) {
      session.collectedData.chiefComplaint = extracted.chiefComplaint;
    }
    if (extracted.duration && !session.collectedData.duration) {
      session.collectedData.duration = extracted.duration;
    }
    if (extracted.severity && !session.collectedData.severity) {
      session.collectedData.severity = extracted.severity;
    }
    if (Array.isArray(extracted.associatedSymptoms) && extracted.associatedSymptoms.length > 0) {
      const currentSymptoms = new Set(session.collectedData.associatedSymptoms);
      extracted.associatedSymptoms.forEach(s => currentSymptoms.add(s));
      session.collectedData.associatedSymptoms = Array.from(currentSymptoms);
    }
    if (extracted.followUp && !session.collectedData.followUp) {
      session.collectedData.followUp = extracted.followUp;
    }

    // Determine logical next stage based on missing information
    session.currentStage = this.determineNextStage(session.collectedData);

    return session;
  }

  determineNextStage(data) {
    if (!data.patientName) return 'NAME';
    if (!data.chiefComplaint) return 'CHIEF_COMPLAINT';
    if (!data.duration) return 'DURATION';
    if (!data.severity) return 'SEVERITY';
    if (!data.associatedSymptoms || data.associatedSymptoms.length === 0) return 'ASSOCIATED_SYMPTOMS';
    if (!data.followUp) return 'FOLLOW_UP';
    return 'COMPLETED';
  }

  addTranscriptMessage(sessionId, role, text) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const message = {
      role, // 'user' | 'assistant' | 'system'
      text,
      timestamp: new Date().toISOString()
    };

    session.transcriptHistory.push(message);
    return message;
  }

  setProcessing(sessionId, isProcessing) {
    const session = this.getSession(sessionId);
    if (session) {
      session.isProcessing = isProcessing;
    }
  }

  endSession(sessionId) {
    const session = this.getSession(sessionId);
    if (session) {
      session.callEndedAt = new Date().toISOString();
      session.currentStage = 'COMPLETED';
    }
    return session;
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
    console.log(`[SessionManager] Deleted session ${sessionId}`);
  }
}

export const sessionManager = new SessionManager();
