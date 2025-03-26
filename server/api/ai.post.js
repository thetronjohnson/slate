import { serverSupabaseServiceRole } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';
import OpenAI from 'openai';
import { useRuntimeConfig } from '#imports';

// Format text as TipTap HTML
function formatTipTapHtml(text) {
  // Helper to escape HTML special characters
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Helper to process inline formatting
  const processInlineFormatting = (text) => {
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Strike
      .replace(/~~(.*?)~~/g, '<s>$1</s>');
  };

  // Clean up excessive line breaks and whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive line breaks with 2
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace
    .trim();

  // Split into paragraphs
  const paragraphs = text.split('\n\n')
    .map(p => p.trim())
    .filter(Boolean);
  
  return paragraphs.map(p => {
    p = p.trim();
    
    // Handle code blocks
    if (p.startsWith('```')) {
      const lines = p.split('\n');
      const language = lines[0].replace('```', '').trim();
      const code = lines.slice(1, -1)
        .map(line => line.trim())
        .join('\n')
        .trim();
      return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
    }

    // Handle blockquotes
    if (p.startsWith('>')) {
      const content = p.split('\n')
        .map(line => line.replace(/^>\s*/, '').trim())
        .filter(line => line)
        .map(line => `<p>${processInlineFormatting(line)}</p>`)
        .join('');
      return `<blockquote>${content}</blockquote>`;
    }

    // Handle task lists
    if (p.match(/^(\s*- \[[ x]\])/m)) {
      const items = p.split('\n')
        .map(item => {
          const match = item.match(/^(\s*)- \[([ x])\]\s*(.+)/);
          if (!match) return null;
          const [, indent, checked, text] = match;
          return `<li data-type="taskItem" data-checked="${checked === 'x'}">${processInlineFormatting(text)}</li>`;
        })
        .filter(item => item);
      return `<ul data-type="taskList">${items.join('')}</ul>`;
    }
    
    // Handle bullet points
    if (p.startsWith('•') || p.startsWith('-') || p.startsWith('*')) {
      const items = p.split('\n')
        .map(item => item.replace(/^[•\-*]\s*/, '').trim())
        .filter(item => item);
      
      return `<ul>${items.map(item => 
        `<li><p>${processInlineFormatting(item)}</p></li>`
      ).join('')}</ul>`;
    }
    
    // Handle numbered lists
    if (/^\d+\./.test(p)) {
      const items = p.split('\n')
        .map(item => item.replace(/^\d+\.\s*/, '').trim())
        .filter(item => item);
      
      return `<ol>${items.map(item => 
        `<li><p>${processInlineFormatting(item)}</p></li>`
      ).join('')}</ol>`;
    }
    
    // Handle headings
    if (p.startsWith('#')) {
      const level = p.match(/^#+/)[0].length;
      const text = p.replace(/^#+\s*/, '');
      if (level <= 3) {
        return `<h${level}>${processInlineFormatting(text)}</h${level}>`;
      }
    }
    
    // Handle horizontal rule
    if (p === '---' || p === '***' || p === '___') {
      return '<hr>';
    }
    
    // Regular paragraphs
    return `<p>${processInlineFormatting(p)}</p>`;
  }).join('\n');
}

// System prompts for different scenarios
const SYSTEM_PROMPTS = {
  grammar: "You are a professional editor. Fix grammar and improve clarity while maintaining the original meaning. Format your response with proper paragraphs.",
  linkedin: "You are a LinkedIn content expert. Make the text more professional and engaging for a LinkedIn audience. Use proper paragraphs and formatting.",
  bullets: "Convert the text into well-organized bullet points. Start each bullet point with '•' on a new line.",
  checklist: "Create a comprehensive checklist. Start each item with '•' on a new line and organize items logically.",
  plan: "Create a detailed plan. Use '# ' for main headings, '## ' for subheadings, and '•' for bullet points.",
  survey: "Create a well-structured survey. Use '## ' for sections and numbered items (1., 2., etc.) for questions."
};

// Get the appropriate system prompt
function getSystemPrompt(prompt) {
  const promptLower = prompt.toLowerCase();
  if (promptLower.includes('grammar')) return SYSTEM_PROMPTS.grammar;
  if (promptLower.includes('linkedin')) return SYSTEM_PROMPTS.linkedin;
  if (promptLower.includes('bullet')) return SYSTEM_PROMPTS.bullets;
  if (promptLower.includes('checklist')) return SYSTEM_PROMPTS.checklist;
  if (promptLower.includes('plan')) return SYSTEM_PROMPTS.plan;
  if (promptLower.includes('survey')) return SYSTEM_PROMPTS.survey;
  return "You are a helpful writing assistant. Format your response in proper markdown with appropriate headings, lists, and emphasis where needed.";
}

export default defineEventHandler(async (event) => {
  // Check if user is authenticated
  const user = await serverSupabaseUser(event);
  if (!user) {
    return {
      success: false,
      requiresAuth: true,
      message: 'Authentication required to use AI features'
    };
  }

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
          content: getSystemPrompt(prompt)
        },
        {
          role: "user",
          content: `Content: ${content}\n\nPrompt: ${prompt}\n\nModify the content according to the prompt. Use proper formatting:\n- Start headings with '#', '##', or '###'\n- Start bullet points with '•'\n- Start numbered items with '1.', '2.', etc.\n- Use blank lines between paragraphs`
        }
      ],
    });

    // Format the response as TipTap HTML
    const formattedResponse = formatTipTapHtml(completion.choices[0].message.content);

    return {
      content: formattedResponse
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to process AI request'
    });
  }
}); 