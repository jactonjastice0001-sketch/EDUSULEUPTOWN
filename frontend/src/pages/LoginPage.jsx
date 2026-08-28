import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ phone, password });
      navigate(params.get('next') || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <span className="tag">Welcome back</span>
        <h1>Log in to UP TOWN</h1>
        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>

      <style>{`
        .auth-page { padding: var(--space-8) 0; display: flex; justify-content: center; }
        .auth-card { width: 100%; max-width: 400px; }
        .auth-card h1 { font-size: 1.5rem; margin: var(--space-2) 0 var(--space-5); }
        .auth-switch { text-align: center; margin-top: var(--space-4); font-size: 0.85rem; color: var(--text-mid); }
        .auth-switch a { color: var(--mango); }
      `}</style>
    </div>
  );
}
