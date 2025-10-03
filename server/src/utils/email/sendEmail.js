import nodemailer from "nodemailer";
import { ApiError } from "../ApiError.js";

const transporter = nodemailer.createTransport({
  service: "Gmail", // or use custom SMTP host + port
  pool: true,       // enable connection pooling
  maxConnections: 5, // keep up to 5 connections open
  maxMessages: 100,  // reuse a connection for up to 100 messages
  rateDelta: 1000,   // per 1 second
  rateLimit: 5,      // limit to 5 messages per second
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Quiz App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Email send failed:", error);
    throw new ApiError(500, "Email could not be sent");
  }
};
