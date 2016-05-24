var expect = require('chai').expect;
var ms = require('ms');
var cache = require('../src/cache');
var Response = require('./mocks/response');

describe('Cache Middleware', function () {

    var ttl = 3600;

    it('cache disabled', function (done) {
        var middleware = cache.disable();
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function(res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();
            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('no-store');
            expect(controls).to.property('no-cache');
            expect(controls).to.property('must-revalidate');
            expect(controls).to.property('proxy-revalidate');

            var pragma = res.get('Pragma');
            expect(pragma).to.not.null();
            expect(pragma).to.equal('no-cache');
            done();
        });
    });

    it('cache secure', function (done) {
        var middleware = cache.secure();
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function (res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();
            expect(cacheControl.indexOf('private')).to.equal(0);

            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('no-store');
            expect(controls).to.property('no-cache');
            expect(controls).to.property('must-revalidate');
            expect(controls).to.property('no-transform');

            var pragma = res.get('Pragma');
            expect(pragma).to.not.null();
            expect(pragma).to.equal('no-cache');
            done();
        });
    });

    it('cache with no TTL', function (done) {
        var middleware = cache.private();
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function (res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();

            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('max-age')
                .and.to.equal(cache.toTimespan(cache.defaultTTL));
            done();
        });
    });

    it('cache private', function (done) {
        var middleware = cache.private(ttl);
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function (res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();
            expect(cacheControl.indexOf('private')).to.equal(0);

            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('max-age').and.to.equal(ttl);
            done();
        });
    });

    it('cache private, with custom options', function (done) {
        var middleware = cache.private(ttl, {mustRevalidate: true});
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function (res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();
            expect(cacheControl.indexOf('private')).to.equal(0);

            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('max-age').and.to.equal(ttl);
            expect(controls).to.property('must-revalidate');
            done();
        });
    });

    it('cache public', function (done) {
        var middleware = cache.public(ttl);
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function (res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();
            expect(cacheControl.indexOf('public')).to.equal(0);

            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('max-age').and.to.equal(ttl);
            expect(controls).to.property('s-maxage').and.to.equal(ttl);
            done();
        });
    });

    it('cache public, with custom options', function (done) {
        var middleware = cache.public(ttl, {mustRevalidate: true});
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function (res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();
            expect(cacheControl.indexOf('public')).to.equal(0);

            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('max-age').and.to.equal(ttl);
            expect(controls).to.property('s-maxage').and.to.equal(ttl);
            expect(controls).to.property('must-revalidate');
            done();
        });
    });

    it('cache custom', function (done) {
        var middleware = cache.custom({
            ttl: ttl,
            sttl: ttl,
            scope: 'public',
            mustRevalidate: true,
            proxyRevalidate: true,
            noTransform: true
        });
        expect(middleware).to.not.null();
        expect(middleware).to.be.a('function');
        runMiddleware(middleware, function (res) {
            var cacheControl = res.get('Cache-Control');
            expect(cacheControl).to.not.null();
            expect(cacheControl.indexOf('public')).to.equal(0);

            var controls = parseCacheControl(cacheControl);
            expect(controls).to.property('max-age').and.to.equal(ttl);
            expect(controls).to.property('s-maxage').and.to.equal(ttl);
            expect(controls).to.property('must-revalidate');
            expect(controls).to.property('no-transform');
            expect(controls).to.property('proxy-revalidate');
            done();
        });
    });

    function runMiddleware(middleware, callback) {
        var res = new Response();
        middleware.call(middleware, {}, res, function () {
            callback(res);
        });
    }

    function parseCacheControl(input) {
        //console.log('Cache-Control:', input);
        var parts = input.split(',');
        return parts.reduce(function (prev, current) {
            var value = true;
            var key = current.trim();
            if (current.indexOf(':') !== -1) {
                var keyAndValue = current.split(':');
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
