import { Routes, Route } from "react-router-dom";
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

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = () => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  const handleLogOut = () => {
    SignOutUser();
    setIsAuthenticated(false);
    navigate("/login");
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
          element={<Login setIsAuthenticated={setIsAuthenticated} />}
        />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/invitation/register/:token"
          element={<InvitationRegister />}
        />
        <Route path="/invitation/:token" element={<InvitationAccept />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route
          path="/admin/companies/:companyId"
          element={<CompanyDetails />}
        />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:taskId" element={<TaskDetails />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/equipment/:equipmentId" element={<EquipmentDetails />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/updates" element={<ProjectUpdates />} />
        <Route path="/project-preview/:token" element={<ProjectPreview />} />
        <Route
          path="/customer/register/:token"
          element={<CustomerRegister />}
        />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route
            path="/admin/audit-logs"
            element={<AuditLogs role="PLATFORM_ADMIN" />}
          />
          <Route path="/admin/profile" element={<Profile />} />
          <Route path="/owner/profile" element={<Profile />} />
          <Route path="/manager/profile" element={<Profile />} />
          <Route path="/worker/profile" element={<Profile />} />
          <Route path="/customer/profile" element={<Profile />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
