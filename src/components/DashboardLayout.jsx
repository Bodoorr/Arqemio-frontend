import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import NotificationListener from "./NotificationListener";

const DashboardLayout = ({ role, profile }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const user = {
    name: profile?.name || "My Account",
    role: role,
  };

  const handleNotification = useCallback((message) => {
    setNotifications((previous) =>
      [
        {
          id: crypto.randomUUID(),
          message,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...previous,
      ].slice(0, 30),
    );
  }, []);

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  };

  const markAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f3] text-[#35362c] lg:h-screen lg:overflow-hidden">
      <NotificationListener onNotification={handleNotification} />

      <Navbar
        isAuthenticated={true}
        user={user}
        onMenuClick={() => setMobileOpen(true)}
        notifications={notifications}
        onMarkAllRead={markAllAsRead}
        onMarkRead={markAsRead}
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
