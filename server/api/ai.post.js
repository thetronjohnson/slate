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

  // Process a section with a heading and content
  const processSection = (section) => {
    const lines = section.split('\n');
    let result = [];
    let currentHeading = null;
    let currentContent = [];
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a heading
      if (line.startsWith('#')) {
        // If we have accumulated content under a previous heading, process it
        if (currentHeading !== null && currentContent.length > 0) {
          result.push(currentHeading);
          result.push(processContent(currentContent.join('\n')));
          currentContent = [];
        }
        
        // Process the new heading
        const level = line.match(/^#+/)[0].length;
        const headingText = line.replace(/^#+\s*/, '');
        currentHeading = `<h${level}>${processInlineFormatting(headingText)}</h${level}>`;
      } else if (line.trim() !== '') {
        // Add non-empty lines to current content
        currentContent.push(line);
      }
    }
    
    // Process any remaining content
    if (currentHeading !== null && currentContent.length > 0) {
      result.push(currentHeading);
      result.push(processContent(currentContent.join('\n')));
    } else if (currentHeading !== null) {
      result.push(currentHeading);
    } else if (currentContent.length > 0) {
      result.push(processContent(currentContent.join('\n')));
    }
    
    return result.join('\n');
  };
  
  // Process content blocks (lists, paragraphs, etc.)
  const processContent = (content) => {
    if (!content || content.trim() === '') return '';
    
    // Handle task lists and bullet points
    if (content.match(/^(\s*[-•*]\s+\[[ x]\]|\s*[-•*]\s+)/m)) {
      const lines = content.split('\n');
      
      // Check if this is a checklist (contains [ ] or [x])
      const isTaskList = lines.some(line => line.match(/^\s*[-•*]\s+\[[ x]\]/));
      
      const items = lines.map(line => {
        // Task list item
        const taskMatch = line.match(/^(\s*)([-•*])\s+\[([ x])\]\s*(.+)/);
        if (taskMatch) {
          const [, indent, bullet, checked, text] = taskMatch;
          return `<li data-type="taskItem" data-checked="${checked === 'x'}">${processInlineFormatting(text)}</li>`;
        }
        
        // Regular bullet point
        const bulletMatch = line.match(/^(\s*)([-•*])\s+(.+)/);
        if (bulletMatch) {
          const [, indent, bullet, text] = bulletMatch;
          return `<li>${processInlineFormatting(text)}</li>`;
        }
        
        return null;
      }).filter(Boolean);
      
      if (isTaskList) {
        return `<ul data-type="taskList">${items.join('')}</ul>`;
      } else {
        return `<ul>${items.join('')}</ul>`;
      }
    }
    
    // Handle numbered lists
    if (content.match(/^\s*\d+\.\s+/m)) {
      const items = content.split('\n')
        .map(line => {
          const match = line.match(/^(\s*)\d+\.\s+(.+)/);
          if (match) {
            const [, indent, text] = match;
            return `<li>${processInlineFormatting(text)}</li>`;
          }
          return null;
        })
        .filter(Boolean);
      
      return `<ol>${items.join('')}</ol>`;
    }
    
    // Regular paragraph
    return `<p>${processInlineFormatting(content)}</p>`;
  };

  // Clean up excessive line breaks and whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive line breaks with 2
    .replace(/[ \t]+\n/g, '\n')  // Remove trailing whitespace
    .trim();

  // Split into sections by double newlines
  const sections = text.split(/\n\n+/)
    .map(section => section.trim())
    .filter(Boolean);
  
  let result = [];
  
  for (const section of sections) {
    // Handle code blocks
    if (section.startsWith('```')) {
      const lines = section.split('\n');
      const language = lines[0].replace('```', '').trim();
      const code = lines.slice(1, -1)
        .map(line => line.trim())
        .join('\n')
        .trim();
      result.push(`<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`);
      continue;
    }

    // Handle blockquotes
    if (section.startsWith('>')) {
      const content = section.split('\n')
        .map(line => line.replace(/^>\s*/, '').trim())
        .filter(line => line)
        .map(line => `<p>${processInlineFormatting(line)}</p>`)
        .join('');
      result.push(`<blockquote>${content}</blockquote>`);
      continue;
    }
    
    // Handle horizontal rule
    if (section === '---' || section === '***' || section === '___') {
      result.push('<hr>');
      continue;
    }
    
    // Check if the section contains headings
    if (section.match(/^#+\s+/m)) {
      result.push(processSection(section));
    } else {
      // Process as regular content
      result.push(processContent(section));
    }
  }
  
  return result.join('\n');
}

// System prompts for different scenarios
const SYSTEM_PROMPTS = {
  grammar: "You are a professional editor. Fix grammar and improve clarity while maintaining the original meaning. Format your response with proper paragraphs.",
  linkedin: "You are a LinkedIn content expert. Make the text more professional and engaging for a LinkedIn audience. Use proper paragraphs and formatting.",
  bullets: "Convert the text into well-organized bullet points. Start each bullet point with '•' on a new line.",
  checklist: "Create a comprehensive checklist. Start each item with a checkbox on a new line and organize items logically.",
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
          content: `Content: ${content}\n\nPrompt: ${prompt}\n\nModify the content according to the prompt. Use proper formatting 
          as per markdown, where applicable, for headings, bullets, numbering and even checkboxes and blockquotes`
        }
      ],
    });

    console.log("Completion output:", completion.choices[0].message.content,"\n");

    // Format the response as TipTap HTML
    const formattedResponse = formatTipTapHtml(completion.choices[0].message.content);
    console.log(formattedResponse);

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