import { Link, useNavigate } from "react-router-dom";
import { Building2, Bell, UserRound, LogIn, Menu } from "lucide-react";

const Navbar = ({ isAuthenticated = false, user = null, onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10">
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

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-[#35362c] hover:bg-[#e2e4e6]"
          >
            <Bell size={21} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
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
                {user?.role?.toLowerCase() || "Member"}
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
