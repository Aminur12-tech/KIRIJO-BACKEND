import { config } from "dotenv";
import { transporter } from "../config/email.config.js";
import jwt from "jsonwebtoken"

config()
const JWT_SECRET = process.env.JWT_SECRET

//function for generating otp
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

//object and function for sending otp

const generateMailOption = (email, otp) => {
    const mailOptions = {
        from : process.env.EMAIL_USER,
        to : email,
        subject : "Kirijo Email Verification OTP",
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
        html: `
            <div style="font-family:Arial, sans-serif; text-align:center; padding:20px;">
                <h2 style="color:#2563eb;">Your OTP Code</h2>
                <p style="font-size:16px; color:#374151;">Use the code below to complete your verification.</p>
                <div style="font-size:28px; font-weight:bold; letter-spacing:8px; margin:20px 0; padding:10px 20px; background:#f3f4f6; display:inline-block; border-radius:8px;">
                    ${otp}
                </div>
                <p style="font-size:14px; color:#6b7280;">This OTP will expire in 10 minutes.</p>
            </div>
            `
    }
    return mailOptions
}


export const sendOtpViaEmail = async (email, otp) => {
    const mailOptions = generateMailOption(email, otp)
    await transporter.sendMail(mailOptions, (err, info) => {
        if(err){
            return console.log("Error in Otp sending")
        }
        console.log("Email send Successfully", info.response)
    })
}

//generating jwt token
export const generateToken = async (userId, res) => {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn : "30d" })

    res.cookie("kirijo_cookie", token, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httponly: true,
        samesite: "strict",
        secure: process.env.NODE_ENV !== "development"
    })

    return token
} 