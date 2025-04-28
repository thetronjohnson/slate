import { serverSupabaseUser } from '#supabase/server';
import OpenAI from 'openai';
import { useRuntimeConfig, defineEventHandler, readBody, createError } from '#imports';
import { formatTipTapHtml } from '@/server/utils/formats';


// Define type for system prompts
interface SystemPrompts {
  grammar: string;
  linkedin: string;
  bullets: string;
  checklist: string;
  plan: string;
  survey: string;
  numbered: string;
  [key: string]: string; // Index signature for other potential prompts
}

// System prompts for different scenarios
const SYSTEM_PROMPTS: SystemPrompts = {
  grammar: "You are a professional editor. Fix grammar and improve clarity while maintaining the original meaning. Format your response with proper paragraphs.",
  linkedin: "You are a LinkedIn content expert. Make the text more professional and engaging for a LinkedIn audience. Use proper paragraphs and formatting.",
  bullets: "Convert the text into well-organized bullet points. Start each bullet point with '•' on a new line.",
  checklist: "Create a comprehensive checklist. Start each item with a checkbox on a new line and organize items logically.",
  plan: "Create a detailed plan. Use '# ' for main headings, '## ' for subheadings, and '•' for bullet points.",
  survey: "Create a well-structured survey. Use '## ' for sections and numbered items (1., 2., etc.) for questions.",
  numbered: "Convert the text into well-organized numbered items."
};

/**
 * Gets the appropriate system prompt based on the user's request
 * @param prompt - The user's prompt
 * @returns The system prompt to use
 */
function getSystemPrompt(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  if (promptLower.includes('grammar')) return SYSTEM_PROMPTS.grammar;
  if (promptLower.includes('linkedin')) return SYSTEM_PROMPTS.linkedin;
  if (promptLower.includes('bullet')) return SYSTEM_PROMPTS.bullets;
  if (promptLower.includes('numbered')) return SYSTEM_PROMPTS.numbered;
  if (promptLower.includes('checklist')) return SYSTEM_PROMPTS.checklist;
  if (promptLower.includes('plan')) return SYSTEM_PROMPTS.plan;
  if (promptLower.includes('survey')) return SYSTEM_PROMPTS.survey;
  return "You are a helpful writing assistant. Format your response in proper markdown with appropriate headings, lists, and emphasis where needed.";
}

// Define types for request and response
interface AiRequest {
  prompt: string;
  content: string;
}

interface AiResponse {
  content?: string;
  success?: boolean;
  requiresAuth?: boolean;
  message?: string;
}

export default defineEventHandler(async (event) => {
  // Check if user is authenticated
  const user = await serverSupabaseUser(event);
  if (!user) {
    return {
      success: false,
      requiresAuth: true,
      message: 'Authentication required to use AI features'
    } as AiResponse;
  }

  const config = useRuntimeConfig();
  
  const { prompt, content } = await readBody<AiRequest>(event);
  
  try {
    const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('API Key not found in either config or env');
      throw createError({
        statusCode: 500,
        message: 'OpenAI API key is not configured'
      });
    }

    if (!content) {
      throw createError({
        statusCode: 400,
        message: 'No text selected'
      });
    }

    const openai = new OpenAI({
      apiKey: apiKey
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(prompt)
        },
        {
          role: "user",
          content: `Content: ${content}\n\nPrompt: ${prompt}\n\nModify the content according to the prompt. Use proper formatting 
          as per markdown, where applicable, for headings, bullets, numbering and even checkboxes and blockquotes`
        }
      ],
    });

    const formattedResponse = formatTipTapHtml(completion.choices[0].message.content || '');
    return {
      content: formattedResponse
    } as AiResponse;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to process AI request'
    });
  }
});
