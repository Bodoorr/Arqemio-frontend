import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Wrench,
  Wallet,
  ClipboardList,
  ScrollText,
  UserRound,
} from "lucide-react";

export const navigationByRole = () => ({
  PLATFORM_ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Companies", path: "/admin/companies", icon: Building2 },
    { label: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText },
    { label: "Profile", path: "/admin/profile", icon: UserRound },
  ],

  OWNER: [
    { label: "Dashboard", path: "/owner/dashboard", icon: LayoutDashboard },
    { label: "Projects", path: "/projects", icon: FolderKanban },
    { label: "Team", path: "/team", icon: Users },
    { label: "Equipment", path: "/equipment", icon: Wrench },
    { label: "Expenses", path: "/expenses", icon: Wallet },
    { label: "Audit Logs", path: "/owner/audit-logs", icon: ScrollText },
    { label: "Profile", path: "/owner/profile", icon: UserRound },
  ],

  MANAGER: [
    { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Projects", path: "/projects", icon: FolderKanban },
    { label: "Team", path: "/team", icon: Users },
    { label: "Project Updates", path: "/project-updates", icon: ClipboardList },
    { label: "Expenses", path: "/expenses", icon: Wallet },
    { label: "Profile", path: "/manager/profile", icon: UserRound },
  ],

  WORKER: [
    { label: "Dashboard", path: "/worker/dashboard", icon: LayoutDashboard },
    { label: "My Projects", path: "/projects", icon: FolderKanban },
    { label: "My Tasks", path: "/tasks", icon: ClipboardList },
    { label: "Project Updates", path: "/project-updates", icon: ClipboardList },
    { label: "Profile", path: "/worker/profile", icon: UserRound },
  ],

  CUSTOMER: [
    { label: "Dashboard", path: "/customer/dashboard", icon: LayoutDashboard },
    { label: "Profile", path: "/customer/profile", icon: UserRound },
  ],
});
