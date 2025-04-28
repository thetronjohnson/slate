/**
 * Utility functions for formatting markdown text to HTML for TipTap editor
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns The escaped string
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Processes inline markdown formatting and converts it to HTML
 * @param text - The text containing markdown formatting
 * @returns The text with markdown converted to HTML
 */
export function processInlineFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold with **
    .replace(/__(.*?)__/g, '<strong>$1</strong>')     // Bold with __
    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Italic with *
    .replace(/_(.*?)_/g, '<em>$1</em>')               // Italic with _
    .replace(/`([^`]+)`/g, '<code>$1</code>')         // Inline code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') // Links
    .replace(/~~(.*?)~~/g, '<s>$1</s>');              // Strikethrough
}

/**
 * Processes a markdown numbered list section and converts it to HTML
 * @param content - The content containing a numbered list
 * @returns An array of HTML list items
 */
export function processNumberedList(content: string): string[] {
  const lines = content.split('\n');
  const items: string[] = [];
  let currentItem: number | null = null;
  let nestedContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const numberedMatch = line.match(/^(\s*)(\d+)\.(\s+)(.+)/);
    
    if (numberedMatch) {
      // Process any accumulated nested content for the previous item
      if (currentItem !== null && nestedContent.length > 0) {
        const nestedHtml = processNestedContent(nestedContent.join('\n'));
        items[items.length - 1] = items[items.length - 1].replace('</li>', nestedHtml + '</li>');
        nestedContent = [];
      }
      
      // Start a new numbered item
      const [, , , , text] = numberedMatch;
      const processedText = processInlineFormatting(text);
      
      items.push(`<li>${processedText}</li>`);
      currentItem = items.length - 1;
    } else if (line.trim() !== '') {
      // This is nested content under the current numbered item
      nestedContent.push(line);
    }
  }
  
  // Process any remaining nested content
  if (nestedContent.length > 0 && items.length > 0) {
    const nestedHtml = processNestedContent(nestedContent.join('\n'));
    items[items.length - 1] = items[items.length - 1].replace('</li>', nestedHtml + '</li>');
  }
  
  return items;
}

/**
 * Processes nested content under a list item and converts it to HTML
 * @param content - The nested content to process
 * @returns HTML representation of the nested content
 */
export function processNestedContent(content: string): string {
  if (!content || content.trim() === '') return '';
  
  // Check if this is a checklist (contains [ ] or [x])
  const hasTaskItems = content.match(/^(\s*[-•*]\s+\[[ x]\])/m);
  
  const lines = content.split('\n');
  let structure: { 
    indent: number; 
    html: string; 
    isTask: boolean;
    text: string;
    parent: number | null;
    children: number[];
    level: number;
  }[] = [];
  
  // First pass: parse all lines and their indentation levels
  lines.forEach(line => {
    // Task list item
    const taskMatch = line.match(/^(\s*)([-•*])\s+\[([ x])\]\s*(.+)/);
    if (taskMatch) {
      const [, indent, , checked, text] = taskMatch;
      structure.push({
        indent: indent.length,
        html: `<li data-type="taskItem" data-checked="${checked === 'x'}">${processInlineFormatting(text)}</li>`,
        isTask: true,
        text,
        parent: null,
        children: [],
        level: 0
      });
      return;
    }
    
    // Regular bullet point
    const bulletMatch = line.match(/^(\s*)([-•*])\s+(.+)/);
    if (bulletMatch) {
      const [, indent, , text] = bulletMatch;
      structure.push({
        indent: indent.length,
        html: `<li>${processInlineFormatting(text)}</li>`,
        isTask: false,
        text,
        parent: null,
        children: [],
        level: 0
      });
      return;
    }
    
    // Non-list content (treat as continuation of previous item)
    if (line.trim() && structure.length > 0) {
      const lastItem = structure[structure.length - 1];
      // Remove the closing </li> tag, add the content, then add the closing tag back
      lastItem.html = lastItem.html.replace(/<\/li>$/, ` ${processInlineFormatting(line.trim())}</li>`);
      lastItem.text += ` ${line.trim()}`;
    }
  });
  
  // If no valid list items were found, treat as a paragraph
  if (structure.length === 0) {
    return `<p>${processInlineFormatting(content)}</p>`;
  }
  
  // Build parent-child relationships based on indentation
  for (let i = 0; i < structure.length; i++) {
    const currentItem = structure[i];
    
    // Find the parent of the current item (the closest preceding item with less indentation)
    for (let j = i - 1; j >= 0; j--) {
      if (structure[j].indent < currentItem.indent) {
        currentItem.parent = j;
        structure[j].children.push(i);
        break;
      }
    }
  }
  
  // Determine the level of each item (depth in the tree)
  for (let i = 0; i < structure.length; i++) {
    let level = 0;
    let parentIdx = structure[i].parent;
    
    while (parentIdx !== null) {
      level++;
      parentIdx = structure[parentIdx].parent;
    }
    
    structure[i].level = level;
  }
  
  // Build the HTML structure recursively
  function buildHtml(items: typeof structure, rootItems: number[]): string {
    let result = '';
    
    for (const idx of rootItems) {
      const item = items[idx];
      result += item.html.replace(/<\/li>$/, '');
      
      if (item.children.length > 0) {
        // Determine if the child list should be a task list
        const childrenAreTasks = item.children.some(childIdx => items[childIdx].isTask);
        const listType = childrenAreTasks ? ' data-type="taskList"' : '';
        
        // Add nested list
        result += `<ul${listType}>${buildHtml(items, item.children)}</ul>`;
      }
      
      result += '</li>';
    }
    
    return result;
  }
  
  // Get root level items (those with no parent)
  const rootItems = structure
    .map((item, idx) => item.parent === null ? idx : -1)
    .filter(idx => idx !== -1);
  
  // Determine if the root list should be a task list
  const rootListType = hasTaskItems ? ' data-type="taskList"' : '';
  
  // Build the final HTML
  return `<ul${rootListType}>${buildHtml(structure, rootItems)}</ul>`;
}

/**
 * Processes text content including task lists, bullet points, and paragraphs
 * @param content - The content to process
 * @returns HTML representation of the content
 */
export function processTextContent(content: string): string {
  if (!content || content.trim() === '') return '';
  
  // Handle task lists and bullet points
  if (content.match(/^(\s*[-•*]\s+\[[ x]\]|\s*[-•*]\s+)/m)) {
    return processNestedContent(content);
  }
  
  // Regular paragraph
  return `<p>${processInlineFormatting(content)}</p>`;
}

/**
* Formats text into TipTap HTML format
* @param text - The markdown text to format
* @returns Formatted HTML string
*/
export function formatTipTapHtml(text: string): string {
 // Clean up excessive line breaks and whitespace
 text = text
   .replace(/\n{3,}/g, '\n\n')
   .replace(/[ \t]+\n/g, '\n')  
   .trim();

 // Split into sections by double newlines
 const sections = text.split(/\n\n+/)
   .map(section => section.trim())
   .filter(Boolean);
 
 let result: string[] = [];
 let inNumberedList = false;
 let numberedListItems: string[] = [];
 
 for (let i = 0; i < sections.length; i++) {
   const section = sections[i];
   
   // Handle code blocks
   if (section.startsWith('```')) {
     // If we were in a numbered list, close it before adding the code block
     if (inNumberedList) {
       result.push(`<ol>${numberedListItems.join('')}</ol>`);
       numberedListItems = [];
       inNumberedList = false;
     }
     
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
     // If we were in a numbered list, close it before adding the blockquote
     if (inNumberedList) {
       result.push(`<ol>${numberedListItems.join('')}</ol>`);
       numberedListItems = [];
       inNumberedList = false;
     }
     
     const content = section.split('\n')
       .map(line => line.replace(/^>\s*/, '').trim())
       .filter(line => line)
       .map(line => `<p>${processInlineFormatting(line)}</p>`)
       .join('');
     result.push(`<blockquote>${content}</blockquote>`);
     continue;
   }
   
   // Handle horizontal rules
   if (section === '---' || section === '***' || section === '___') {
     // If we were in a numbered list, close it before adding the horizontal rule
     if (inNumberedList) {
       result.push(`<ol>${numberedListItems.join('')}</ol>`);
       numberedListItems = [];
       inNumberedList = false;
     }
     
     result.push('<hr>');
     continue;
   }
   
   // Check if this section is a heading
   if (section.startsWith('#')) {
     // If we were in a numbered list, close it before adding the heading
     if (inNumberedList) {
       result.push(`<ol>${numberedListItems.join('')}</ol>`);
       numberedListItems = [];
       inNumberedList = false;
     }

     const lines = section.split('\n');
     const headingLine = lines[0];
     const headingMatch = headingLine.match(/^#+/);
     
     if (headingMatch) {
       const level = headingMatch[0].length;
       const headingText = headingLine.replace(/^#+\s*/, '');
       
       result.push(`<h${level}>${processInlineFormatting(headingText)}</h${level}>`);
       
       // If there's content after the heading, process it separately
       if (lines.length > 1) {
         const remainingContent = lines.slice(1).join('\n').trim();
         if (remainingContent) {
           // Check if the remaining content is a numbered list
           if (remainingContent.match(/^\s*\d+\.\s+/m)) {
             const listItems = processNumberedList(remainingContent);
             numberedListItems = [...numberedListItems, ...listItems];
             inNumberedList = true;
           } 
           // Check if the remaining content contains bullet points or task items
           else if (remainingContent.match(/^(\s*[-•*]\s+\[[ x]\]|\s*[-•*]\s+)/m)) {
             result.push(processNestedContent(remainingContent));
           }
           else {
             // Process as regular content
             result.push(processTextContent(remainingContent));
           }
         }
       }
     }
     
     continue;
   }
   
   // Check if this section is a numbered list
   if (section.match(/^\s*\d+\.\s+/m)) {
     const listItems = processNumberedList(section);
     numberedListItems = [...numberedListItems, ...listItems];
     inNumberedList = true;
     continue;
   }
   
   // If we were in a numbered list, close it before adding non-list content
   if (inNumberedList) {
     result.push(`<ol>${numberedListItems.join('')}</ol>`);
     numberedListItems = [];
     inNumberedList = false;
   }
   
   // Process regular content
   result.push(processTextContent(section));
 }
 
 // If we ended while still in a numbered list, close it
 if (inNumberedList) {
   result.push(`<ol>${numberedListItems.join('')}</ol>`);
 }
 
 return result.join('\n');
}