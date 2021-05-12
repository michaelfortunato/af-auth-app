const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const fs = require('fs');
const config = require('./config.json');
let accessTokenPrivateKeys = [];

// Load the tokens 
exports.initAuth =() => {
    const privateKeyDir = '../keys' ////"/etc/secret-volume";
    fs.readdirSync(privateKeyDir).forEach(file => {
        console.log(file)
        if (file.split('.').pop() === 'key') {
            // Load the key value 
            accessTokenPrivateKeys.push(fs.readFileSync(privateKeyDir+'/'+file, 'utf-8'));
        }    
    });
    if (accessTokenPrivateKeys.length === 0) {
        throw 'Could not initialize auth service'
    }
}



exports.generateAccessToken = (contents) => {
    const privateKey = accessTokenPrivateKeys[0] ;
    const algorithm = 'RS256';
    const token = jwt.sign(contents, privateKey, {algorithm: algorithm});
    return token;
}


