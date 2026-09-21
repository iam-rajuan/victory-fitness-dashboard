import { Link, useNavigate, useLocation } from "react-router-dom";
import { IoCloseSharp, IoLogOutOutline } from "react-icons/io5";
import { logoutAdmin, getUserData } from "../../../services/auth.service";

const NAV_GROUPS = [
  {
    label: "MAIN MENU",
    items: [
      { to: "/", label: "Dashboard", exact: true },
      { to: "/user-details", label: "All Users" },
      { to: "/workouts", label: "Workouts" },
      { to: "/challenges", label: "Challenges" },
      { to: "/masterclasses", label: "Masterclasses" },
      { to: "/subscriptions", label: "Subscriptions" },
      { to: "/beta-analytics", label: "21-Day Gold Beta", badge: "15" },
      { to: "/trial-analytics", label: "5-Day Gold Trial", badge: "19" },
      { to: "/all-subscribers", label: "All Subscribers" },
      { to: "/community", label: "Community" },
      { to: "/applications", label: "Applications", badge: "2" },
      { to: "/support-inbox", label: "Help & Support", badge: "3" },
      { to: "/quotes", label: "Quotes" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { to: "/payments", label: "Payments" },
      { to: "/audit-logs", label: "Audit Logs" },
      { to: "/feature-flags", label: "Feature Flags" },
      { to: "/notifications", label: "Notification Templates" },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      { to: "/faq", label: "FAQ" },
      { to: "/settings", label: "Settings" },
    ],
  },
];

function NavItem({ to, label, badge, exact, isActive, matchesPrefix, onClick }) {
  const active = exact ? isActive(to) : matchesPrefix(to);

  return (
    <Link to={to} onClick={onClick} className="block select-none">
      <div
        className={`group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
          active
            ? "bg-[#C9943A]/16 border-l-[3px] border-[#C9943A] text-[#F7F3EE] font-semibold"
            : "text-[#F7F3EE]/65 hover:text-[#F7F3EE] hover:bg-[#F7F3EE]/5 font-normal border-l-[3px] border-transparent"
        }`}
      >
        <span className="text-[13.5px] leading-tight font-dmsans truncate">{label}</span>
        {badge && (
          <span
            className={`text-[11px] font-jetbrains px-2 py-0.5 rounded-md ${
              active
                ? "bg-[#C9943A] text-[#0D0D0D] font-bold"
                : "bg-[#F7F3EE]/10 text-[#C9943A] font-semibold"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path) => currentPath === path;
  const matchesPrefix = (path) => path !== "/" && currentPath.startsWith(path);
  const navigate = useNavigate();
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
      className={`fixed lg:sticky top-0 left-0 h-screen w-[248px] bg-[#0A0A0A] border-r border-[#F7F3EE]/10 flex flex-col z-[70] transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Mobile Close Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="lg:hidden absolute top-4 right-4 p-2 text-[#F7F3EE]/60 hover:text-[#F7F3EE] bg-[#0D0D0D] border border-[#F7F3EE]/10 rounded-lg"
        aria-label="Close sidebar"
      >
        <IoCloseSharp className="w-5 h-5" />
      </button>

      {/* Header / Brand */}
      <div className="pt-6 pb-5 px-5 border-b border-[#F7F3EE]/10 shrink-0">
        <Link to="/" onClick={handleLinkClick} className="block">
          <img
            src="/logo_light.png?v=5"
            alt="Victory Fitness"
            className="h-10 w-auto object-contain mb-2.5"
          />
          <div className="text-[9.5px] font-medium tracking-[0.19em] text-[#F7F3EE]/45 uppercase font-dmsans">
            ADMIN DASHBOARD
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="text-[9.5px] font-medium tracking-[0.17em] text-[#F7F3EE]/35 px-3 py-1 uppercase font-dmsans">
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                isActive={isActive}
                matchesPrefix={matchesPrefix}
                onClick={handleLinkClick}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-[#F7F3EE]/10 shrink-0 bg-[#0A0A0A]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D0D0D] border border-[#F7F3EE]/10">
          <Link
            to="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#C9943A] flex items-center justify-center shrink-0">
              <span className="font-bold text-xs text-[#0D0D0D] font-dmsans">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#F7F3EE] truncate font-dmsans">
                {displayName}
              </div>
              <div className="text-[10px] font-mono text-[#F7F3EE]/45">admin</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-[#F7F3EE]/50 hover:text-red-400 hover:bg-[#F7F3EE]/5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <IoLogOutOutline className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
