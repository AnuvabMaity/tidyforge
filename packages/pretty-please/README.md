# @tidyforge/pretty-please

> One command to set up ESLint + Prettier + Husky for any JavaScript/TypeScript project.

## Installation

```bash
npx @tidyforge/pretty-please
```

## What it does

- ✅ Copies ESLint config (`eslint.config.mjs`)
- ✅ Copies Prettier config (`.prettierrc`)
- ✅ Adds npm scripts (lint, format, etc.)
- ✅ Sets up Husky pre-commit hooks
- ✅ Configures lint-staged

## Requirements

- Node.js >= 16
- npm/pnpm/yarn project with `package.json`

## Usage

Navigate to your project and run:

```bash
npx @tidyforge/pretty-please
```

That's it! Your project now has linting, formatting, and pre-commit hooks.

## What gets added

### Scripts

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint --fix .",
  "format:check": "prettier --check .",
  "format": "prettier --write .",
  "prepare": "husky"
}
```

### Git Hooks

- `pre-commit`: Runs lint-staged to format and lint staged files

## License

MIT © AnuvabMaity
