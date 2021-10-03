const express = require("express");
const { generateAccessToken, refreshTokenPublicKeys } = require("./auth");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Check that a refresh-token exists
    const accountsCollection = req.app.locals.database.collection("Verified-Accounts");
    const { email } = jwt.decode(req.body.refreshToken);

    const { header } = jwt.decode(req.body.refreshToken, { complete: true });
    const kid = header.kid;
    const publicKey = refreshTokenPublicKeys[kid];
    const account = await accountsCollection.findOne({ _id: email, email: email });

    if (account === null) {
      return res
        .status(500)
        .send({ statusMessage: "Could not log in. Account does not exist." });
    }
    const jwtid = account.refreshTokenId;
    if (jwtid === null) {
      return res.sendStatus(401);
    }

    const isVerified = jwt.verify(req.body.refreshToken, publicKey, {
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
    return res.status(500).send({ statusMessage: error.message });
  }
});

module.exports = router;
