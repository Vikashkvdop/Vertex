import express from "express";
import dotenv from "dotenv"
import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import messageRoute from "./routes/message.route.js"
import cors from "cors"
import fileUpload from "express-fileupload";
import cloudinaryConnect from "./lib/cloudinary.js";
import { app,server } from "./lib/socket.js";
import path from "path";

dotenv.config();
const PORT=process.env.PORT;
const __dirname=path.resolve();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}));

app.use(
    fileUpload({
        useTempFiles:true,
        tempFilesDir:"/tmp",
    })
)

//coudinary connection
cloudinaryConnect();

app.use("/api/auth",authRoutes)
app.use("/api/messages",messageRoute)

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}
server.listen(PORT,()=>{
    console.log("Server is running on port:"+PORT);
    connectDB();
})