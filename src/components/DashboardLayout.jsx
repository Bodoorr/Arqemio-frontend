import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = {
    name: "My Account",
    role: "OWNER",
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f3] text-[#35362c] lg:h-screen lg:overflow-hidden">
      <Navbar
        isAuthenticated={true}
        user={user}
        onMenuClick={() => setMobileOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
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
