import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Building2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import {
  GetProfile,
  UpdateProfile,
  ChangePassword,
} from "../../services/profile";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeSection, setActiveSection] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await GetProfile();
      setProfile(data);
      setMobileNumber(data.mobileNumber || "");
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Please sign in to view your profile."
          : "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mobileNumber && !/^\d{8}$/.test(mobileNumber)) {
      setError("Mobile number must contain exactly 8 digits.");
      return;
    }

    try {
      setSaving(true);

      const updated = await UpdateProfile({
        mobileNumber: mobileNumber || null,
      });

      setProfile(updated);
      setMobileNumber(updated.mobileNumber || "");
      setMessage("Your profile has been updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await ChangePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswords(false);
      setPasswordMessage("Password changed successfully.");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          "Unable to change your password. Check your current password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleSection = (section) => {
    setActiveSection((previous) => (previous === section ? null : section));
  };

  const inputClass =
    "w-full rounded-xl border border-[#e2e4e6] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#aab850] focus:ring-2 focus:ring-[#d4e14b]/20";

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center gap-3 text-[#858779]">
        <RefreshCw size={20} className="animate-spin" />
        <span>Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8 text-[#35362c]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#8b8d80]">
            Account Settings
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-[#858779]">
            Manage your personal information and account security.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProfile}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[#e2e4e6] bg-white px-4 py-3 text-sm font-medium transition hover:bg-[#fafbf8] disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-[#d4e14b] bg-[#f1f4d4] px-5 py-4 text-sm"
        >
          <CheckCircle2 size={19} className="shrink-0" />
          {message}
        </div>
      )}

      {profile && (
        <>
          <section className="overflow-hidden rounded-2xl border border-[#ebede7] bg-white">
            <div className="h-20 bg-gradient-to-r from-[#eaf0ae] via-[#f1f4d4] to-[#f5f6f3]" />

            <div className="flex flex-wrap items-end gap-5 px-7 pb-7">
              <div className="-mt-9 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#d4e14b] shadow-sm">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound size={42} />
                )}
              </div>

              <div className="min-w-0 flex-1 pt-4">
                <h2 className="truncate text-2xl font-semibold tracking-tight">
                  {profile.name || "My Account"}
                </h2>

                <p className="mt-1 flex items-center gap-2 text-sm text-[#858779]">
                  <Mail size={15} />
                  <span className="truncate">{profile.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-[#f1f4d4] px-4 py-2 text-sm font-medium">
                <BadgeCheck size={17} />
                Account #{profile.id}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#ebede7] bg-white px-7 py-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <p className="mt-1 text-sm text-[#858779]">
                Your basic account details
              </p>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <UserRound size={16} />
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={profile.name || ""}
                    readOnly
                    className={`${inputClass} bg-[#f5f6f3] text-[#858779]`}
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Mail size={16} />
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={profile.email || ""}
                    readOnly
                    className={`${inputClass} bg-[#f5f6f3] text-[#858779]`}
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Phone size={16} />
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={8}
                    value={mobileNumber}
                    onChange={(event) =>
                      setMobileNumber(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Enter your mobile number"
                    className={inputClass}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={
                      saving || mobileNumber === (profile.mobileNumber || "")
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#d4e14b] px-6 py-3.5 text-sm font-semibold transition hover:bg-[#c6d23f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={17} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-[#ebede7] bg-white">
              <button
                type="button"
                onClick={() => toggleSection("account")}
                aria-expanded={activeSection === "account"}
                className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left transition hover:bg-[#fafbf8]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f1f4d4]">
                    <Building2 size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Account Information
                    </h2>
                    <p className="mt-1 text-sm text-[#858779]">
                      View your account details and company memberships
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={21}
                  className={`shrink-0 text-[#858779] transition-transform ${
                    activeSection === "account" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeSection === "account" && (
                <div className="border-t border-[#eff0eb] px-7 py-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#f5f6f3] p-5">
                      <p className="text-sm text-[#858779]">Account ID</p>
                      <p className="mt-2 text-lg font-semibold">
                        #{profile.id}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f5f6f3] p-5">
                      <p className="text-sm text-[#858779]">Customer Account</p>
                      <p className="mt-2 text-lg font-semibold">
                        {profile.isCustomer ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  {profile.memberships?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-4 text-base font-semibold">
                        Company Memberships
                      </h3>

                      <div className="space-y-3">
                        {profile.memberships.map((membership) => (
                          <div
                            key={
                              membership.id ??
                              `${membership.companyId}-${membership.role}`
                            }
                            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2e4e6] px-5 py-4"
                          >
                            <div>
                              <p className="font-semibold">
                                {membership.companyName ||
                                  `Company ${membership.companyId}`}
                              </p>

                              <p className="mt-1 text-sm text-[#858779]">
                                {membership.status}
                              </p>
                            </div>

                            <span className="rounded-full bg-[#f1f4d4] px-4 py-2 text-xs font-semibold">
                              {membership.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#ebede7] bg-white">
              <button
                type="button"
                onClick={() => toggleSection("password")}
                aria-expanded={activeSection === "password"}
                className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left transition hover:bg-[#fafbf8]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f1f4d4]">
                    <LockKeyhole size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">Change Password</h2>
                    <p className="mt-1 text-sm text-[#858779]">
                      Update your password to keep your account secure
                    </p>
                  </div>
                </div>

                <ChevronDown
                  size={21}
                  className={`shrink-0 text-[#858779] transition-transform ${
                    activeSection === "password" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {activeSection === "password" && (
                <div className="border-t border-[#eff0eb] px-7 py-6">
                  {passwordError && (
                    <div
                      role="alert"
                      className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      <AlertCircle size={18} />
                      {passwordError}
                    </div>
                  )}

                  {passwordMessage && (
                    <div
                      role="status"
                      className="mb-5 flex items-center gap-3 rounded-xl bg-[#f1f4d4] px-4 py-3 text-sm"
                    >
                      <CheckCircle2 size={18} />
                      {passwordMessage}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium">
                          Current Password
                        </label>

                        <input
                          type={showPasswords ? "text" : "password"}
                          value={currentPassword}
                          onChange={(event) =>
                            setCurrentPassword(event.target.value)
                          }
                          required
                          autoComplete="current-password"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          New Password
                        </label>

                        <input
                          type={showPasswords ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) =>
                            setNewPassword(event.target.value)
                          }
                          required
                          minLength={8}
                          autoComplete="new-password"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Confirm New Password
                        </label>

                        <input
                          type={showPasswords ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          required
                          minLength={8}
                          autoComplete="new-password"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((previous) => !previous)
                        }
                        className="flex items-center gap-2 text-sm text-[#858779] transition hover:text-[#35362c]"
                      >
                        {showPasswords ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                        {showPasswords ? "Hide Passwords" : "Show Passwords"}
                      </button>

                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="rounded-xl bg-[#d4e14b] px-6 py-3.5 text-sm font-semibold transition hover:bg-[#c6d23f] disabled:opacity-50"
                      >
                        {changingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#858779]">
                      <ShieldCheck size={17} />
                      Your new password must contain at least 8 characters.
                    </div>
                  </form>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
