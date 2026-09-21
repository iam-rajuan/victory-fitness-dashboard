import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  IoSunnyOutline,
  IoMoonOutline,
  IoMenu,
  IoNotificationsOutline,
} from "react-icons/io5";
import { HiOutlineBars3BottomLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { useTheme } from "../../context/ThemeContext";
import { listAdminNotifications } from "../../../services/admin-content.service";
import { getUserData } from "../../../services/auth.service";

const ROUTE_LABELS = {
  "/": "Executive Overview",
  "/dashboard": "Executive Overview",
  "/user-details": "All Users Directory",
  "/workouts": "Workout Library",
  "/challenges": "Active Challenges",
  "/masterclasses": "Masterclass Series",
  "/subscriptions": "Subscription Tiers",
  "/all-subscribers": "Subscribers & Members",
  "/community": "Community & Cohorts",
  "/applications": "Inner Circle Applications",
  "/support-inbox": "Help & Support Inbox",
  "/quotes": "Daily Coach Quotes",
  "/beta-analytics": "21-Day Gold Beta Insights",
  "/trial-analytics": "5-Day Gold Trial Insights",
  "/gold-trial": "5-Day Gold Trial Insights",
  "/audit-logs": "System Audit Logs",
  "/feature-flags": "Feature Flags Engine",
  "/payments": "Payments & Transactions",
  "/notifications": "Broadcast & Notifications",
  "/faq": "FAQ Knowledge Base",
  "/settings": "Platform Settings",
  "/profile": "Admin Profile",
  "/profile/edit": "Edit Profile",
  "/profile/change-password": "Change Password",
};

export default function TopBar({ toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse }) {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userData, setUserData] = useState(() => getUserData());

  const currentLabel = ROUTE_LABELS[location.pathname] || "Admin Console";

  useEffect(() => {
    let isMounted = true;
    const loadUnread = async () => {
      try {
        const res = await listAdminNotifications().catch(() => ({ items: [] }));
        if (isMounted && Array.isArray(res?.items)) {
          setUnreadCount(res.items.filter((item) => !item?.read).length);
        }
      } catch {
        // ignore
      }
    };
    loadUnread();

    const handleProfileUpdate = () => {
      setUserData(getUserData());
    };
    window.addEventListener("admin-profile-updated", handleProfileUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("admin-profile-updated", handleProfileUpdate);
    };
  }, []);

  const initials = userData?.fullName
    ? userData.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "VA";

  return (
    <header
      className={`sticky top-0 z-30 shrink-0 h-16 border-b transition-colors duration-250 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between ${
        isDark
          ? "bg-[#0A0A0A]/85 border-[#F7F3EE]/10 text-[#F7F3EE]"
          : "bg-[#FFFFFF]/90 border-[rgba(13,43,69,0.08)] text-[#0D2B45] shadow-[0_2px_12px_rgba(13,43,69,0.03)]"
      }`}
    >
      {/* Left side: Mobile Toggle + Desktop Collapse Toggle + Breadcrumb + Status Badge */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`lg:hidden p-2 rounded-xl transition-colors ${
            isDark
              ? "text-[#F7F3EE]/70 hover:text-[#F7F3EE] hover:bg-[#F7F3EE]/5"
              : "text-[#0D2B45]/70 hover:text-[#0D2B45] hover:bg-[#0D2B45]/5"
          }`}
          aria-label="Toggle navigation menu"
        >
          <IoMenu className="w-6 h-6" />
        </button>

        {/* Desktop Sidebar Collapse / Expand Toggle */}
        {toggleSidebarCollapse && (
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className={`hidden lg:flex items-center justify-center h-9 w-9 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? "text-[#F7F3EE]/70 hover:text-[#C9943A] bg-[#0D0D0D] border-[#F7F3EE]/15 hover:border-[#C9943A]/50"
                : "text-[#0D2B45]/70 hover:text-[#C9943A] bg-[#F7F3EE] border-[rgba(13,43,69,0.12)] hover:border-[#C9943A]"
            }`}
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <HiOutlineChevronRight className="w-4 h-4" />
            ) : (
              <HiOutlineBars3BottomLeft className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="font-clash font-semibold text-sm sm:text-base tracking-tight truncate">
              {currentLabel}
            </h1>
            <span
              className={`hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-semibold uppercase tracking-wider ${
                isDark
                  ? "bg-[#1A7A4A]/15 text-[#5FC48E] border border-[#1A7A4A]/30"
                  : "bg-[#1A7A4A]/10 text-[#1A7A4A] border border-[#1A7A4A]/25"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A7A4A] animate-pulse" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Luxury Theme Switcher + Notifications + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Luxury Theme Mode Switcher Pill */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "White" : "Dark"} Mode`}
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all duration-200 cursor-pointer select-none group shadow-sm ${
            isDark
              ? "bg-[#0D0D0D] border-[#F7F3EE]/15 hover:border-[#C9943A]/50 text-[#F7F3EE]"
              : "bg-[#F7F3EE] border-[rgba(13,43,69,0.12)] hover:border-[#C9943A] text-[#0D2B45]"
          }`}
        >
          {/* Animated Icons Container */}
          <div className="flex items-center gap-1 text-xs">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                !isDark
                  ? "bg-[#C9943A] text-[#0D0D0D] shadow-sm scale-105"
                  : "text-[#F7F3EE]/40 hover:text-[#F7F3EE]"
              }`}
            >
              <IoSunnyOutline className="w-3.5 h-3.5" />
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                isDark
                  ? "bg-[#C9943A] text-[#0D0D0D] shadow-sm scale-105"
                  : "text-[#0D2B45]/40 hover:text-[#0D2B45]"
              }`}
            >
              <IoMoonOutline className="w-3.5 h-3.5" />
            </div>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-medium font-dmsans tracking-wide pr-1">
            {isDark ? "Dark" : "Light"}
          </span>
        </button>

        {/* Notifications Icon with Unread Badge */}
        <Link
          to="/notifications"
          aria-label="View notifications"
          className={`relative p-2 rounded-full border transition-all ${
            isDark
              ? "border-[#F7F3EE]/15 text-[#F7F3EE]/80 hover:text-[#F7F3EE] hover:bg-[#F7F3EE]/5"
              : "border-[rgba(13,43,69,0.12)] text-[#0D2B45]/80 hover:text-[#0D2B45] hover:bg-[rgba(13,43,69,0.05)]"
          }`}
        >
          <IoNotificationsOutline className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#B5651D] text-[#F7F3EE] font-mono text-[9px] font-bold shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Avatar Chip */}
        <div
          onClick={() => navigate("/profile")}
          className={`flex items-center gap-2 pl-1 sm:pl-2 pr-2 py-1 rounded-full border cursor-pointer transition-all ${
            isDark
              ? "border-[#F7F3EE]/10 bg-[#0D0D0D] hover:border-[#C9943A]/40"
              : "border-[rgba(13,43,69,0.1)] bg-[#F7F3EE] hover:border-[#C9943A]"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-[#C9943A] flex items-center justify-center shrink-0">
            <span className="font-bold text-[11px] text-[#0D0D0D] font-dmsans">
              {initials}
            </span>
          </div>
          <span className="hidden md:inline-block text-xs font-semibold font-dmsans pr-1">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}
