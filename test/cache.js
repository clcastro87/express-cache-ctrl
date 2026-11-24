const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const ms = require("ms");
const cache = require("../src/cache");
const Response = require("./mocks/response");

describe("Cache Middleware", function () {
    const ttl = 3600;

    it("cache disabled", function (t, done) {
        const middleware = cache.disable();
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);
            const controls = parseCacheControl(cacheControl);
            assert.ok("no-store" in controls);
            assert.ok("no-cache" in controls);
            assert.ok("must-revalidate" in controls);
            assert.ok("proxy-revalidate" in controls);

            const pragma = res.get("Pragma");
            assert.ok(pragma);
            assert.equal(pragma, "no-cache");
            done();
        });
    });

    it("cache secure", function (t, done) {
        const middleware = cache.secure();
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);
            assert.equal(cacheControl.indexOf("private"), 0);

            const controls = parseCacheControl(cacheControl);
            assert.ok("no-store" in controls);
            assert.ok("no-cache" in controls);
            assert.ok("must-revalidate" in controls);
            assert.ok("no-transform" in controls);

            const pragma = res.get("Pragma");
            assert.ok(pragma);
            assert.equal(pragma, "no-cache");
            done();
        });
    });

    it("cache with no TTL", function (t, done) {
        const middleware = cache.private();
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);

            const controls = parseCacheControl(cacheControl);
            assert.equal(controls["max-age"], cache.toTimespan(cache.defaultTTL));
            done();
        });
    });

    it("cache private", function (t, done) {
        const middleware = cache.private(ttl);
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);
            assert.equal(cacheControl.indexOf("private"), 0);

            const controls = parseCacheControl(cacheControl);
            assert.equal(controls["max-age"], ttl);
            done();
        });
    });

    it("cache private, with custom options", function (t, done) {
        const middleware = cache.private(ttl, { mustRevalidate: true });
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);
            assert.equal(cacheControl.indexOf("private"), 0);

            const controls = parseCacheControl(cacheControl);
            assert.equal(controls["max-age"], ttl);
            assert.ok("must-revalidate" in controls);
            done();
        });
    });

    it("cache public", function (t, done) {
        const middleware = cache.public(ttl);
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);
            assert.equal(cacheControl.indexOf("public"), 0);

            const controls = parseCacheControl(cacheControl);
            assert.equal(controls["max-age"], ttl);
            assert.equal(controls["s-maxage"], ttl);
            done();
        });
    });

    it("cache public, with custom options", function (t, done) {
        const middleware = cache.public(ttl, { mustRevalidate: true });
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);
            assert.equal(cacheControl.indexOf("public"), 0);

            const controls = parseCacheControl(cacheControl);
            assert.equal(controls["max-age"], ttl);
            assert.equal(controls["s-maxage"], ttl);
            assert.ok("must-revalidate" in controls);
            done();
        });
    });

    it("cache custom", function (t, done) {
        const middleware = cache.custom({
            ttl: ttl,
            sttl: ttl,
            scope: "public",
            mustRevalidate: true,
            proxyRevalidate: true,
            noTransform: true,
        });
        assert.ok(middleware);
        assert.equal(typeof middleware, "function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            assert.ok(cacheControl);
            assert.equal(cacheControl.indexOf("public"), 0);

            const controls = parseCacheControl(cacheControl);
            assert.equal(controls["max-age"], ttl);
            assert.equal(controls["s-maxage"], ttl);
            assert.ok("must-revalidate" in controls);
            assert.ok("no-transform" in controls);
            assert.ok("proxy-revalidate" in controls);
            done();
        });
    });

    describe("Edge Cases", function () {
        it("public and private should not mutate the caller's options", function () {
            const opts = { mustRevalidate: true };
            cache.public("1d", opts);
            cache.private("2h", opts);
            assert.deepEqual(opts, { mustRevalidate: true });
        });

        it("reusing one options object should not leak scope or ttl between calls", function (t, done) {
            const opts = { mustRevalidate: true };
            cache.public("1d", opts);
            const middleware = cache.private("2h", opts);
            runMiddleware(middleware, function (res) {
                const controls = parseCacheControl(res.get("Cache-Control"));
                assert.ok("private" in controls);
                assert.ok(!("public" in controls));
                assert.ok(!("s-maxage" in controls));
                assert.equal(controls["max-age"], 7200);
                done();
            });
        });

        it("cache private with TTL = 0 defaults to defaultTTL", function (t, done) {
            const middleware = cache.private(0);
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                const defaultTtlSeconds = cache.toTimespan(cache.defaultTTL);
                // 0 is falsy, so it defaults to defaultTTL (1h = 3600)
                assert.equal(controls["max-age"], defaultTtlSeconds);
                done();
            });
        });

        it("cache public with string TTL '1d'", function (t, done) {
            const middleware = cache.public("1d");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                assert.equal(controls["max-age"], 86400);
                assert.equal(controls["s-maxage"], 86400);
                done();
            });
        });

        it("cache public with string TTL '2h'", function (t, done) {
            const middleware = cache.public("2h");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                assert.equal(controls["max-age"], 7200);
                assert.equal(controls["s-maxage"], 7200);
                done();
            });
        });

        it("cache public with string TTL '30m'", function (t, done) {
            const middleware = cache.public("30m");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                assert.equal(controls["max-age"], 1800);
                assert.equal(controls["s-maxage"], 1800);
                done();
            });
        });

        it("cache custom with no options", function (t, done) {
            const middleware = cache.custom();
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                assert.ok(cacheControl);
                assert.equal(typeof cacheControl, "string");
                done();
            });
        });

        it("cache custom with empty options", function (t, done) {
            const middleware = cache.custom({});
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                assert.ok(cacheControl);
                const controls = parseCacheControl(cacheControl);
                assert.ok("private" in controls);
                done();
            });
        });

        it("should remove Pragma header when noCache is false", function (t, done) {
            const middleware = cache.private(3600);
            const res = new Response();
            // Set Pragma header first
            res.setHeader("Pragma", "no-cache");
            middleware.call(middleware, {}, res, function () {
                const pragma = res.get("Pragma");
                assert.equal(pragma, undefined);
                done();
            });
        });

        it("should call next() callback", function (t, done) {
            const middleware = cache.private(3600);
            const res = new Response();
            let nextCalled = false;
            middleware.call(middleware, {}, res, function () {
                nextCalled = true;
                assert.equal(nextCalled, true);
                done();
            });
        });

        it("cache public with 1 week TTL", function (t, done) {
            const middleware = cache.public("1w");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                assert.equal(controls["max-age"], 604800);
                assert.equal(controls["s-maxage"], 604800);
                done();
            });
        });

        it("cache public with invalid TTL should be treated as stale", function (t, done) {
            const middleware = cache.public("1h30m");
            runMiddleware(middleware, function (res) {
                assert.equal(res.get("Cache-Control"), "public, max-age=0, s-maxage=0");
                done();
            });
        });

        it("cache private with negative TTL should be treated as stale", function (t, done) {
            const middleware = cache.private("-1h");
            runMiddleware(middleware, function (res) {
                assert.equal(res.get("Cache-Control"), "private, max-age=0");
                done();
            });
        });

        it("cache custom with different max-age and s-maxage", function (t, done) {
            const middleware = cache.custom({
                scope: "public",
                ttl: "2h",
                sttl: "1h",
            });
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                assert.equal(controls["max-age"], 7200);
                assert.equal(controls["s-maxage"], 3600);
                done();
            });
        });
    });

    function runMiddleware(middleware, callback) {
        const res = new Response();
        middleware.call(middleware, {}, res, function () {
            callback(res);
        });
    }

    function parseCacheControl(input) {
        //console.log('Cache-Control:', input);
        const parts = input.split(",");
        return parts.reduce(function (prev, current) {
            let value = true;
            let key = current.trim();
            if (current.indexOf("=") !== -1) {
                let keyAndValue = current.split("=");
                key = keyAndValue[0] && keyAndValue[0].trim();
                value = keyAndValue[1] && keyAndValue[1].trim();
            }
            if (!isNaN(value)) {
                value = parseInt(value);
            }
            prev[key] = value;
            return prev;
        }, {});
    }
});
