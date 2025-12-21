import TurndownService from 'turndown';

// HTML → Markdown converter
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Add custom rule for task lists
turndownService.addRule('taskList', {
  filter: (node: any) => {
    return node.getAttribute && node.getAttribute('data-type') === 'taskItem';
  },
  replacement: (content: string, node: any) => {
    const checked = node.getAttribute('data-checked') === 'true';
    return `- [${checked ? 'x' : ' '}] ${content}\n`;
  }
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

// Markdown → HTML converter - from Slate's formatTipTapHtml
// This is a production-quality parser

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function processInlineFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>');
}

function processNumberedList(content: string): string[] {
  const lines = content.split('\n');
  const items: string[] = [];
  let currentItem: number | null = null;
  let nestedContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const numberedMatch = line.match(/^(\s*)(\d+)\.(\s+)(.+)/);

    if (numberedMatch) {
      if (currentItem !== null && nestedContent.length > 0) {
        const nestedHtml = processNestedContent(nestedContent.join('\n'));
        items[items.length - 1] = items[items.length - 1].replace('</li>', nestedHtml + '</li>');
        nestedContent = [];
      }

      const [, , , , text] = numberedMatch;
      const processedText = processInlineFormatting(text);

      items.push(`<li>${processedText}</li>`);
      currentItem = items.length - 1;
    } else if (line.trim() !== '') {
      nestedContent.push(line);
    }
  }

  if (nestedContent.length > 0 && items.length > 0) {
    const nestedHtml = processNestedContent(nestedContent.join('\n'));
    items[items.length - 1] = items[items.length - 1].replace('</li>', nestedHtml + '</li>');
  }

  return items;
}

function processNestedContent(content: string): string {
  if (!content || content.trim() === '') return '';

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

  lines.forEach(line => {
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

    if (line.trim() && structure.length > 0) {
      const lastItem = structure[structure.length - 1];
      lastItem.html = lastItem.html.replace(/<\/li>$/, ` ${processInlineFormatting(line.trim())}</li>`);
      lastItem.text += ` ${line.trim()}`;
    }
  });

  if (structure.length === 0) {
    return `<p>${processInlineFormatting(content)}</p>`;
  }

  for (let i = 0; i < structure.length; i++) {
    const currentItem = structure[i];
    for (let j = i - 1; j >= 0; j--) {
      if (structure[j].indent < currentItem.indent) {
        currentItem.parent = j;
        structure[j].children.push(i);
        break;
      }
    }
  }

  for (let i = 0; i < structure.length; i++) {
    let level = 0;
    let parentIdx = structure[i].parent;
    while (parentIdx !== null) {
      level++;
      parentIdx = structure[parentIdx].parent;
    }
    structure[i].level = level;
  }

  function buildHtml(items: typeof structure, rootItems: number[]): string {
    let result = '';
    for (const idx of rootItems) {
      const item = items[idx];
      result += item.html.replace(/<\/li>$/, '');

      if (item.children.length > 0) {
        const childrenAreTasks = item.children.some(childIdx => items[childIdx].isTask);
        const listType = childrenAreTasks ? ' data-type="taskList"' : '';
        result += `<ul${listType}>${buildHtml(items, item.children)}</ul>`;
      }
      result += '</li>';
    }
    return result;
  }

  const rootItems = structure
    .map((item, idx) => item.parent === null ? idx : -1)
    .filter(idx => idx !== -1);

  const rootListType = hasTaskItems ? ' data-type="taskList"' : '';
  return `<ul${rootListType}>${buildHtml(structure, rootItems)}</ul>`;
}

function processTextContent(content: string): string {
  if (!content || content.trim() === '') return '';

  if (content.match(/^(\s*[-•*]\s+\[[ x]\]|\s*[-•*]\s+)/m)) {
    return processNestedContent(content);
  }

  return `<p>${processInlineFormatting(content)}</p>`;
}

export function markdownToHtml(text: string): string {
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();

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
      if (inNumberedList) {
        result.push(`<ol>${numberedListItems.join('')}</ol>`);
        numberedListItems = [];
        inNumberedList = false;
      }
      result.push('<hr>');
      continue;
    }

    // Handle headings
    if (section.startsWith('#')) {
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

        if (lines.length > 1) {
          const remainingContent = lines.slice(1).join('\n').trim();
          if (remainingContent) {
            if (remainingContent.match(/^\s*\d+\.\s+/m)) {
              const listItems = processNumberedList(remainingContent);
              numberedListItems = [...numberedListItems, ...listItems];
              inNumberedList = true;
            } else if (remainingContent.match(/^(\s*[-•*]\s+\[[ x]\]|\s*[-•*]\s+)/m)) {
              result.push(processNestedContent(remainingContent));
            } else {
              result.push(processTextContent(remainingContent));
            }
          }
        }
      }
      continue;
    }

    // Handle numbered lists
    if (section.match(/^\s*\d+\.\s+/m)) {
      const listItems = processNumberedList(section);
      numberedListItems = [...numberedListItems, ...listItems];
      inNumberedList = true;
      continue;
    }

    // Close numbered list if needed
    if (inNumberedList) {
      result.push(`<ol>${numberedListItems.join('')}</ol>`);
      numberedListItems = [];
      inNumberedList = false;
    }

    // Process regular content
    result.push(processTextContent(section));
  }

  // Close any remaining numbered list
  if (inNumberedList) {
    result.push(`<ol>${numberedListItems.join('')}</ol>`);
  }

  return result.join('\n');
}
