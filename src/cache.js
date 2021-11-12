"use strict";

// Module requires
const ms = require("ms");

// Defaults
const defaultTTL = "1h";

// Public functions
function cacheCustom(opts) {
    // Avoid undefined exception
    opts = opts || {};
    // Generate header according to options
    var cacheControl = generateHeader(opts);

    // Save values for performance optimization.
    var cacheControlHeader = cacheControl.join(", ");
    var setPragma = !!opts.noCache;

    // Return middleware.
    return function (req, res, next) {
        var fnSet = res.setHeader || res.set;
        var fnUnset = res.removeHeader;
        fnSet.call(res, "Cache-Control", cacheControlHeader);
        if (setPragma) {
            fnSet.call(res, "Pragma", "no-cache");
        } else {
            fnUnset.call(res, "Pragma");
        }
        next();
    };
}

function cacheDisable() {
    return cacheCustom({
        noCache: true,
        mustRevalidate: true,
        proxyRevalidate: true,
    });
}

function cacheSecure() {
    return cacheCustom({
        scope: "private",
        noCache: true,
        mustRevalidate: true,
        noTransform: true,
    });
}

function cachePublic(ttl, opts) {
    opts = opts || {};
    opts.scope = "public";
    opts.sttl = opts.ttl = ttl || defaultTTL;
    return cacheCustom(opts);
}

function cachePrivate(ttl, opts) {
    opts = opts || {};
    opts.scope = "private";
    opts.ttl = ttl || defaultTTL;
    return cacheCustom(opts);
}

// Private functions
function toTimespan(input) {
    if (!isNaN(input)) {
        return parseInt(input);
    }
    // Is in seconds, not milliseconds
    return parseInt(ms(input) / 1000);
}

function generateHeader(opts) {
    var cacheControl = [];

    // Set corresponding caching scope.
    if (opts.scope && opts.scope === "public") {
        cacheControl.push("public");
    } else if (opts.scope && opts.scope === "private") {
        cacheControl.push("private");
    }

    if (!!opts.noCache) {
        // Set no cache headers to both navigator engines.
        cacheControl.push("no-cache");
        cacheControl.push("no-store");
    } else {
        // Verify scope
        if (cacheControl.length === 0) {
            cacheControl.push("private");
        }
        // Set max-age
        cacheControl.push("max-age=" + toTimespan(opts.ttl || defaultTTL));
        if (opts.sttl) {
            cacheControl.push("s-maxage=" + toTimespan(opts.sttl));
        }
    }
    if (!!opts.mustRevalidate) {
        // Set endpoint content revalidation
        cacheControl.push("must-revalidate");
    }
    if (!!opts.proxyRevalidate) {
        // Set proxy content revalidation
        cacheControl.push("proxy-revalidate");
    }
    if (!!opts.noTransform) {
        // Don't transform response.
        cacheControl.push("no-transform");
    }

    return cacheControl;
}

// Module exports
exports.defaultTTL = defaultTTL;
exports.custom = cacheCustom;
exports.disable = cacheDisable;
exports.secure = cacheSecure;
exports.public = cachePublic;
exports.private = cachePrivate;
exports.toTimespan = toTimespan;
