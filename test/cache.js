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
