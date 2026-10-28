import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { SignInUser } from "../../services/Auth";
import ErrorMessage from "../../components/ErrorMessage";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await SignInUser(form);
      setIsAuthenticated(true);
      navigate(location.state?.from || "/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e2e4e6] text-[#35362c]">
      <main className="relative flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[#7a7359] transition hover:text-[#35362c]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[410px]">
            <div className="mb-9">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7359]">
                ARQEMIO / ACCOUNT
              </span>

              <h1 className="text-[30px] font-semibold tracking-tight">
                Sign in
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#7a7359]">
                Enter your email and password to access your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email <span className="text-red-600">*</span>
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email"
                  className="h-12 w-full rounded-lg border border-[#c3c8c1] bg-white/75 px-4 text-sm outline-none transition placeholder:text-[#a69b88] focus:border-[#7a7359] focus:ring-2 focus:ring-[#d4e14b]/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password <span className="text-red-600">*</span>
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-lg border border-[#c3c8c1] bg-white/75 px-4 pr-12 text-sm outline-none transition placeholder:text-[#a69b88] focus:border-[#7a7359] focus:ring-2 focus:ring-[#d4e14b]/30"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-[#7a7359] hover:text-[#35362c]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-[#35362c] underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <ErrorMessage message={error} />

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d4e14b] text-sm font-semibold text-[#35362c] transition hover:bg-[#c5d23f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#7a7359]">
              Don't have an account?{" "}
              <span className="font-medium text-[#35362c]">
                Contact your company administrator for an invitation.
              </span>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-[#7a7359]">
          © {new Date().getFullYear()} Arqemio. All rights reserved.
        </p>
      </main>
    </div>
  );
};

export default Login;
