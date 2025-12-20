# Task 5: Polish & Testing

**Timeline:** Week 3 (5 days)
**Goal:** Final polish, comprehensive testing, documentation, and publishing

## Day 1: Theme & UI Polish (1 day)

### Step 1: Enhance Theme Integration (2 hours)

Create `webview/utils/theme.ts`:

```typescript
export interface ThemeColors {
  background: string;
  foreground: string;
  heading: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
}

export function getVSCodeTheme(): ThemeColors {
  const style = getComputedStyle(document.body);

  return {
    background: style.getPropertyValue('--vscode-editor-background'),
    foreground: style.getPropertyValue('--vscode-editor-foreground'),
    heading: style.getPropertyValue('--vscode-editorWidget-foreground'),
    border: style.getPropertyValue('--vscode-panel-border'),
    primary: style.getPropertyValue('--vscode-button-background'),
    success: style.getPropertyValue('--vscode-charts-green'),
    warning: style.getPropertyValue('--vscode-charts-yellow'),
    error: style.getPropertyValue('--vscode-charts-red')
  };
}

export function applyTheme(theme: ThemeColors) {
  document.documentElement.style.setProperty('--theme-bg', theme.background);
  document.documentElement.style.setProperty('--theme-fg', theme.foreground);
  document.documentElement.style.setProperty('--theme-heading', theme.heading);
  document.documentElement.style.setProperty('--theme-border', theme.border);
  document.documentElement.style.setProperty('--theme-primary', theme.primary);
  document.documentElement.style.setProperty('--theme-success', theme.success);
  document.documentElement.style.setProperty('--theme-warning', theme.warning);
  document.documentElement.style.setProperty('--theme-error', theme.error);
}
```

### Step 2: Add Loading States (1 hour)

Update components with skeleton loaders:

```vue
<template>
  <div v-if="loading" class="loading-skeleton">
    <div class="skeleton-line"></div>
    <div class="skeleton-line short"></div>
    <div class="skeleton-line"></div>
  </div>
  <div v-else>
    <!-- Actual content -->
  </div>
</template>

<style>
.skeleton-line {
  height: 1rem;
  background: linear-gradient(
    90deg,
    var(--vscode-editor-background) 0%,
    var(--vscode-editorWidget-background) 50%,
    var(--vscode-editor-background) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

### Step 3: Add Smooth Transitions (1 hour)

```css
/* Global transitions */
* {
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
```

### Step 4: Accessibility Improvements (2 hours)

- Add ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support

```vue
<button
  :aria-label="`Accept annotation ${annotation.id}`"
  @click="accept"
  @keydown.enter="accept"
  @keydown.space.prevent="accept"
  tabindex="0"
>
  ✓ Accept
</button>
```

## Day 2: Error Handling & Validation (1 day)

### Step 1: Add Error Boundaries (1 hour)

Create `webview/components/ErrorBoundary.vue`:

```vue
<template>
  <div v-if="error" class="error-boundary">
    <div class="error-icon">⚠️</div>
    <h3>Something went wrong</h3>
    <p>{{ error.message }}</p>
    <button @click="retry" class="retry-btn">Retry</button>
    <details>
      <summary>Error details</summary>
      <pre>{{ error.stack }}</pre>
    </details>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const error = ref<Error | null>(null);

onErrorCaptured((err: Error) => {
  error.value = err;
  console.error('Error caught:', err);
  return false; // Prevent propagation
});

function retry() {
  error.value = null;
}
</script>
```

### Step 2: Validate Annotation Data (1 hour)

```typescript
function validateAnnotation(annotation: any): boolean {
  const required = ['type', 'status', 'id', 'content'];
  const validTypes = ['suggestion', 'question', 'issue', 'note'];
  const validStatuses = ['pending', 'accepted', 'rejected', 'resolved'];

  // Check required fields
  for (const field of required) {
    if (!annotation[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // Validate type
  if (!validTypes.includes(annotation.type)) {
    console.error(`Invalid type: ${annotation.type}`);
    return false;
  }

  // Validate status
  if (!validStatuses.includes(annotation.status)) {
    console.error(`Invalid status: ${annotation.status}`);
    return false;
  }

  return true;
}
```

### Step 3: Handle Edge Cases (2 hours)

- Empty documents
- Very large documents (>10MB)
- Corrupted markdown
- Missing annotation IDs
- Duplicate IDs
- Network failures

### Step 4: Add Telemetry (Optional) (1 hour)

```typescript
interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
}

function trackEvent(event: TelemetryEvent) {
  // Only if user opted in
  const config = vscode.workspace.getConfiguration('markdownAnnotator');
  if (config.get('telemetry.enabled')) {
    // Send to telemetry service
  }
}

// Example usage
trackEvent({
  event: 'annotation_inserted',
  properties: {
    type: 'suggestion',
    source: 'ai_agent'
  }
});
```

## Day 3: Testing (1 day)

### Unit Tests

```typescript
// test/markdown.test.ts
import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, markdownToHtml } from '../webview/utils/markdown';

describe('Markdown Conversion', () => {
  it('converts headings', () => {
    const md = '# Hello\n## World';
    const html = markdownToHtml(md);
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<h2>World</h2>');
  });

  it('round-trips without data loss', () => {
    const original = '# Title\n\nParagraph\n\n- List item';
    const html = markdownToHtml(original);
    const converted = htmlToMarkdown(html);
    expect(converted).toBe(original);
  });

  it('preserves annotations', () => {
    const md = '<!--@agent:suggestion status="pending" id="ann-1"\nTest\n@-->';
    const html = markdownToHtml(md);
    expect(html).toContain('data-agent-annotation');
    expect(html).toContain('data-type="suggestion"');
  });
});
```

### Integration Tests

```typescript
// test/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Tests', () => {
  test('Extension activates', async () => {
    const ext = vscode.extensions.getExtension('your-publisher.markdown-annotator');
    assert.ok(ext);
    await ext!.activate();
  });

  test('Opens markdown file in custom editor', async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: '# Test',
      language: 'markdown'
    });

    await vscode.commands.executeCommand(
      'vscode.openWith',
      doc.uri,
      'markdownAnnotator.editor'
    );

    // Assert custom editor opened
  });

  test('Inserts annotation', async () => {
    // Test annotation insertion
  });
});
```

### Manual Testing Checklist

- ✅ Open .md file in editor
- ✅ Type and format text
- ✅ Insert annotation manually
- ✅ Send to AI agent
- ✅ Accept/reject annotations
- ✅ Save file
- ✅ Reload file
- ✅ External file changes sync
- ✅ Theme switching works
- ✅ Sidebar filters work
- ✅ Export annotations
- ✅ Keyboard shortcuts work
- ✅ Large files (>1MB) work
- ✅ Works on Windows/Mac/Linux

## Day 4: Documentation (1 day)

### README.md

```markdown
# Markdown Annotator

> WYSIWYG markdown editor for VSCode with AI-powered annotations

![Screenshot](media/screenshot.png)

## Features

- **WYSIWYG Editing** - Edit markdown visually like Typora
- **AI Annotations** - Get feedback from AI agents
- **Accept/Reject** - Review and manage annotations
- **Export** - Export annotations as JSON, CSV, or Markdown

## Installation

1. Open VSCode
2. Search for "Markdown Annotator" in extensions
3. Click Install

## Quick Start

1. Open any `.md` file
2. Right-click → "Open With..." → "Markdown Annotator"
3. Start editing!

### Send to AI Agent

1. Right-click → "Send to AI Agent for Review"
2. Select an agent
3. Review annotations
4. Accept or reject each one

## Configuration

```json
{
  "markdownAnnotator.ai.apiKey": "your-api-key",
  "markdownAnnotator.ai.agents": [
    {
      "id": "gpt4",
      "name": "GPT-4 Reviewer",
      "model": "gpt-4"
    }
  ]
}
```

## Keyboard Shortcuts

- `Cmd+S` - Save
- `Cmd+B` - Bold
- `Cmd+I` - Italic
- `Cmd+Shift+A` - Toggle annotations sidebar
- `Cmd+Shift+I` - Insert annotation

## Annotation Syntax

```markdown
<!--@agent:suggestion status="pending" id="ann-001"
Consider adding error handling
@-->
```

## Custom Agents

You can use local scripts as agents:

```json
{
  "markdownAnnotator.ai.localCommand": "/path/to/your/script.py"
}
```

Your script should output JSON:

```json
{
  "annotations": [
    {
      "type": "suggestion",
      "content": "Your feedback",
      "location": { "pattern": "some text" }
    }
  ]
}
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
```

### CHANGELOG.md

```markdown
# Changelog

## [0.1.0] - 2025-01-XX

### Added
- WYSIWYG markdown editing
- Custom annotation extension
- AI agent integration
- Annotations sidebar
- Export annotations (JSON, CSV, Markdown)
- Theme support (light/dark)
- Keyboard shortcuts

### Known Issues
- Large files (>10MB) may be slow
- Some markdown features not supported yet
```

### CONTRIBUTING.md

```markdown
# Contributing

## Development Setup

1. Clone repo
2. `npm install`
3. Press F5 to debug

## Architecture

See [docs/architecture.md](docs/architecture.md)

## Adding Features

1. Create issue
2. Fork repo
3. Create branch
4. Make changes
5. Add tests
6. Submit PR

## Testing

```bash
npm test
```

## Code Style

We use ESLint and Prettier. Run:

```bash
npm run lint
npm run format
```
```

### Create Tutorial Video/GIF (2 hours)

Record demo showing:
1. Opening markdown file
2. Editing with WYSIWYG
3. Sending to AI agent
4. Reviewing annotations
5. Accepting/rejecting
6. Exporting

Tools: QuickTime, LICEcap, or ScreenToGif

## Day 5: Publishing (1 day)

### Step 1: Pre-publish Checklist (1 hour)

- ✅ All tests passing
- ✅ No console errors
- ✅ README complete with screenshots
- ✅ CHANGELOG up to date
- ✅ LICENSE file (MIT)
- ✅ Icon (128x128 PNG)
- ✅ Keywords in package.json
- ✅ Repository URL set
- ✅ Version number correct (0.1.0)
- ✅ Categories set correctly

### Step 2: Create Extension Icon (1 hour)

```svg
<!-- icon.svg -->
<svg width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#0078d4" rx="16"/>
  <text x="64" y="80" text-anchor="middle"
        font-family="Arial" font-size="72"
        font-weight="bold" fill="white">
    📝
  </text>
</svg>
```

Convert to PNG at 128x128.

### Step 3: Package Extension (30 min)

```bash
# Install vsce
npm install -g @vscode/vsce

# Package
vsce package

# Creates: markdown-annotator-0.1.0.vsix
```

### Step 4: Test .vsix (30 min)

```bash
# Install locally
code --install-extension markdown-annotator-0.1.0.vsix

# Test thoroughly
# - Fresh VSCode window
# - New workspace
# - Create .md file
# - Test all features
```

### Step 5: Create Publisher Account (30 min)

1. Go to https://marketplace.visualstudio.com/manage
2. Create publisher account
3. Get Personal Access Token from Azure DevOps
4. Login: `vsce login your-publisher-name`

### Step 6: Publish (30 min)

```bash
# Publish to marketplace
vsce publish

# Or upload manually at marketplace website
```

### Step 7: Announce (1 hour)

- Tweet about it
- Post on Reddit r/vscode
- Blog post
- Add to awesome-vscode list
- Share on Discord/Slack communities

## Post-Launch (Ongoing)

### Week 1
- Monitor GitHub issues
- Fix critical bugs
- Respond to feedback

### Week 2-4
- Add requested features
- Improve documentation
- Performance optimizations

### Month 2+
- Build community
- Add integrations
- Plan v0.2.0

## Success Metrics

### Week 1
- 100+ installs
- <5 critical bugs
- >3.0 star rating

### Month 1
- 1,000+ installs
- Active GitHub issues/discussions
- >4.0 star rating

### Month 3
- 5,000+ installs
- Community contributions
- Featured by VSCode team (aspirational)

## Deliverables

✅ Polished UI with theme support
✅ Comprehensive error handling
✅ Full test suite (unit + integration)
✅ Complete documentation
✅ Demo video/GIF
✅ Published to marketplace
✅ Announcement posts

## Final Checklist

### Code Quality
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ All tests passing
- ✅ Code formatted
- ✅ No console.logs in production

### Documentation
- ✅ README with screenshots
- ✅ CHANGELOG
- ✅ LICENSE
- ✅ CONTRIBUTING guide
- ✅ Code comments
- ✅ API documentation

### Publishing
- ✅ Extension icon
- ✅ Keywords set
- ✅ Categories correct
- ✅ Repository linked
- ✅ Version number
- ✅ .vsix tested

### Marketing
- ✅ Screenshots taken
- ✅ Demo GIF recorded
- ✅ Tweet drafted
- ✅ Blog post written
- ✅ Reddit post ready

---

**Estimated Time:** 5 days
**Difficulty:** Medium
**Dependencies:** All previous tasks

**CONGRATULATIONS!** 🎉 Your VSCode Markdown Annotator is now published and ready for users!
