import OpenAI from 'openai';
import { config } from '../config/env.js';

let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is missing. Please set OPENAI_API_KEY in server/.env');
    }
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openaiClient;
}

/**
 * Synthesizes text to speech using OpenAI TTS.
 * @param {string} text - Text to convert to speech
 * @param {string} language - 'en' or 'hi'
 * @returns {Promise<{ audioBase64: string, mimeType: string }|null>} Base64 audio payload
 */
export async function synthesizeSpeech(text, language = 'en') {
  if (!text || text.trim().length === 0) return null;

  try {
    const client = getOpenAIClient();
    console.log(`[TTS Service] Synthesizing speech (${language}): "${text.slice(0, 40)}..."`);

    // Voice selection: alloy for English, shimmer for Hindi (warm & clear)
    const voice = language === 'hi' ? 'shimmer' : 'alloy';

    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const audioBase64 = buffer.toString('base64');

    console.log(`[TTS Service] Generated ${buffer.length} bytes of MP3 audio.`);
    return {
      audioBase64,
      mimeType: 'audio/mp3'
    };
  } catch (error) {
    console.error('[TTS Service Warning]: Synthesis failed, fallback to text display:', error.message || error);
    return null; // Non-fatal: text remains displayed on screen
  }
}
