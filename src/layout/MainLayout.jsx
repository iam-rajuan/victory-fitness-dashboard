import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../shared/Sidebar/Sidebar";
import TopBar from "../shared/TopBar/TopBar";
import RequireAdminAuth from "../components/RequireAdminAuth";
import { AnalyticsFilterProvider } from "../context/AnalyticsFilterContext";
import { AdminDrawerProvider } from "../context/AdminDrawerContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import ClaudeDrawer from "../shared/ClaudeDrawer/ClaudeDrawer";
import ClaudeToast from "../shared/ClaudeToast/ClaudeToast";

function MainLayoutContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("vf_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const location = useLocation();
  const { isDark } = useTheme();

  useEffect(() => {
    // Close mobile drawer on route change
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Keyboard shortcut (Ctrl+B or Cmd+B) to toggle sidebar collapse
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("vf_sidebar_collapsed", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div
      className={`min-h-screen flex items-stretch font-dmsans transition-colors duration-150 ${
        isDark
          ? "bg-[#0D0D0D] text-[#F7F3EE] selection:bg-[#C9943A]/30 selection:text-[#F7F3EE]"
          : "bg-[#F7F3EE] text-[#0D2B45] selection:bg-[#C9943A]/20 selection:text-[#0D2B45]"
      }`}
    >
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[65] lg:hidden transition-opacity"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Stage */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Luxury Top Bar */}
        <TopBar
          toggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebarCollapse={toggleSidebarCollapse}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-7">
          <div className="max-w-[1580px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Universal Interactive Drawer & Toast */}
      <ClaudeDrawer />
      <ClaudeToast />
    </div>
  );
}

export default function MainLayout() {
  return (
    <RequireAdminAuth>
      <ThemeProvider>
        <AdminDrawerProvider>
          <AnalyticsFilterProvider>
            <MainLayoutContent />
          </AnalyticsFilterProvider>
        </AdminDrawerProvider>
      </ThemeProvider>
    </RequireAdminAuth>
  );
}
