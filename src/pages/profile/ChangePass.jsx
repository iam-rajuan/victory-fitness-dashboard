import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { adminApiRequest } from "../../../services/auth.service";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";

function ChangePass() {
  const { showToast } = useAdminDrawer();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await adminApiRequest("/admin/me/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: formData.currentPassword,
          new_password: formData.newPassword,
        }),
      });

      showToast("✓ Password changed successfully");
      setSuccess("Your admin password has been changed. Use it for next sign-in.");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
      className={`rounded-[22px] border p-6 sm:p-8 shadow-xl font-dmsans transition-all ${
        isDark
          ? "bg-[#0D2B45] border-[#F7F3EE]/15 text-[#F7F3EE]"
          : "bg-white border-[rgba(13,43,69,0.08)] shadow-[0_4px_20px_rgba(13,43,69,0.04)] text-[#0D2B45]"
      }`}
    >
      <div className="mb-6">
        <h3
          className={`text-xl sm:text-2xl font-semibold font-clash ${
            isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
          }`}
        >
          Change Administrator Password
        </h3>
        <p
          className={`text-xs sm:text-sm font-inter mt-1 ${
            isDark ? "text-[#F7F3EE]/60" : "text-[#0D2B45]/70"
          }`}
        >
          Ensure your account is protected with a secure password at least 8 characters long.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#1A7A4A]/20 border border-[#1A7A4A]/30 text-xs font-mono text-[#5FC48E] mb-5">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className={`p-3.5 rounded-xl border border-[#B5651D]/30 text-xs font-inter mb-5 ${isDark ? "bg-[#B5651D]/15 text-[#F7F3EE]/90" : "bg-[#B5651D]/10 text-[#0D2B45]"}`}>
          {error}
        </div>
      )}

      <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
        <div>
          <label
            className={`block text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-2 ${
              isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
            }`}
          >
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all ${
                isDark
                  ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]"
                  : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"
              }`}
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition ${isDark ? "text-[#F7F3EE]/50 hover:text-[#F7F3EE]" : "text-[#0D2B45]/50 hover:text-[#0D2B45]"}`}
            >
              {showCurrent ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            className={`block text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-2 ${
              isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
            }`}
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all ${
                isDark
                  ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]"
                  : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"
              }`}
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition ${isDark ? "text-[#F7F3EE]/50 hover:text-[#F7F3EE]" : "text-[#0D2B45]/50 hover:text-[#0D2B45]"}`}
            >
              {showNew ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            className={`block text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-2 ${
              isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
            }`}
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all ${
                isDark
                  ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]"
                  : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"
              }`}
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition ${isDark ? "text-[#F7F3EE]/50 hover:text-[#F7F3EE]" : "text-[#0D2B45]/50 hover:text-[#0D2B45]"}`}
            >
              {showConfirm ? <IoEyeOffOutline className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Updating password..." : "Update Password →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePass;
