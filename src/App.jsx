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
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/companies" element={<Companies />} />
      <Route path="/admin/companies/:companyId" element={<CompanyDetails />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:projectId" element={<ProjectDetails />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/tasks/:taskId" element={<TaskDetails />} />
      <Route path="/equipment" element={<Equipment />} />
    </Routes>
  );
};

export default App;
