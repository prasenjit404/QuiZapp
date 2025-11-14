import { Resend } from "resend";
import { ApiError } from "../ApiError.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: "QuiZapp <onboarding@resend.dev>", // Sender shown to user
      to,
      subject,
      html,
    });

    console.log("Email sent:", data);
  } catch (error) {
    console.error("Email send failed:", error);
    throw new ApiError(500, "Email could not be sent");
  }
};
