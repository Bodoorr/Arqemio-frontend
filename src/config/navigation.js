import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  HardHat,
  Wallet,
  ClipboardList,
  ScrollText,
  UserRound,
  History,
  CalendarDays,
  Activity,
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
    { label: "Tasks", path: "/tasks", icon: ClipboardList },
    { label: "Equipment", path: "/equipment", icon: HardHat },
    { label: "Reservations", path: "/reservations", icon: CalendarDays },
    { label: "Expenses", path: "/expenses", icon: Wallet },
    { label: "Project Updates", path: "/updates", icon: Activity },
    { label: "Audit Logs", path: "/owner/audit-logs", icon: History },
    { label: "Profile", path: "/owner/profile", icon: UserRound },
  ],

  MANAGER: [
    { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Projects", path: "/projects", icon: FolderKanban },
    { label: "Tasks", path: "/tasks", icon: ClipboardList },
    { label: "Equipment", path: "/equipment", icon: HardHat },
    { label: "Reservations", path: "/reservations", icon: CalendarDays },
    { label: "Profile", path: "/manager/profile", icon: UserRound },
    { label: "Project Updates", path: "/updates", icon: Activity },
  ],

  WORKER: [
    {
      label: "Dashboard",
      path: "/worker/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Projects",
      path: "/projects",
      icon: FolderKanban,
    },
    {
      label: "Tasks",
      path: "/tasks",
      icon: ClipboardList,
    },
    {
      label: "Profile",
      path: "/worker/profile",
      icon: UserRound,
    },
    { label: "Project Updates", path: "/updates", icon: Activity },
  ],

  CUSTOMER: [
    { label: "Dashboard", path: "/customer/dashboard", icon: LayoutDashboard },
    { label: "Profile", path: "/customer/profile", icon: UserRound },
  ],
});
