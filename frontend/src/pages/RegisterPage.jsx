import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    hostelName: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/menu');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <span className="tag">Create your profile</span>
        <h1>Join UP TOWN</h1>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="0712345678"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="hostelName">Hostel name (optional)</label>
          <input
            id="hostelName"
            value={form.hostelName}
            onChange={(e) => update('hostelName', e.target.value)}
            placeholder="e.g. Sunrise Hostel"
          />
        </div>
        <div className="field">
          <label htmlFor="address">Room / block / address (optional)</label>
          <input
            id="address"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="e.g. Block C, Room 14"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            minLength={6}
            required
          />
          <span className="field__hint">At least 6 characters.</span>
        </div>

        <button className="btn btn--primary btn--full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>

      <style>{`
        .auth-page { padding: var(--space-8) 0; display: flex; justify-content: center; }
        .auth-card { width: 100%; max-width: 420px; }
        .auth-card h1 { font-size: 1.5rem; margin: var(--space-2) 0 var(--space-5); }
        .auth-switch { text-align: center; margin-top: var(--space-4); font-size: 0.85rem; color: var(--text-mid); }
        .auth-switch a { color: var(--mango); }
      `}</style>
    </div>
  );
}