import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HardHat, Mail, LockKeyhole, ArrowRight } from "lucide-react";
import { login } from "../../services/Auth";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F0] flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#19232B] text-white p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <HardHat className="text-[#F3B43F]" size={32} />
          <span className="text-2xl font-bold tracking-tight">ARQEMIO</span>
        </div>

        <div>
          <p className="text-[#F3B43F] uppercase tracking-[0.3em] text-sm mb-5">
            Build with confidence
          </p>
          <h1 className="text-5xl font-semibold leading-tight max-w-lg">
            Every project.
            <br />
            Every detail.
            <br />
            Under control.
          </h1>
          <p className="text-slate-400 mt-6 max-w-md">
            One workspace to manage construction projects, teams, equipment, and
            progress.
          </p>
        </div>

        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Arqemio
        </p>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <HardHat className="text-amber-500" />
            <span className="text-xl font-bold">ARQEMIO</span>
          </div>

          <p className="text-amber-600 text-sm font-semibold uppercase tracking-widest mb-3">
            Welcome back
          </p>
          <h2 className="text-4xl font-semibold text-[#19232B]">Sign in</h2>
          <p className="text-slate-500 mt-3 mb-9">
            Enter your credentials to access your workspace.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Password</label>
                <a
                  href="/forgot-password"
                  className="text-sm text-amber-700 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#19232B] text-white rounded-xl py-3.5 font-medium hover:bg-[#2A3944] disabled:opacity-60 transition"
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to Arqemio? Registration is available by invitation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
