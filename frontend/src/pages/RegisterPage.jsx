import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    idNumber: "",
    password: "",
    hostelName: "",
    address: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/menu");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <form className="form-card" onSubmit={handleSubmit}>
        <h1 style={{ fontSize: "1.6rem" }}>Create your profile</h1>
        <p className="muted" style={{ marginTop: 0, fontSize: "0.88rem" }}>
          We use this to deliver your order and confirm payment. Your ID number is encrypted and never shown in
          full.
        </p>
        {error && <div className="form-error">{error}</div>}

        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="07XXXXXXXX" required />
        </div>
        <div className="field">
          <label htmlFor="idNumber">National ID number</label>
          <input id="idNumber" value={form.idNumber} onChange={(e) => update("idNumber", e.target.value)} placeholder="For delivery/payment verification" required />
        </div>
        <div className="field">
          <label htmlFor="hostelName">Hostel name</label>
          <input id="hostelName" value={form.hostelName} onChange={(e) => update("hostelName", e.target.value)} placeholder="e.g. Sunrise Hostel" />
        </div>
        <div className="field">
          <label htmlFor="address">Room / block / address</label>
          <input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. Block C, Room 14" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} minLength={8} required />
          <span className="field-hint">At least 8 characters.</span>
        </div>

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
