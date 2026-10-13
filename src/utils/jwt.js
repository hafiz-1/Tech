
const jwt = require("jsonwebtoken");

function generateAuthToken(user) {
    return jwt.sign(
        {
            tokenVersion: user.tokenVersion
        },
        process.env.JWT_SECRET,
        {
            subject: String(user.id),
            expiresIn: "1h",
            issuer: "techcart-api",
            audience: "techcart-client"
        }
    );
}

module.exports = {
    generateAuthToken
};
