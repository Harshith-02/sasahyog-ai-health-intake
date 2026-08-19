import OpenAI, { toFile } from 'openai';
import { config } from '../config/env.js';

let groqClient = null;
let openaiClient = null;

const HALLUCINATED_PHRASES = [
  'thank you', 'thank you.', 'thank you!', 'thank you very much',
  'you', 'you.', 'subtitles by', 'amara.org', 'by amara.org',
  '.', '..', '...', 'speech', 'silence', 'audio', 'bye', 'bye.'
];

function getSTTClient() {
  if (config.groqApiKey) {
    if (!groqClient) {
      groqClient = new OpenAI({
        apiKey: config.groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    }
    return { client: groqClient, model: 'whisper-large-v3-turbo', provider: 'Groq' };
  }

  if (config.openaiApiKey) {
    if (!openaiClient) {
      openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
    }
    return { client: openaiClient, model: 'whisper-1', provider: 'OpenAI' };
  }

  throw new Error('No API key found for STT. Please set GROQ_API_KEY or OPENAI_API_KEY in server/.env');
}

function cleanTranscript(text) {
  if (!text) return '';
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Check if output matches known Whisper hallucination on silent/short audio
  if (HALLUCINATED_PHRASES.includes(lower)) {
    console.log(`[STT Service] Filtered out Whisper hallucination phrase: "${trimmed}"`);
    return '';
  }
  return trimmed;
}

/**
 * Converts audio buffer/base64 to text using Groq Whisper or OpenAI Whisper API.
 * @param {Buffer|string} audioData - Base64 audio string or Buffer
 * @param {string} mimeType - e.g., 'audio/webm' or 'audio/wav'
 * @param {string} language - 'en' or 'hi'
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioData, mimeType = 'audio/webm', language = 'en') {
  const { client, model, provider } = getSTTClient();

  let buffer;
  if (typeof audioData === 'string') {
    const base64Clean = audioData.replace(/^data:audio\/\w+;base64,/, '');
    buffer = Buffer.from(base64Clean, 'base64');
  } else {
    buffer = audioData;
  }

  if (!buffer || buffer.length < 500) {
    console.warn('[STT Service] Audio buffer too small (<500 bytes), skipping STT call.');
    return '';
  }

  let ext = 'webm';
  if (mimeType.includes('wav')) ext = 'wav';
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3';
  if (mimeType.includes('ogg')) ext = 'ogg';
  if (mimeType.includes('m4a') || mimeType.includes('mp4')) ext = 'm4a';

  console.log(`[STT Service] Sending ${buffer.length} bytes (${mimeType}) to ${provider} Whisper (${model})...`);

  const initialPrompt = language === 'hi'
    ? 'मरीज़ स्वास्थ्य संबंधी जानकारी, अपना नाम, लक्षण या बीमारी बता रहा है।'
    : 'Sasahyog AI Health Intake patient conversation. Patient stating their name, symptoms, duration, or health concern.';

  try {
    const fileObj = await toFile(buffer, `input_audio.${ext}`, { type: mimeType });
    const response = await client.audio.transcriptions.create({
      file: fileObj,
      model: model,
      language: language === 'hi' ? 'hi' : 'en',
      prompt: initialPrompt,
      temperature: 0.0,
    });

    const rawTranscript = response.text ? response.text.trim() : '';
    const transcript = cleanTranscript(rawTranscript);

    console.log(`[STT Service (${provider})] Transcribed: "${rawTranscript}" => Cleaned: "${transcript}"`);
    return transcript;
  } catch (error) {
    console.error(`[STT Service Error (${provider})]:`, error.message || error);
    if (provider === 'Groq' && config.openaiApiKey) {
      console.log('[STT Service] Retrying STT with OpenAI Whisper fallback...');
      const fallbackClient = new OpenAI({ apiKey: config.openaiApiKey });
      const fileObj = await toFile(buffer, `input_audio.${ext}`, { type: mimeType });
      const fbResponse = await fallbackClient.audio.transcriptions.create({
        file: fileObj,
        model: 'whisper-1',
        language: language === 'hi' ? 'hi' : 'en',
        prompt: initialPrompt,
        temperature: 0.0,
      });
      return cleanTranscript(fbResponse.text || '');
    }
    throw new Error(`Speech recognition failed: ${error.message || 'Unknown error'}`);
  }
}
