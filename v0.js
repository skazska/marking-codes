const dsa = require('@skazska/nano-dsa');
const b36 = require('@skazska/base36-utils');
const hash = require('./v0-hash');

//const VERSION = 15;
// const VERSION = 7;
const VERSION = 0;

/**
 * Version 0 marking code:
 * 1 st and 2nd symbols represent code descriptior on version 0
 * next 2-5 symbols represent producer id
 * next 3-10 symbols represent code batch
 * next 3-any symbols represent a code in a batch
 * last 4 or 6 symbols represent the sign of code
 *
 * variations of blocks for producer batch and sign indicated in code descriptior
 */

/**
 *
 * @param {string} producerId
 * @param {string} batchId
 * @param {string} id
 * @returns {string}
 */
function composeCode(producerId, batchId, id) {
    return producerId + batchId + id;
}

/**
 * code consists of 2 36 capacity digits representing 1296 values, so we can use 10 bits (1023) binary structure
 * descr structure:
 * first 4 bits - version 0 - 15
 * next  2 bits - producer code length extension 0 - 3 (assuming min 2 digits producerId length can vary from 2 to 5)
 * next  3 bits - batch code length extension 0 - 7 (assuming min 3 digits batchId length can vary from 3 to 10)
 * last  1 bit  - indicates code digital sign length extention (asume base length 4 digits extended sign will be 6) (not actual)
 * @param {string} producerId
 * @param {string} batchId
 * @param {string} id
 * @param sign
 * @param {number} [ver]
 * @returns {string}
 */
function generateCodeDescr(producerId, batchId, id, sign, ver) {
    let descr = 0; //this is version 0 code description

    descr = descr | ((typeof ver === 'undefined' ? VERSION : ver) << 6);

    if (producerId.length > 5) return '';
    let producerIdLength = producerId.length - 2;
    descr = descr | (producerIdLength << 4);

    if (batchId.length > 10) return '';
    let batchIdLength = batchId.length - 3;
    descr = descr | (batchIdLength << 1);

    if (sign.length !== 4) return '';
    // if (sign.length !== 4 && sign.length !== 6) return '';
    if (sign.length === 6) descr = descr | 1;

    return b36.int2Str36(descr).padStart(2, '0');
}

/**
 *
 * @param {string} code
 * @return {{producerIdLenExt: number, batchIdLenExt: number, signExt: number, version: number}}
 */
function decodeCodeDescr(code) {
    let descr = b36.str2Int36(code.substr(0, 2));

    let signExt = descr & 1;
    let batchExtLen = (descr >>> 1) & 7;
    let producerExtLen = (descr >>> 4) & 3;
    let version = (descr >>> 6) & 15;


    return {
        version: version,
        producerIdLenExt: producerExtLen,
        batchIdLenExt: batchExtLen,
        signExt: signExt
    }
}

/**
 *
 * @param {[{r: number, s: number}]} sign
 * @return {string}
 */
function sign2Str36(sign) {
    let result = '';
    sign.forEach(({r, s}) => {
        let rS = b36.int2Str36(r).padStart(2, '0');
        let sS = b36.int2Str36(s).padStart(2, '0');
        result += rS + sS;
    });

    return result;
}

/**
 *
 * @param {string} sign
 * @param {number} blockLen
 * @return {[{r: number, s: number}]}
 */
function str2Sign36(sign, blockLen) {
    let result = [];
    let pos = 0;
    do {
        let r = sign.substr(pos, blockLen);
        pos += blockLen;
        let s = sign.substr(pos, blockLen);
        pos += blockLen;
        result.push({
            r: b36.str2Int36(r),
            s: b36.str2Int36(s)
        });
    } while (pos < sign.length);

    return result;
}

/**
 * creates alphanum representation of marking code
 * @param {{id: number, dsa: {q: number, p: number, g: number}, version: number, producerId: number, publicKey: number, privateKey: number}} batch
 * @param {*} id
 * @param {number} [ver]
 */
function encode(batch, id, ver) {
    //producerId min 2 digits
    let producerId = b36.int2Str36(batch.producerId).padStart(2, '0');
    //producerId min 3 digits
    let batchId = b36.int2Str36(batch.id).padStart(3, '0');
    //id min 2 digits
    id = b36.int2Str36(id).padStart(3, '0');

    let msg = composeCode(producerId, batchId, id);

    let sign = sign2Str36(dsa.doSign(batch.dsa, batch.privateKey, msg, hash.vsHash));

    let codeDescr =  generateCodeDescr(producerId, batchId, id, sign, ver);

    return codeDescr ? (codeDescr + msg + sign) : '';
}

/**
 *
 * @param {string} code
 * @param {{id: number, dsa: {q: number, p: number, g: number}, version: number, producerId: number, publicKey: number, privateKey: number}} batch
 * @return {{version: number, producerId: number, batchId: number, id: number, signOk: boolean}}
 */
function decode(code, batch) {
    let cd = decodeCodeDescr(code);
    let message = code.substring(2, code.length - (cd.signExt ? 6 : 4));
    let sign = code.substr(cd.signExt ? -6 : -4);
    let signOk = dsa.verify(batch.dsa, batch.publicKey, str2Sign36(sign, 2), message, hash.vsHash);
    let pos = 0;
    let producerId = message.substr(pos, 2 + cd.producerIdLenExt);
    pos = pos + 2 + cd.producerIdLenExt;
    let batchId = message.substr(pos, 3 + cd.batchIdLenExt);
    pos = pos + 3 + cd.batchIdLenExt;
    let id = message.substring(pos, code.length - (cd.signExt ? 6 : 4));

    return {
        version: cd.version,
        producerId: b36.str2Int36(producerId),
        batchId: b36.str2Int36(batchId),
        id: b36.str2Int36(id),
        signOk: signOk
    }
}

module.exports = {
    encode: encode,
    decode: decode
};