import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import NotificationListener from "./NotificationListener";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const role = pathname.startsWith("/admin")
    ? "PLATFORM_ADMIN"
    : pathname.startsWith("/owner")
      ? "OWNER"
      : pathname.startsWith("/manager")
        ? "MANAGER"
        : pathname.startsWith("/worker")
          ? "WORKER"
          : pathname.startsWith("/customer")
            ? "CUSTOMER"
            : null;

  const user = {
    name: "My Account",
    role,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f3] text-[#35362c] lg:h-screen lg:overflow-hidden">
      <NotificationListener />

      <Navbar
        isAuthenticated={true}
        user={user}
        onMenuClick={() => setMobileOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          role={role}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main className="min-w-0 flex-1 overflow-y-auto px-5 pb-6 pt-3 sm:px-8 lg:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
