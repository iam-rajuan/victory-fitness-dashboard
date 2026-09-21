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

    if (sanitized && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = new Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!resetEmail) return;

    if (joinedCode.length !== CODE_LENGTH) {
      setError(`Please enter the complete ${CODE_LENGTH}-digit code.`);
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
    if (!resetEmail || cooldown > 0) return;
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
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-dmsans">
      {/* Ambient glow */}
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
            Verify Code
          </h1>
          <p className="mt-2 text-sm text-[#F7F3EE]/60 font-inter">
            Enter the 4-digit authentication code sent to your mailbox.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0D2B45] border border-[#F7F3EE]/15 border-l-4 border-l-[#B5651D] rounded-[22px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="absolute top-6 left-6">
            <Link
              to="/forget-password"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#F7F3EE]/15 text-[#F7F3EE]/60 hover:text-[#F7F3EE] hover:border-[#C9943A] transition-colors"
              title="Back"
            >
              <FiArrowLeft size={14} />
            </Link>
          </div>

          <div className="flex flex-col items-center mt-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#C9943A]/15 text-[#C9943A] mb-3">
              <FiShield size={22} />
            </div>

            <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#C9943A] font-mono">
              Step 2 of 3
            </span>
            <h3 className="text-lg font-bold text-[#F7F3EE] mt-1 font-clash">
              Enter 4-digit code
            </h3>
            <p className="mt-1 text-xs text-[#F7F3EE]/60 text-center leading-relaxed max-w-xs font-inter">
              Sent to <span className="font-mono text-[#F7F3EE]">{maskEmail(resetEmail)}</span>
            </p>
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleVerify}>
            <div className="flex justify-center gap-3">
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
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border border-[#F7F3EE]/15 bg-[#0A0A0A] text-center text-2xl font-bold font-mono text-[#F7F3EE] outline-none transition-all focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A]"
                />
              ))}
            </div>

            {error ? (
              <div className="p-3.5 rounded-xl bg-[#B5651D]/20 border border-[#B5651D]/40 text-xs font-inter text-[#F7F3EE] leading-relaxed">
                {error}
              </div>
            ) : null}

            {info ? (
              <div className="p-3.5 rounded-xl bg-[#1A7A4A]/20 border border-[#1A7A4A]/40 text-xs font-mono text-[#5FC48E]">
                ✓ {info}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? "Verifying code..." : "Verify Code →"}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2 text-center border-t border-[#F7F3EE]/10 pt-4">
            <p className="text-xs text-[#F7F3EE]/50 font-inter">
              Didn't receive the code? Check spam or request a new code.
            </p>
            <button
              type="button"
              disabled={isResending || cooldown > 0}
              onClick={handleResend}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#C9943A] hover:text-[#d8a24a] transition-colors cursor-pointer disabled:opacity-40"
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
