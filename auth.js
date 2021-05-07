const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const fs = require('fs');
const config = require('./config.json');

exports.generateAccessToken = (contents) => {
    const private_key = fs.readFileSync(config.privateKeyFile);
    const algorithm = config.algorithm;
    const token = jwt.sign(contents, private_key, {algorithm: algorithm});
    return token;
}


