import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IoCloseSharp, IoLogOutOutline } from "react-icons/io5";
import {
  HiOutlineSquares2X2,
  HiOutlineUsers,
  HiOutlineBolt,
  HiOutlineTrophy,
  HiOutlineAcademicCap,
  HiOutlineCreditCard,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineLifebuoy,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineBanknotes,
  HiOutlineShieldCheck,
  HiOutlineFlag,
  HiOutlineBell,
  HiOutlineQuestionMarkCircle,
  HiOutlineCog6Tooth,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import { logoutAdmin, getUserData } from "../../../services/auth.service";
import { useTheme } from "../../context/ThemeContext";
import RequirementAuditBoundary from "../../components/audit/RequirementAuditBoundary";

const NAV_GROUPS = [
  {
    label: "MAIN MENU",
    items: [
      { to: "/", label: "Dashboard", icon: HiOutlineSquares2X2, exact: true },
      { to: "/user-details", label: "All Users", icon: HiOutlineUsers },
      { to: "/workouts", label: "Workouts", icon: HiOutlineBolt },
      { to: "/challenges", label: "Challenges", icon: HiOutlineTrophy },
      { to: "/masterclasses", label: "Masterclasses", icon: HiOutlineAcademicCap },
      { to: "/subscriptions", label: "Subscriptions", icon: HiOutlineCreditCard },
      {
        to: "/beta-analytics",
        label: "21-Day Gold Beta",
        icon: HiOutlineSparkles,
        badge: "12",
        audit: {
          auditId: "ADMIN-MISMATCH-001",
          status: "mismatch",
          label: "MISMATCH - DOCUMENT REQUIRES 5-DAY GOLD TRIAL",
        },
      },
      { to: "/trial-analytics", label: "5-Day Gold Trial", icon: HiOutlineClock, badge: "5" },
      { to: "/all-subscribers", label: "All Subscribers", icon: HiOutlineUserGroup },
      { to: "/community", label: "Community", icon: HiOutlineChatBubbleLeftRight, badge: "3" },
      { to: "/applications", label: "Applications", icon: HiOutlineDocumentText, badge: "2" },
      {
        to: "/support-inbox",
        label: "Help & Support",
        icon: HiOutlineLifebuoy,
        badge: "3",
        audit: {
          auditId: "ADMIN-EXTRA-028",
          status: "extra",
          label: "NEW FEATURE - SUPPORT INBOX NOT IN REQUIREMENT",
        },
      },
      {
        to: "/quotes",
        label: "Quotes",
        icon: HiOutlineChatBubbleBottomCenterText,
      },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { to: "/payments", label: "Payments", icon: HiOutlineBanknotes, badge: "2" },
      { to: "/audit-logs", label: "Audit Logs", icon: HiOutlineShieldCheck },
      { to: "/feature-flags", label: "Feature Flags", icon: HiOutlineFlag },
      { to: "/notifications", label: "Notification Templates", icon: HiOutlineBell },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      {
        to: "/faq",
        label: "FAQ",
        icon: HiOutlineQuestionMarkCircle,
        audit: { auditId: "ADMIN-EXTRA-003", status: "extra", label: "NEW FEATURE - FAQ MANAGEMENT NOT IN REQUIREMENT" },
      },
      { to: "/settings", label: "Settings", icon: HiOutlineCog6Tooth },
    ],
  },
];

function NavItem({ to, label, icon: Icon, badge, exact, audit, isActive, matchesPrefix, onClick, isDark, isCollapsed }) {
  const active = exact ? isActive(to) : matchesPrefix(to);

  if (isCollapsed) {
    const link = (
      <Link to={to} onClick={onClick} className="block select-none" title={badge ? `${label} (${badge})` : label}>
        <div
          className={`relative flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-200 cursor-pointer ${
            active
              ? isDark
                ? "bg-[#0D2B45] text-[#C9943A] shadow-xs border-l-[3px] border-[#C9943A]"
                : "bg-[#0D2B45]/10 text-[#0D2B45] shadow-xs border-l-[3px] border-[#C9943A]"
              : isDark
              ? "text-[#F7F3EE]/60 hover:text-[#F7F3EE] hover:bg-[#F7F3EE]/6"
              : "text-[#0D2B45]/65 hover:text-[#0D2B45] hover:bg-[rgba(13,43,69,0.05)]"
          }`}
        >
          <Icon className="w-5 h-5 shrink-0" />
          {badge && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C9943A]" />
          )}
        </div>
      </Link>
    );

    return audit ? (
      <RequirementAuditBoundary auditId={audit.auditId} status={audit.status} label={audit.label}>
        {link}
      </RequirementAuditBoundary>
    ) : link;
  }

  const link = (
    <Link to={to} onClick={onClick} className="block select-none">
      <div
        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
          active
            ? isDark
              ? "bg-[#0D2B45] text-[#F7F3EE] font-semibold shadow-xs border-l-[3px] border-[#C9943A]"
              : "bg-[#0D2B45]/10 text-[#0D2B45] font-semibold shadow-xs border-l-[3px] border-[#C9943A]"
            : isDark
            ? "text-[#F7F3EE]/65 hover:text-[#F7F3EE] hover:bg-[#F7F3EE]/5 font-normal"
            : "text-[#0D2B45]/70 hover:text-[#0D2B45] hover:bg-[rgba(13,43,69,0.04)] font-normal"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-5 h-5 shrink-0 transition-colors ${
              active
                ? "text-[#C9943A]"
                : isDark
                ? "text-[#F7F3EE]/50 group-hover:text-[#F7F3EE]"
                : "text-[#0D2B45]/50 group-hover:text-[#0D2B45]"
            }`}
          />
          <span className="text-[13.5px] leading-tight font-dmsans truncate">{label}</span>
        </div>

        {badge && (
          <span
            className={`text-[11px] font-jetbrains px-2 py-0.5 rounded-md shrink-0 ${
              active
                ? "bg-[#C9943A] text-[#0D0D0D] font-bold"
                : isDark
                ? "bg-[#F7F3EE]/10 text-[#C9943A] font-semibold"
                : "bg-[rgba(13,43,69,0.06)] text-[#B5651D] font-semibold"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </Link>
  );

  return audit ? (
    <RequirementAuditBoundary auditId={audit.auditId} status={audit.status} label={audit.label}>
      {link}
    </RequirementAuditBoundary>
  ) : link;
}

const Sidebar = ({
  isOpen,
  toggleSidebar,
  isCollapsed: propCollapsed,
  toggleCollapse: propToggleCollapse,
}) => {
  const { isDark, logoSrc } = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path) => currentPath === path;
  const matchesPrefix = (path) => path !== "/" && currentPath.startsWith(path);
  const navigate = useNavigate();

  const [localCollapsed, setLocalCollapsed] = useState(() => {
    try {
      return localStorage.getItem("vf_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const isCollapsed = propCollapsed !== undefined ? propCollapsed : localCollapsed;

  const toggleCollapse = () => {
    if (propToggleCollapse) {
      propToggleCollapse();
    } else {
      setLocalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("vf_sidebar_collapsed", String(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
  };

  const user = getUserData();
  const displayName = user?.fullName || user?.name || "Victor Akko";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "VA";

  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && toggleSidebar) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    localStorage.removeItem("resetToken");
    navigate("/sign-in");
    if (window.innerWidth < 1024 && toggleSidebar) {
      toggleSidebar();
    }
  };

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 h-screen border-r flex flex-col z-[70] transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[76px]" : "w-[260px]"
      } ${
        isDark
          ? "bg-[#0A0A0A] border-[#F7F3EE]/10 text-[#F7F3EE]"
          : "bg-[#FFFFFF] border-[rgba(13,43,69,0.08)] text-[#0D2B45] shadow-[2px_0_16px_rgba(13,43,69,0.03)]"
      } ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Mobile Close Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`lg:hidden absolute top-4 right-4 p-2 rounded-lg border ${
          isDark
            ? "text-[#F7F3EE]/60 hover:text-[#F7F3EE] bg-[#0D0D0D] border-[#F7F3EE]/10"
            : "text-[#0D2B45]/60 hover:text-[#0D2B45] bg-[#F7F3EE] border-[rgba(13,43,69,0.1)]"
        }`}
        aria-label="Close sidebar"
      >
        <IoCloseSharp className="w-5 h-5" />
      </button>

      {/* Header / Brand with Centered Logo */}
      <div
        className={`border-b shrink-0 transition-all duration-300 ${
          isCollapsed ? "py-4 px-2" : "pt-6 pb-5 px-4"
        } ${isDark ? "border-[#F7F3EE]/10" : "border-[rgba(13,43,69,0.08)]"}`}
      >
        <Link to="/" onClick={handleLinkClick} className="block text-center select-none group">
          {isCollapsed ? (
            <div className="flex items-center justify-center py-1">
              <img
                src={logoSrc}
                alt="VF"
                className="h-9 w-auto max-w-[44px] object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <img
                src={logoSrc}
                alt="Victory Fitness"
                className="h-14 w-auto object-contain mx-auto mb-2 transition-transform duration-200 group-hover:scale-102"
              />
              <div
                className={`text-[10px] font-semibold tracking-[0.22em] uppercase font-dmsans text-center transition-colors ${
                  isDark ? "text-[#F7F3EE]/45" : "text-[#0D2B45]/55"
                }`}
              >
                ADMIN DASHBOARD
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(201,148,58,0.25)_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#F7F3EE]/10 hover:[&::-webkit-scrollbar-thumb]:bg-[#C9943A]/40 [&::-webkit-scrollbar-track]:bg-transparent">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {isCollapsed ? (
              <div
                className={`w-6 h-[1px] mx-auto my-2.5 transition-colors ${
                  isDark ? "bg-[#F7F3EE]/10" : "bg-[rgba(13,43,69,0.1)]"
                }`}
              />
            ) : (
              <div
                className={`text-[9.5px] font-semibold tracking-[0.17em] px-3.5 py-1 uppercase font-dmsans ${
                  isDark ? "text-[#F7F3EE]/35" : "text-[#0D2B45]/45 font-semibold"
                }`}
              >
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                exact={item.exact}
                audit={item.audit}
                isActive={isActive}
                matchesPrefix={matchesPrefix}
                onClick={handleLinkClick}
                isDark={isDark}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer Profile, Collapse Action & Logout */}
      <div
        className={`p-3 border-t shrink-0 transition-all duration-300 ${
          isDark ? "border-[#F7F3EE]/10 bg-[#0A0A0A]" : "border-[rgba(13,43,69,0.08)] bg-[#FFFFFF]"
        }`}
      >
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/profile"
              onClick={handleLinkClick}
              className="w-10 h-10 rounded-full bg-[#C9943A] flex items-center justify-center shrink-0 shadow-sm cursor-pointer hover:ring-2 hover:ring-[#C9943A]/50 transition-all"
              title={`${displayName} (Super Admin)`}
            >
              <span className="font-bold text-xs text-[#0D0D0D] font-dmsans">{initials}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isDark
                  ? "text-[#F7F3EE]/60 hover:text-red-400 border-transparent hover:border-red-500/20 hover:bg-red-500/10"
                  : "text-[#0D2B45]/60 hover:text-red-600 border-transparent hover:border-red-500/20 hover:bg-red-500/10"
              }`}
              title="Log out"
              aria-label="Log out"
            >
              <IoLogOutOutline className="w-4 h-4" />
            </button>

            {/* Expand button at bottom when collapsed */}
            <button
              type="button"
              onClick={toggleCollapse}
              className={`hidden lg:flex w-10 h-10 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "text-[#F7F3EE]/70 hover:text-[#C9943A] bg-[#0D0D0D] border-[#F7F3EE]/10 hover:border-[#C9943A]/40"
                  : "text-[#0D2B45]/70 hover:text-[#C9943A] bg-[#F7F3EE] border-[rgba(13,43,69,0.08)] hover:border-[#C9943A]/40"
              }`}
              title="Expand sidebar (Ctrl+B)"
              aria-label="Expand sidebar"
            >
              <HiOutlineChevronRight className="w-4 h-4 text-[#C9943A]" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                isDark
                  ? "bg-[#0D0D0D] border-[#F7F3EE]/10"
                  : "bg-[#F7F3EE] border-[rgba(13,43,69,0.08)]"
              }`}
            >
              <Link
                to="/profile"
                onClick={handleLinkClick}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#C9943A] flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-[#C9943A]/40 transition-all">
                  <span className="font-bold text-xs text-[#0D0D0D] font-dmsans">{initials}</span>
                </div>
                <div className="min-w-0">
                  <div
                    className={`text-xs font-semibold truncate font-dmsans group-hover:text-[#C9943A] transition-colors ${
                      isDark ? "text-[#F7F3EE]" : "text-[#0D2B45]"
                    }`}
                  >
                    {displayName}
                  </div>
                  <div
                    className={`text-[10px] font-mono tracking-wider truncate uppercase ${
                      isDark ? "text-[#F7F3EE]/40" : "text-[#0D2B45]/50"
                    }`}
                  >
                    Super Admin
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isDark
                    ? "text-[#F7F3EE]/60 hover:text-red-400 border-transparent hover:border-red-500/20 hover:bg-red-500/10"
                    : "text-[#0D2B45]/60 hover:text-red-600 border-transparent hover:border-red-500/20 hover:bg-red-500/10"
                }`}
                title="Log out"
                aria-label="Log out"
              >
                <IoLogOutOutline className="w-4 h-4" />
              </button>
            </div>

            {/* Collapse Sidebar Button (Linear/Notion Gold Standard) */}
            <button
              type="button"
              onClick={toggleCollapse}
              className={`hidden lg:flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-dmsans transition-all cursor-pointer ${
                isDark
                  ? "text-[#F7F3EE]/55 hover:text-[#F7F3EE] hover:bg-[#F7F3EE]/5"
                  : "text-[#0D2B45]/60 hover:text-[#0D2B45] hover:bg-[rgba(13,43,69,0.05)]"
              }`}
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <div className="flex items-center gap-2.5">
                <HiOutlineChevronLeft className="w-4 h-4 text-[#C9943A]" />
                <span className="font-medium">Collapse sidebar</span>
              </div>
              <span
                className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  isDark
                    ? "bg-[#0D0D0D] border-[#F7F3EE]/10 text-[#F7F3EE]/40"
                    : "bg-[#FFFFFF] border-[rgba(13,43,69,0.12)] text-[#0D2B45]/50"
                }`}
              >
                Ctrl B
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
