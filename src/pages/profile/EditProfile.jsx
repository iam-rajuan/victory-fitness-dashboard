import { useState } from "react";
import { adminApiRequest } from "../../../services/auth.service";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";

function EditProfile({ profileData, onProfileUpdated }) {
  const { showToast } = useAdminDrawer();
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    fullName: profileData?.fullName || "",
    contactNumber: profileData?.contactNumber || "",
    country: profileData?.country || "Germany",
  });
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
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminApiRequest("/admin/me", {
        method: "PUT",
        body: JSON.stringify({
          fullName: formData.fullName,
          contactNumber: formData.contactNumber,
          country: formData.country,
        }),
      });

      const updatedProfile = {
        ...profileData,
        ...response,
      };

      showToast("✓ Profile updated successfully");
      onProfileUpdated?.(updatedProfile);
      setSuccess("Profile details updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile");
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
          Edit Administrative Details
        </h3>
        <p
          className={`text-xs sm:text-sm font-inter mt-1 ${
            isDark ? "text-[#F7F3EE]/60" : "text-[#0D2B45]/70"
          }`}
        >
          Update your public administrator name, jurisdiction country, and support direct contact.
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

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className={`block text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-2 ${
              isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
            }`}
          >
            Administrator Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all ${
              isDark
                ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]"
                : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"
            }`}
            placeholder="Victor Akko"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
                isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
              }`}
            >
              Email Address
            </label>
            <span
              className={`text-[10.5px] font-mono ${
                isDark ? "text-[#F7F3EE]/40" : "text-[#0D2B45]/45"
              }`}
            >
              Root credentials
            </span>
          </div>
          <input
            type="email"
            name="email"
            value={profileData?.email || ""}
            className={`w-full px-4 py-3 rounded-xl text-sm font-mono cursor-not-allowed outline-none ${
              isDark
                ? "bg-[#0A0A0A]/50 border border-[#F7F3EE]/10 text-[#F7F3EE]/60"
                : "bg-[rgba(13,43,69,0.05)] border border-[rgba(13,43,69,0.1)] text-[#0D2B45]/60"
            }`}
            placeholder="office@victoryfitness.de"
            disabled
            readOnly
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-2 ${
                isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
              }`}
            >
              Country / Jurisdiction
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all ${
                isDark
                  ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]"
                  : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"
              }`}
              placeholder="Germany"
            />
          </div>

          <div>
            <label
              className={`block text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-2 ${
                isDark ? "text-[#F7F3EE]/55" : "text-[#0D2B45]/60"
              }`}
            >
              Contact Phone / WhatsApp
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 rounded-xl text-sm font-mono outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all ${
                isDark
                  ? "bg-[#0A0A0A] border border-[#F7F3EE]/15 text-[#F7F3EE]"
                  : "bg-[#F7F3EE] border border-[rgba(13,43,69,0.15)] text-[#0D2B45]"
              }`}
              placeholder="+49 171 555 0912"
            />
          </div>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-8 h-12 bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] font-bold text-sm rounded-xl transition-all shadow-lg active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? "Saving changes..." : "Save Changes →"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;
