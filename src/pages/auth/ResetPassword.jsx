import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { FiArrowLeft, FiCheckCircle, FiLock } from "react-icons/fi";
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
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_32px_80px_rgba(15,23,42,0.14)] sm:p-10">
          <Link
            to="/verification-code"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <FiArrowLeft />
            Back
          </Link>

          <div className="mt-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
              <FiLock size={24} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
              Step 3 of 3
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">Create a new password</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Choose a new password for your admin dashboard account. Once saved, the old password
              will stop working immediately.
            </p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 pr-14 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                >
                  {showPassword ? <IoEyeOffOutline size={22} /> : <IoEyeOutline size={22} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 pr-14 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                >
                  {showConfirmPassword ? <IoEyeOffOutline size={22} /> : <IoEyeOutline size={22} />}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                Password checks
              </p>
              <div className="mt-3 space-y-2">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-sm">
                    <FiCheckCircle className={check.valid ? "text-emerald-500" : "text-slate-300"} />
                    <span className={check.valid ? "text-slate-700" : "text-slate-500"}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Updating password..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
