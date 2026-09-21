import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import {
  clearResetFlow,
  getResetToken,
  resetPasswordWithToken,
} from "../../../services/auth.service";

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    const storedToken = getResetToken();
    if (!storedToken) {
      navigate("/forget-password", { replace: true });
      return;
    }
    setResetToken(storedToken);
  }, [navigate]);

  const passwordChecks = useMemo(
    () => [
      { label: "At least 8 characters", valid: password.length >= 8 },
      { label: "Passwords match", valid: Boolean(password) && password === confirmPassword },
    ],
    [password, confirmPassword],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!resetToken) {
      setError("Your reset session has expired. Start the reset process again.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordWithToken({
        resetToken,
        newPassword: password,
      });
      clearResetFlow();
      setSuccess("Password updated successfully. Redirecting to sign in...");
      window.setTimeout(() => {
        navigate("/sign-in", { replace: true });
      }, 1400);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to reset password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F7F3EE] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-dmsans">
      {/* Background Decorative Radial Gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0D2B45]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#C9943A]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Section with Brand */}
        <div className="text-center mb-8">
          <img
            src="/vf-logo-white.png?v=8"
            alt="Victory Fitness"
            className="h-14 w-auto object-contain mx-auto mb-4"
          />
          <div className="text-[10.5px] font-medium tracking-[0.2em] text-[#B5651D] uppercase">
            Admin Security Control
          </div>
          <h1 className="text-3xl font-bold font-clash text-[#F7F3EE] mt-2 tracking-tight">
            Create new password
          </h1>
          <p className="text-xs text-[#F7F3EE]/60 mt-1 max-w-xs mx-auto">
            Choose a new strong password for your admin account. The previous password will stop working immediately.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#0D2B45]/90 backdrop-blur-md border border-[#F7F3EE]/15 rounded-2xl p-7 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#B5651D] via-[#C9943A] to-[#B5651D] rounded-t-2xl" />

          {error && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#F7F3EE]/70 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0D0D0D]/70 border border-[#F7F3EE]/20 rounded-xl px-3.5 py-2.5 text-sm text-[#F7F3EE] placeholder-[#F7F3EE]/30 focus:outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F7F3EE]/50 hover:text-[#F7F3EE] transition"
                >
                  {showPassword ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#F7F3EE]/70 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0D0D0D]/70 border border-[#F7F3EE]/20 rounded-xl px-3.5 py-2.5 text-sm text-[#F7F3EE] placeholder-[#F7F3EE]/30 focus:outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F7F3EE]/50 hover:text-[#F7F3EE] transition"
                >
                  {showConfirmPassword ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation checks */}
            <div className="bg-[#0D0D0D]/50 border border-[#F7F3EE]/10 rounded-xl p-3 space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#F7F3EE]/40 mb-1">
                Password Requirements
              </div>
              {passwordChecks.map((check) => (
                <div key={check.label} className="flex items-center gap-2 text-xs">
                  <FiCheckCircle className={`w-3.5 h-3.5 ${check.valid ? "text-[#1A7A4A]" : "text-[#F7F3EE]/25"}`} />
                  <span className={check.valid ? "text-[#F7F3EE]/90 font-medium" : "text-[#F7F3EE]/45"}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#C9943A]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-1.5 text-xs text-[#F7F3EE]/60 hover:text-[#C9943A] transition"
            >
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-[#F7F3EE]/35">
          Victory Fitness Executive Suite · Authorized Personnel Only
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
