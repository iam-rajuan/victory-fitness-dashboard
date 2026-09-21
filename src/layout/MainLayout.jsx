import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { IoMenu } from "react-icons/io5";
import Sidebar from "../shared/Sidebar/Sidebar";
import RequireAdminAuth from "../components/RequireAdminAuth";
import { AnalyticsFilterProvider } from "../context/AnalyticsFilterContext";
import { AdminDrawerProvider } from "../context/AdminDrawerContext";
import ClaudeDrawer from "../shared/ClaudeDrawer/ClaudeDrawer";
import ClaudeToast from "../shared/ClaudeToast/ClaudeToast";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Close mobile drawer on route change
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <RequireAdminAuth>
      <AdminDrawerProvider>
        <AnalyticsFilterProvider>
          <div className="min-h-screen bg-[#0D0D0D] text-[#F7F3EE] flex items-stretch font-dmsans selection:bg-[#C9943A]/30 selection:text-[#F7F3EE]">
            {/* Mobile Drawer Overlay */}
            {isSidebarOpen && (
              <div
                onClick={toggleSidebar}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[65] lg:hidden transition-opacity"
                aria-label="Close menu"
              />
            )}

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {/* Main Stage */}
            <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
              {/* Mobile Top Navbar (Hidden on lg+) */}
              <div className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 bg-[#0A0A0A] border-b border-[#F7F3EE]/10 z-30">
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="p-2 text-[#F7F3EE]/70 hover:text-[#F7F3EE] focus:outline-none"
                  aria-label="Open menu"
                >
                  <IoMenu className="w-6 h-6" />
                </button>
                <img
                  src="/logo_light.png?v=5"
                  alt="Victory Fitness"
                  className="h-8 w-auto object-contain"
                />
                <div className="w-8" />
              </div>

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
        </AnalyticsFilterProvider>
      </AdminDrawerProvider>
    </RequireAdminAuth>
  );
};

export default MainLayout;
