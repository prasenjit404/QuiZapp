export const verifyEmailTemplate = ({ fullName, verifyUrl }) => `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Hey ${fullName},</h2>
    <p>Welcome to <b>Quiz App</b> 🎉</p>
    <p>Please verify your email by clicking below:</p>
    <a href="${verifyUrl}" 
       style="display:inline-block; background:#4CAF50; color:white; padding:10px 20px; 
              text-decoration:none; border-radius:5px; margin-top:10px;">
      Verify Email
    </a>
    <p>This link expires in <b>15 minutes</b>.</p>
    <br/>
    <p>Cheers,<br/>The Quiz App Team</p>
  </div>
`;
