import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FaCamera } from "react-icons/fa";
import { useAdminDrawer } from "../../context/AdminDrawerContext";
import { useTheme } from "../../context/ThemeContext";
import {
  adminApiRequest,
  getUserData,
  storeUserInfo,
} from "../../../services/auth.service";
import EditProfile from "./EditProfile";
import ChangePass from "./ChangePass";

function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useAdminDrawer();
  const { isDark } = useTheme();
  const [profileData, setProfileData] = useState(getUserData());
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("editProfile");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await adminApiRequest("/admin/me");
        if (isMounted) {
          setProfileData(data);
          storeUserInfo({
            ...getUserData(),
            ...data,
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load admin profile");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const syncStoredAdminProfile = (updatedProfile) => {
    const nextUser = {
      ...getUserData(),
      ...updatedProfile,
    };
    storeUserInfo(nextUser);
    window.dispatchEvent(
      new CustomEvent("admin-profile-updated", { detail: nextUser }),
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setIsUpdating(true);
      setError("");

      try {
        const response = await adminApiRequest("/admin/me/profile-image", {
          method: "PUT",
          body: JSON.stringify({ image_data: base64Data }),
        });

        const nextProfile = {
          ...profileData,
          profileImage: response.profile_image || base64Data,
        };
        setProfileData(nextProfile);
        syncStoredAdminProfile(nextProfile);
        showToast("✓ Profile photo updated successfully");
      } catch (err) {
        setError(err.message || "Failed to update profile photo");
      } finally {
        setIsUpdating(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const displayName = profileData?.fullName || "Victor Akko";
  const displayRole = profileData?.role || "admin";

  return (
    <div className="space-y-6 font-dmsans animate-in fade-in duration-200">
      {/* Header */}
      <div
        className={`flex items-center gap-3 pb-2 border-b transition-colors ${
          isDark ? "border-[#F7F3EE]/10" : "border-[rgba(13,43,69,0.08)]"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isDark
              ? "bg-[#0D2B45] border-[#F7F3EE]/15 text-[#F7F3EE]/70 hover:text-[#F7F3EE] hover:border-[#C9943A]"
              : "bg-white border-[rgba(13,43,69,0.12)] text-[#0D2B45]/70 hover:text-[#0D2B45] hover:border-[#C9943A] shadow-xs"
          }`}
          aria-label="Go back"
        >
          <IoChevronBack className="w-5 h-5" />
        </button>
        <div>
          <div className="text-[10px] font-medium tracking-[0.18em] text-[#B5651D] uppercase font-dmsans">
            ADMIN ACCOUNT CONTROL
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-semibold font-clash leading-tight ${
              isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
            }`}
          >
            Administrator Profile
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Hero Card */}
        <div
          style={{ borderLeftWidth: 4, borderLeftColor: "#B5651D", borderLeftStyle: "solid" }}
          className={`rounded-[22px] p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 shadow-xl relative overflow-hidden transition-all ${
            isDark
              ? "bg-[#0D2B45] text-[#F7F3EE]"
              : "bg-white border border-[rgba(13,43,69,0.08)] shadow-[0_4px_20px_rgba(13,43,69,0.04)] text-[#0D2B45]"
          }`}
        >
          {/* Avatar with Camera badge */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#C9943A] bg-[#0A0A0A] overflow-hidden shadow-2xl flex items-center justify-center">
              <img
                src={profileData?.profileImage || "/userimg.png"}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/userimg.png";
                }}
              />
            </div>
            <label
              htmlFor="profilePicUpload"
              className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#C9943A] hover:bg-[#d8a24a] text-[#0D0D0D] shadow-lg cursor-pointer transition-transform active:scale-95"
              title="Upload profile picture"
            >
              <FaCamera className="w-3.5 h-3.5" />
            </label>
            <input
              type="file"
              id="profilePicUpload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUpdating}
            />
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2
              className={`text-2xl sm:text-3xl font-semibold font-clash truncate ${
                isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
              }`}
            >
              {isLoading ? "Loading..." : displayName}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
              <span className="text-xs font-mono font-semibold text-[#C9943A] bg-[#C9943A]/15 px-2.5 py-0.5 rounded-md uppercase">
                {displayRole}
              </span>
              <span
                className={`text-xs font-mono ${
                  isDark ? "text-[#F7F3EE]/50" : "text-[#0D2B45]/55"
                }`}
              >
                {profileData?.email || "office@victoryfitness.de"}
              </span>
            </div>
            {isUpdating && (
              <div className="text-xs font-mono text-[#5FC48E] mt-2 animate-pulse">
                Updating profile photo...
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className={`p-3.5 rounded-xl border border-[#B5651D]/30 text-xs font-inter leading-relaxed ${isDark ? "bg-[#B5651D]/15 text-[#F7F3EE]/90" : "bg-[#B5651D]/10 text-[#0D2B45]"}`}>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div
          className={`flex border-b gap-6 text-sm font-semibold transition-colors ${
            isDark ? "border-[#F7F3EE]/15" : "border-[rgba(13,43,69,0.12)]"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab("editProfile")}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === "editProfile"
                ? "text-[#C9943A]"
                : isDark
                ? "text-[#F7F3EE]/60 hover:text-[#F7F3EE]"
                : "text-[#0D2B45]/60 hover:text-[#0D2B45]"
            }`}
          >
            Edit Profile
            {activeTab === "editProfile" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9943A]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("changePassword")}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === "changePassword"
                ? "text-[#C9943A]"
                : isDark
                ? "text-[#F7F3EE]/60 hover:text-[#F7F3EE]"
                : "text-[#0D2B45]/60 hover:text-[#0D2B45]"
            }`}
          >
            Change Password
            {activeTab === "changePassword" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9943A]" />
            )}
          </button>
        </div>

        {/* Tab Content Container */}
        <div>
          {activeTab === "editProfile" && (
            <EditProfile
              profileData={profileData}
              onProfileUpdated={(updatedProfile) => {
                setProfileData(updatedProfile);
                syncStoredAdminProfile(updatedProfile);
              }}
            />
          )}
          {activeTab === "changePassword" && <ChangePass />}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
