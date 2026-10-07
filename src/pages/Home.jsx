import { useNavigate } from "react-router-dom";
import "../stylesheet/Home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <nav className="home-navbar">
        <div className="home-logo">Arqemio</div>

        <button className="login-button" onClick={() => navigate("/login")}>
          Sign In
        </button>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <span className="hero-label">CONSTRUCTION PROJECT MANAGEMENT</span>

          <h1>
            Build smarter.
            <br />
            Manage better.
          </h1>

          <p>
            Manage construction projects, teams, progress updates, and client
            communication from one centralized platform.
          </p>

          <button className="primary-button" onClick={() => navigate("/login")}>
            Get Started
          </button>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span>Project Overview</span>
            <span className="active-status">Active</span>
          </div>

          <h3>Manama Commercial Complex</h3>

          <p>Construction progress</p>

          <div className="progress-bar">
            <div className="progress"></div>
          </div>

          <div className="progress-info">
            <span>Progress</span>
            <strong>72%</strong>
          </div>

          <div className="project-stats">
            <div>
              <strong>24</strong>
              <span>Tasks</span>
            </div>

            <div>
              <strong>8</strong>
              <span>Workers</span>
            </div>

            <div>
              <strong>3</strong>
              <span>Managers</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
