import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Login from "./pages/auth/Login";
import ForgetPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import InvitationRegister from "./pages/invitation/InvitationRegister";
import InvitationAccept from "./pages/invitation/InvitationAccept";
import { SignOutUser } from "./services/Auth";
import AdminDashboard from "./pages/dahsboards/AdminDashboard";
import Companies from "./pages/company/Companies";
import CompanyDetails from "./pages/company/CompanyDetails";
import Projects from "./pages/projects/Projects";
import ProjectDetails from "./pages/projects/ProjectsDetails";
import Tasks from "./pages/tasks/Tasks";
import TaskDetails from "./pages/tasks/TaskDetails";
import Equipment from "./pages/equipments/Equipment";
import EquipmentDetails from "./pages/equipments/EquipmentDetails";
import Reservations from "./pages/equipments/reservation/Reservations";
import Expenses from "./pages/expense/Expense";
import ProjectUpdates from "./pages/projects/updates/ProjectUpdates";
import ProjectPreview from "./pages/customer/ProjectPreview";
import CustomerRegister from "./pages/customer/CustomerRegister";
import CustomerDashboard from "./pages/dahsboards/CustomerDashboard";
import DashboardLayout from "./components/DashboardLayout";
import AuditLogs from "./pages/audit/AuditLogs";
import Profile from "./pages/profile/Profile";
import { Toaster } from "sonner";
import OwnerDashboard from "./pages/dahsboards/OwnerDashboard";
import Client from "./services/api";
import WorkerDashboard from "./pages/dahsboards/WorkerDashboard";
import ManagerDashboard from "./pages/dahsboards/ManagerDashboard";

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated === null || isAuthenticated === true) {
      checkToken();
    }
  }, [isAuthenticated]);

  const checkToken = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setRole(null);
      setLoading(false);
      console.error("Profile request failed:", error.response?.status, error);
      return;
    }

    setLoading(true);

    try {
      const response = await Client.get("/users/profile");
      const user = response.data;

      const memberships = (user.memberships || []).filter(
        (membership) => membership.status === "ACTIVE",
      );

      const activeMembershipId = sessionStorage.getItem("activeMembershipId");

      const activeMembership = memberships.find(
        (membership) => String(membership.id) === activeMembershipId,
      );

      let currentRole = null;

      if (
        user.role === "PLATFORM_ADMIN" ||
        user.platformRole === "PLATFORM_ADMIN"
      ) {
        currentRole = "PLATFORM_ADMIN";
      } else if (activeMembership) {
        currentRole = activeMembership.role;
      } else if (memberships.length === 1) {
        currentRole = memberships[0].role;
      } else if (memberships.length === 0 && user.isCustomer) {
        currentRole = "CUSTOMER";
      }

      setCurrentUser(user);
      setRole(currentRole);
      setIsAuthenticated(true);
    } catch (error) {
      setCurrentUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogOut = () => {
    SignOutUser();
    sessionStorage.removeItem("activeMembershipId");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setRole(null);
    navigate("/login");
  };

  const protect = (component, allowedRoles) => {
    if (loading || isAuthenticated === null) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f6f3]">
          <p className="text-sm text-[#7a7359]">Loading...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return component;
  };

  const companyRoles = ["OWNER", "MANAGER", "WORKER"];
  const managementRoles = ["OWNER", "MANAGER"];
  const allRoles = ["PLATFORM_ADMIN", "OWNER", "MANAGER", "WORKER", "CUSTOMER"];

  const getDashboardPath = () => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return "/admin/dashboard";
      case "OWNER":
        return "/owner/dashboard";
      case "MANAGER":
        return "/manager/dashboard";
      case "WORKER":
        return "/worker/dashboard";
      case "CUSTOMER":
        return "/customer/dashboard";
      default:
        return "/unauthorized";
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        duration={5000}
        closeButton
        theme="light"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#35362c",
            border: "1px solid #e2e4e6",
            borderRadius: "14px",
            padding: "16px",
          },
        }}
      />

      <Routes>
        <Route
          path="/login"
          element={
            loading ? (
              <p>Loading...</p>
            ) : isAuthenticated && role ? (
              <Navigate to={getDashboardPath()} replace />
            ) : (
              <Login setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />

        <Route path="/forgot-password" element={<ForgetPassword />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/invitation/register/:token"
          element={<InvitationRegister />}
        />

        <Route path="/invitation/:token" element={<InvitationAccept />} />

        <Route path="/project-preview/:token" element={<ProjectPreview />} />

        <Route
          path="/customer/register/:token"
          element={<CustomerRegister />}
        />

        <Route
          element={protect(
            <DashboardLayout role={role} profile={currentUser} />,
            allRoles,
          )}
        >
          <Route
            path="/admin/dashboard"
            element={protect(<AdminDashboard />, ["PLATFORM_ADMIN"])}
          />

          <Route
            path="/admin/audit-logs"
            element={protect(<AuditLogs role="PLATFORM_ADMIN" />, [
              "PLATFORM_ADMIN",
            ])}
          />

          <Route
            path="/admin/companies"
            element={protect(<Companies />, ["PLATFORM_ADMIN"])}
          />

          <Route
            path="/admin/companies/:companyId"
            element={protect(<CompanyDetails />, ["PLATFORM_ADMIN"])}
          />

          <Route
            path="/owner/dashboard"
            element={protect(<OwnerDashboard />, ["OWNER"])}
          />

          <Route
            path="/customer/dashboard"
            element={protect(<CustomerDashboard />, ["CUSTOMER"])}
          />

          <Route
            path="/worker/dashboard"
            element={protect(<WorkerDashboard />, ["WORKER"])}
          />

          <Route
            path="/manager/dashboard"
            element={protect(<ManagerDashboard />, ["MANAGER"])}
          />
          <Route
            path="/projects"
            element={protect(<Projects />, companyRoles)}
          />

          <Route
            path="/projects/:projectId"
            element={protect(<ProjectDetails />, companyRoles)}
          />

          <Route path="/tasks" element={protect(<Tasks />, companyRoles)} />

          <Route
            path="/tasks/:taskId"
            element={protect(<TaskDetails />, companyRoles)}
          />

          <Route
            path="/equipment"
            element={protect(<Equipment />, companyRoles)}
          />

          <Route
            path="/equipment/:equipmentId"
            element={protect(<EquipmentDetails />, companyRoles)}
          />

          <Route
            path="/reservations"
            element={protect(<Reservations />, managementRoles)}
          />

          <Route
            path="/expenses"
            element={protect(<Expenses />, managementRoles)}
          />

          <Route
            path="/updates"
            element={protect(<ProjectUpdates />, companyRoles)}
          />

          <Route
            path="/admin/profile"
            element={protect(<Profile />, ["PLATFORM_ADMIN"])}
          />

          <Route
            path="/owner/profile"
            element={protect(<Profile />, ["OWNER"])}
          />

          <Route
            path="/manager/profile"
            element={protect(<Profile />, ["MANAGER"])}
          />

          <Route
            path="/worker/profile"
            element={protect(<Profile />, ["WORKER"])}
          />

          <Route
            path="/customer/profile"
            element={protect(<Profile />, ["CUSTOMER"])}
          />

          <Route
            path="/owner/audit-logs"
            element={protect(<AuditLogs role="OWNER" />, ["OWNER"])}
          />
        </Route>

        <Route
          path="/unauthorized"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f5f6f3]">
              <h1 className="text-3xl font-bold text-[#35362c]">
                Access Denied
              </h1>

              <p className="text-sm text-[#7a7359]">
                You don't have permission to access this page.
              </p>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl bg-[#d4e14b] px-5 py-2.5 font-semibold text-[#35362c]"
              >
                Go Back
              </button>
            </div>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;
