import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ResetUserPassword } from "../../services/Auth";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await ResetUserPassword({
        token,
        newPassword,
        confirmPassword,
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e2e4e6] px-4">
      <div className="w-full max-w-md rounded-lg border border-[#c3c8c1] bg-white p-8">
        <h1 className="text-2xl font-semibold text-[#35362c]">
          Reset Password
        </h1>

        <p className="mt-2 text-sm text-[#7a7359]">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#35362c]">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-md border border-[#c3c8c1] px-4 py-3 outline-none focus:border-[#7a7359]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#35362c]">
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-[#c3c8c1] px-4 py-3 outline-none focus:border-[#7a7359]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#d4e14b] py-3 font-medium text-[#35362c] hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-6 text-sm text-[#7a7359] hover:underline"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );
};
export default ResetPassword;
