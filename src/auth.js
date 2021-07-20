const jwt = require('jsonwebtoken');
const body_parser = require('body-parser');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

let accessTokenPublicKeys = [];
let accessTokenPrivateKeys = [];
let refreshTokenPublicKeys = [];
let refreshTokenPrivateKeys = [];

// Load the tokens 
exports.initAuth =() => {
    const accessTokenKeyDir = "/etc/secret-volume/jwts/access-tokens";
    const refreshTokenKeyDir = "/etc/secret-volume/jwts/refresh-tokens";
    fs.readdirSync(accessTokenKeyDir).forEach(file => {
        if (file.split('.').pop() === 'key') {
            accessTokenPrivateKeys.push(fs.readFileSync(accessTokenKeyDir+'/'+file, 'utf-8'));
        } else if (file.split(".").pop() === "pub") {
           accessTokenPublicKeys.push(fs.readFileSync(accessTokenKeyDir+"/"+file, "utf-8"));
        }
    });
    fs.readdirSync(refreshTokenKeyDir).forEach(file => {
        if (file.split('.').pop() === 'key') {
            refreshTokenPrivateKeys.push(fs.readFileSync(refreshTokenKeyDir+'/'+file, 'utf-8'));
        } else if (file.split(".").pop() === "pub") {
          refreshTokenPublicKeys.push(fs.readFileSync(refreshTokenKeyDir+"/"+file, "utf-8"));
        }
    });

    if (accessTokenPrivateKeys.length == 0 || refreshTokenPrivateKeys.length == 0) {
        throw 'Could not initialize auth service'
    }
     
    console.log("Initialized auth service! 🔥");
}

// Make this middlewear
exports.generateAccessToken = (contents) => {
    // Get a random kid 
    const kid = Math.floor(Math.random() * accessTokenPrivateKeys.length);
    const privateKey = accessTokenPrivateKeys[kid] ;
    const algorithm = 'RS256';
    const token = jwt.sign(contents, privateKey, {keyid: kid.toString(), expiresIn: '15min', algorithm: algorithm});
    return token;
}

exports.generateRefreshToken = (contents) => {
    const jwtid = uuidv4()
    const kid = Math.floor(Math.random() * refreshTokenPrivateKeys.length);
    const privateKey = refreshTokenPrivateKeys[kid] ;
    const algorithm = 'RS256';
    const token = jwt.sign(contents, privateKey, {jwtid: jwtid, keyid: kid.toString(), expiresIn: '7d', algorithm: algorithm});
    return [jwtid, token];
}

exports.refreshTokenPublicKeys = refreshTokenPublicKeys;