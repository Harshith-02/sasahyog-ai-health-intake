import OpenAI from 'openai';
import { config } from '../config/env.js';
import { INTAKE_SYSTEM_PROMPT, buildIntakePrompt } from '../prompts/intakePrompt.js';

let groqClient = null;
let openaiClient = null;

const GROQ_MODELS = ['groq/compound-mini', 'groq/compound', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

function getOpenAIClient() {
  if (!openaiClient && config.openaiApiKey) {
    openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return openaiClient;
}

function getGroqClient() {
  if (!groqClient && config.groqApiKey) {
    groqClient = new OpenAI({
      apiKey: config.groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return groqClient;
}

/**
 * Sends conversation state to LLM and returns structured JSON intake response.
 * @param {Object} session - Active session object from sessionManager
 * @returns {Promise<Object>} Structured JSON LLM response
 */
export async function generateIntakeResponse(session) {
  const promptText = buildIntakePrompt(session);
  const groq = getGroqClient();

  // Try Groq models first if key exists
  if (groq) {
    for (const model of GROQ_MODELS) {
      try {
        console.log(`[LLM Service (Groq)] Trying model ${model} for stage: ${session.currentStage}`);
        const completion = await groq.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: INTAKE_SYSTEM_PROMPT },
            { role: 'user', content: promptText }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const rawContent = completion.choices[0]?.message?.content || '{}';
        console.log(`[LLM Service (Groq ${model}) Success]:`, rawContent);

        const parsed = JSON.parse(rawContent);
        return {
          response: parsed.response || (session.language === 'hi' ? 'जी, मैं समझ गया। कृपया आगे बताएं।' : 'Thank you. Please tell me more.'),
          extracted: parsed.extracted || {},
          nextStage: parsed.nextStage || session.currentStage,
          isComplete: Boolean(parsed.isComplete),
          urgencyFlagged: Boolean(parsed.urgencyFlagged)
        };
      } catch (err) {
        console.warn(`[LLM Service (Groq ${model}) Warning]:`, err.message);
        // Continue to next model
      }
    }
  }

  // OpenAI Fallback if Groq failed or not configured
  const oai = getOpenAIClient();
  if (oai) {
    console.log('[LLM Service (OpenAI)] Trying GPT-4o-mini...');
    const completion = await oai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: INTAKE_SYSTEM_PROMPT },
        { role: 'user', content: promptText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      response: parsed.response || 'Thank you. Please continue.',
      extracted: parsed.extracted || {},
      nextStage: parsed.nextStage || session.currentStage,
      isComplete: Boolean(parsed.isComplete),
      urgencyFlagged: Boolean(parsed.urgencyFlagged)
    };
  }

  throw new Error('All LLM providers failed or no valid API key was provided.');
}
