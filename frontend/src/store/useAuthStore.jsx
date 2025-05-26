import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set,get) => ({
  authUser: null,
  isSendingOtp: false,
  isSigningUp: false,
  isLoggingIng:false, 
  isUpdatingProfile:false,
  onlineUsers:[],
  socket:null,
  isCheckingAuth: true,
  otpFormData: null, // store data temporarily between pages

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  sendOtp: async (email, formData) => {
    set({ isSendingOtp: true });
    try {
      await axiosInstance.post("/auth/send-otp", { email });
      set({ otpFormData: formData }); // temporarily store formData for later signup
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      set({ isSendingOtp: false });
    }
  },

  signup: async (otp) => {
    const { otpFormData } = useAuthStore.getState();

    if (!otpFormData) {
      toast.error("Missing signup data. Please start over.");
      return;
    }

    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", {
        ...otpFormData,
        otp,
      });
      set({ authUser: res.data, otpFormData: null });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data, {
        headers: {
          // Don't set 'Content-Type', axios will handle it
          // 'Content-Type': 'multipart/form-data' <-- avoid this
        },
      });
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

   connectSocket: () => {
      const { authUser } = get();
      if (!authUser || get().socket?.connected) return;
  
      const socket = io(BASE_URL, {
        query: {
          userId: authUser._id,
        },
      });
      socket.connect();
  
      set({ socket: socket });
  
      socket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
      });
    },
    disconnectSocket: () => {
      if (get().socket?.connected) get().socket.disconnect();
    },

}));
