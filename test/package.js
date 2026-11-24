const { expect } = require("chai");
const http = require("http");
const express = require("express");
const pkg = require("../package.json");
const cache = require("../src/cache");

describe("Package", function () {
    it("should not bundle express as a production dependency", function () {
        expect(pkg.dependencies).to.not.have.property("express");
    });

    it("should declare express as a peer dependency", function () {
        expect(pkg.peerDependencies).to.have.property("express");
    });

    it("should set headers in a real express app", function (done) {
        const app = express();
        app.get("/", cache.public("1h30m"), function (req, res) {
            res.send("ok");
        });
        const server = app.listen(0, "127.0.0.1", function () {
            const options = { host: "127.0.0.1", port: server.address().port, agent: false };
            http.get(options, function (res) {
                res.resume();
                server.close();
                expect(res.headers["cache-control"]).to.equal("public, max-age=0, s-maxage=0");
                done();
            }).on("error", done);
        });
    });
});
