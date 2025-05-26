import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js"
import uploadImageToCloudinary from "../utils/imageUploader.js";
import { getReceiverSocketId, io } from "../lib/socket.js"

export const getUsersForSidebar=async (req,res)=>{
    try{
        const loggedInUserId=req.user._id;
        const filteredUsers=await User.find({_id:{$ne:loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers);
    }catch(error){
        console.error("Error in getUsersForSidebar:",error.message);
        res.status(500).json({error:"Internal server error"});
    }
};

export const getMessages=async (req,res)=>{
    try{
        const { id: userToChatId }=req.params;
        const myId=req.user._id;

        const messages=await Message.find({
            $or:[
                {senderId:myId,receiverId:userToChatId},
                {senderId:userToChatId,receiverId:myId},
            ],
        });
        res.status(200).json(messages);
    }catch(error){
        console.log("Error in getMessages contoller:",error.message);
        res.status(500).json({error:"Internal server error"});
    }
};

export const sendMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const { text } = req.body;
    const imageFile = req.files?.file;

    console.log("req.body:", req.body);
   console.log("req.files:", req.files);



    let imageUrl = null;

    if (imageFile) {
      const uploadResponse = await uploadImageToCloudinary(
        imageFile,
        process.env.FOLDER_NAME,
        1000,
        1000
      );
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


 