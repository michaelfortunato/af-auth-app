import express from "express";
import jwt from "jsonwebtoken";
import { refreshTokenPublicKeys } from "./auth";

const router = express.Router();

/*
This route assumes one thing: You have a valid accessToken.
We should verify the refreshToken to make sure this operation is permitted.
This may seem benign but here is why. 
Say somehow Eve got Bob's access key. 
Now Eve wants to log Bob out. 
Say eve does not have the refreshToken signature but somehow has the randomn nonce (or session id)
that represents bob's session. Now, Eve can use this route, fabricate a refreshToken key with the nonce and log bob
out.  
*/

router.post("/", async (req, res) => {
  try {
    const authCollection =
      req.app.locals.database.collection("Verified-Accounts");
    const {
      header: { kid },
      payload: { email, jti }
    } = jwt.decode(req.body.refreshToken, {
      complete: true
    });
    const publicKey = refreshTokenPublicKeys[kid];
    const { name, refreshTokenId } = await authCollection.findOne({
      _id: email,
      email
    });

    // Verify the jwt and make sure its id matches the one we have stored in the db
    if (refreshTokenId === null || refreshTokenId === undefined) {
      throw new Error(
        `Token jwtid/jti ${jti} does not match database jwtid ${refreshTokenId}`
      );
    }

    jwt.verify(req.body.refreshToken, publicKey, {
      jwtid: refreshTokenId,
      algorithm: "RS256"
    });

    // If now error was thrown, the refreshToken is verified and we can clear the session.
    await authCollection.updateOne(
      {
        _id: email,
        email
      },
      { $set: { refreshTokenId: null } }
    );
    return res.status(200).send({
      statusMessage: `Logged out user with id (${email}) and name (${name}).`
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ statusMessage: "Could not sign user out." });
  }
});

export default router;
