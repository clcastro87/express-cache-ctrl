const MockRes = require("mock-res");
const util = require("util");

/**
 * Response prototype.
 */

function Response() {
    MockRes.call(this);
}

util.inherits(Response, MockRes);

Response.prototype.set = function (field, val) {
    if (arguments.length === 2) {
        var value = Array.isArray(val) ? val.map(String) : String(val);

        this.setHeader(field, value);
    } else {
        for (let key in field) {
            this.set(key, field[key]);
        }
    }
    return this;
};

/**
 * Get value for header `field`.
 *
 * @param {String} field
 * @return {String}
 * @public
 */

Response.prototype.get = function (field) {
    return this.getHeader(field);
};

module.exports = Response;
