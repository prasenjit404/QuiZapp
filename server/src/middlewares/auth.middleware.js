import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { generateAccessAndRefreshTokens } from "../controllers/user.controller.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    let token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token || typeof token !== "string" || token.trim() === "") {
      throw new ApiError(401, "Unauthorized request");
    }

    let decodedToken;

    try {
      // First try verifying access token
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      // If token expired, try refreshing using refresh token
      if (error.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
          throw new ApiError(401, "Session expired, please log in again");
        }

        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedRefresh?._id);

        if (!user || user.refreshToken !== refreshToken) {
          throw new ApiError(401, "Invalid refresh token, login again");
        }

        // Generate new tokens
        const { accessToken, newRefreshToken } =
          await generateAccessAndRefreshTokens(user._id);

        // Set fresh cookies
        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        });

        // Overwrite token so next logic works
        token = accessToken;
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      } else {
        throw new ApiError(401, "Invalid access token");
      }
    }

    //Find user from DB
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User not found, invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized");
  }
});
