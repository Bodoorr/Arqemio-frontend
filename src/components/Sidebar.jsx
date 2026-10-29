import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { navigationByRole } from "../config/navigation";

const Sidebar = ({
  role,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const navigation = navigationByRole[role] || [];
  const renderLinks = () =>
    navigation.map(({ label, path, icon: Icon }) => (
      <NavLink
        key={path}
        to={path}
        title={collapsed ? label : undefined}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          `flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
            isActive
              ? "bg-[#e9edcf] font-semibold text-[#35362c]"
              : "text-[#62665d] hover:bg-[#e9ebe6] hover:text-[#35362c]"
          } ${collapsed ? "lg:justify-center" : ""}`
        }
      >
        <Icon size={19} className="shrink-0" />
        <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
      </NavLink>
    ));

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-50 flex w-64 flex-col bg-[#f5f6f3] px-4 py-5 transition-all duration-300 lg:static lg:z-auto lg:shrink-0 lg:bg-transparent lg:px-3 lg:py-3 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[76px]" : "lg:w-60"}`}
      >
        <div className="mb-5 flex items-center justify-between px-2">
          <span
            className={`text-xs font-semibold uppercase tracking-wider text-[#7a7359] ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            Workspace
          </span>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden rounded-lg p-2 text-[#62665d] hover:bg-[#e2e4e6] lg:flex"
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-[#62665d] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">{renderLinks()}</nav>
      </aside>
    </>
  );
};

export default Sidebar;
