const express = require("express");
const { generateAccessToken, refreshTokenPublicKeys } = require("./auth");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Check that a refresh-token exists
    const accountsCollection = req.app.locals.database.collection("Verified-Accounts");
    const refreshToken = req.body.refreshToken;
    if (refreshToken === null) {
      return res
        .status(500)
        .send({ statusMessage: "Could not log in. Refresh token is empty." });
    }
    const refreshTokenKeyDir = "../secrets"; //"/etc/secret-volume/jwts/refresh-tokens";
    const { header } = jwt.decode(req.body.refreshToken, { complete: true });
    const kid = header.kid;
    const publicKey = refreshTokenPublicKeys[kid];
    const account = await accountsCollection.findOne({ _id: req.body.email });

    if (account === null) {
      return res
        .status(500)
        .send({ statusMessage: "Could not log in. Account does not exist." });
    }
    const jwtid = account.refreshTokenId;
    if (jwtid === null) {
      return res.sendStatus(401);
    }

    const isVerified = jwt.verify(refreshToken, publicKey, {
      jwtid: jwtid,
    });
    if (!isVerified) {
      return res.sendStatus(401);
    }

    const accessToken = generateAccessToken({ email: req.body.email });
    return res.status(200).send({
      accessToken: accessToken,
      statusMessage: "Generated new access token",
    });
  } catch (error) {
    return res.status(500).send({statusMessage: error.message});
  }
});

module.exports = router;
