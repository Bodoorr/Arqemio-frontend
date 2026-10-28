import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ForgetPassword } from "../../services/Auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await ForgetPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setError("Too many requests. Please wait a minute and try again.");
      } else {
        setError(err.response?.data?.message || "Unable to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e2e4e6] text-[#35362c]">
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-12">
        <Link
          to="/login"
          className="inline-flex w-fit items-center gap-2 text-sm text-[#7a7359] hover:text-[#35362c]"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[410px]">
            <div className="mb-9">
              <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7359]">
                ARQEMIO / ACCOUNT
              </span>

              <h1 className="text-[30px] font-semibold tracking-tight">
                Forgot password?
              </h1>

              <p className="mt-2 text-sm leading-6 text-[#7a7359]">
                Enter your email address and we'll send you instructions to
                reset your password.
              </p>
            </div>

            {success ? (
              <div className="space-y-5">
                <p
                  role="status"
                  className="rounded-lg border border-[#c3c8c1] bg-white/75 p-4 text-sm leading-6"
                >
                  If your email is registered, you'll receive password reset
                  instructions shortly.
                </p>

                <Link
                  to="/login"
                  className="flex h-12 items-center justify-center rounded-lg bg-[#d4e14b] text-sm font-semibold hover:bg-[#c5d23f]"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 w-full rounded-lg border border-[#c3c8c1] bg-white/75 px-4 text-sm outline-none placeholder:text-[#a69b88] focus:border-[#7a7359] focus:ring-2 focus:ring-[#d4e14b]/30"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#d4e14b] text-sm font-semibold transition hover:bg-[#c5d23f] disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send reset link"}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#7a7359]">
          © {new Date().getFullYear()} Arqemio. All rights reserved.
        </p>
      </main>
    </div>
  );
};

export default ForgotPassword;
