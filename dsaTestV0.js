const {doSign, verify} = require('@skazska/nano-dsa');


function randomMessage(len) {
    let codes = [];
    for (let i = 0; i < len; i++) {
        codes.push(Math.round(Math.random()*35));
    }
    return codes;
}

const HASH_LEN = 5;
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
        let code = text[i];
        if (code !== null) {
            codes[pos][partPos] = code;
            partPos += 1;
        }
        if (partPos === HASH_LEN) {
            partPos = 0;
            pos += 1;
        }
    }

    if (partPos) {
        for (let i = 0; i < HASH_LEN - partPos; i++) {
            codes[pos].push(0);
        }
    }

    return [codes.reduce((result, code) => {
        result = result ^ code.reduce((r, v, i) => {
            return r + v * Math.pow(v, i);
        }, 0);
        return result;
    }, 0)];
}

/**
 * qiuck test for given dsa parameters and keys
 * @param params
 * @param keys
 * @param trial
 * @return {boolean}
 */
function quickTest(params, keys, trial) {
    let failCnt = {
        tot: 0,
        fails: 0,
        collisions: 0
    };
    let maxS = 0;
    let maxR = 0;

    // console.log('batch creation dsa params & keys quick test: (trial ' + trial + ')');

    for (let j = 0; j < 8; j++) {
        let charsName = ''+(10+j)+' chars';
        failCnt[charsName] = {tot: 0, fails: 0, collisions: 0};

        // if (!x) console.log(charsName)

        for (let i = 0; i < 1000; i++) {
            failCnt.tot += 1;
            failCnt[charsName].tot += 1;

            let fail = false;
            let message = randomMessage(10 + j + 1);

            // if (!x) console.log('sign', message);

            let sign = doSign(params, keys.pri, message, vsHash);
            let messageToTest = message.slice();
            let messageToCollide = randomMessage(10 + j + 1);

            sign.forEach(({r, s}) => {
                maxR = Math.max(maxR, r);
                maxS = Math.max(maxS, s);
            });

            // if (!x) console.log('verify', messageToTest);
            if (!verify(params, keys.pub, sign, messageToTest, vsHash)) {
                console.log(message, sign, 'failed to verify ', messageToTest, i);
                fail = true;
            }
            // if (!x) console.log('verify', messageToTest);
            if (verify(params, keys.pub, sign, messageToCollide, vsHash)) {
                // console.log(message, sign, 'failed to verify ', 'SOMEOTHER123', i);
                if (!failCnt[charsName]) console.log('*** ', charsName);
                failCnt.collisions += 1;
                failCnt[charsName].collisions += 1;
            }
            if (fail){
                if (!failCnt[charsName]) console.log('*** ', charsName);
                failCnt.fails += 1;
                failCnt[charsName].fails += 1;
            }
        }
    }

    // console.log('total probes: ', failCnt.tot,
    //     ' failed: ', failCnt.fails,
    //     ' fail percent: ', failCnt.fails/failCnt.tot*100,
    //     ' collisions: ', failCnt.collisions,
    //     ' collision percent: ', failCnt.collisions/failCnt.tot*100
    // );
    // console.log('maxS: ', maxS, 'maxR: ', maxR);

    let result = failCnt.tot === 8000 && failCnt.fails === 0 && failCnt.collisions/failCnt.tot*100 < 5;

    // console.log('result: ', result ? 'Ok.' : 'not Ok.');

    return result;
}

module.exports = {
    quickTest: quickTest
};