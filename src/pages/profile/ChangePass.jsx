import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { adminApiRequest } from "../../../services/auth.service";

function ChangePass() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await adminApiRequest("/admin/me/change-password", {
        method: "POST",
        body: {
          current_password: formData.oldPassword,
          new_password: formData.newPassword,
        },
      });

      setSuccess("Administrator password updated successfully.");
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0D2B45] rounded-[22px] border border-[#F7F3EE]/15 p-6 sm:p-8 shadow-xl font-dmsans">
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-[#F7F3EE] font-clash">
          Update Security Password
        </h3>
        <p className="text-xs sm:text-sm text-[#F7F3EE]/60 font-inter mt-1">
          Provide your current credentials and choose a strong minimum 8-character password.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-[#1A7A4A]/20 border-l-3 border-[#1A7A4A] text-xs font-mono text-[#5FC48E] mb-5">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#B5651D]/15 border-l-3 border-[#B5651D] text-xs font-inter text-[#F7F3EE]/90 mb-5">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleInputChange}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] text-sm font-jetbrains outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F7F3EE]/40 hover:text-[#F7F3EE]/80 transition-colors p-1"
            >
              {showOldPassword ? (
                <IoEyeOffOutline className="w-5 h-5" />
              ) : (
                <IoEyeOutline className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] text-sm font-jetbrains outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F7F3EE]/40 hover:text-[#F7F3EE]/80 transition-colors p-1"
            >
              {showNewPassword ? (
                <IoEyeOffOutline className="w-5 h-5" />
              ) : (
                <IoEyeOutline className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••••••"
            className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] text-sm font-jetbrains outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all"
            required
          />
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
