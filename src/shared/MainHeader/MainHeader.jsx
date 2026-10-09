import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMenu, IoNotificationsOutline } from "react-icons/io5";
import { adminApiRequest, getUserData, storeUserInfo } from "../../../services/auth.service";
import { listAdminNotifications } from "../../../services/admin-content.service";


const MainHeader = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getUserData());
  const [isLoading, setIsLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const displayName =
    currentUser?.fullName ||
    currentUser?.name ||
    "Admin";
  const displayRole =
    currentUser?.role ||
    "Admin";
  const displayImage =
    currentUser?.profileImage ||
    currentUser?.profile_image ||
    "/userimg.png";

  useEffect(() => {
    let isMounted = true;

    const loadAdminProfile = async () => {
      setIsLoading(true);
      try {
        const [response, notificationsResponse] = await Promise.all([
          adminApiRequest("/admin/me"),
          listAdminNotifications().catch(() => null),
        ]);
        if (!isMounted) {
          return;
        }

        const nextUser = {
          ...getUserData(),
          fullName: response.fullName,
          name: response.fullName,
          role: response.role,
          profileImage: response.profileImage,
          country: response.country,
          contactNumber: response.contactNumber,
          email: response.email,
        };
        storeUserInfo(nextUser);
        setCurrentUser(nextUser);
        if (Array.isArray(notificationsResponse?.items)) {
          setNotificationCount(notificationsResponse.items.filter((item) => !item?.read).length);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(getUserData());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const syncHeaderProfile = () => {
      setCurrentUser(getUserData());
      loadAdminProfile();
    };

    const syncNotifications = (event) => {
      const items = Array.isArray(event?.detail) ? event.detail : [];
      setNotificationCount(items.filter((item) => !item?.read).length);
    };

    loadAdminProfile();
    window.addEventListener("admin-profile-updated", syncHeaderProfile);
    window.addEventListener("admin-notifications-updated", syncNotifications);

    return () => {
      isMounted = false;
      window.removeEventListener("admin-profile-updated", syncHeaderProfile);
      window.removeEventListener("admin-notifications-updated", syncNotifications);
    };
  }, []);

  return (
    <div className="relative w-full px-3 sm:px-4 lg:px-5">
      <header className="shadow-sm rounded-lg border border-surface-200 overflow-hidden bg-white">
        <div className="flex items-center px-3 sm:px-5 md:px-10 h-[60px] sm:h-[70px] lg:h-[80px]">
          {/* Left: Hamburger Menu */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="md:hidden p-2 rounded-lg hover:bg-brand-50 active:bg-brand-100 focus:outline-none transition-colors duration-200"
          >
            <IoMenu className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600" />
          </button>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right: Notification & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification */}
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
              className="relative p-2 rounded-full border border-brand-600 hover:bg-brand-50 active:bg-brand-100 transition-colors duration-200"
            >
              <IoNotificationsOutline className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 text-white text-[10px] px-1 leading-none font-semibold">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Profile */}
            <div
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={displayImage}
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover rounded-full border-2 border-brand-100"
                alt="User Avatar"
                onError={(e) => {
                  e.target.src = "/userimg.png";
                }}
              />
              <div className="hidden sm:block">
                <h3 className="hidden md:block text-brand-700 text-sm lg:text-base font-semibold leading-tight">
                  {isLoading
                    ? "Loading..."
                    : displayName}
                </h3>
                <p className="text-brand-600 text-xs sm:text-sm lg:text-base font-semibold">
                  {displayRole}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default MainHeader;
