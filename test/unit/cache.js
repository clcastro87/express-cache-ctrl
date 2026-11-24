const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const cache = require("../../src/cache");

describe("Cache Internal Functions", function () {
    describe("toTimespan()", function () {
        describe("numeric inputs", function () {
            it("should return numeric value as-is for positive integers", function () {
                assert.equal(cache.toTimespan(3600), 3600);
                assert.equal(cache.toTimespan(60), 60);
                assert.equal(cache.toTimespan(1), 1);
            });

            it("should return numeric value for large numbers", function () {
                assert.equal(cache.toTimespan(86400), 86400);
                assert.equal(cache.toTimespan(31536000), 31536000);
            });

            it("should return 0 for zero value", function () {
                assert.equal(cache.toTimespan(0), 0);
            });
        });

        describe("string inputs", function () {
            it("should convert days to seconds", function () {
                assert.equal(cache.toTimespan("1d"), 86400);
                assert.equal(cache.toTimespan("2d"), 172800);
                assert.equal(cache.toTimespan("7d"), 604800);
            });

            it("should convert hours to seconds", function () {
                assert.equal(cache.toTimespan("1h"), 3600);
                assert.equal(cache.toTimespan("2h"), 7200);
                assert.equal(cache.toTimespan("24h"), 86400);
            });

            it("should convert minutes to seconds", function () {
                assert.equal(cache.toTimespan("1m"), 60);
                assert.equal(cache.toTimespan("30m"), 1800);
                assert.equal(cache.toTimespan("60m"), 3600);
            });

            it("should convert seconds to seconds", function () {
                assert.equal(cache.toTimespan("1s"), 1);
                assert.equal(cache.toTimespan("30s"), 30);
                assert.equal(cache.toTimespan("60s"), 60);
            });

            it("should convert weeks to seconds", function () {
                assert.equal(cache.toTimespan("1w"), 604800);
                assert.equal(cache.toTimespan("2w"), 1209600);
            });

            it("should convert milliseconds to seconds", function () {
                assert.equal(cache.toTimespan("1000ms"), 1);
                assert.equal(cache.toTimespan("60000ms"), 60);
            });

            it("should return NaN for compound time strings (not supported)", function () {
                // The ms library doesn't support compound time strings
                assert.equal(cache.toTimespan("1h30m"), NaN);
                assert.equal(cache.toTimespan("1d12h"), NaN);
            });
        });

        describe("edge cases", function () {
            it("should handle negative numbers", function () {
                assert.equal(cache.toTimespan(-3600), -3600);
            });

            it("should return NaN for invalid string input", function () {
                assert.equal(cache.toTimespan("invalid"), NaN);
            });

            it("should handle floating point numbers", function () {
                assert.equal(cache.toTimespan(3600.5), 3600);
            });
        });
    });

    describe("generateHeader()", function () {
        describe("scope handling", function () {
            it("should add public scope when specified", function () {
                const result = cache.generateHeader({ scope: "public" });
                assert.ok(result.includes("public"));
            });

            it("should add private scope when specified", function () {
                const result = cache.generateHeader({ scope: "private" });
                assert.ok(result.includes("private"));
            });

            it("should default to private when no scope is specified and not no-cache", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                assert.ok(result.includes("private"));
            });
        });

        describe("noCache handling", function () {
            it("should add no-cache and no-store when noCache is true", function () {
                const result = cache.generateHeader({ noCache: true });
                assert.ok(result.includes("no-cache"));
                assert.ok(result.includes("no-store"));
            });

            it("should not add max-age when noCache is true", function () {
                const result = cache.generateHeader({ noCache: true, ttl: 3600 });
                const hasMaxAge = result.some(item => item.startsWith("max-age="));
                assert.equal(hasMaxAge, false);
            });

            it("should not add private scope when noCache is true without explicit scope", function () {
                const result = cache.generateHeader({ noCache: true });
                assert.ok(!result.includes("private"));
            });

            it("should respect explicit scope even with noCache", function () {
                const result = cache.generateHeader({ noCache: true, scope: "public" });
                assert.ok(result.includes("public"));
            });
        });

        describe("TTL handling", function () {
            it("should add max-age with numeric TTL", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                assert.ok(result.includes("max-age=3600"));
            });

            it("should add max-age with string TTL", function () {
                const result = cache.generateHeader({ ttl: "1h" });
                assert.ok(result.includes("max-age=3600"));
            });

            it("should use default TTL when not specified", function () {
                const result = cache.generateHeader({});
                const defaultTtlSeconds = cache.toTimespan(cache.defaultTTL);
                assert.ok(result.includes(`max-age=${defaultTtlSeconds}`));
            });

            it("should add s-maxage when sttl is specified", function () {
                const result = cache.generateHeader({ ttl: 3600, sttl: 7200 });
                assert.ok(result.includes("s-maxage=7200"));
            });

            it("should add s-maxage with string sttl", function () {
                const result = cache.generateHeader({ ttl: 3600, sttl: "2h" });
                assert.ok(result.includes("s-maxage=7200"));
            });
        });

        describe("invalid TTL handling", function () {
            const invalidTTLs = ["1h30m", "invalid", "-1h", -5, Infinity, true];

            invalidTTLs.forEach(function (ttl) {
                it(`should emit max-age=0 for ttl ${ttl} (${typeof ttl})`, function () {
                    const result = cache.generateHeader({ ttl: ttl });
                    assert.deepEqual(result, ["private", "max-age=0"]);
                });

                it(`should emit s-maxage=0 for sttl ${ttl} (${typeof ttl})`, function () {
                    const result = cache.generateHeader({ ttl: 60, sttl: ttl });
                    assert.deepEqual(result, ["private", "max-age=60", "s-maxage=0"]);
                });
            });
        });

        describe("revalidation flags", function () {
            it("should add must-revalidate when specified", function () {
                const result = cache.generateHeader({ mustRevalidate: true });
                assert.ok(result.includes("must-revalidate"));
            });

            it("should add proxy-revalidate when specified", function () {
                const result = cache.generateHeader({ proxyRevalidate: true });
                assert.ok(result.includes("proxy-revalidate"));
            });

            it("should add both revalidation flags when both specified", function () {
                const result = cache.generateHeader({
                    mustRevalidate: true,
                    proxyRevalidate: true,
                });
                assert.ok(result.includes("must-revalidate"));
                assert.ok(result.includes("proxy-revalidate"));
            });

            it("should not add revalidation flags when not specified", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                assert.ok(!result.includes("must-revalidate"));
                assert.ok(!result.includes("proxy-revalidate"));
            });
        });

        describe("no-transform flag", function () {
            it("should add no-transform when specified", function () {
                const result = cache.generateHeader({ noTransform: true });
                assert.ok(result.includes("no-transform"));
            });

            it("should not add no-transform when not specified", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                assert.ok(!result.includes("no-transform"));
            });
        });

        describe("complex scenarios", function () {
            it("should generate correct header for public cache with all options", function () {
                const result = cache.generateHeader({
                    scope: "public",
                    ttl: 3600,
                    sttl: 7200,
                    mustRevalidate: true,
                    proxyRevalidate: true,
                    noTransform: true,
                });

                assert.ok(result.includes("public"));
                assert.ok(result.includes("max-age=3600"));
                assert.ok(result.includes("s-maxage=7200"));
                assert.ok(result.includes("must-revalidate"));
                assert.ok(result.includes("proxy-revalidate"));
                assert.ok(result.includes("no-transform"));
            });

            it("should generate correct header for disabled cache", function () {
                const result = cache.generateHeader({
                    noCache: true,
                    mustRevalidate: true,
                    proxyRevalidate: true,
                });

                assert.ok(result.includes("no-cache"));
                assert.ok(result.includes("no-store"));
                assert.ok(result.includes("must-revalidate"));
                assert.ok(result.includes("proxy-revalidate"));
            });

            it("should generate correct header for secure cache", function () {
                const result = cache.generateHeader({
                    scope: "private",
                    noCache: true,
                    mustRevalidate: true,
                    noTransform: true,
                });

                assert.ok(result.includes("private"));
                assert.ok(result.includes("no-cache"));
                assert.ok(result.includes("no-store"));
                assert.ok(result.includes("must-revalidate"));
                assert.ok(result.includes("no-transform"));
            });

            it("should handle empty options object", function () {
                const result = cache.generateHeader({});
                assert.ok(Array.isArray(result));
                assert.ok(result.length > 0);
            });

            it("should throw error for undefined options", function () {
                // The code doesn't handle undefined, which is expected behavior
                assert.throws(() => cache.generateHeader(undefined), TypeError);
            });

            it("should throw error for null options", function () {
                // The code doesn't handle null, which is expected behavior
                assert.throws(() => cache.generateHeader(null), TypeError);
            });
        });
    });
});
