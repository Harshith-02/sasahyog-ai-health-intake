/**
 * Audio Player Service managing queued playback of AI voice responses.
 * Features built-in browser Web Speech API (window.speechSynthesis) fallback
 * if server-side TTS fails (e.g. OpenAI API quota exceeded).
 */

class AudioPlayer {
  constructor() {
    this.queue = [];
    this.isPlaying = false;
    this.currentAudio = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
  }

  setCallbacks({ onStart, onEnd }) {
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;
  }

  /**
   * Enqueue a base64 audio payload and start playback if idle.
   * @param {string} base64Data 
   * @param {string} mimeType 
   */
  play(base64Data, mimeType = 'audio/mp3') {
    if (!base64Data) return;

    const dataUri = base64Data.startsWith('data:')
      ? base64Data
      : `data:${mimeType};base64,${base64Data}`;

    this.queue.push({ type: 'audio', src: dataUri });

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Speak plain text via Web Speech API fallback when audio payload is absent.
   * @param {string} text 
   * @param {string} language 
   */
  speakText(text, language = 'en') {
    if (!text || !('speechSynthesis' in window)) return;

    this.queue.push({ type: 'speech', text, language });

    if (!this.isPlaying) {
      this.playNext();
    }
  }

  playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.currentAudio = null;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
      return;
    }

    this.isPlaying = true;
    if (this.onStartCallback) {
      this.onStartCallback();
    }

    const item = this.queue.shift();

    if (item.type === 'speech') {
      // Browser SpeechSynthesis fallback
      window.speechSynthesis.cancel(); // stop previous speech
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = item.language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 1.0;

      utterance.onend = () => {
        this.playNext();
      };
      utterance.onerror = (e) => {
        console.warn('[AudioPlayer] Web Speech API error:', e);
        this.playNext();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Audio element playback
      this.currentAudio = new Audio(item.src);

      this.currentAudio.onended = () => {
        this.playNext();
      };

      this.currentAudio.onerror = (e) => {
        console.warn('[AudioPlayer] Playback error encountered, skipping to next:', e);
        this.playNext();
      };

      this.currentAudio.play().catch((err) => {
        console.warn('[AudioPlayer] Auto-play error:', err);
        this.playNext();
      });
    }
  }

  stop() {
    this.queue = [];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    if (this.onEndCallback) {
      this.onEndCallback();
    }
  }
}

export const audioPlayer = new AudioPlayer();
