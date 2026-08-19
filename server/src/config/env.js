import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from server root or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 3001,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  groqApiKey: process.env.GROQ_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
};

export function validateEnv() {
  console.log('--- Checking Sasahyog AI Health Server Environment ---');
  let valid = true;

  if (config.groqApiKey) {
    console.log('\x1b[32m%s\x1b[0m', '[OK] Groq API key detected (Groq Llama-3.3 & Whisper-large-v3 enabled).');
  }
  if (config.openaiApiKey) {
    console.log('\x1b[32m%s\x1b[0m', '[OK] OpenAI API key detected.');
  }
  if (config.deepgramApiKey) {
    console.log('\x1b[32m%s\x1b[0m', '[OK] Deepgram API key detected.');
  }

  if (!config.groqApiKey && !config.openaiApiKey && !config.deepgramApiKey) {
    console.warn('\x1b[33m%s\x1b[0m', '[WARNING] No API keys detected in server/.env!');
    valid = false;
  }

  console.log(`[INFO] Server running on port: ${config.port}`);
  console.log('----------------------------------------------------');
  return valid;
}
