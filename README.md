# express-cache-ctrl

[![NPM version](https://img.shields.io/npm/v/express-cache-ctrl.svg?style=flat)](https://www.npmjs.com/package/express-cache-ctrl)
[![NPM Downloads](https://img.shields.io/npm/dm/express-cache-ctrl.svg)](https://www.npmjs.com/package/express-cache-ctrl)
[![Build Status](https://github.com/clcastro87/express-cache-ctrl/actions/workflows/node.js.yml/badge.svg)](https://github.com/clcastro87/express-cache-ctrl/actions/workflows/node.js.yml)
[![Issues](https://img.shields.io/github/issues/clcastro87/express-cache-ctrl.svg)](https://github.com/clcastro87/express-cache-ctrl/issues)
[![GitHub forks](https://img.shields.io/github/forks/clcastro87/express-cache-ctrl.svg)](https://github.com/clcastro87/express-cache-ctrl/network)
[![GitHub stars](https://img.shields.io/github/stars/clcastro87/express-cache-ctrl.svg)](https://github.com/clcastro87/express-cache-ctrl/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/clcastro87/express-cache-ctrl/master/LICENSE)

Express middleware to manage the `Cache-Control` header, helping browsers with HTTP 1.1 support understand content expiration and when to serve content from the browser's cache. This can significantly improve performance when loading content from your website.

## Why use this middleware?

-   **Improved Performance:** By setting appropriate cache headers, you can reduce server load and decrease page load times for your users.
-   **Fine-Grained Control:** Easily set different caching policies for different routes or resources.
-   **OWASP Recommended:** Includes a `secure()` method to apply secure caching headers as recommended by OWASP.
-   **Flexible Configuration:** Supports `public`, `private`, and `no-cache` scopes, along with TTLs and revalidation directives.

## Installation

```bash
npm install express-cache-ctrl
```

## Basic Usage

```javascript
const express = require("express");
const cache = require("express-cache-ctrl");
const app = express();

// Disable caching for API routes
app.use("/api", cache.disable());

// Set public caching for static assets
app.use("/static", cache.public("1d"));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(3000);
```

## API

### `cache.disable()`

Disables caching by setting the `Cache-Control` header to `no-cache, no-store, must-revalidate, proxy-revalidate`. Also sets `Pragma: no-cache`.

### `cache.secure()`

Applies secure caching settings as recommended by OWASP. Sets the `Cache-Control` header to `private, no-cache, no-store, must-revalidate, no-transform`.

### `cache.public(ttl, [options])`

Sets the `Cache-Control` header to `public`.

-   `ttl`: Cache Time-To-Live. Can be a number in seconds or a string in `ms` format (e.g., `'1d'`, `'2h'`). Defaults to `'1h'`.
-   `options`: An optional object for more specific directives.

### `cache.private(ttl, [options])`

Sets the `Cache-Control` header to `private`.

-   `ttl`: Cache Time-To-Live. Can be a number in seconds or a string in `ms` format (e.g., `'1d'`, `'2h'`). Defaults to `'1h'`.
-   `options`: An optional object for more specific directives.

### `cache.custom([options])`

Returns a middleware with a custom `Cache-Control` header based on the provided options.

### Configuration Options

The `public`, `private`, and `custom` methods accept an options object with the following properties:

-   `scope`: The caching scope. Can be `'public'` or `'private'`.
-   `ttl`: The `max-age` value in seconds or `ms` format. Defaults to `'1h'`.
-   `sttl`: The `s-maxage` value in seconds or `ms` format.
-   `mustRevalidate`: (Boolean) If `true`, adds the `must-revalidate` directive.
-   `proxyRevalidate`: (Boolean) If `true`, adds the `proxy-revalidate` directive.
-   `noTransform`: (Boolean) If `true`, adds the `no-transform` directive.
-   `noCache`: (Boolean) If `true`, adds `no-cache` and `no-store` directives.

## Examples

### Setting a default cache policy

You can apply a caching policy to all routes by using the middleware at the top of your Express application.

```javascript
const express = require("express");
const cache = require("express-cache-ctrl");

const app = express();

// Set a default private cache with a 1-hour TTL
app.use(cache.private("1h"));

app.get("/profile", (req, res) => {
    res.json({ user: "John Doe" });
});
```

### Applying caching to a specific route

You can also apply caching middleware to individual routes.

```javascript
const express = require("express");
const cache = require("express-cache-ctrl");

const app = express();

// Apply secure caching to a specific route
app.get("/secure-data", cache.secure(), (req, res) => {
    res.json({ data: "This is secure data" });
});
```

For more examples, please refer to the unit tests in `test/cache.js`.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

[MIT](LICENSE)