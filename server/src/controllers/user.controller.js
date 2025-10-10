import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import crypto from "crypto";
import { sendEmail } from "../utils/email/sendEmail.js";
import { verifyEmailTemplate } from "../utils/email/templates/verifyEmail.template.js";
import jwt from "jsonwebtoken";
import { redis } from "../utils/redis.js";
import { forgotPasswordTemplate } from "../utils/email/templates/forgotPassword.template.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    // console.log("User found:", user.email); // Debugging
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // console.log("Generated tokens:", { accessToken, refreshToken }); // Debugging

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    // console.error("Token generation error:", error); // Debugging
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //destructure data from body
  const { fullName, email, password, role } = req.body;

  //check if any field is not filled
  if ([fullName, email, password, role].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  email.toLowerCase();
  const existedUser = await User.findOne({ email });

  //if user exists give proper error
  if (existedUser) {
    throw new ApiError(409, "User with same email already exists");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  // const verificationTokenExpiry = Date.now() + 1 * 60 * 1000; //10 minutes validity

  const verificationTokenExpiry = 1800; //30 minutes validity

  const user = await User.create({
    fullName,
    email,
    password,
    role,
    isVerified: false,
    // verificationToken,
    // verificationTokenExpiry,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  await redis.set(`email:${email}`, JSON.stringify({ otp }),
    { ex: verificationTokenExpiry}
  );
  // console.log(createdUser);

  // const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${email}`;

  

  await sendEmail({
    to: email,
    subject: "Verify your email - Quiz App",
    html: verifyEmailTemplate({ fullName, otp }),
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        createdUser,
        "User registered. Verification email sent."
      )
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ApiError(400, "Invalid link");

  if (user.isVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Email already verified"));
  }

  const otpFromRedis = await redis.get(`email:${email}`);

  // const parsedUser = userFromRedis ? JSON.parse(userFromRedis) : null;

  // console.log("otpFromRedis: ",otpFromRedis);

  if(!otpFromRedis){
    throw new ApiError(400, "OTP is invalid or expired");
  }
  // if (
  //   user.verificationToken !== token ||
  //   user.verificationTokenExpiry < Date.now()
  // ) {
  //   throw new ApiError(400, "Token is invalid or expired");
  // }

  if(otp!==otpFromRedis.otp){
    throw new ApiError(400, "Token is invalid or expired");
  }
  

  await User.updateOne(
    { _id: user._id },
    {
      $set: { isVerified: true },
      $unset: {
        unverifiedExpiry: "",
      },
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, "Email verified successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Email and Password, both are required");
  }

  email.toLowerCase();

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(404, "User does not exist");

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(401, "Password incorrect");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //to be deleted later
  //   console.log("Generated tokens:", accessToken, refreshToken);

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
  };
  //to be deleted later
  //   console.log("Set cookies:", accessToken, refreshToken);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser,
          accessToken,
        },
        "User logged in succesfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // console.log(req);

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");
  console.log(incomingRefreshToken);

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    console.log(user);

    if (!user) throw new ApiError(401, "Invalid refresh token1");

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: refreshToken },

          "Access token and refresh token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token2");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password");

  if (oldPassword === newPassword) {
    throw new ApiError(400, "New password cannot be same as old password");
  }

  user.password = newPassword;
  user.refreshToken = undefined; // invalidate all sessions
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password changed successfully, please login again"
      )
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const emailRaw = (req.body?.email ?? "").toString();
  if (!emailRaw.trim()) {
    throw new ApiError(400, "Email is required");
  }

  const email = emailRaw.toLowerCase().trim();

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "If an account with that email exists, a reset link has been sent."));
  }

  // generate raw reset token
  const rawToken = crypto.randomBytes(32).toString("hex");

  // hash it before saving (so even if DB leaks, attacker can’t use it)
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const ttlSeconds = 20 * 60; // 20 mins

  const redisKey = `pwdreset:${hashedToken}`;

  // await user.save({ validateBeforeSave: false });

  try {
    await redis.set(redisKey, String(user._id), { ex: ttlSeconds});
  } catch (err) {
    console.error("Redis set error", err);
    throw new ApiError(500, "Internal server error");
  }

  // reset URL
  const resetUrl = `${process.env.FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(
    rawToken
  )}&email=${encodeURIComponent(user.email)}`;

  // send email
  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request - Quiz App",
      html: forgotPasswordTemplate({ fullName: user.fullName, resetUrl }),
    });
  } catch (sendErr) {
    console.error("Failed to send reset email", sendErr);
    // rollback Redis key to avoid orphaned usable token
    try {
      await redisClient.del(redisKey);
    } catch (delErr) {
      console.error("Failed to delete redis key after email send failure", delErr);
    }
    throw new ApiError(500, "Failed to send reset email. Please try again later.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "If an account with that email exists, a reset link has been sent."));
});

const resetPassword = asyncHandler(async (req, res) => {
  let { token, email, newPassword } = req.body ?? {};

  if (!token || !email || !newPassword) {
    throw new ApiError(400, "Token, email and new password are required");
  }

  email = email.toLowerCase().trim();

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }



  // hash the token to compare with DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const redisKey = `pwdreset:${hashedToken}`;

  // lookup in redis
  let userId;
  try {
    userId = await redis.get(redisKey);
  } catch (err) {
    console.error("Redis get error", err);
    throw new ApiError(500, "Internal server error");
  }

  if (!userId) {
    throw new ApiError(400, "Invalid or expired token");
  }

  // find user and ensure email matches the id (extra safety)
  const user = await User.findById(userId);
  if (!user || user.email.toLowerCase() !== email) {
    // either mismatch or user removed -> delete key and reject
    try {
      await redis.del(redisKey);
    } catch (e) {}
    throw new ApiError(400, "Invalid or expired token");
  }

  // update password (assume pre-save hook hashes password)
  user.password = newPassword;

  // invalidate sessions
  user.refreshToken = undefined;

  // Save user
  await user.save();

  // Delete redis key so token cannot be reused
  try {
    await redis.del(redisKey);
  } catch (err) {
    console.error("Failed to delete redis key after reset", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been reset successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName } = req.body;

  if (fullName.trim() === "") {
    throw new ApiError(400, "Full Name is required");
  }

  fullName = fullName.trim();

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  generateAccessAndRefreshTokens,
  forgotPassword,
  resetPassword,
};
