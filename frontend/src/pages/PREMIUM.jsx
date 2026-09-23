import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

export default function Premium() {
  const { user, refreshProfile } = useAuth();
  const [status, setStatus] = useState(null);
  const [phone, setPhone] = useState(user?.phone?.replace(/^254/, "0") || "");
  const [paymentId, setPaymentId] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.premiumStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (!paymentId || status?.isPremium) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.premiumPaymentStatus(paymentId);
        if (data.status === "paid") {
          clearInterval(interval);
          await refreshProfile();
          const fresh = await api.premiumStatus();
          setStatus(fresh);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError("Payment wasn't completed. You can try again.");
        }
      } catch {
        /* ignore transient polling errors */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [paymentId, status, refreshProfile]);

  async function handlePay(e) {
    e.preventDefault();
    setError("");
    setMessage("");
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

  if (!status) return <div className="page"><p className="muted" style={{ marginTop: "2.5rem" }}>Loading…</p></div>;

  return (
    <div className="page">
      <h1 style={{ marginTop: "2.5rem" }}>UP TOWN Premium</h1>

      <div className="two-col">
        <div className="form-card" style={{ margin: 0 }}>
          {status.isPremium ? (
            <>
              <h2 style={{ fontSize: "1.1rem" }}>You're Premium</h2>
              <div className="form-success">Active since {new Date(status.premiumSince).toLocaleDateString()}.</div>
              <p className="muted" style={{ fontSize: "0.9rem" }}>Your chit code:</p>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--flame)",
                  border: "1px dashed var(--flame)",
                  borderRadius: "8px",
                  padding: "0.8rem 1rem",
                  textAlign: "center"
                }}
              >
                {status.premiumCode}
              </div>
              <p className="field-hint" style={{ marginTop: "0.6rem" }}>
                Keep this code — quote it to staff for premium perks on your next order.
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "1.1rem" }}>Upgrade to Premium — KES {status.priceKes}</h2>
              <p className="muted" style={{ marginTop: 0, fontSize: "0.9rem" }}>
                Pay once with M-Pesa to unlock Premium and receive your unique chit code.
              </p>
              {error && <div className="form-error">{error}</div>}
              {message && <div className="form-success">{message}</div>}
              <form onSubmit={handlePay}>
                <div className="field">
                  <label htmlFor="phone">M-Pesa phone number</label>
                  <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" required />
                </div>
                <button className="btn btn-primary btn-block" disabled={paying}>
                  {paying ? "Sending prompt…" : `Pay KES ${status.priceKes}`}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="ticket">
          <div className="ticket-header"><span>Premium perks</span></div>
          <div className="ticket-row"><span>Unique chit code</span><span>Starts with P</span></div>
          <div className="ticket-row"><span>Priority orders</span><span>Faster prep</span></div>
          <div className="ticket-row"><span>One-time fee</span><span>KES {status.priceKes}</span></div>
          <div className="ticket-stamp pending">Members only</div>
        </div>
      </div>
    </div>
  );
}
