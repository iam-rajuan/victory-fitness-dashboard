import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiRefreshCw, FiShield } from "react-icons/fi";
import {
  getResetEmail,
  requestPasswordReset,
  verifyPasswordResetCode,
} from "../../../services/auth.service";

const CODE_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 30;

function maskEmail(email) {
  const [localPart, domain = ""] = String(email || "").split("@");
  if (!localPart || !domain) {
    return email || "";
  }
  const first = localPart[0] || "";
  const last = localPart[localPart.length - 1] || "";
  const middle = "*".repeat(Math.max(localPart.length - 2, 1));
  return `${first}${middle}${last}@${domain}`;
}

function VerificationCode() {
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const [digits, setDigits] = useState(() => new Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const resetEmail = getResetEmail();

  useEffect(() => {
    if (!resetEmail) {
      navigate("/forget-password", { replace: true });
    }
  }, [navigate, resetEmail]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const joinedCode = useMemo(() => digits.join(""), [digits]);

  const focusInput = (index) => {
    inputRefs.current[index]?.focus?.();
    inputRefs.current[index]?.select?.();
  };

  const handleDigitChange = (value, index) => {
    const sanitized = String(value || "").replace(/\D/g, "").slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = sanitized;
      return next;
    });
    setError("");
    setInfo("");
    if (sanitized && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) {
      return;
    }
    event.preventDefault();
    const next = new Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);
    setError("");
    setInfo("");
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!resetEmail) {
      navigate("/forget-password", { replace: true });
      return;
    }

    if (joinedCode.length !== CODE_LENGTH) {
      setError("Enter the full 4-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyPasswordResetCode({ email: resetEmail, code: joinedCode });
      navigate("/new-password", { replace: true });
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Invalid verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resetEmail || cooldown > 0) {
      return;
    }
    setError("");
    setInfo("");
    setIsResending(true);
    try {
      await requestPasswordReset({ email: resetEmail });
      setInfo("A new code has been sent to your email.");
      setDigits(new Array(CODE_LENGTH).fill(""));
      setCooldown(RESEND_COOLDOWN_SECONDS);
      focusInput(0);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Failed to resend the code. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_32px_80px_rgba(15,23,42,0.14)] sm:p-10">
          <Link
            to="/forget-password"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <FiArrowLeft />
            Back
          </Link>

          <div className="mt-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
              <FiShield size={24} />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-blue-600">
              Step 2 of 3
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-900">Verify reset code</h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Enter the 4-digit code we sent to{" "}
              <span className="font-semibold text-slate-700">{maskEmail(resetEmail)}</span>.
            </p>
          </div>

          <form className="mt-10" onSubmit={handleVerify}>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleDigitChange(event.target.value, index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  onPaste={handlePaste}
                  className="h-16 w-16 rounded-2xl border border-slate-300 bg-white text-center text-2xl font-black text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-20 sm:w-20"
                />
              ))}
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}

            {info ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {info}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 inline-flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Verifying code..." : "Continue"}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-slate-500">
              Didn’t receive the email? Check spam or request another code.
            </p>
            <button
              type="button"
              disabled={isResending || cooldown > 0}
              onClick={handleResend}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw className={isResending ? "animate-spin" : ""} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationCode;
