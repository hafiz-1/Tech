const path = require("path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function redact(value, secrets) {
    let result = String(value || "");
    for (const secret of secrets) {
        if (secret) result = result.split(secret).join("[redacted]");
    }
    return result;
}

function describeSmtpError(error, secrets) {
    const details = [
        error.code && `code: ${error.code}`,
        error.command && `command: ${error.command}`,
        error.responseCode && `response code: ${error.responseCode}`,
        error.response && `server response: ${redact(error.response, secrets)}`,
        error.message && `message: ${redact(error.message, secrets)}`
    ].filter(Boolean);

    console.error(details.length ? details.join("\n") : "No additional SMTP error details were provided.");
}

async function testSmtp() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_TEST_TO } = process.env;
    const missing = [
        ["SMTP_HOST", SMTP_HOST],
        ["SMTP_PORT", SMTP_PORT],
        ["SMTP_USER", SMTP_USER],
        ["SMTP_PASS", SMTP_PASS]
    ]
        .filter(([, value]) => !value || !value.trim())
        .map(([name]) => name);

    if (missing.length) {
        console.error(`SMTP test cannot start. Missing or empty settings: ${missing.join(", ")}`);
        console.error("Add these to backend/.env (or set them in your shell) and run this script again.");
        return false;
    }

    const port = Number(SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        console.error("SMTP test cannot start: SMTP_PORT must be a valid port number.");
        return false;
    }

    if (SMTP_TEST_TO && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SMTP_TEST_TO.trim())) {
        console.error("SMTP test cannot send: SMTP_TEST_TO is not a valid email address.");
        return false;
    }

    const secrets = [SMTP_PASS, SMTP_USER, SMTP_TEST_TO];
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    });

    try {
        console.log(`Checking SMTP connection to ${SMTP_HOST} on port ${port}...`);
        await transporter.verify();
        console.log("SMTP connection and authentication succeeded.");

        if (!SMTP_TEST_TO) {
            console.log("No test email was sent. Set SMTP_TEST_TO in backend/.env to test actual sending.");
            console.log("A successful SMTP check does not guarantee inbox delivery; check spam and provider delivery logs.");
            return true;
        }

        console.log("Sending a test email...");
        const result = await transporter.sendMail({
            from: `"TechCart SMTP Test" <${SMTP_USER}>`,
            to: SMTP_TEST_TO,
            subject: "TechCart SMTP test",
            text: "This is a test email from the TechCart SMTP diagnostic."
        });

        console.log("SMTP server accepted the test email.");
        console.log(`Message ID: ${result.messageId}`);
        if (!result.accepted?.length) {
            console.error("The SMTP server did not report any accepted recipients.");
            return false;
        }
        console.log("If it does not arrive, check Spam/Junk, sender verification, and your provider's delivery logs.");
        return true;
    } catch (error) {
        console.error("SMTP test failed.");
        describeSmtpError(error, secrets);

        if (error.code === "EAUTH" || error.responseCode === 535) {
            console.error("Likely cause: SMTP username/password rejected. Check SMTP_USER and SMTP_PASS; Gmail commonly requires an App Password.");
        } else if (["ETIMEDOUT", "ECONNECTION", "ECONNREFUSED", "ENOTFOUND"].includes(error.code)) {
            console.error("Likely cause: SMTP host/port is unreachable or incorrect, or a firewall/network is blocking SMTP.");
        } else if (error.responseCode >= 500) {
            console.error("Likely cause: the mail provider rejected the sender, recipient, or message. Check the provider response and account restrictions.");
        } else {
            console.error("Check SMTP_HOST, SMTP_PORT, TLS requirements, account restrictions, and the mail provider's logs.");
        }
        return false;
    } finally {
        transporter.close();
    }
}

if (require.main === module) {
    testSmtp()
        .then((passed) => {
            process.exitCode = passed ? 0 : 1;
        })
        .catch((error) => {
            console.error("Unexpected SMTP diagnostic error:", redact(error.message, [
                process.env.SMTP_PASS,
                process.env.SMTP_USER,
                process.env.SMTP_TEST_TO
            ]));
            process.exitCode = 1;
        });
}

module.exports = { testSmtp };