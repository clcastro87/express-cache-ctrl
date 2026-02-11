const { expect } = require("chai");
const ms = require("ms");
const cache = require("../src/cache");
const Response = require("./mocks/response");

describe("Cache Middleware", function () {
    const ttl = 3600;

    it("cache disabled", function (done) {
        const middleware = cache.disable();
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;
            const controls = parseCacheControl(cacheControl);
            expect(controls).to.property("no-store");
            expect(controls).to.property("no-cache");
            expect(controls).to.property("must-revalidate");
            expect(controls).to.property("proxy-revalidate");

            const pragma = res.get("Pragma");
            expect(pragma).to.not.be.null;
            expect(pragma).to.equal("no-cache");
            done();
        });
    });

    it("cache secure", function (done) {
        const middleware = cache.secure();
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;
            expect(cacheControl.indexOf("private")).to.equal(0);

            const controls = parseCacheControl(cacheControl);
            expect(controls).to.property("no-store");
            expect(controls).to.property("no-cache");
            expect(controls).to.property("must-revalidate");
            expect(controls).to.property("no-transform");

            const pragma = res.get("Pragma");
            expect(pragma).to.not.be.null;
            expect(pragma).to.equal("no-cache");
            done();
        });
    });

    it("cache with no TTL", function (done) {
        const middleware = cache.private();
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;

            const controls = parseCacheControl(cacheControl);
            expect(controls)
                .to.property("max-age")
                .and.to.equal(cache.toTimespan(cache.defaultTTL));
            done();
        });
    });

    it("cache private", function (done) {
        const middleware = cache.private(ttl);
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;
            expect(cacheControl.indexOf("private")).to.equal(0);

            const controls = parseCacheControl(cacheControl);
            expect(controls).to.property("max-age").and.to.equal(ttl);
            done();
        });
    });

    it("cache private, with custom options", function (done) {
        const middleware = cache.private(ttl, { mustRevalidate: true });
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;
            expect(cacheControl.indexOf("private")).to.equal(0);

            const controls = parseCacheControl(cacheControl);
            expect(controls).to.property("max-age").and.to.equal(ttl);
            expect(controls).to.property("must-revalidate");
            done();
        });
    });

    it("cache public", function (done) {
        const middleware = cache.public(ttl);
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;
            expect(cacheControl.indexOf("public")).to.equal(0);

            const controls = parseCacheControl(cacheControl);
            expect(controls).to.property("max-age").and.to.equal(ttl);
            expect(controls).to.property("s-maxage").and.to.equal(ttl);
            done();
        });
    });

    it("cache public, with custom options", function (done) {
        const middleware = cache.public(ttl, { mustRevalidate: true });
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;
            expect(cacheControl.indexOf("public")).to.equal(0);

            const controls = parseCacheControl(cacheControl);
            expect(controls).to.property("max-age").and.to.equal(ttl);
            expect(controls).to.property("s-maxage").and.to.equal(ttl);
            expect(controls).to.property("must-revalidate");
            done();
        });
    });

    it("cache custom", function (done) {
        const middleware = cache.custom({
            ttl: ttl,
            sttl: ttl,
            scope: "public",
            mustRevalidate: true,
            proxyRevalidate: true,
            noTransform: true,
        });
        expect(middleware).to.not.be.null;
        expect(middleware).to.be.a("function");
        runMiddleware(middleware, function (res) {
            const cacheControl = res.get("Cache-Control");
            expect(cacheControl).to.not.be.null;
            expect(cacheControl.indexOf("public")).to.equal(0);

            const controls = parseCacheControl(cacheControl);
            expect(controls).to.property("max-age").and.to.equal(ttl);
            expect(controls).to.property("s-maxage").and.to.equal(ttl);
            expect(controls).to.property("must-revalidate");
            expect(controls).to.property("no-transform");
            expect(controls).to.property("proxy-revalidate");
            done();
        });
    });

    describe("Edge Cases", function () {
        it("cache private with TTL = 0 defaults to defaultTTL", function (done) {
            const middleware = cache.private(0);
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                const defaultTtlSeconds = cache.toTimespan(cache.defaultTTL);
                // 0 is falsy, so it defaults to defaultTTL (1h = 3600)
                expect(controls).to.property("max-age").and.to.equal(defaultTtlSeconds);
                done();
            });
        });

        it("cache public with string TTL '1d'", function (done) {
            const middleware = cache.public("1d");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                expect(controls).to.property("max-age").and.to.equal(86400);
                expect(controls).to.property("s-maxage").and.to.equal(86400);
                done();
            });
        });

        it("cache public with string TTL '2h'", function (done) {
            const middleware = cache.public("2h");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                expect(controls).to.property("max-age").and.to.equal(7200);
                expect(controls).to.property("s-maxage").and.to.equal(7200);
                done();
            });
        });

        it("cache public with string TTL '30m'", function (done) {
            const middleware = cache.public("30m");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                expect(controls).to.property("max-age").and.to.equal(1800);
                expect(controls).to.property("s-maxage").and.to.equal(1800);
                done();
            });
        });

        it("cache custom with no options", function (done) {
            const middleware = cache.custom();
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                expect(cacheControl).to.not.be.null;
                expect(cacheControl).to.be.a("string");
                done();
            });
        });

        it("cache custom with empty options", function (done) {
            const middleware = cache.custom({});
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                expect(cacheControl).to.not.be.null;
                const controls = parseCacheControl(cacheControl);
                expect(controls).to.property("private");
                done();
            });
        });

        it("should remove Pragma header when noCache is false", function (done) {
            const middleware = cache.private(3600);
            const res = new Response();
            // Set Pragma header first
            res.setHeader("Pragma", "no-cache");
            middleware.call(middleware, {}, res, function () {
                const pragma = res.get("Pragma");
                expect(pragma).to.be.undefined;
                done();
            });
        });

        it("should call next() callback", function (done) {
            const middleware = cache.private(3600);
            const res = new Response();
            let nextCalled = false;
            middleware.call(middleware, {}, res, function () {
                nextCalled = true;
                expect(nextCalled).to.be.true;
                done();
            });
        });

        it("cache public with 1 week TTL", function (done) {
            const middleware = cache.public("1w");
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                expect(controls).to.property("max-age").and.to.equal(604800);
                expect(controls).to.property("s-maxage").and.to.equal(604800);
                done();
            });
        });

        it("cache custom with different max-age and s-maxage", function (done) {
            const middleware = cache.custom({
                scope: "public",
                ttl: "2h",
                sttl: "1h",
            });
            runMiddleware(middleware, function (res) {
                const cacheControl = res.get("Cache-Control");
                const controls = parseCacheControl(cacheControl);
                expect(controls).to.property("max-age").and.to.equal(7200);
                expect(controls).to.property("s-maxage").and.to.equal(3600);
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
