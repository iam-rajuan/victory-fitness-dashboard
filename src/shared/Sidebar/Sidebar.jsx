import { Link, useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { LuUsers } from "react-icons/lu";
import { IoMdSettings } from "react-icons/io";
import { IoCloseSharp, IoLogOutOutline } from "react-icons/io5";
import { MdCardMembership, MdOutlineGroups, MdQuiz } from "react-icons/md";
import { FaDumbbell, FaTrophy, FaGraduationCap, FaUsers, FaFileAlt, FaHeadset } from "react-icons/fa";
import { MdFormatQuote, MdAnalytics, MdWorkspacePremium } from "react-icons/md";
import { logoutAdmin } from "../../../services/auth.service";

/**
 * Sidebar item config — single source of truth for the navigation.
 * Adding a new link here is enough: no other file needs to change.
 */
const NAV_GROUPS = [
  {
    label: "Main Menu",
    items: [
      { to: "/", label: "Dashboard", icon: RxDashboard, exact: true },
      { to: "/user-details", label: "All Users", icon: LuUsers },
      { to: "/workouts", label: "Workouts", icon: FaDumbbell },
      { to: "/challenges", label: "Challenges", icon: FaTrophy },
      { to: "/masterclasses", label: "Masterclasses", icon: FaGraduationCap },
      { to: "/subscriptions", label: "Subscriptions", icon: MdCardMembership },
      { to: "/beta-analytics", label: "21-Day Gold Beta", icon: MdWorkspacePremium },
      { to: "/trial-analytics", label: "5-Day Gold Trial", icon: MdWorkspacePremium },
      { to: "/all-subscribers", label: "All Subscribers", icon: FaUsers },
      { to: "/community", label: "Community", icon: MdOutlineGroups },
      { to: "/applications", label: "Applications", icon: FaFileAlt },
      { to: "/support-inbox", label: "Help & Support", icon: FaHeadset },
      { to: "/quotes", label: "Quotes", icon: MdFormatQuote },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/audit-logs", label: "Audit Logs", icon: MdAnalytics },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/faq", label: "FAQ", icon: MdQuiz },
      { to: "/settings", label: "Settings", icon: IoMdSettings },
    ],
  },
];

function NavItem({ to, label, icon: Icon, exact, isActive, matchesPrefix, onClick }) {
  const active = exact ? isActive(to) : matchesPrefix(to);
  return (
    <Link to={to} onClick={onClick} className="block">
      <li
        className={`group flex items-center gap-2 sm:gap-3 cursor-pointer transition-all duration-300 ease-in-out list-none
          ${active
            ? "nav-active px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl scale-[1.02]"
            : "text-surface-700 nav-hover px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl hover:scale-[1.01]"
          }`}
      >
        <Icon
          className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${active ? "" : "group-hover:scale-110"}`}
        />
        <p className="text-xs sm:text-sm font-semibold">{label}</p>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
        )}
      </li>
    </Link>
  );
}

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path) => currentPath === path;
  const matchesPrefix = (path) => path !== "/" && currentPath.startsWith(path);
  const navigate = useNavigate();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    localStorage.removeItem("resetToken");
    navigate("/sign-in");
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-brand-50 via-white to-accent-50 h-screen overflow-y-auto z-[60] transition-all duration-500 ease-in-out
        w-[100%] sm:w-[85%] md:w-72 xl:w-80
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none "}
        fixed top-0 left-0
        md:sticky md:top-0 md:translate-x-0 md:shadow-xl md:flex-shrink-0
        border-r border-surface-200
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-brand-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-brand-300
      `}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-100/30 pointer-events-none"></div>

      {/* Close Button (Mobile Only) */}
      <button
        onClick={toggleSidebar}
        className="absolute top-6 right-6 md:hidden text-white bg-brand-gradient hover:opacity-90 focus:outline-none p-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-[70]"
        aria-label="Close sidebar"
      >
        <IoCloseSharp className="w-5 h-5" />
      </button>

      {/* Logo Section */}
      <div className="relative flex flex-col justify-center items-center gap-2 px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="relative"></div>
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-brand-gradient bg-clip-text text-transparent">
            Victory Fitness
          </h2>
          <p className="text-[10px] sm:text-xs text-surface-500 font-medium mt-1">
            Admin Dashboard
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 sm:mx-6 h-px bg-gradient-to-r from-transparent via-surface-300 to-transparent"></div>

      {/* Sidebar Menu */}
      <nav className="relative mt-4 sm:mt-6 px-3 sm:px-4 pb-28 sm:pb-32">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx === 0 ? "space-y-0.5 sm:space-y-1" : "mt-4 sm:mt-6 space-y-0.5 sm:space-y-1"}>
            <p className="text-[10px] sm:text-xs font-semibold text-surface-400 uppercase tracking-wider px-2 sm:px-3 mb-2 sm:mb-3">
              {group.label}
            </p>
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

      {/* Logout Button */}
      <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-5 bg-gradient-to-t from-surface-100 to-surface-50 backdrop-blur-sm">
        <button
          onClick={handleLogout}
          className="group flex items-center justify-center gap-2 sm:gap-3 w-full py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-danger-500 to-danger-600 hover:from-danger-600 hover:to-red-700 shadow-lg shadow-red-500/30 transition-all duration-300 text-white text-sm sm:text-base font-semibold hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/40"
        >
          <IoLogOutOutline className="w-4 h-4 sm:w-5 sm:h-5 font-bold transition-transform duration-300 group-hover:translate-x-[-2px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
