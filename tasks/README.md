# VSCode Markdown WYSIWYG Editor with AI Agent Annotations

## Project Goal

Build a **Typora-like WYSIWYG markdown editor for VSCode** with custom annotation support for reviewing AI agent plans and providing feedback.

## Why This Project?

- Need a WYSIWYG markdown editor in VSCode (like Typora)
- Want to annotate AI agent-generated plans with suggestions, questions, issues
- Custom markdown extensions for agent feedback workflow
- Don't want to build from scratch - use Slate as reference

## What We're Using from Slate

**Reference only** - not extracting the entire codebase:
- ✅ TipTap editor configuration (MarkdownEditor.vue structure)
- ✅ CSS styling patterns
- ✅ Markdown conversion approach
- ✅ ProseMirror extension patterns

**NOT taking:**
- ❌ Nuxt framework
- ❌ Supabase/backend
- ❌ IndexedDB storage
- ❌ AI command palette
- ❌ Web app UI

## Architecture

```
VSCode Extension
├── Extension Host
│   ├── CustomTextEditorProvider
│   ├── Annotation commands
│   └── AI agent integration
│
├── Webview (Vue 3)
│   ├── TipTap editor (inspired by Slate)
│   ├── Custom annotation extension
│   └── Accept/reject UI
│
└── Markdown with Annotations
    ├── Standard markdown
    └── <!--@agent:type="..." ...@--> syntax
```

## Timeline

**Total:** 3 weeks to MVP

- **Week 1:** Basic WYSIWYG editor (2-3 days) + Custom annotation extension (2-3 days)
- **Week 2:** Annotation UI and parsing (3-4 days) + AI integration (1-2 days)
- **Week 3:** Polish, testing, documentation (5 days)

## Task Files

1. **[setup-vscode-extension.md](./setup-vscode-extension.md)** - Week 1, Days 1-3
   - Scaffold VSCode extension
   - Add TipTap with Vue 3
   - Basic markdown editing
   - Reference Slate's patterns

2. **[custom-annotation-extension.md](./custom-annotation-extension.md)** - Week 1, Days 4-5
   - Create TipTap annotation node
   - Markdown syntax design
   - Parser for `<!--@agent:...@-->`
   - Renderer with styling

3. **[annotation-ui.md](./annotation-ui.md)** - Week 2, Days 1-3
   - Accept/reject buttons
   - Status tracking
   - Visual indicators
   - Sidebar panel (optional)

4. **[ai-agent-integration.md](./ai-agent-integration.md)** - Week 2, Days 4-5
   - Send plan for review
   - Parse agent responses
   - Insert annotations
   - Diff view

5. **[polish-and-testing.md](./polish-and-testing.md)** - Week 3
   - Theme integration
   - Keyboard shortcuts
   - Error handling
   - Testing & documentation

## Success Criteria

### MVP Must-Haves
- ✅ WYSIWYG markdown editing in VSCode
- ✅ Save/load markdown files directly
- ✅ Custom annotation syntax working
- ✅ Can insert, view, accept/reject annotations
- ✅ Basic AI agent integration (send plan, get feedback)

### Nice-to-Haves (v2)
- ⚠️ Collaborative annotations (multiple reviewers)
- ⚠️ Annotation threads/discussions
- ⚠️ Export annotations to CSV/JSON
- ⚠️ Integration with GitHub PR comments
- ⚠️ Diff view for accepted changes

## Annotation Syntax Design

### Proposed Markdown Syntax

```markdown
# AI Agent Plan

This is a regular paragraph.

<!--@agent:suggestion status="pending" id="ann-001"
Consider adding error handling for this API call
@-->

Another paragraph.

<!--@agent:question status="pending" id="ann-002"
Have you considered edge cases for empty input?
@-->

Code block here...

<!--@agent:issue status="accepted" id="ann-003"
This approach won't scale beyond 1000 items
@-->
```

### Annotation Types

1. **suggestion** - Proposed improvement
2. **question** - Asking for clarification
3. **issue** - Problem that needs fixing
4. **note** - General observation

### Annotation States

- `pending` - Not yet reviewed
- `accepted` - Approved by user
- `rejected` - Dismissed
- `resolved` - Issue fixed

## Technology Stack

### Core
- **VSCode Extension API** - CustomTextEditorProvider
- **Vue 3** - Webview UI framework
- **TipTap 2.x** - WYSIWYG editor
- **ProseMirror** - Underlying editor (via TipTap)

### Utilities
- **turndown** - HTML → Markdown
- **markdown-it** or custom parser - Markdown → HTML (with annotations)
- **TypeScript** - Type safety

### Bundle
- **esbuild** or **webpack** - Fast bundling
- Separate bundles for extension and webview

## File Structure

```
vscode-markdown-annotator/
├── package.json                   # Extension manifest
├── tsconfig.json
├── README.md
├── CHANGELOG.md
│
├── src/
│   ├── extension.ts              # Extension entry
│   ├── AnnotationEditorProvider.ts
│   ├── commands/
│   │   ├── insertAnnotation.ts
│   │   ├── acceptAnnotation.ts
│   │   └── rejectAnnotation.ts
│   └── ai/
│       └── agentClient.ts        # AI agent integration
│
├── webview/
│   ├── main.ts                   # Webview entry
│   ├── Editor.vue                # Main editor component
│   ├── AnnotationNode.vue        # Annotation display
│   ├── extensions/
│   │   └── agentAnnotation.ts    # TipTap extension
│   └── styles/
│       └── editor.css            # Styles (from Slate)
│
├── media/                         # Compiled webview assets
│   ├── editor.js
│   └── editor.css
│
└── out/                          # Compiled extension
    └── extension.js
```

## Key Features

### 1. WYSIWYG Editing
- Rich text formatting (bold, italic, code, etc.)
- Live preview - what you see is what you get
- Markdown shortcuts (e.g., `# ` for heading)
- Keyboard shortcuts matching VSCode

### 2. Annotation System
- Visual indicators for annotations
- Color coding by type (suggestion=blue, issue=red, etc.)
- Inline display with expand/collapse
- Quick actions (accept/reject)

### 3. AI Integration
- Command: "Send plan to AI agent for review"
- Parse agent response (JSON or markdown)
- Auto-insert annotations at relevant locations
- Track which annotations came from which agent

### 4. VSCode Integration
- Respects VSCode theme (light/dark)
- Works with VSCode's save/undo/redo
- File watcher for external changes
- Status bar indicators

## Example Workflow

```
1. User writes markdown plan in VSCode
   ↓
2. Right-click > "Send to AI Agent for Review"
   ↓
3. Extension sends content to AI agent
   ↓
4. AI agent returns feedback as annotations
   ↓
5. Annotations appear inline in editor
   ↓
6. User reviews each annotation:
   - Accept (apply suggestion)
   - Reject (dismiss)
   - Reply (if threaded)
   ↓
7. Final markdown saved with/without annotations
```

## Comparison with Existing Tools

| Feature | Typora | VSCode Default | Our Extension |
|---------|--------|----------------|---------------|
| WYSIWYG editing | ✅ | ❌ | ✅ |
| Live preview | ✅ | Split view | ✅ |
| Custom annotations | ❌ | ❌ | ✅ |
| AI integration | ❌ | ❌ | ✅ |
| VSCode integration | ❌ | ✅ | ✅ |
| Open source | ❌ | ✅ | ✅ |

## References

### Slate Codebase
- `/home/user/slate/components/MarkdownEditor.vue` - Main editor reference
- `/home/user/slate/docs/` - Extraction documentation (FYI)

### TipTap Resources
- [TipTap Documentation](https://tiptap.dev/)
- [Custom Extensions Guide](https://tiptap.dev/guide/custom-extensions)
- [ProseMirror](https://prosemirror.net/)

### VSCode Resources
- [Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)

### Similar Projects
- [vscode-markdown-editor](https://github.com/zaaack/vscode-markdown-editor) - Existing WYSIWYG editor
- [Foam](https://foambubble.github.io/foam/) - VSCode knowledge base

## Getting Started

**Next step:** Read [setup-vscode-extension.md](./setup-vscode-extension.md) to begin Week 1.

---

**Created:** 2025-01-20
**Status:** Planning
**Goal:** Typora-like editor with AI agent annotations for VSCode
