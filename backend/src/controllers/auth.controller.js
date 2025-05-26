import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import Otp from "../models/otp.model.js";
import sendMail from "../utils/mailSender.js";

import uploadImageToCloudinary from "../utils/imageUploader.js";

export const sendOtp= async (req,res)=>{

    try{
        const {email}=req.body;
        const user=await User.findOne({email});
        if (user) {
            return res.status(401).json({
                message:"User already exist"
            });
        }

        //generate otp
        let otp= otpGenerator.generate(6,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("Generated otp",otp);

        //Ensure otp is unique
        let existingOtp= await Otp.findOne({otp});
        while (existingOtp) {
          otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
          });
          existingOtp = await Otp.findOne({ otp });
        }

        //save in database
        console.log("Creating OTP with:", { email, otp });
        await Otp.create({email,otp});

        await sendMail(
        email,
        "Your OTP Code",
        `Your One Time Password (OTP) is: ${otp}`
        );
        res.status(200).json({ message: "OTP sent successfully", otp }); 
        
    }catch(error){
        console.error("Error sending OTP:", error.message);
        res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const signup= async (req,res)=>{
   const {fullName,email,password,otp}=req.body;

   try{
    if (!fullName || !email || !password || !otp) {
        return res.status(400).json({message:"All fields are required"});
    }

    if (password.length<6) {
        return res.status(400).json({
            message:"Password must be at least 6 character"
        });
    }

    const user=await User.findOne({email})

    if (user) return res.status(400).json({message:"User is already exists"});

    // Find the most recent OTP for the user
    const recentOtpRecord = await Otp.find({ email }).sort({ createdAt: -1 }).limit(1);
    console.log("Recent OTP: ", recentOtpRecord);

    if (recentOtpRecord.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'OTP not found',
        });
    }
    // Check if OTP matches
    if (recentOtpRecord[0].otp !== otp) {
        return res.status(400).json({
            success: false,
            message: 'Invalid OTP',
        });
    }
    //  Check for OTP expiration
    if (recentOtpRecord[0].expiresAt && recentOtpRecord[0].expiresAt < Date.now()) {
        return res.status(400).json({
            success: false,
            message: 'OTP has expired',
        });
            
    }

    const salt=await bcrypt.genSalt(10)
    const hashedPassword=await bcrypt.hash(password,salt)

    const newUser=new User({
        fullName,
        email,
        password:hashedPassword
    })

    if (newUser) {
        //generate jwt token
        generateToken(newUser._id,res);
        await newUser.save();

        res.status(201).json({
            success:true,
            message:"User Registered successfully",
            _id:newUser._id,
            fullName:newUser.fullName,
            email:newUser.email,
            profilePic:newUser.profilePic,
        });
    }else{
        res.status(400).json({message:"Invalid user data"});
    }
   }catch(error){
    console.log("Erro in signup controller",error.message);
    res.status(500).json({message:"Internal Server Error"});
   }
};

export const login=async(req,res)=>{
   const {email,password}=req.body;

   try{
    const user=await User.findOne({email});
    if (!user) {
        return res.status(400).json({message:"Invalid credentials"});
    }
    const isPasswordCorrect=await bcrypt.compare(password,user.password);
    if (!isPasswordCorrect) {
        return res.status(400).json({message:"Invalid credentails"});
    }
    generateToken(user._id,res)

    res.status(200).json({
        _id:user._id,
        fullName:user.fullName,
        email:user.email,
        profilePic:user.profilePic,
    })
   }catch(error){
    console.log("Error in login controller",error.message);
    res.status(500).json({message:"Internal server Error"});
   }
};

export const logout=(req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message:"Logged out  successfully"});
    }catch(error){
        console.log("Error in logout controller",error.message);
        res.status(500).json({message:"Internal server Error"});
    }
};

export const updateProfile= async(req,res)=>{
    try{
        const profilePic=req.files?.profilePic
        const userId=req.user._id;
        
        if(!profilePic){
            return res.status(400).json({message:"Profile pic is required"});
        }
        const uploadResponse=await uploadImageToCloudinary(
            profilePic,
            process.env.FOLDER_NAME,
            1000,
            1000,
        )
        console.log(profilePic);
        const updatedUser=await User.findByIdAndUpdate(
            userId,
            {profilePic:uploadResponse.secure_url},
            {new:true}
        );

        res.status(200).json(updatedUser);
    }catch(error){
        console.log("Error in update profile",error);
        res.status(500).json({message:"Internal server error"});
    }
};

export const checkAuth=(req,res)=>{
    try{
        res.status(200).json(req.user);
    }catch(error){
        console.log("Error in checkAuth controller",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}