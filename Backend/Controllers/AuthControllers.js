import authModel from "../Database/Models/AuthModel.js";
import crypto from "node:crypto";
import otpModel from "../Database/Models/OtpModel.js";
import sendEmailOTP from "../utils/Email.js";
import OtpTemplate from "../utils/Template.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SignupController = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const profileImage = req.file.path;
        if (!username || !email || !password || !profileImage) {
            return res.status(400).send({ success: false, message: "all fields required" });
        }
        const userExist = await authModel.findOne({ email });
        if (userExist) {
            return res.status(400).send({ success: false, message: "user already exist!" });
        }
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        await sendEmailOTP(
            email,
            "verify your email via otp",
            OtpTemplate(otp)
        )
        await otpModel.create({
            email,
            otp,
            expireAt: otpExpire,
            purpose: "signup",
        });
        const newUser = await authModel.create({
            username: username,
            email: email,
            password: password,
            profile: profileImage
        })
        return res.status(201).send({ success: true, message: "user created successfully", newUser: { email: newUser.email, profile: newUser.profile, username: newUser.username } })
    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

const VerifyOtpSignupController = async (req, res) => {
    try {
        const { email, otp, purpose } = req.body;
        if (!email || !otp || !purpose) {
            return res.status(400).send({ success: false, message: "all fields required" });
        }
        const userRecords = await otpModel.findOne({ email });
        if (!userRecords) {
            return res.status(404).send({ success: false, message: "email not found" });
        }
        if (userRecords.otp !== otp || userRecords.purpose !== purpose) {
            return res.status(404).send({ success: false, message: "invalid otp or purpose" });
        }
        if (Date.now() > userRecords.expireAt) {
            await otpModel.deleteOne({ _id: userRecords._id })
            return res.status(410).send({ success: false, message: "otp expire" });
        }
        const user = await authModel.findOneAndUpdate(
            { email },
            { isVerified: true },
            { new: true }
        )
        if (!user) {
            return res.status(404).send({ success: false, message: "user not found" });
        }
        await otpModel.deleteOne({ _id: userRecords._id });
        return res.status(201).send({ success: true, message: "otp verified successfully", user: { email: user.email, isVerified: user.isVerified } })

    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

const ResendOtpController = async (req, res) => {
    try {
      const { email, purpose } = req.body;
  
      if (!email || !purpose) {
        return res
          .status(400)
          .send({ success: false, message: "email or purpose missing" });
      }
  
      // 🔹 Generate new OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  
      // 🔹 Check existing OTP
      const existingOtp = await otpModel.findOne({ email, purpose });
  
      if (!existingOtp) {
        return res.status(400).send({
          success: false,
          message: "OTP request not found, please signup again",
        });
      }
  
      // 🔹 Update OTP
      existingOtp.otp = otp;
      existingOtp.expireAt = otpExpire;
      await existingOtp.save();
  
      // 🔹 Email subject
      const subject =
        purpose === "signup"
          ? "Verify your email via OTP"
          : "Reset Password OTP";
  
      // 🔹 Send OTP email
      await sendEmailOTP(email, subject, OtpTemplate(otp));
  
      return res.status(200).send({
        success: true,
        message: "OTP resent successfully",
      });
    } catch (error) {
      return res
        .status(400)
        .send({ success: false, message: error.message });
    }
  };


const LoginController = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).send({success: false, message: "all fields required"});
        }
        const userFound = await authModel.findOne({email});
        if(!userFound){
            return res.status(404).send({success: false, message: "user not found"});
        }
        const checkPassword = await bcrypt.compare(password, userFound.password);
        if(!checkPassword){
            return res.status(404).send({success: false, message: "invalid credentials"});
        }
        if(!userFound.isVerified){
            return res.status(400).send({success: false, message: "please verify you email before login"});
        }
        const token = jwt.sign(
            {_id: userFound._id, email: userFound.email},
            process.env.SECRETKEY,
            {expiresIn: '10m'}
        )
        return res.status(201).send({success: true, message: "user logged in successfully", user: {userName:userFound.username, email: userFound.email, token, profile: userFound.profile}})
    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

const LogoutController = async (req, res) => {
    try {
        return res.status(201).send({success: true, message: "user logout successfully"});
    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

const ForgotPasswordController = async (req, res) => {
    try {
        const {email} = req.body;
        if(!email){
            return res.status(400).send({success: false, message: "email is required"});
        }
        const foundUser = await authModel.findOne({ email });
        if(!foundUser){
            return res.status(404).send({success: false, message: "user not found"});
        }
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expireOtp = new Date(Date.now() + 10 * 60 * 1000);
        await sendEmailOTP(
          email,
          "Verify Otp for Forgot Password",
          OtpTemplate(otp)  
        )
        await otpModel.create({
            email,
            otp,
            expireAt: expireOtp,
            purpose: "forgot_password"
        })
        return res.status(201).send({success: true, message: "verify the otp via email address"});

    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

const VerifyOtpForgotPasswordController = async (req, res) => {
    try {
        const {email, otp, purpose} = req.body;
        if(!email || !otp || !purpose){
            return res.status(400).send({success: false, message: "all fields required"});
        }
        const userRecords = await otpModel.findOne({email});
        if(!userRecords){
            return res.status(404).send({success: false, message: "user not found"});
        }
        if(userRecords.otp !== otp || userRecords.purpose !== purpose){
            return res.status(404).send({success: false, message: "invalid otp or purpose"});
        }
        if(Date.now() > userRecords.expireAt){
            return res.status(404).send({success: false, message: "otp has expire"});
            await otpModel.deleteOne({_id: userRecords._id});
        }
        await otpModel.deleteOne({ _id: userRecords._id });
        return res.status(201).send({success: true, message: "otp verified successfully"})
    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

const ResetPasswordController = async (req, res) => {
    try {
        const {email, newPassword} = req.body;
        if(!email || !newPassword){
            return res.status(400).send({success: false, message: "all fields required"});
        }
        const foundUser = await authModel.findOne({ email });
        if(!foundUser){
            return res.status(404).send({success: false, message: "user not found"});
        }
        foundUser.password = newPassword;
        await foundUser.save();
        return res.status(201).send({success: true, message: "reset password successfully"});
    } catch (error) {
        return res.status(400).send({ success: false, message: error.message });
    }
}

export { SignupController, VerifyOtpSignupController, ResendOtpController, LoginController, LogoutController, ForgotPasswordController, VerifyOtpForgotPasswordController, ResetPasswordController }
