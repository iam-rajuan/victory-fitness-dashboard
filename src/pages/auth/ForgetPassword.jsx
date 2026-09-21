import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { requestPasswordReset, storeResetEmail } from "../../../services/auth.service";

function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your admin email address.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await requestPasswordReset({ email: normalizedEmail });
      storeResetEmail(normalizedEmail);
      navigate("/verification-code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-dmsans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#B5651D]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#C9943A]/8 blur-[110px] pointer-events-none rounded-full" />

      <div className="w-full max-w-[480px] relative z-10">
        {/* Header Section with Brand */}
        <div className="text-center mb-8">
          <img
            src="/vf-logo-white.png?v=8"
            alt="Victory Fitness"
            className="h-14 w-auto object-contain mx-auto mb-4"
          />
          <div className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-[#B5651D] uppercase">
            Admin Dashboard Control
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-[#F7F3EE] font-clash">
            Password Recovery
          </h1>
          <p className="mt-2 text-sm text-[#F7F3EE]/60 font-inter">
            Enter your admin email to receive a secure 4-digit reset code.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0D2B45] border border-[#F7F3EE]/15 border-l-4 border-l-[#B5651D] rounded-[22px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="absolute top-6 left-6">
            <Link
              to="/sign-in"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#F7F3EE]/15 text-[#F7F3EE]/60 hover:text-[#F7F3EE] hover:border-[#C9943A] transition-colors"
              title="Back to sign in"
            >
              <FiArrowLeft size={14} />
            </Link>
          </div>

          <div className="flex flex-col items-center mt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9943A]/15 text-[#C9943A] mb-3">
              <FiMail size={22} />
            </div>

            <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#C9943A] font-mono">
              Step 1 of 3
            </span>
            <h3 className="text-lg font-bold text-[#F7F3EE] mt-1 font-clash">
              Forgot password?
            </h3>
            <p className="mt-1 text-xs text-[#F7F3EE]/60 text-center leading-relaxed max-w-xs font-inter">
              We'll send a 4-digit code valid for 10 minutes to your verified administrator mailbox.
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55 mb-2">
                Admin Email Address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="office@victoryfitness.de"
                className="w-full px-4 py-3.5 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] placeholder-[#F7F3EE]/30 outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all text-sm font-dmsans"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                required
              />
            </div>

            {error ? (
              <div className="p-3.5 rounded-xl bg-[#B5651D]/20 border border-[#B5651D]/40 text-xs font-inter text-[#F7F3EE] leading-relaxed">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? "Sending code..." : "Send Reset Code →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ForgetPassword;
