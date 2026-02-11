const { expect } = require("chai");
const cache = require("../../src/cache");

describe("Cache Internal Functions", function () {
    describe("toTimespan()", function () {
        describe("numeric inputs", function () {
            it("should return numeric value as-is for positive integers", function () {
                expect(cache.toTimespan(3600)).to.equal(3600);
                expect(cache.toTimespan(60)).to.equal(60);
                expect(cache.toTimespan(1)).to.equal(1);
            });

            it("should return numeric value for large numbers", function () {
                expect(cache.toTimespan(86400)).to.equal(86400);
                expect(cache.toTimespan(31536000)).to.equal(31536000);
            });

            it("should return 0 for zero value", function () {
                expect(cache.toTimespan(0)).to.equal(0);
            });
        });

        describe("string inputs", function () {
            it("should convert days to seconds", function () {
                expect(cache.toTimespan("1d")).to.equal(86400);
                expect(cache.toTimespan("2d")).to.equal(172800);
                expect(cache.toTimespan("7d")).to.equal(604800);
            });

            it("should convert hours to seconds", function () {
                expect(cache.toTimespan("1h")).to.equal(3600);
                expect(cache.toTimespan("2h")).to.equal(7200);
                expect(cache.toTimespan("24h")).to.equal(86400);
            });

            it("should convert minutes to seconds", function () {
                expect(cache.toTimespan("1m")).to.equal(60);
                expect(cache.toTimespan("30m")).to.equal(1800);
                expect(cache.toTimespan("60m")).to.equal(3600);
            });

            it("should convert seconds to seconds", function () {
                expect(cache.toTimespan("1s")).to.equal(1);
                expect(cache.toTimespan("30s")).to.equal(30);
                expect(cache.toTimespan("60s")).to.equal(60);
            });

            it("should convert weeks to seconds", function () {
                expect(cache.toTimespan("1w")).to.equal(604800);
                expect(cache.toTimespan("2w")).to.equal(1209600);
            });

            it("should convert milliseconds to seconds", function () {
                expect(cache.toTimespan("1000ms")).to.equal(1);
                expect(cache.toTimespan("60000ms")).to.equal(60);
            });

            it("should return NaN for compound time strings (not supported)", function () {
                // The ms library doesn't support compound time strings
                expect(cache.toTimespan("1h30m")).to.be.NaN;
                expect(cache.toTimespan("1d12h")).to.be.NaN;
            });
        });

        describe("edge cases", function () {
            it("should handle negative numbers", function () {
                expect(cache.toTimespan(-3600)).to.equal(-3600);
            });

            it("should return NaN for invalid string input", function () {
                expect(cache.toTimespan("invalid")).to.be.NaN;
            });

            it("should handle floating point numbers", function () {
                expect(cache.toTimespan(3600.5)).to.equal(3600);
            });
        });
    });

    describe("generateHeader()", function () {
        describe("scope handling", function () {
            it("should add public scope when specified", function () {
                const result = cache.generateHeader({ scope: "public" });
                expect(result).to.include("public");
            });

            it("should add private scope when specified", function () {
                const result = cache.generateHeader({ scope: "private" });
                expect(result).to.include("private");
            });

            it("should default to private when no scope is specified and not no-cache", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                expect(result).to.include("private");
            });
        });

        describe("noCache handling", function () {
            it("should add no-cache and no-store when noCache is true", function () {
                const result = cache.generateHeader({ noCache: true });
                expect(result).to.include("no-cache");
                expect(result).to.include("no-store");
            });

            it("should not add max-age when noCache is true", function () {
                const result = cache.generateHeader({ noCache: true, ttl: 3600 });
                const hasMaxAge = result.some(item => item.startsWith("max-age="));
                expect(hasMaxAge).to.be.false;
            });

            it("should not add private scope when noCache is true without explicit scope", function () {
                const result = cache.generateHeader({ noCache: true });
                expect(result).to.not.include("private");
            });

            it("should respect explicit scope even with noCache", function () {
                const result = cache.generateHeader({ noCache: true, scope: "public" });
                expect(result).to.include("public");
            });
        });

        describe("TTL handling", function () {
            it("should add max-age with numeric TTL", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                expect(result).to.include("max-age=3600");
            });

            it("should add max-age with string TTL", function () {
                const result = cache.generateHeader({ ttl: "1h" });
                expect(result).to.include("max-age=3600");
            });

            it("should use default TTL when not specified", function () {
                const result = cache.generateHeader({});
                const defaultTtlSeconds = cache.toTimespan(cache.defaultTTL);
                expect(result).to.include(`max-age=${defaultTtlSeconds}`);
            });

            it("should add s-maxage when sttl is specified", function () {
                const result = cache.generateHeader({ ttl: 3600, sttl: 7200 });
                expect(result).to.include("s-maxage=7200");
            });

            it("should add s-maxage with string sttl", function () {
                const result = cache.generateHeader({ ttl: 3600, sttl: "2h" });
                expect(result).to.include("s-maxage=7200");
            });
        });

        describe("revalidation flags", function () {
            it("should add must-revalidate when specified", function () {
                const result = cache.generateHeader({ mustRevalidate: true });
                expect(result).to.include("must-revalidate");
            });

            it("should add proxy-revalidate when specified", function () {
                const result = cache.generateHeader({ proxyRevalidate: true });
                expect(result).to.include("proxy-revalidate");
            });

            it("should add both revalidation flags when both specified", function () {
                const result = cache.generateHeader({
                    mustRevalidate: true,
                    proxyRevalidate: true,
                });
                expect(result).to.include("must-revalidate");
                expect(result).to.include("proxy-revalidate");
            });

            it("should not add revalidation flags when not specified", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                expect(result).to.not.include("must-revalidate");
                expect(result).to.not.include("proxy-revalidate");
            });
        });

        describe("no-transform flag", function () {
            it("should add no-transform when specified", function () {
                const result = cache.generateHeader({ noTransform: true });
                expect(result).to.include("no-transform");
            });

            it("should not add no-transform when not specified", function () {
                const result = cache.generateHeader({ ttl: 3600 });
                expect(result).to.not.include("no-transform");
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

                expect(result).to.include("public");
                expect(result).to.include("max-age=3600");
                expect(result).to.include("s-maxage=7200");
                expect(result).to.include("must-revalidate");
                expect(result).to.include("proxy-revalidate");
                expect(result).to.include("no-transform");
            });

            it("should generate correct header for disabled cache", function () {
                const result = cache.generateHeader({
                    noCache: true,
                    mustRevalidate: true,
                    proxyRevalidate: true,
                });

                expect(result).to.include("no-cache");
                expect(result).to.include("no-store");
                expect(result).to.include("must-revalidate");
                expect(result).to.include("proxy-revalidate");
            });

            it("should generate correct header for secure cache", function () {
                const result = cache.generateHeader({
                    scope: "private",
                    noCache: true,
                    mustRevalidate: true,
                    noTransform: true,
                });

                expect(result).to.include("private");
                expect(result).to.include("no-cache");
                expect(result).to.include("no-store");
                expect(result).to.include("must-revalidate");
                expect(result).to.include("no-transform");
            });

            it("should handle empty options object", function () {
                const result = cache.generateHeader({});
                expect(result).to.be.an("array");
                expect(result.length).to.be.greaterThan(0);
            });

            it("should throw error for undefined options", function () {
                // The code doesn't handle undefined, which is expected behavior
                expect(() => cache.generateHeader(undefined)).to.throw(TypeError);
            });

            it("should throw error for null options", function () {
                // The code doesn't handle null, which is expected behavior
                expect(() => cache.generateHeader(null)).to.throw(TypeError);
            });
        });
    });
});
