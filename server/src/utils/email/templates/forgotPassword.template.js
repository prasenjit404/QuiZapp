export const forgotPasswordTemplate = ({ fullName, resetUrl }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
    
    <p>Hi <strong>${fullName}</strong>,</p>
    <p>You recently requested to reset your password for your Quiz App account. Click the button below to set a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
         Reset Password
      </a>
    </div>

    <p>If the button doesn’t work, copy and paste this link into your browser:</p>
    <p style="word-break: break-word; color: #0066cc;">${resetUrl}</p>

    <p><b>Note:</b> This link will expire in 10 minutes. If you didn’t request this, you can safely ignore this email.</p>

    <p style="margin-top: 30px;">Thanks,<br/>The Quiz App Team</p>
  </div>
  `;
