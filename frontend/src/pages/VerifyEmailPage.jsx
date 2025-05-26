import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2 } from "lucide-react";

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const { signup, isSigningUp, resendOtp, otpFormData } = useAuthStore();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("OTP is required");
    await signup(otp);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Verify Your Email</h2>
        <p className="text-center text-base-content/60">
          We’ve sent an OTP to <span className="font-semibold">{otpFormData?.email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            className="input input-bordered w-full"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
            {isSigningUp ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify and Create Account"
            )}
          </button>

          
        </form>

        <div className="flex justify-between ">
         <button
            type="button"
            className="btn btn-ghost text-blue-400 "
            onClick={() => navigate("/signup")}
          >
            ← Back to Signup
          </button>

          <button
            className="btn btn-link text-sm"
            onClick={() => resendOtp(otpFormData?.email)}
          >
            Resend OTP
          </button>
          
          
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
