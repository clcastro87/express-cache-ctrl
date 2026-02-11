# AGENTS.md

This file provides guidelines for AI coding agents working on the express-cache-ctrl repository.

## Project Overview

An Express.js middleware for managing Cache-Control headers with support for public/private caching, TTL, and OWASP secure caching recommendations.

## Build/Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npx mocha 'test/cache.js'
npx mocha 'test/unit/cache.js'

# Run tests matching a pattern (grep)
npx mocha 'test/**/*.js' --grep "cache disabled"

# Run with different reporter
npx mocha 'test/**/*.js' --reporter spec
```

Note: This project uses Mocha (test runner) + Chai (assertions). Tests use BDD style with `describe()` and `it()` blocks.

## Code Style Guidelines

### Formatting
- Indent: 4 spaces for `.js` files, 2 spaces for `package.json` (see `.editorconfig`)
- Use double quotes for strings
- Always use semicolons
- Insert final newline at end of files
- Trim trailing whitespace

### Language & Imports
- Use ES5/CommonJS (no ES6 modules)
- Import style: `const module = require("module");`
- Use `"use strict";` directive at top of source files
- Node.js version: >= 12.0

### Naming Conventions
- Functions: camelCase (e.g., `cacheCustom`, `toTimespan`)
- Variables: camelCase (e.g., `cacheControl`, `defaultTTL`)
- Constants: Use descriptive names, may use ALL_CAPS for true constants
- Files: camelCase for source files (e.g., `cache.js`)

### Functions & Structure
- Prefer traditional function declarations over arrow functions in source
- Arrow functions acceptable in tests
- Group related functions together with clear section comments
- Export pattern: `exports.functionName = functionName;` at end of file

### Testing Conventions
- Test files: Located in `test/` directory with `.js` extension
- Unit tests: Place in `test/unit/` subdirectory
- Mock objects: Place in `test/mocks/` subdirectory
- Use Chai's `expect()` assertion style
- Use descriptive test names that explain behavior
- Group related tests with nested `describe()` blocks
- Follow pattern: `it("should do something", function (done) { ... });`
- Call `done()` callback for async tests

### Error Handling
- Middleware must call `next()` to pass control
- Validate inputs with truthy checks: `opts = opts || {};`
- Use `parseInt()` for numeric conversions
- Avoid throwing errors for expected edge cases

### Comments
- Use `//` for single-line comments
- Add descriptive headers for sections: `// Public functions`, `// Module requires`
- JSDoc-style comments acceptable but not required

## File Organization

```
src/
  cache.js          # Main middleware implementation
test/
  cache.js          # Integration tests
  unit/
    cache.js        # Unit tests for internal functions
  mocks/
    response.js     # Mock Express response object
```

## Dependencies

Production:
- express: ^4.18.2
- ms: ^2.1.3

Development:
- mocha: ^10.2.0
- chai: ^4.3.7
- mock-res: ^0.6.0

## Important Notes

- Default TTL is "1h" (3600 seconds) when not specified
- Uses `ms` library for human-readable time parsing
- Middleware follows Express convention: `(req, res, next) => {}`
- Supports both `res.setHeader()` and `res.set()` methods
- Always exports internal functions for testability
