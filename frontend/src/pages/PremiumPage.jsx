import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function PremiumPage() {
  const { user, setUser } = useAuth();
  const [status, setStatusData] = useState(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentId, setPaymentId] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getPremiumStatus().then(setStatusData).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!paymentId || status?.isPremium) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.premiumPaymentStatus(paymentId);
        if (data.status === 'paid') {
          clearInterval(interval);
          const fresh = await api.getPremiumStatus();
          setStatusData(fresh);
          const { user: me } = await api.me();
          setUser(me);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError("Payment wasn't completed. You can try again.");
        }
      } catch {
        // ignore transient polling errors
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [paymentId, status, setUser]);

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setPaying(true);
    try {
      const data = await api.premiumStkPush({ phone });
      setMessage(data.message);
      setPaymentId(data.paymentId);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (!status) {
    return (
      <div className="container premium-page">
        <p style={{ color: 'var(--text-mid)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container premium-page">
      <h1>UP TOWN Premium</h1>

      <div className="premium-layout">
        <div className="card">
          {status.isPremium ? (
            <>
              <h3>You're Premium</h3>
              <div className="alert alert--success">
                Active since {new Date(status.premiumSince).toLocaleDateString()}.
              </div>
              <p style={{ color: 'var(--text-mid)', fontSize: '0.85rem', marginBottom: 8 }}>Your chit code:</p>
              <div className="premium-code mono">{status.premiumCode}</div>
              <p className="field__hint" style={{ marginTop: 12 }}>
                Keep this code — quote it to staff for Premium perks on your next order.
              </p>
            </>
          ) : (
            <>
              <h3>Upgrade to Premium — KES {status.priceKes}</h3>
              <p style={{ color: 'var(--text-mid)', fontSize: '0.85rem', marginBottom: 16 }}>
                Pay once with M-Pesa to unlock Premium and receive your unique chit code.
              </p>
              {error && <div className="alert alert--error">{error}</div>}
              {message && <div className="alert alert--success">{message}</div>}
              <form onSubmit={handlePay}>
                <div className="field">
                  <label htmlFor="phone">M-Pesa phone number</label>
                  <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" required />
                </div>
                <button className="btn btn--primary btn--full" disabled={paying}>
                  {paying ? 'Sending prompt…' : `Pay KES ${status.priceKes}`}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="ticket">
          <div className="ticket__header">
            <span className="ticket__brand">Premium perks</span>
          </div>
          <div className="ticket-row"><span>Unique chit code</span><span>Starts with P</span></div>
          <div className="ticket-row"><span>Priority orders</span><span>Faster prep</span></div>
          <div className="ticket-row"><span>One-time fee</span><span>KES {status.priceKes}</span></div>
        </div>
      </div>

      <style>{`
        .premium-page { padding: var(--space-7) 0 var(--space-8); }
        .premium-page h1 { font-size: 1.8rem; margin-bottom: var(--space-6); }
        .premium-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: var(--space-6);
          align-items: start;
        }
        .premium-code {
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--mango);
          border: 1px dashed var(--mango);
          border-radius: var(--r-sm);
          padding: 14px 16px;
          text-align: center;
        }
        .ticket-row {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          font-size: 0.85rem;
          padding: 6px 0;
        }
        @media (max-width: 860px) { .premium-layout { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
