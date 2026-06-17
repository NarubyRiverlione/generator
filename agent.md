## Agent Session Guidelines

### Session Start Checklist

**At the beginning of each session, read `README.md`.**

This ensures you understand:
- The project uses **pnpm** as the package manager (not npm)
- All commands: `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm vitest run --coverage`
- Project structure and current phase
- Component naming conventions in `docs/naming.md`

### Critical Tools

- **Package Manager:** pnpm only (never npm)
- **Test Runner:** vitest with pnpm (`pnpm test`)
- **Build:** Vite
- **Language:** TypeScript (explicit types, no `var`)

### Code Style

- Refer to `.claude/CLAUDE.md` for global style rules
- TypeScript: Use explicit types, no `var`
- .NET (if applicable): Primary constructors, explicit types, `Interfaces/` directories
- Comments: File-level doc blocks only; single-line elsewhere
- No emojis unless explicitly requested by user

### Test Organization

Tests are organized in `src/core/__tests__/`:
- `unit/`: Simple utilities (complex arithmetic, conversions)
- `integration/`: Simulation features (4.1–4.8, Phase 2 3.1–3.6)
- `helpers.ts`: Shared test utilities

All tests use vitest with ~90% coverage target.

### When in Doubt

1. Read the README
2. Check `.claude/CLAUDE.md` for style
3. Verify package manager in use (always pnpm for this project)
4. Check relevant docs in `docs/`
