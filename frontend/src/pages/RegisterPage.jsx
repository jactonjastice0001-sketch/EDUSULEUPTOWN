import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initial = {
  fullName: '',
  email: '',
  phone: '',
  idNumber: '',
  hostelName: '',
  address: '',
  password: '',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container auth-page">
      <form className="card auth-card auth-card--wide" onSubmit={handleSubmit}>
        <span className="tag">First order's on you</span>
        <h1>Create your account</h1>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="auth-grid">
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" value={form.fullName} onChange={update('fullName')} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={update('email')} required />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" value={form.phone} onChange={update('phone')} placeholder="0712345678" required />
          </div>
          <div className="field">
            <label htmlFor="idNumber">National ID number</label>
            <input id="idNumber" value={form.idNumber} onChange={update('idNumber')} placeholder="33221144" required />
            <span className="field__hint">Encrypted at rest — used only to verify delivery pickup.</span>
          </div>
          <div className="field">
            <label htmlFor="hostelName">Hostel / residence</label>
            <input id="hostelName" value={form.hostelName} onChange={update('hostelName')} required />
          </div>
          <div className="field">
            <label htmlFor="address">Room / delivery address</label>
            <input id="address" value={form.address} onChange={update('address')} required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={update('password')} required />
          <span className="field__hint">At least 8 characters, with an uppercase letter, lowercase letter, and number.</span>
        </div>

        <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>

      <style>{`
        .auth-card--wide { max-width: 560px; }
        .auth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 var(--space-4); }
        @media (max-width: 560px) { .auth-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
