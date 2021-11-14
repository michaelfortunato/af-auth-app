import express from "express";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  refreshTokenPublicKeys
} from "./auth";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Check that a refresh-token exists
    const authCollection =
      req.app.locals.database.collection("Verified-Accounts");

    const {
      header: { kid },
      payload: { email, jti }
    } = jwt.decode(req.body.refreshToken, {
      complete: true
    });
    // Decode the refresh token and get the header, which contains the jwtid
    const publicKey = refreshTokenPublicKeys[kid];
    const account = await authCollection.findOne({
      _id: email,
      email
    });

    if (account === null) {
      return res
        .status(401)
        .send({ statusMessage: "Could not log in. Account does not exist." });
    }
    // Verify the jwt and make sure its id matches the one we have stored in the db
    const actualJwtId = account.refreshTokenId;
    if (actualJwtId === null || actualJwtId === undefined) {
      console.log("here");
      throw new Error(
        `Token jwtid/jti ${jti} does not match database jwtid ${actualJwtId}`
      );
    }
    console.log(account);
    console.log(account);
    jwt.verify(req.body.refreshToken, publicKey, {
      jwtid: actualJwtId,
      algorithm: "RS256"
    });

    // On successful verification, (no throw), generate the new tokens
    const accessToken = generateAccessToken({
      name: account.name,
      email: account.email
    });
    const [refreshTokenId, refreshToken] = generateRefreshToken({
      name: account.name,
      email: account.email
    });

    // Update the db to account for the new refreshTokenId,
    // >>> this is what auth0 calls 'smart' refresh-key rotation
    await authCollection.updateOne(
      { _id: account.email },
      {
        $set: {
          refreshTokenId
        }
      }
    );
    return res.status(200).send({
      accessToken,
      refreshToken,
      statusMessage: "Generated new access and refresh tokens"
    });
  } catch (error) {
    console.log(error);
    return res.status(401).send({ statusMessage: error.message });
  }
});

export default router;
