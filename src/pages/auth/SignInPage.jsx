import { useState, useEffect } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { clearUserInfo, ensureAdminSession, loginAdmin } from "../../../services/auth.service";
function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    let isMounted = true;
    ensureAdminSession()
      .then((allowed) => {
        if (!isMounted) {
          return;
        }
        if (allowed) {
          navigate("/", { replace: true });
          return;
        }
        setIsCheckingSession(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setIsCheckingSession(false);
      });
    // Clear any plaintext password and saved email details on mount
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberMe');
    return () => {
      isMounted = false;
    };
  }, [navigate]);
  const handleCheckboxChange = (event) => {
    const checked = event.target.checked;
    setIsChecked(checked);
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
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
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
        <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-xl shadow-slate-200/40">
          {isCheckingSession ? (
            <div className="py-12 text-center text-sm font-semibold text-purple-600">
              Verifying admin session credentials...
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-405 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-sm"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-410 outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-sm"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="w-5 h-5" />
                    ) : (
                      <IoEyeOutline className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    className="hidden"
                    onChange={handleCheckboxChange}
                  />
                  {isChecked ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="Group 335">
                        <rect
                          id="Rectangle 331"
                          x="-0.00012207"
                          y="6.10352e-05"
                          width="21"
                          height="21"
                          rx="5"
                          className="fill-purple-600"
                          stroke="#a855f7"
                        ></rect>
                        <path
                          id="Vector"
                          d="M8.19594 15.4948C8.0646 15.4949 7.93453 15.4681 7.81319 15.4157C7.69186 15.3633 7.58167 15.2865 7.48894 15.1896L4.28874 11.8566C4.10298 11.6609 3.99914 11.3965 3.99988 11.1213C4.00063 10.8461 4.10591 10.5824 4.29272 10.3878C4.47953 10.1932 4.73269 10.0835 4.99689 10.0827C5.26109 10.0819 5.51485 10.1901 5.70274 10.3836L8.19591 12.9801L14.2887 6.6335C14.4767 6.4402 14.7304 6.3322 14.9945 6.33307C15.2586 6.33395 15.5116 6.44362 15.6983 6.63815C15.8851 6.83268 15.9903 7.09627 15.9912 7.37137C15.992 7.64647 15.8883 7.91073 15.7027 8.10648L8.90294 15.1896C8.8102 15.2865 8.7 15.3633 8.57867 15.4157C8.45734 15.4681 8.32727 15.4949 8.19594 15.4948Z"
                          fill="white"
                        ></path>
                      </g>
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="Group 335">
                        <rect
                          id="Rectangle 331"
                          x="-0.00012207"
                          y="6.10352e-05"
                          width="21"
                          height="21"
                          rx="5"
                          className="fill-transparent"
                          stroke="#cbd5e1"
                        ></rect>
                      </g>
                    </svg>
                  )}
                  <span className="text-slate-500 group-hover:text-slate-800 transition-colors font-medium">
                    Remember email
                  </span>
                </label>
                <Link to="/forget-password" className="text-purple-600 hover:text-purple-500 transition-colors font-semibold">
                  Forgot Password?
                </Link>
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </div>
              {error && (
                <div className="text-red-650 text-center text-xs bg-red-55 border border-red-100 py-2.5 rounded-lg font-medium">
                  {error}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export default SignInPage;
