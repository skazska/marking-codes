const codes = require('./index.js');

console.log('batch: ', codes.prepareBatch({id: 0, producerId: 0, version: 0}));


let keys = {"pub":858450,"pri":816};
//let keys = {"pub":1,"pri":1021}

let batch = {
    id: 0,
    version: 0,
    producerId: 60466177,
    dsa: { q: 1009, p: 932317, g: 730099 },
    publicKey: keys.pub,
    privateKey: keys.pri
};


//exceding test
// let code = codes.encode( batch, 0);
// console.log('code (prod '+batch.producerId+' bat '+batch.id+' id '+0+'): ', code);
// code = codes.decode( code, batch.publicKey);
// console.log('back: ', code);


//versions
const versions = [0, 7, 15];
batch.producerId = 60466175;
batch.id = 0;
let id = 46655;

for (let l = 0; l < versions.length; l++) {
    let code = codes.encode(batch, 46655, versions[l]);
    console.log('code (ver '+versions[l]+' prod '+batch.producerId+' bat '+batch.id+' id '+id+'): ', code);
    code = codes.decode( code, batch);
    console.log('back: ', code);
    batch.producerId = 0;
    batch.id = 60466175;
    id = 0;
}

//cases test
const producers = [0, 1, 1295, 1296, 46656, 46657, 1679616, 60466175];
const batches = [0, 1, 1295, 1296, 46656, 46657, 1679616, 1679617];

let fails = 0;
let badSigns = 0;
let collisions = 0;
let total = 0;

for (let i = 3; i < producers.length; i++) {
    batch.producerId = producers[i];

    for (let j = 5; j < batches.length; j++) {
        batch.id = batches[j];

        for (let k = 0; k < 1679616; k = k + 33) {
            total++;
            let code = codes.encode( batch, k);
            // console.log('code (prod '+batch.producerId+' bat '+batch.id+' id '+k+'): ', code);
            let decode = codes.decode( code, batch);
            // console.log('back: ', decode);
            if (decode.producerId !== batch.producerId || decode.batchId !== batch.id || decode.id !== k) {
                fails++;
                console.log('fail:');
                console.log('code (prod '+batch.producerId+' bat '+batch.id+' id '+k+'): ', code);
                console.log('back: ', decode);
            }
            if (!decode.signOk) {
                badSigns++;
                console.log('sign check fail:');
                console.log('code (prod '+batch.producerId+' bat '+batch.id+' id '+k+'): ', code);
                console.log('back: ', decode);
            }

            let letter = code[code.length-1];
            letter = letter === 'A' ? '0' : 'A';
            code = code.substring(0, code.length-1) + letter;
            decode = codes.decode( code, batch);
            if (decode.signOk) {
                collisions++;
                // console.log('sign collision:');
                // console.log('code (prod '+batch.producerId+' bat '+batch.id+' id '+k+'): ', code);
                // console.log('back: ', decode);
            }
        }
    }
}

console.log('total: ', total, 'fails: ', fails, ' badSigns: ', badSigns, ' collisions:', collisions, ' %', collisions/total*100);
