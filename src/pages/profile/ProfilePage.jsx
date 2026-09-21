import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import EditProfile from "./EditProfile";
import ChangePass from "./ChangePass";
import { IoChevronBack } from "react-icons/io5";
import { adminApiRequest, storeUserInfo, getUserData } from "../../../services/auth.service";

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("editProfile");
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const syncStoredAdminProfile = (profile) => {
    const nextUser = {
      ...getUserData(),
      fullName: profile.fullName,
      name: profile.fullName,
      role: profile.role,
      profileImage: profile.profileImage,
      country: profile.country,
      contactNumber: profile.contactNumber,
      email: profile.email,
    };
    storeUserInfo(nextUser);
    window.dispatchEvent(new Event("admin-profile-updated"));
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await adminApiRequest("/admin/me");
        if (isMounted) {
          setProfileData(response);
          syncStoredAdminProfile(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load profile");
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

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const imageBase64 = result.includes(",") ? result.split(",")[1] : "";

      if (!imageBase64) {
        setError("The selected image could not be processed");
        return;
      }

      setIsUpdating(true);
      setError("");
      try {
        const uploadResponse = await adminApiRequest("/admin/me/profile-image", {
          method: "POST",
          body: {
            image_base64: imageBase64,
            mime_type: file.type || "image/jpeg",
            file_name: file.name || "admin-profile.jpg",
          },
        });

        setProfileData((current) => {
          if (!current) return current;
          const nextProfile = {
            ...current,
            profileImage: uploadResponse.image_url,
          };
          syncStoredAdminProfile(nextProfile);
          return nextProfile;
        });
      } catch (err) {
        setError(err.message || "Failed to upload profile image");
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
      <div className="flex items-center gap-3 pb-2 border-b border-[#F7F3EE]/10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-[#0D2B45] border border-[#F7F3EE]/15 text-[#F7F3EE]/70 hover:text-[#F7F3EE] hover:border-[#C9943A] transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <IoChevronBack className="w-5 h-5" />
        </button>
        <div>
          <div className="text-[10px] font-medium tracking-[0.18em] text-[#B5651D] uppercase font-dmsans">
            ADMIN ACCOUNT CONTROL
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#F7F3EE] font-clash leading-tight">
            Administrator Profile
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Hero Card */}
        <div className="bg-[#0D2B45] rounded-[22px] border-l-4 border-[#B5651D] p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 shadow-xl relative overflow-hidden">
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
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#F7F3EE] font-clash truncate">
              {isLoading ? "Loading..." : displayName}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1.5 flex-wrap">
              <span className="text-xs font-mono font-semibold text-[#C9943A] bg-[#C9943A]/15 px-2.5 py-0.5 rounded-md uppercase">
                {displayRole}
              </span>
              <span className="text-xs text-[#F7F3EE]/50 font-mono">
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
          <div className="p-3.5 rounded-xl bg-[#B5651D]/15 border-l-3 border-[#B5651D] text-xs font-inter text-[#F7F3EE]/90 leading-relaxed">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-[#F7F3EE]/15 gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("editProfile")}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === "editProfile"
                ? "text-[#C9943A]"
                : "text-[#F7F3EE]/60 hover:text-[#F7F3EE]"
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
                : "text-[#F7F3EE]/60 hover:text-[#F7F3EE]"
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
