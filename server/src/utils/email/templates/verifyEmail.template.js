export const verifyEmailTemplate = ({ fullName, otp }) => `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Hey ${fullName},</h2>
    <p>Welcome to <b>QuiZapp</b></p>
    <p>Use the One-Time Password (OTP) below to verify your email address:</p>

    <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; 
                background: #f3f3f3; display: inline-block; 
                padding: 10px 20px; border-radius: 8px; margin: 15px 0;">
      ${otp}
    </div>

    <p>This OTP will expire in <b>30 minutes</b>. Please do not share it with anyone.</p>
    <p>If you didn’t request this, you can safely ignore this email.</p>

    <br/>
    <p>Cheers,<br/>The QuiZapp Team</p>
  </div>
`;
