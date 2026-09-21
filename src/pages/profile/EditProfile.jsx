import { useEffect, useState } from "react";
import { adminApiRequest } from "../../../services/auth.service";

function EditProfile({ profileData, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    fullName: "",
    country: "",
    contactNumber: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profileData) return;

    setFormData({
      fullName: profileData.fullName || "",
      country: profileData.country || "",
      contactNumber: profileData.contactNumber || "",
    });
  }, [profileData]);

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
      const updatedProfile = await adminApiRequest("/admin/me", {
        method: "PATCH",
        body: {
          fullName: formData.fullName.trim(),
          country: formData.country.trim(),
          contactNumber: formData.contactNumber.trim(),
        },
      });

      onProfileUpdated?.(updatedProfile);
      setSuccess("Profile details updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0D2B45] rounded-[22px] border border-[#F7F3EE]/15 p-6 sm:p-8 shadow-xl font-dmsans">
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-[#F7F3EE] font-clash">
          Edit Administrative Details
        </h3>
        <p className="text-xs sm:text-sm text-[#F7F3EE]/60 font-inter mt-1">
          Update your public administrator name, jurisdiction country, and support direct contact.
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
            Administrator Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] text-sm outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all"
            placeholder="Victor Akko"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55">
              Email Address
            </label>
            <span className="text-[10.5px] font-mono text-[#F7F3EE]/40">Root credentials</span>
          </div>
          <input
            type="email"
            name="email"
            value={profileData?.email || ""}
            className="w-full px-4 py-3 bg-[#0A0A0A]/50 border border-[#F7F3EE]/10 rounded-xl text-[#F7F3EE]/60 text-sm font-mono cursor-not-allowed outline-none"
            placeholder="office@victoryfitness.de"
            disabled
            readOnly
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55 mb-2">
              Country / Jurisdiction
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] text-sm outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all"
              placeholder="Germany"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#F7F3EE]/55 mb-2">
              Contact Phone / WhatsApp
            </label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#F7F3EE]/15 rounded-xl text-[#F7F3EE] text-sm font-mono outline-none focus:border-[#C9943A] focus:ring-1 focus:ring-[#C9943A] transition-all"
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
