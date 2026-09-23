import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone?.replace(/^254/, "0") || "",
    hostelName: user?.hostelName || "",
    address: user?.address || ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api.updateProfile(form);
      await refreshProfile();
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1 style={{ fontSize: "1.6rem" }}>Your profile</h1>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="field">
          <label>Email</label>
          <input value={user.email} disabled />
          <span className="field-hint">Email can't be changed here.</span>
        </div>
        <div className="field">
          <label>National ID</label>
          <input value={user.idNumberMasked || ""} disabled />
          <span className="field-hint">Stored encrypted — only the last 4 digits are ever shown.</span>
        </div>

        <div className="field">
          <label>Membership</label>
          {user.isPremium ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--flame)",
                border: "1px dashed var(--flame)",
                borderRadius: "8px",
                padding: "0.6rem 0.8rem",
                fontWeight: 700
              }}
            >
              ★ Premium — chit code {user.premiumCode}
            </div>
          ) : (
            <div className="field-hint">
              Not Premium yet. <Link to="/premium">Upgrade for KES 500</Link>.
            </div>
          )}
        </div>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="hostelName">Hostel name</label>
          <input id="hostelName" value={form.hostelName} onChange={(e) => update("hostelName", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="address">Room / block / address</label>
          <input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>

        <button className="btn btn-primary btn-block" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
