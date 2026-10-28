import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ValidateInvitation,
  RegisterInvitation,
} from "../../services/invitation";

const InvitationRegister = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const validate = async () => {
      try {
        const data = await ValidateInvitation(token);
        setError(data.message || "This invitation is invalid or has expired.");
        retur;
        setInvitation(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "This invitation is invalid or has expired.",
        );
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await RegisterInvitation({
        token,
        ...form,
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e2e4e6]">
        <p className="text-sm text-[#7a7359]">Validating invitation...</p>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e2e4e6] px-4">
        <div className="w-full max-w-md rounded-lg border border-[#c3c8c1] bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-[#35362c]">
            Invalid Invitation
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error || "This invitation is invalid or has expired."}
          </p>

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
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e2e4e6] px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-[#c3c8c1] bg-white p-8">
        <h1 className="text-2xl font-semibold text-[#35362c]">Join Arqemio</h1>

        <p className="mt-2 text-sm text-[#7a7359]">
          Complete your registration to join your company.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#35362c]">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              className="w-full rounded-md border border-[#c3c8c1] px-4 py-3 outline-none focus:border-[#7a7359]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#35362c]">
              Email Address
            </label>

            <input
              type="email"
              value={invitation.email || ""}
              disabled
              className="w-full rounded-md border border-[#c3c8c1] bg-[#e2e4e6] px-4 py-3 text-[#7a7359]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#35362c]">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full rounded-md border border-[#c3c8c1] px-4 py-3 outline-none focus:border-[#7a7359]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#35362c]">
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
              className="w-full rounded-md border border-[#c3c8c1] px-4 py-3 outline-none focus:border-[#7a7359]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#d4e14b] py-3 font-medium text-[#35362c] hover:brightness-95 disabled:opacity-50"
          >
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7a7359]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-[#35362c] hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default InvitationRegister;
