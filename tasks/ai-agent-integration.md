# Task 4: AI Agent Integration

**Timeline:** Week 2, Days 4-5 (1-2 days)
**Goal:** Send plans to AI agents and receive annotated feedback

## Overview

Integrate with AI agents to:
- Send markdown content for review
- Parse AI agent responses
- Insert annotations automatically
- Handle multiple agents
- Track annotation provenance

## Step 1: Design AI Agent Protocol (30 min)

### Request Format

```typescript
interface AgentReviewRequest {
  content: string;          // Markdown content
  context?: string;         // Additional context
  focusAreas?: string[];    // What to focus on
  agentId?: string;         // Specific agent to use
}
```

### Response Format

```typescript
interface AgentReviewResponse {
  agentId: string;
  timestamp: string;
  annotations: Array<{
    type: 'suggestion' | 'question' | 'issue' | 'note';
    content: string;
    location?: {
      line?: number;
      pattern?: string;    // Text to search for
    };
    priority?: 'low' | 'medium' | 'high';
    severity?: 'info' | 'warning' | 'critical';
  }>;
}
```

### Example Response

```json
{
  "agentId": "code-reviewer-gpt4",
  "timestamp": "2025-01-20T10:30:00Z",
  "annotations": [
    {
      "type": "suggestion",
      "content": "Consider adding error handling for the API call",
      "location": {
        "pattern": "fetch('/api/data')"
      },
      "priority": "high"
    },
    {
      "type": "question",
      "content": "Have you considered rate limiting?",
      "location": {
        "line": 15
      }
    },
    {
      "type": "issue",
      "content": "This will cause a memory leak with large datasets",
      "location": {
        "pattern": "const data = []"
      },
      "severity": "critical",
      "priority": "high"
    }
  ]
}
```

## Step 2: Create Agent Client (1.5 hours)

Create `src/ai/AgentClient.ts`:

```typescript
import * as vscode from 'vscode';

export interface AgentConfig {
  id: string;
  name: string;
  endpoint?: string;      // API endpoint
  apiKey?: string;        // API key
  model?: string;         // Model name
  systemPrompt?: string;  // Custom system prompt
}

export interface AgentReviewRequest {
  content: string;
  context?: string;
  focusAreas?: string[];
  agentId?: string;
}

export interface Annotation {
  type: 'suggestion' | 'question' | 'issue' | 'note';
  content: string;
  location?: {
    line?: number;
    pattern?: string;
  };
  priority?: 'low' | 'medium' | 'high';
  severity?: 'info' | 'warning' | 'critical';
}

export interface AgentReviewResponse {
  agentId: string;
  timestamp: string;
  annotations: Annotation[];
}

export class AgentClient {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Send content to agent for review
   */
  async review(request: AgentReviewRequest): Promise<AgentReviewResponse> {
    const endpoint = this.config.endpoint || this.getDefaultEndpoint();
    const apiKey = this.config.apiKey || await this.getApiKey();

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    try {
      // Construct prompt
      const prompt = this.buildPrompt(request);

      // Call AI API (example using OpenAI-compatible endpoint)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.config.systemPrompt || this.getDefaultSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Agent API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from agent');
      }

      // Parse annotations from response
      const annotations = this.parseAnnotations(content);

      return {
        agentId: this.config.id,
        timestamp: new Date().toISOString(),
        annotations
      };
    } catch (error) {
      vscode.window.showErrorMessage(`Agent review failed: ${error}`);
      throw error;
    }
  }

  private buildPrompt(request: AgentReviewRequest): string {
    let prompt = `Please review the following markdown content and provide feedback as structured annotations.\n\n`;

    if (request.context) {
      prompt += `Context: ${request.context}\n\n`;
    }

    if (request.focusAreas && request.focusAreas.length > 0) {
      prompt += `Focus on: ${request.focusAreas.join(', ')}\n\n`;
    }

    prompt += `Content:\n\`\`\`markdown\n${request.content}\n\`\`\`\n\n`;

    prompt += `Provide feedback as JSON with this structure:
{
  "annotations": [
    {
      "type": "suggestion|question|issue|note",
      "content": "Your feedback here",
      "location": {
        "pattern": "text to find in document"
      },
      "priority": "low|medium|high",
      "severity": "info|warning|critical"
    }
  ]
}`;

    return prompt;
  }

  private parseAnnotations(content: string): Annotation[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const json = JSON.parse(jsonMatch[0]);
      return json.annotations || [];
    } catch (error) {
      console.error('Failed to parse annotations:', error);
      return [];
    }
  }

  private getDefaultEndpoint(): string {
    // Default to OpenAI API
    return 'https://api.openai.com/v1/chat/completions';
  }

  private async getApiKey(): Promise<string | undefined> {
    // Try to get from VSCode settings
    const config = vscode.workspace.getConfiguration('markdownAnnotator');
    let apiKey = config.get<string>('ai.apiKey');

    if (!apiKey) {
      // Prompt user for API key
      apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your AI API key',
        password: true,
        placeHolder: 'sk-...'
      });

      if (apiKey) {
        // Save to settings
        await config.update('ai.apiKey', apiKey, vscode.ConfigurationTarget.Global);
      }
    }

    return apiKey;
  }

  private getDefaultSystemPrompt(): string {
    return `You are a helpful code and documentation reviewer.
Your job is to review markdown documents and provide constructive feedback.
Focus on clarity, completeness, technical accuracy, and potential issues.
Provide specific, actionable feedback in the requested JSON format.`;
  }
}
```

## Step 3: Create Review Command (1 hour)

Create `src/commands/sendToAgent.ts`:

```typescript
import * as vscode from 'vscode';
import { AgentClient, AgentConfig } from '../ai/AgentClient';

export async function sendToAgentCommand(
  document: vscode.TextDocument,
  webviewPanel: vscode.WebviewPanel
) {
  // Get configuration
  const config = vscode.workspace.getConfiguration('markdownAnnotator');
  const agentConfigs = config.get<AgentConfig[]>('ai.agents') || [];

  // Select agent
  const agentId = await vscode.window.showQuickPick(
    agentConfigs.map(a => ({
      label: a.name,
      description: a.id,
      id: a.id
    })),
    {
      placeHolder: 'Select AI agent for review'
    }
  );

  if (!agentId) return;

  const agentConfig = agentConfigs.find(a => a.id === agentId.id);
  if (!agentConfig) return;

  // Get focus areas (optional)
  const focusInput = await vscode.window.showInputBox({
    prompt: 'What should the agent focus on? (optional)',
    placeHolder: 'e.g., security, performance, clarity'
  });

  const focusAreas = focusInput
    ? focusInput.split(',').map(s => s.trim())
    : undefined;

  // Show progress
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Sending to AI agent...',
      cancellable: false
    },
    async progress => {
      try {
        progress.report({ message: 'Analyzing content...' });

        const client = new AgentClient(agentConfig);
        const response = await client.review({
          content: document.getText(),
          focusAreas
        });

        progress.report({ message: 'Inserting annotations...' });

        // Send annotations to webview
        webviewPanel.webview.postMessage({
          type: 'insertAnnotations',
          annotations: response.annotations,
          agentId: response.agentId,
          timestamp: response.timestamp
        });

        vscode.window.showInformationMessage(
          `Received ${response.annotations.length} annotations from ${agentConfig.name}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Agent review failed: ${error}`);
      }
    }
  );
}
```

## Step 4: Handle Annotation Insertion in Webview (1 hour)

Update `webview/Editor.vue`:

```typescript
function handleMessage(event: MessageEvent) {
  const message = event.data;

  switch (message.type) {
    case 'insertAnnotations':
      insertAnnotationsFromAgent(
        message.annotations,
        message.agentId,
        message.timestamp
      );
      break;
    // ... other cases
  }
}

function insertAnnotationsFromAgent(
  annotations: any[],
  agentId: string,
  timestamp: string
) {
  if (!editor.value) return;

  let insertedCount = 0;

  annotations.forEach(annotation => {
    // Generate unique ID
    const id = `ann-${Date.now()}-${insertedCount}`;

    // Find insertion position
    let position = findInsertionPosition(annotation.location);

    if (position === null) {
      // If location not found, append at end
      position = editor.value!.state.doc.content.size;
    }

    // Insert annotation
    editor.value!.chain()
      .focus()
      .insertContentAt(position, {
        type: 'agentAnnotation',
        attrs: {
          type: annotation.type,
          status: 'pending',
          id,
          priority: annotation.priority,
          severity: annotation.severity,
          agent: agentId,
          timestamp
        },
        content: [
          {
            type: 'text',
            text: annotation.content
          }
        ]
      })
      .run();

    insertedCount++;
  });

  props.vscode.postMessage({
    type: 'log',
    message: `Inserted ${insertedCount} annotations from ${agentId}`
  });
}

function findInsertionPosition(location?: {
  line?: number;
  pattern?: string;
}): number | null {
  if (!editor.value || !location) return null;

  // Find by pattern
  if (location.pattern) {
    const doc = editor.value.state.doc;
    const text = doc.textContent;
    const index = text.indexOf(location.pattern);

    if (index >= 0) {
      // Convert text index to doc position
      let pos = 0;
      let currentIndex = 0;

      doc.descendants((node, nodePos) => {
        if (currentIndex <= index && currentIndex + node.textContent.length > index) {
          pos = nodePos + (index - currentIndex);
          return false;
        }
        currentIndex += node.textContent.length;
      });

      return pos;
    }
  }

  // Find by line number
  if (location.line) {
    const doc = editor.value.state.doc;
    let currentLine = 1;
    let pos = 0;

    doc.descendants((node, nodePos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        if (currentLine === location.line) {
          pos = nodePos;
          return false;
        }
        currentLine++;
      }
    });

    return pos;
  }

  return null;
}
```

## Step 5: Add Settings for Agent Configuration (30 min)

Update `package.json` contributes:

```json
{
  "contributes": {
    "configuration": {
      "title": "Markdown Annotator",
      "properties": {
        "markdownAnnotator.ai.apiKey": {
          "type": "string",
          "default": "",
          "description": "API key for AI agent service",
          "order": 1
        },
        "markdownAnnotator.ai.agents": {
          "type": "array",
          "default": [
            {
              "id": "gpt4-reviewer",
              "name": "GPT-4 Code Reviewer",
              "model": "gpt-4",
              "endpoint": "https://api.openai.com/v1/chat/completions"
            }
          ],
          "description": "Configured AI agents for code review",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "description": "Unique agent identifier"
              },
              "name": {
                "type": "string",
                "description": "Display name"
              },
              "endpoint": {
                "type": "string",
                "description": "API endpoint URL"
              },
              "model": {
                "type": "string",
                "description": "Model name"
              },
              "systemPrompt": {
                "type": "string",
                "description": "Custom system prompt"
              }
            },
            "required": ["id", "name"]
          },
          "order": 2
        },
        "markdownAnnotator.ai.autoReview": {
          "type": "boolean",
          "default": false,
          "description": "Automatically send to agent on save",
          "order": 3
        }
      }
    }
  }
}
```

## Step 6: Add Local Agent Option (Advanced) (1 hour)

For users who want to run agents locally or use custom endpoints:

Create `src/ai/LocalAgentClient.ts`:

```typescript
import { AgentClient, AgentReviewRequest, AgentReviewResponse } from './AgentClient';
import * as vscode from 'vscode';

/**
 * Client for local or custom agent implementations
 */
export class LocalAgentClient extends AgentClient {
  async review(request: AgentReviewRequest): Promise<AgentReviewResponse> {
    // Check if custom command is configured
    const config = vscode.workspace.getConfiguration('markdownAnnotator');
    const customCommand = config.get<string>('ai.localCommand');

    if (customCommand) {
      return this.runLocalCommand(customCommand, request);
    }

    // Fall back to API-based review
    return super.review(request);
  }

  private async runLocalCommand(
    command: string,
    request: AgentReviewRequest
  ): Promise<AgentReviewResponse> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      // Create temp file with content
      const tmpFile = `/tmp/markdown-review-${Date.now()}.md`;
      const fs = await import('fs/promises');
      await fs.writeFile(tmpFile, request.content);

      // Execute command
      const { stdout } = await execAsync(`${command} ${tmpFile}`);

      // Parse output as JSON
      const response = JSON.parse(stdout);

      // Clean up
      await fs.unlink(tmpFile);

      return {
        agentId: this.config.id,
        timestamp: new Date().toISOString(),
        annotations: response.annotations || []
      };
    } catch (error) {
      throw new Error(`Local agent execution failed: ${error}`);
    }
  }
}
```

## Step 7: Testing (1 hour)

### Test Cases

1. **Basic Review**
   - Send simple markdown to agent
   - Verify annotations are inserted
   - Check annotation attributes

2. **Location Matching**
   - Test pattern-based location
   - Test line-based location
   - Test fallback to end of document

3. **Multiple Agents**
   - Configure multiple agents
   - Send to different agents
   - Verify agent ID is tracked

4. **Error Handling**
   - Test with invalid API key
   - Test with network error
   - Test with malformed response

5. **Settings**
   - Configure custom endpoint
   - Configure custom system prompt
   - Test API key storage

### Testing Checklist

- ✅ Can send content to agent
- ✅ Annotations are inserted correctly
- ✅ Location matching works (pattern & line)
- ✅ Agent ID is tracked in annotations
- ✅ Multiple agents supported
- ✅ Error messages are helpful
- ✅ API key stored securely
- ✅ Progress indicator shows
- ✅ Settings UI works

## Deliverables

✅ AgentClient for API integration
✅ Send to agent command
✅ Annotation insertion from agent response
✅ Location matching (pattern & line)
✅ Settings for agent configuration
✅ Progress indicators
✅ Error handling
✅ Optional local agent support

## Example Agent Implementations

### Python Script Example

```python
#!/usr/bin/env python3
import sys
import json

def review_markdown(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Simple example: check for TODOs
    annotations = []

    for i, line in enumerate(content.split('\n'), 1):
        if 'TODO' in line:
            annotations.append({
                'type': 'issue',
                'content': 'Unresolved TODO found',
                'location': {'line': i},
                'priority': 'medium'
            })

    return {'annotations': annotations}

if __name__ == '__main__':
    result = review_markdown(sys.argv[1])
    print(json.dumps(result))
```

### Node.js Script Example

```javascript
#!/usr/bin/env node
const fs = require('fs');

function reviewMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const annotations = [];

  // Check for long paragraphs
  const paragraphs = content.split('\n\n');
  paragraphs.forEach(para => {
    if (para.split(' ').length > 100) {
      annotations.push({
        type: 'suggestion',
        content: 'Consider breaking this paragraph into smaller chunks',
        location: { pattern: para.substring(0, 50) },
        priority: 'low'
      });
    }
  });

  return { annotations };
}

const result = reviewMarkdown(process.argv[2]);
console.log(JSON.stringify(result));
```

## Next Task

**[polish-and-testing.md](./polish-and-testing.md)** - Final polish, comprehensive testing, and documentation

---

**Estimated Time:** 1-2 days
**Difficulty:** Medium-Hard
**Dependencies:** Task 2 (Annotation Extension), Task 3 (Annotation UI)
