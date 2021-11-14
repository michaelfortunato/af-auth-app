/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  accessTokenPrivateKeys,
  refreshTokenPrivateKeys,
  refreshTokenPublicKeys
} from "./secrets";

// Make this middlewear
const generateAccessToken = contents => {
  // Get a random kid
  const kid = Math.floor(Math.random() * accessTokenPrivateKeys.length);
  const privateKey = accessTokenPrivateKeys[kid];
  const algorithm = "RS256";
  const token = jwt.sign(contents, privateKey, {
    keyid: kid.toString(),
    expiresIn: "15min",
    algorithm
  });
  return token;
};

const generateRefreshToken = contents => {
  const jwtid = uuidv4();
  const kid = Math.floor(Math.random() * refreshTokenPrivateKeys.length);
  const privateKey = refreshTokenPrivateKeys[kid];
  const algorithm = "RS256";
  const token = jwt.sign(contents, privateKey, {
    jwtid,
    keyid: kid.toString(),
    expiresIn: "7d",
    algorithm
  });
  return [jwtid, token];
};

export { generateAccessToken, generateRefreshToken, refreshTokenPublicKeys };
