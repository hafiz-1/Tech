const jwt = require("jsonwebtoken");

function generateAccessToken(user, sessionId) {
    return jwt.sign(
        {
            tokenVersion: user.tokenVersion,
            sid: sessionId
        },
        process.env.JWT_SECRET,
        {
            subject: String(user.id),
            expiresIn: "15m",
            issuer: "techcart-api",
            audience: "techcart-client"
        }
    );
}

module.exports = {
    generateAccessToken
};