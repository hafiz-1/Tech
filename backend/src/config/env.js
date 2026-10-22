
const requiredVariables = [
    "DATABASE_URL",
    "JWT_SECRET"
];

function validateEnv() {
    const missingVariables = requiredVariables.filter(
        (variable) => !process.env[variable]
    );

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVariables.join(", ")}`
        );
    }
}

module.exports = validateEnv;
