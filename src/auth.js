const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const fs = require('fs');
const config = require('./config.json');

exports.generateAccessToken = (contents) => {
    const privateKeyPath = process.env.privateKeyFile || './jwtRS256_1.key'
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');
    console.log(privateKey)
    const algorithm = 'RS256';
    const token = jwt.sign(contents, privateKey, {algorithm: algorithm});
    return token;
}


