import { useState, useEffect } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { clearUserInfo, ensureAdminSession, loginAdmin } from "../../../services/auth.service";

function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    ensureAdminSession()
      .then((allowed) => {
        if (!isMounted) return;
        if (allowed) {
          navigate("/", { replace: true });
          return;
        }
        setIsCheckingSession(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsCheckingSession(false);
      });

    // Clean any plaintext legacy credentials
    localStorage.removeItem("rememberedPassword");
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("rememberMe");
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      clearUserInfo();
      await loginAdmin({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Invalid credentials or unauthorized admin role.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-dmsans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#B5651D]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#C9943A]/8 blur-[110px] pointer-events-none rounded-full" />

      <div className="w-full max-w-[480px] relative z-10">
        {/* Header Section with Brand */}
        <div className="text-center mb-8">
          <img
            src="/logo_light.png?v=5"
            alt="Victory Fitness"
            className="h-12 sm:h-14 w-auto object-contain mx-auto mb-4"
          />
          <div className="text-[10px] sm:text-[11px] font-medium tracking-[0.2em] text-[#B5651D] uppercase">
            Admin Dashboard Control
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-[#F7F3EE] font-clash">
            Executive Portal
          </h1>
          <p className="mt-2 text-sm text-[#F7F3EE]/60 font-inter">
            Enter your credentials to manage operations, members, and revenue.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0D2B45] border-l-4 border-[#B5651D] border border-r-[#F7F3EE]/10 border-t-[#F7F3EE]/10 border-b-[#F7F3EE]/10 rounded-[22px] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {isCheckingSession ? (
            <div className="py-14 text-center">
              <div className="w-8 h-8 border-2 border-[#C9943A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-xs font-semibold uppercase tracking-wider text-[#C9943A] font-jetbrains">
                Verifying administrative session...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-[#B5651D]/20 border-l-3 border-[#B5651D] text-xs font-inter text-[#F7F3EE] leading-relaxed">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@victoryfitness.de"
                  className="w-full px-4 py-3.5 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] placeholder-[#F7F3EE]/30 outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all text-sm font-dmsans"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55">
                    Password
                  </label>
                  <Link
                    to="/forget-password"
                    className="text-xs font-medium text-[#C9943A] hover:text-[#d8a24a] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3.5 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] placeholder-[#F7F3EE]/30 outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all text-sm font-jetbrains"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F7F3EE]/40 hover:text-[#F7F3EE]/80 transition-colors p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="w-5 h-5" />
                    ) : (
                      <IoEyeOutline className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleCheckboxChange}
                    className="rounded border-[#F7F3EE]/20 bg-[#0A0A0A] text-[#C9943A] focus:ring-[#C9943A]/20"
                  />
                  <span className="text-xs text-[#F7F3EE]/60 hover:text-[#F7F3EE] transition-colors">
                    Keep signed in
                  </span>
                </label>
                <span className="text-[11px] font-mono text-[#F7F3EE]/40">v2.4 live</span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg shadow-[#C9943A]/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer font-dmsans"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0D0D0D] border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Enter Dashboard →</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-[#F7F3EE]/40 font-jetbrains">
          Victory Fitness · Strictly Authorized Access Only
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
