
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendVerificationEmail(email, otp) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your TechCart Account</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="background:#f3f4f6;padding:32px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                    style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
                    <tr>
                        <td align="center" style="background:#111827;padding:28px 20px;">
                            <h1 style="margin:0;color:#ffffff;font-size:28px;">
                                Tech<span style="color:#60a5fa;">Cart</span>
                            </h1>
                            <p style="margin:8px 0 0;color:#d1d5db;font-size:13px;">
                                Your technology, delivered.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:36px 28px;">
                            <p style="margin:0 0 12px;color:#2563eb;font-size:12px;font-weight:bold;letter-spacing:1.5px;">
                                WELCOME TO TECHCART
                            </p>

                            <h2 style="margin:0 0 16px;color:#111827;font-size:25px;">
                                Verify your email
                            </h2>

                            <p style="font-size:15px;line-height:1.8;color:#4b5563;">
                                Thanks for creating a TechCart account.
                                Use the verification code below to confirm
                                your email address.
                            </p>

                            <div style="margin:28px 0;padding:22px 12px;background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;text-align:center;">
                                <p style="margin:0 0 10px;font-size:12px;color:#6b7280;">
                                    YOUR VERIFICATION CODE
                                </p>
                                <div style="font-size:34px;font-weight:bold;letter-spacing:10px;color:#1d4ed8;">
                                    ${otp}
                                </div>
                            </div>

                            <p style="font-size:14px;line-height:1.8;color:#4b5563;">
                                This code expires in <strong>10 minutes</strong>.
                                Never share it with anyone.
                            </p>

                            <p style="font-size:13px;line-height:1.7;color:#6b7280;">
                                If you didn't create a TechCart account, you can
                                safely ignore this email.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background:#f9fafb;padding:22px 20px;border-top:1px solid #e5e7eb;">
                            <p style="margin:0 0 7px;font-size:13px;font-weight:bold;color:#374151;">
                                TechCart
                            </p>
                            <p style="margin:0;font-size:12px;line-height:1.7;color:#9ca3af;">
                                Automated account verification email.
                                Please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    const text = `
Welcome to TechCart!

Your email verification code is: ${otp}

This code expires in 10 minutes.
Never share this code with anyone.

If you didn't create a TechCart account, you can ignore this email.

TechCart
    `.trim();

    await transporter.sendMail({
        from: `"TechCart" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your TechCart verification code",
        text,
        html
    });
}

module.exports = { sendVerificationEmail };
