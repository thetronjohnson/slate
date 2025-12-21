# Markdown WYSIWYG Editor for VSCode

## Goal

True WYSIWYG markdown editor for VSCode:
- Open `.md` files
- Edit inline (what you see is what you edit)
- Save as markdown (round-trip conversion)

## Approach

1. **CustomTextEditorProvider** - VSCode API for custom editors
2. **TipTap/ProseMirror** - WYSIWYG editor (from Slate reference)
3. **Round-trip conversion:**
   - On open: Markdown → HTML (for TipTap)
   - On save: HTML → Markdown (back to file)

## Architecture

```
.md file on disk
    ↓ open
Parse markdown → HTML
    ↓
TipTap editor (WYSIWYG)
    ↓ user edits
HTML changes
    ↓ save (Cmd+S)
Convert HTML → markdown
    ↓
Write to .md file
```

## Trade-offs

**Accepted:** Round-trip conversion may normalize markdown syntax
- `*italic*` might become `_italic_`
- Spacing may change slightly
- **BUT** meaning is preserved (headings, lists, bold, etc. all work)

## Next Steps

1. Scaffold VSCode extension
2. Basic TipTap integration
3. Markdown ↔ HTML conversion
4. Test with real files
5. THEN: Add annotations, AI features, etc.

---

**Status:** Building minimal proof-of-concept
