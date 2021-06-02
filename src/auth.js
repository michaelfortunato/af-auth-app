const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const fs = require('fs');
const config = require('./config.json');
const bcrypt = require('bcrypt');
let accessTokenPrivateKeys = [];

// Load the tokens 
exports.initAuth =() => {
    const privateKeyDir = "/etc/secret-volume/jwts";
    fs.readdirSync(privateKeyDir).forEach(file => {
        if (file.split('.').pop() === 'key') {
            accessTokenPrivateKeys.push(fs.readFileSync(privateKeyDir+'/'+file, 'utf-8'));
        }    
    });
    if (accessTokenPrivateKeys == 0) {
        throw 'Could not initialize auth service'
    }
}

// Make this middlewear
exports.generateAccessToken = (contents) => {
    // Get a random kid 
    const kid = Math.floor(Math.random() * accessTokenPrivateKeys.length);
    const privateKey = accessTokenPrivateKeys[kid] ;
    const algorithm = 'RS256';
    const token = jwt.sign(contents, privateKey, {algorithm: algorithm});
    return {kid: kid, token: token};
}


