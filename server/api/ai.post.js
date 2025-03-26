import OpenAI from 'openai';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  
  // Debug log to see what's available
  
  const { prompt, content } = await readBody(event);
  
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
          content: "You are a helpful writing assistant. Modify the selected text according to the user's prompt. Return only the modified content, preserving any HTML formatting. Keep your response focused only on the selected text."
        },
        {
          role: "user",
          content: `Selected text: ${content}\n\nPrompt: ${prompt}\n\nModify only the selected text according to the prompt and return the updated content.`
        }
      ],
    });

    return {
      content: completion.choices[0].message.content
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to process AI request'
    });
  }
}); 