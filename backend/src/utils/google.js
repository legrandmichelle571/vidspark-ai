const axios = require("axios");

const verifyGoogleToken = async (token) => {
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    const { sub, email, name, picture, email_verified } = response.data;

    if (!email_verified) {
      throw new Error("Google email not verified");
    }

    return {
      googleId: sub,
      email,
      name,
      picture,
      emailVerified: email_verified
    };
  } catch (err) {
    console.error("[Google] Token verification error:", err.message);
    throw new Error("Invalid Google token: " + err.message);
  }
};

module.exports = { verifyGoogleToken };
