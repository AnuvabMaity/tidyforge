# Tidyforge

A collection of utility packages for modern JavaScript/TypeScript/React development workflow automation.

## Packages

This monorepo contains the following utility packages:

### 🎨 @tidyforge/pretty-please

Automated linter + formatter setup with pre-commit hooks for maintaining code quality in JS/TS/React projects.

**Installation:**

```bash
npx @tidyforge/pretty-please
```

**Added Scripts:**

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint --fix .",
  "format:check": "prettier --check .",
  "format": "prettier --write .",
  "prepare": "husky"
}
```

**Git Hooks:**

- `pre-commit`: Runs lint-staged to format and lint staged files

---

### 💬 @tidyforge/commit-ment

> Structured commit message enforcer with pre-commit hooks for good commit practices.

Sets up commitlint and commitizen for standardized, conventional commit messages.

**Installation:**

```bash
npx @tidyforge/commit-ment
```

**Added Scripts:**

```json
{
  "commit": "cz",
  "prepare": "husky"
}
```

**Git Hooks:**

- `commit-msg`: Validates commit messages against conventional format

**Usage:**
Instead of `git commit`, use:

```bash
npm run commit
```

## This launches an interactive prompt to create properly formatted commit messages

## Core Utilities

### 🔧 @tidyforge/core (internal)

Shared utility functions used by all Tidyforge packages. Not published separately.

**Features:**

- Logging utilities with color coding
- JSON file operations (read/write with error handling)
- File copying with user prompts
- package.json manipulation (scripts, configs)
- Husky setup and management helpers

---

### Workspace Structure

```
tidyforge/
├── packages/
│   ├── core/              # Shared utilities
│   │   ├── utils.js
│   │   ├── utils-husky.js
│   │   └── package.json
│   ├── pretty-please/     # ESLint + Prettier setup
│   │   ├── bin/
│   │   ├── configs/
│   │   ├── hooks/
│   │   └── package.json
│   └── commit-ment/       # Commitlint + Commitizen setup
│       ├── bin/
│       ├── configs/
│       ├── hooks/
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

### Package Manager

This monorepo uses **npm** with workspaces for efficient dependency management.

---

## Requirements

- Node.js >= 16
- npm/pnpm/yarn
- Git repository initialized

---

## License

MIT © AnuvabMaity

---

## Support

For issues and questions, please open an issue on the [GitHub repository](https://github.com/AnuvabMaity/tidyforge).
