import { Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/auth/Login";
import ForgetPassword from "./pages/auth/ForgetPassword";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgetPassword />} />
    </Routes>
  );
};

export default App;
