import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Building2,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  GetCustomerRegistrationEmail,
  RegisterCustomer,
} from "../../services/projectshare";

export default function CustomerRegister() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    const loadInvitation = async () => {
      try {
        const data = await GetCustomerRegistrationEmail(token);

        if (active) setEmail(data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.response?.data?.detail ||
              "This registration link is invalid or has been revoked.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInvitation();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !password || !confirmedPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (password !== confirmedPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      await RegisterCustomer(token, {
        name: name.trim(),
        password,
        confirmedPassword,
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f3] px-5 py-6 text-[#35362c] sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4e14b]">
              <Building2 size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold">Arqemio</h1>
              <p className="text-[10px] tracking-[0.13em] text-[#7a7359]">
                CONSTRUCTION MANAGEMENT
              </p>
            </div>
          </div>

          <span className="hidden items-center gap-2 text-xs text-[#7a7359] sm:flex">
            <LockKeyhole size={15} />
            Secure Registration
          </span>
        </header>

        <main className="mx-auto max-w-[480px]">
          {loading ? (
            <div className="py-20 text-center text-sm text-[#7a7359]">
              Validating your invitation...
            </div>
          ) : success ? (
            <div className="rounded-2xl border border-[#e2e4e6] bg-white p-8 text-center shadow-sm">
              <CheckCircle2 size={48} className="mx-auto mb-5 text-[#8c9c27]" />

              <h2 className="text-2xl font-bold">Account created!</h2>

              <p className="mt-3 text-sm leading-7 text-[#7a7359]">
                Your customer account is ready. Sign in to access the project
                updates shared with you.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-3.5 text-sm font-semibold hover:bg-[#c5d23f]"
              >
                Go to Login
                <ArrowRight size={17} />
              </button>
            </div>
          ) : !email ? (
            <div className="rounded-2xl border border-[#e2e4e6] bg-white p-8 text-center shadow-sm">
              <AlertCircle size={42} className="mx-auto mb-4 text-[#7a7359]" />

              <h2 className="text-xl font-bold">Registration unavailable</h2>

              <p className="mt-3 text-sm text-[#7a7359]">
                {error || "Unable to validate this registration link."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#7a7359]">
                  CUSTOMER REGISTRATION
                </p>

                <h2 className="text-3xl font-bold tracking-tight">
                  Welcome to Arqemio
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#7a7359]">
                  Create your account to stay connected with your construction
                  projects.
                </p>
              </div>

              <div className="rounded-2xl border border-[#e2e4e6] bg-white p-6 shadow-sm sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Email Address
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
                      />

                      <input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full rounded-xl border border-[#e2e4e6] bg-[#f5f6f3] py-3 pl-11 pr-4 text-sm text-[#7a7359] outline-none"
                      />
                    </div>

                    <p className="mt-2 text-xs text-[#7a7359]">
                      This email is linked to your invitation.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Full Name
                    </label>

                    <div className="relative">
                      <UserRound
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
                      />

                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="w-full rounded-xl border border-[#e2e4e6] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#aab83d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className="w-full rounded-xl border border-[#e2e4e6] bg-white py-3 pl-11 pr-12 text-sm outline-none focus:border-[#aab83d]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Confirm Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7359]"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmedPassword}
                        onChange={(e) => setConfirmedPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="w-full rounded-xl border border-[#e2e4e6] bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-[#aab83d]"
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                    >
                      <AlertCircle size={17} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4e14b] px-5 py-3.5 text-sm font-bold transition hover:bg-[#c5d23f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Creating Account..." : "Create Account"}
                    {!submitting && <ArrowRight size={17} />}
                  </button>
                </form>
              </div>

              <p className="mt-6 text-center text-sm text-[#7a7359]">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#35362c] underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </main>

        <footer className="mt-10 text-center text-xs text-[#7a7359]">
          Powered by Arqemio · Construction Project Management
        </footer>
      </div>
    </div>
  );
}
