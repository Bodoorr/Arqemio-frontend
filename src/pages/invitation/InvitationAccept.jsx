import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ValidateInvitation,
  AcceptInvitation,
} from "../../services/invitation";
import ErrorMessage from "../../components/ErrorMessage";

const InvitationAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    const validate = async () => {
      try {
        const data = await ValidateInvitation(token);
        if (!data.success) {
          setError(
            data.message || "This invitation is invalid or has expired.",
          );
          return;
        }
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

  const handleAccept = async () => {
    setError("");
    setSubmitting(true);

    try {
      await AcceptInvitation(token);
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", {
          state: { from: `/invitation/${token}` },
        });
        return;
      }

      setError(
        err.response?.data?.message || "Unable to accept this invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e2e4e6]">
        <p className="text-[#7a7359]">Validating invitation...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md rounded-lg border border-[#c3c8c1] bg-white p-8">
        <h1 className="text-2xl font-semibold text-[#35362c]">
          {success ? "Invitation Accepted" : "Join Arqemio"}
        </h1>

        {success ? (
          <>
            <p className="mt-4 text-sm text-[#7a7359]">
              You have successfully joined the company.
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 w-full rounded-md bg-[#d4e14b] py-3 font-medium text-[#35362c]"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            {invitation && (
              <>
                <p className="mt-3 text-sm text-[#7a7359]">
                  You've been invited to join Arqemio.
                </p>

                <div className="mt-6 space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Email: </span>
                    {invitation.email}
                  </p>

                  <p>
                    <span className="font-medium">Role: </span>
                    {invitation.role}
                  </p>
                </div>
              </>
            )}

            <div className="mt-4">
              <ErrorMessage message={error} />
            </div>

            {invitation && (
              <>
                {isLoggedIn ? (
                  <button
                    onClick={handleAccept}
                    disabled={submitting}
                    className="mt-8 w-full rounded-md bg-[#d4e14b] py-3 font-medium text-[#35362c] disabled:opacity-50"
                  >
                    {submitting ? "Accepting..." : "Accept Invitation"}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      navigate("/login", {
                        state: { from: `/invitation/${token}` },
                      })
                    }
                    className="mt-8 w-full rounded-md bg-[#d4e14b] py-3 font-medium text-[#35362c]"
                  >
                    Sign In to Accept
                  </button>
                )}

                <button
                  onClick={() => navigate(`/invitation/register/${token}`)}
                  className="mt-4 w-full text-sm text-[#7a7359] hover:underline"
                >
                  Don't have an account? Register
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvitationAccept;
