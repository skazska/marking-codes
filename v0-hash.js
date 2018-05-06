const d36 = [Math.pow(36, 10), Math.pow(36, 9), Math.pow(36, 8), Math.pow(36, 7), Math.pow(36, 6), Math.pow(36, 5),
    Math.pow(36, 4), Math.pow(36, 3), Math.pow(36, 2), Math.pow(36, 1), Math.pow(36, 0)];

/**
 * generates 36 capacity digits string from integer result is string of [0-1A-Z]
 * @param {number} num
 * @returns {string}
 */
function int2Str36(num) {
    let baseIdx = d36.length;
    let result = [];
    let empty = null;
    if (num === 0) return '0';
    for (let i = 0; i < baseIdx; i++) {
        let d = d36[i];
        let c = 0;
        if (d <= num) {
            c = Math.trunc(num/d);
            num -= d * c;
            c = encodeCharCode2Int36(c);
            empty = encodeCharCode2Int36(0);
        } else {
            c = empty;
        }
        if (c) result.push(c);
    }
    return String.fromCharCode.apply(null, result);
}


/**
 * converts alphanum string of [0-9A-Z] into integer
 * @param {string} str
 * @return {number}
 */
function str2Int36(str) {
    const codes = [];
    for (let i = 0; i < str.length; i++) {
        let code = decodeCharCode2Int36(str.charCodeAt(i));
        if (code !== null) {
            codes.push(code);
        }
    }
    return codes.reverse().reduce((r, v, i) => {
        return r + v * Math.pow(36, i);
    }, 0);
}

/**
 * converts 0-35 integer to charCode of [0-9A-Z]
 * @param {number} v
 * @returns {number}
 */
function encodeCharCode2Int36(v) {
    return (0 <= v && v < 10) ? (v + 48) : ((10 <= v && v < 36) ? v + 55 : null);
}

/**
 * converts charCode of [0-9A-Z] to 0-35 integer
 * @param {number} d
 * @returns {number}
 */
function decodeCharCode2Int36(d) {
    return (47 < d && d < 58) ? (d - 48) : ((63 < d && d < 91) ? d - 55 : null);
}

const LEN = 5;
/**
 * hashes string value
 * @param text
 * @returns {Array}
 */
function vsHash(text) {
    let codes = [];
    let pos = 0;
    let partPos = 0;
    for (let i = 0; i < text.length; i++) {
        if (!codes[pos]) codes[pos]=[];
        let code = decodeCharCode2Int36(text.charCodeAt(i));
        if (code !== null) {
            codes[pos][partPos] = code;
            partPos += 1;
        }
        if (partPos === LEN) {
            partPos = 0;
            pos += 1;
        }
    }

    if (partPos) {
        for (let i = 0; i < LEN - partPos; i++) {
            codes[pos].push(0);
        }
    }

    return [codes.reduce((result, code) => {
        result = result ^ code.reduce((r, v, i) => {
            return r + v * Math.pow(36, i);
        }, 0);
        return result;
    }, 0)];
}

module.exports = {
    vsHash: vsHash,
    decodeCharCode2Int36: decodeCharCode2Int36,
    encodeCharCode2Int36: encodeCharCode2Int36,
    int2Str36: int2Str36,
    str2Int36: str2Int36
};