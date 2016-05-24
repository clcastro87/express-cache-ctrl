# express-cache-ctrl

[![NPM version](https://img.shields.io/npm/v/express-cache-ctrl.svg?style=flat)](https://www.npmjs.com/package/express-cache-ctrl)
[![NPM Downloads](https://img.shields.io/npm/dm/express-cache-ctrl.svg)](https://www.npmjs.com/package/express-cache-ctrl)
[![Build Status](https://travis-ci.org/clcastro87/express-cache-ctrl.svg?branch=master)](https://travis-ci.org/clcastro87/express-cache-ctrl)
[![Issues](https://img.shields.io/github/issues/clcastro87/express-cache-ctrl.svg)](https://travis-ci.org/clcastro87/express-cache-ctrl)
[![GitHub forks](https://img.shields.io/github/forks/clcastro87/express-cache-ctrl.svg)](https://github.com/clcastro87/express-cache-ctrl/network)
[![GitHub stars](https://img.shields.io/github/stars/clcastro87/express-cache-ctrl.svg)](https://github.com/clcastro87/express-cache-ctrl/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/clcastro87/express-cache-ctrl/master/LICENSE)

**Express middleware to handle Cache-Control header, this is used by browsers with HTTP 1.1 support to know about content expiration, 
and when to deliver content from navigator's cache. This is a huge performance improvement when loading content from a website.**

## Install

```bash
$ npm install express-cache-ctrl
```

## Basic usage

```js
var app = express();
var cache = require('express-cache-ctrl');
app.use('/api', cache.disable());
```

### disable()

Returns a middleware you can use on express pipeline, to disable content caching. 

### secure()

Returns a middleware you can use on express pipeline, to disable content caching. This method is recomended by OWASP. 

### private([ttl], [options])

Returns the cache middleware using the given `options` and `ttl`. This middleware sets Cache-Control scope to private.

#### ttl

Cache Time-To-Live in seconds or in ms() notation. e.g. `1d`

#### Options

`private()` accepts these properties in the options object. 

##### ttl

Cache ttl in seconds (max-age). Defaults to `1h`.

##### sttl

Shared cache ttl in seconds (s-maxage). Defaults to `1h`.

##### mustRevalidate

Boolean to specify if content must be revalidated by the browser. 

##### proxyRevalidate

Boolean to specify if content must be revalidated by proxy servers. 

##### noTransform

Boolean to disable header transformation. 

### public([ttl], [options])

Returns the cache middleware using the given `options` and `ttl`. This middleware sets Cache-Control scope to public.

#### ttl

Cache Time-To-Live in seconds or in ms() notation. e.g. `1d`

#### Options

`public()` accepts these properties in the options object. 

##### ttl

Cache ttl in seconds (max-age). Defaults to `1h`.

##### sttl

Shared cache ttl in seconds (s-maxage). Defaults to `1h`.

##### mustRevalidate

Boolean to specify if content must be revalidated by the browser. 

##### proxyRevalidate

Boolean to specify if content must be revalidated by proxy servers. 

##### noTransform

Boolean to disable header transformation. 

### custom([options])

Returns the cache middleware using the given `options`. 

#### Options

`custom()` accepts these properties in the options object. 

##### scope

Sets the Cache-Control scope. Either `public` or `private`.

##### ttl

Cache ttl in seconds (max-age). Defaults to `1h`.

##### sttl

Shared cache ttl in seconds (s-maxage). Defaults to `1h`.

##### mustRevalidate

Boolean to specify if content must be revalidated by the browser. 

##### proxyRevalidate

Boolean to specify if content must be revalidated by proxy servers. 

##### noTransform

Boolean to disable header transformation. 

##### noCache

Disables content caching and sets header to: `no-cache, no-store`. 

## Examples

### express/connect

When using this module with express or connect, simply `app.use` the module as
high as you like. Also it can be used in any stage in any express pipeline or route.

**Setting default cache to private, and 1 hour to expiration.**

```js
var express = require('express');
var cache = require('express-cache-ctrl');

var app = express();

app.use(cache.private(3600)); // 1 min.

app.get('/hello', function(req, res) {
    res.json({hello: 'world!'});
});
```

**Setting secure cache to specific route.**

```js
var express = require('express');
var cache = require('express-cache-ctrl');

var app = express();

app.get('/hello', cache.secure(), function(req, res) {
    res.json({hello: 'world!'});
});
```

**For more examples, you can watch out, the unit tests for this module. `test/cache.js`**

## License

[MIT](LICENSE)
