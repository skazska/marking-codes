const v0 = require('./v0');
const b36 = require('@skazska/base36-utils');

const VERSIONS = [
    v0,
    null,
    null,
    null,
    null,
    null,
    null,
    v0,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    v0,
];

/**
 * marking code:
 * 1 st symbol will always be [0-9A-Z] charecter for any version (first 4 bits should contain major version of code)
 * this is a part (or a whole) of code descriptior.
 * rest of code may depend on code version, version can affect anything up to dsa params used
 */


/**
 * creates alphanum representation of marking code
 * @param {{q: number, p: number, g: number}} dsaParams
 * @param {{version: number, producerId: number, batch: {id: number, publicKey: number}, privateKey: number}} batch
 * @param {number} id
 */
function encode(batch, id) {
    return VERSIONS[batch.version || 0].encode.apply(this, arguments);
}

function decode(code, batch) {
    if (!code) return;
    let cd = b36.str2Int36(code.substr(0, 2)) >>> 6;
    return VERSIONS[cd].decode.apply(this, arguments);
}

module.exports = {
    versions: VERSIONS,
    encode: encode,
    decode: decode
};
