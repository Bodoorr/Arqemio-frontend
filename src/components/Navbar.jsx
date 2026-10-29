import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Bell,
  UserRound,
  LogIn,
  Menu,
  CheckCheck,
  Inbox,
  X,
} from "lucide-react";

const Navbar = ({
  isAuthenticated = false,
  user = null,
  onMenuClick,
  notifications = [],
  onMarkAllRead,
  onMarkRead,
}) => {
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const profilePaths = {
    PLATFORM_ADMIN: "/admin/profile",
    OWNER: "/owner/profile",
    MANAGER: "/manager/profile",
    WORKER: "/worker/profile",
    CUSTOMER: "/customer/profile",
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const handleProfileClick = () => {
    setNotificationsOpen(false);
    navigate(profilePaths[user?.role] || "/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const formatTime = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <header className="relative z-40 flex h-20 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4e14b]">
          <Building2 size={23} className="text-[#35362c]" />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#35362c]">
            Arqemio
          </h1>
          <p className="text-[10px] tracking-[0.13em] text-[#7a7359]">
            CONSTRUCTION MANAGEMENT
          </p>
        </div>
      </Link>

      {isAuthenticated ? (
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className="rounded-lg p-2 text-[#35362c] hover:bg-[#e2e4e6] lg:hidden"
          >
            <Menu size={21} />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((previous) => !previous)}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              className="relative rounded-lg p-2 text-[#35362c] transition hover:bg-[#e2e4e6]"
            >
              <Bell size={21} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d4e14b] px-1 text-[10px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-[-65px] top-full z-50 mt-4 w-[calc(100vw-32px)] max-w-[390px] overflow-hidden rounded-2xl border border-[#e2e4e6] bg-white shadow-xl sm:right-0">
                <div className="flex items-center justify-between gap-3 border-b border-[#eff0eb] px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#35362c]">
                      Notifications
                    </h2>
                    <p className="mt-1 text-xs text-[#858779]">
                      {unreadCount > 0
                        ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                        : "You're all caught up"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                    className="rounded-lg p-2 text-[#858779] hover:bg-[#f5f6f3]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {notifications.length > 0 ? (
                  <>
                    <div className="max-h-[340px] overflow-y-auto">
                      {notifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => onMarkRead?.(notification.id)}
                          className={`flex w-full items-start gap-3 border-b border-[#f0f1ec] px-5 py-4 text-left transition hover:bg-[#f8f9f4] ${
                            notification.read ? "bg-white" : "bg-[#f8fae9]"
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f4d4]">
                            <Bell size={18} className="text-[#35362c]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm leading-6 text-[#35362c]">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-xs text-[#858779]">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>

                          {!notification.read && (
                            <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#b6c63a]" />
                          )}
                        </button>
                      ))}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="flex w-full items-center justify-center gap-2 px-5 py-4 text-sm font-semibold text-[#35362c] transition hover:bg-[#f5f6f3]"
                      >
                        <CheckCheck size={17} />
                        Mark all as read
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f4d4]">
                      <Inbox size={25} className="text-[#35362c]" />
                    </div>

                    <h3 className="text-sm font-semibold text-[#35362c]">
                      No notifications yet
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-[#858779]">
                      New notifications will appear here when you receive them.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleProfileClick}
            className="flex items-center gap-3 rounded-full p-1 transition hover:bg-[#e2e4e6]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e2e4e6]">
              <UserRound size={19} className="text-[#35362c]" />
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-[#35362c]">
                {user?.name || "My Account"}
              </p>
              <p className="text-xs capitalize text-[#7a7359]">
                {user?.role?.toLowerCase().replaceAll("_", " ") || "Member"}
              </p>
            </div>
          </button>
        </div>
      ) : (
        <nav className="flex items-center gap-5">
          <Link
            to="/"
            className="hidden text-sm font-medium text-[#62665d] hover:text-[#35362c] sm:block"
          >
            Home
          </Link>

          <a
            href="/#features"
            className="hidden text-sm font-medium text-[#62665d] hover:text-[#35362c] sm:block"
          >
            Features
          </a>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-2.5 text-sm font-semibold text-[#35362c] hover:bg-[#c5d23f]"
          >
            <LogIn size={16} />
            Login
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
