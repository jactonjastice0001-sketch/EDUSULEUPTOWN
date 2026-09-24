import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [hostelName, setHostelName] = useState(user?.hostelName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  if (!user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStatus('saving');
    try {
      const { user: updated } = await api.updateProfile({ fullName, hostelName, address });
      setUser(updated);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  return (
    <div className="container profile-page">
      <h1>Your profile</h1>

      <div className="profile-layout">
        <form className="card" onSubmit={handleSubmit}>
          {error && <div className="alert alert--error">{error}</div>}
          {status === 'saved' && <div className="alert alert--success">Profile updated.</div>}

          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="hostelName">Hostel / residence</label>
            <input id="hostelName" value={hostelName} onChange={(e) => setHostelName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="address">Room / delivery address</label>
            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <button className="btn btn--primary" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <aside className="card profile-readonly">
          <h3>Account details</h3>
          <dl>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Phone</dt>
            <dd className="mono">{user.phone}</dd>
            <dt>National ID</dt>
            <dd className="mono">{user.idNumberMasked}</dd>
          </dl>
          <p className="profile-readonly__note">
            Your ID number is encrypted at rest and never shown in full — only the last 4 digits are visible here.
          </p>
          <div className="profile-readonly__premium">
            {user.isPremium ? (
              <>
                <span className="mono" style={{ color: 'var(--mango)', fontWeight: 700 }}>★ Premium</span>
                <span className="mono" style={{ display: 'block', marginTop: 4 }}>{user.premiumCode}</span>
              </>
            ) : (
              <Link to="/premium" className="btn btn--sm btn--outline">Upgrade to Premium</Link>
            )}
          </div>
        </aside>
      </div>

      <style>{`
        .profile-page { padding: var(--space-7) 0 var(--space-8); }
        .profile-page h1 { font-size: 1.8rem; margin-bottom: var(--space-6); }
        .profile-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: var(--space-6);
          align-items: start;
        }
        .profile-readonly h3 { font-size: 1rem; margin-bottom: var(--space-4); }
        .profile-readonly dl { display: grid; grid-template-columns: auto 1fr; gap: 6px var(--space-3); margin: 0 0 var(--space-4); }
        .profile-readonly dt { color: var(--text-low); font-size: 0.78rem; }
        .profile-readonly dd { margin: 0; font-size: 0.85rem; }
        .profile-readonly__note { font-size: 0.78rem; color: var(--text-low); border-top: 1px solid var(--ink-line); padding-top: var(--space-3); }
        .profile-readonly__premium { margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--ink-line); }
        @media (max-width: 860px) { .profile-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
