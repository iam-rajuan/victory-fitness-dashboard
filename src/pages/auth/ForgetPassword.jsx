import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import {
  clearResetFlow,
  requestPasswordReset,
  storeResetEmail,
} from "../../../services/auth.service";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!normalizedEmail) {
      setError("Enter your admin email address.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      clearResetFlow();
      await requestPasswordReset({ email: normalizedEmail });
      storeResetEmail(normalizedEmail);
      navigate("/verification-code", { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send reset code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-[#a855f7]/5 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#a855f7]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#06b6d4]/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.png?v=3" 
            alt="Victory Fitness" 
            className="h-12 w-auto object-contain mb-3" 
          />
          <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">
            Admin Portal
          </h2>
          <p className="mt-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Victory Fitness Dashboard Control
          </p>
        </div>

        <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-xl shadow-slate-200/40 relative">
          <div className="absolute top-6 left-6">
            <Link
              to="/sign-in"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-800 transition-colors"
              title="Back to sign in"
            >
              <FiArrowLeft size={14} />
            </Link>
          </div>

          <div className="flex flex-col items-center mt-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
              <FiMail size={20} />
            </div>
            
            <span className="text-[9px] font-bold uppercase tracking-widest text-purple-650">
              Step 1 of 3
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-1 uppercase text-center">
              Forgot password?
            </h3>
            <p className="mt-2 text-xs text-slate-500 text-center leading-relaxed max-w-xs">
              Enter your verified admin email address. We'll send a 4-digit code valid for 10 minutes.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Admin Email Address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your admin email address"
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-sm"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 text-center">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-sm"
            >
              {isLoading ? "Sending code..." : "Send Reset Code"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword;
