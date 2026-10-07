import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignInUser } from "../services/Auth";
import "../stylesheet/Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await SignInUser(formData);

      if (response.token) {
        navigate("/dashboard");
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError("Unable to sign in. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <h1 onClick={() => navigate("/")}>Arqemio</h1>

        <div>
          <span>CONSTRUCTION PROJECT MANAGEMENT</span>

          <h2>
            Manage every project
            <br />
            with clarity.
          </h2>

          <p>
            Keep your projects, teams, progress updates and client communication
            connected in one place.
          </p>
        </div>
      </div>

      <div className="login-section">
        <div className="login-form">
          <h2>Welcome back</h2>

          <p className="login-subtitle">Sign in to continue to Arqemio.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>Email address</label>

            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <div className="forgot-password">
              <span onClick={() => navigate("/forgot-password")}>
                Forgot password?
              </span>
            </div>

            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
