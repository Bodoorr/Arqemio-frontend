import { Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/auth/Login";
import ForgetPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import InvitationRegister from "./pages/invitation/InvitationRegister";
import AcceptInvitation from "./pages/invitation/AcceptInvitation";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgetPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="/invitation/register/:token"
        element={<InvitationRegister />}
      />
      <Route path="/invitation/:token" element={<AcceptInvitation />} />
    </Routes>
  );
};

export default App;
