import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import LocationCapture from "../components/LocationCapture";

export default function Checkout() {
  const { list, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hostel, setHostel] = useState(user?.hostelName || "");
  const [address, setAddress] = useState(user?.address || "");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [location, setLocation] = useState(null);
  const [locStatus, setLocStatus] = useState('idle'); // idle | locating | done | error
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { order, whatsappLink, mpesa }

 if (lines.length === 0 && !result) {
    return (
      <div className="container checkout-empty">
        <p>Your chit is empty — nothing to check out yet.</p>
        <button className="btn btn--primary btn--sm" onClick={() => navigate('/')}>
          Back to menu
        </button>
        <style>{`
          .checkout-empty { padding: var(--space-8) 0; display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
          .checkout-empty p { color: var(--text-mid); }
        `}</style>
      </div>
    );
  }

  function captureLocation() {
    if (!('geolocation' in navigator)) {
      setLocStatus('error');
      return;
    }
    setLocStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('done');
      },
      () => setLocStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        items: list.map((i) => ({ id: i.id, quantity: i.quantity })),
        deliveryHostel: hostel,
        deliveryAddress: address,
        deliveryNotes: notes,
        ...(location ? { latitude: location.latitude, longitude: location.longitude } : {})
      };
      const data = await api.createOrder(payload);
      clearCart();
      navigate(`/orders/${data.order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }
if (result) {
    const { order, whatsappLink, mpesa } = result;
    return (
      <div className="container checkout-done">
        <div className="ticket">
          <div className="ticket__stamp" style={{ borderColor: 'var(--matatu-green)', color: 'var(--matatu-green)' }}>
            placed
          </div>
          <div className="ticket__header">
            <span className="ticket__brand">
              UP<span>TOWN</span>
            </span>
            <span className="ticket__number">#{order.ticketNumber}</span>
          </div>
          <div className="ticket__meta">
            <span>{new Date(order.createdAt).toLocaleString('en-KE')}</span>
            <span>{order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on delivery'}</span>
          </div>

          {order.items.map((i) => (
            <div className="ticket__line" key={i.id}>
              <span>{i.name}</span>
              <span className="ticket__line-qty">×{i.quantity}</span>
              <span className="ticket__line-price">KSh {i.price * i.quantity}</span>
            </div>
          ))}

          <hr className="ticket__tear" />

          <div className="ticket__total-row">
            <span className="ticket__total-label">Total</span>
            <span>KSh {order.total}</span>
          </div>
          <div className="ticket__barcode" />
        </div>

        <div className="checkout-done__actions">
          {order.paymentMethod === 'mpesa' && mpesa && !mpesa.ok && (
            <div className="alert alert--error">{mpesa.reason}</div>
          )}
          {order.paymentMethod === 'mpesa' && mpesa && mpesa.ok && (
            <div className="alert alert--success">
              Check your phone — enter your M-Pesa PIN to complete payment for chit #{order.ticketNumber}.
            </div>
          )}
          <a className="btn btn--green btn--full" href={whatsappLink} target="_blank" rel="noreferrer">
            Send chit to the kitchen on WhatsApp
          </a>
          <button className="btn btn--outline btn--full" onClick={() => navigate('/orders')}>
            View my orders
          </button>
        </div>
        <style>{`
          .checkout-done { padding: var(--space-7) 0 var(--space-8); max-width: 480px; margin: 0 auto; }
          .checkout-done__actions { margin-top: var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1>Fill in the chit</h1>
      <div className="checkout-layout">
        <form className="card checkout-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert--error">{error}</div>}

          <div className="field">
            <label htmlFor="deliverTo">Deliver to</label>
            <input
              id="deliverTo"
              value={deliverTo}
              onChange={(e) => setDeliverTo(e.target.value)}
              placeholder="e.g. Room B12, Nyota Hostel"
              required
            />
          </div>

          <div className="field">
            <label>Pin your location (optional but recommended)</label>
            <button type="button" className="btn btn--outline btn--sm" onClick={captureLocation}>
              {locStatus === 'locating' ? 'Locating…' : locStatus === 'done' ? 'Location captured ✓' : 'Share my location'}
            </button>
            {locStatus === 'error' && (
              <span className="field__error">Couldn't get your location — you can still add directions in notes.</span>
            )}
            {locStatus === 'done' && location && (
              <span className="field__hint">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="notes">Notes for the kitchen (optional)</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. extra chili, call on arrival"
            />
          </div>

          <div className="field">
            <label>Payment method</label>
            <div className="payment-toggle">
              <button
                type="button"
                className={`payment-option ${paymentMethod === 'mpesa' ? 'payment-option--active' : ''}`}
                onClick={() => setPaymentMethod('mpesa')}
              >
                M-Pesa (STK push)
              </button>
              <button
                type="button"
                className={`payment-option ${paymentMethod === 'cash' ? 'payment-option--active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                Cash on delivery
              </button>
            </div>
          </div>

          <button className="btn btn--primary btn--full" type="submit" disabled={submitting}>
            {submitting ? 'Placing your chit…' : `Place order — KSh ${total}`}
          </button>
        </form>

        <aside className="card checkout-summary">
          <h3>Order summary</h3>
          <ul className="checkout-summary__list mono">
            {lines.map((l) => (
              <li key={l.id}>
                <span>{l.quantity}× {l.name}</span>
                <span>KSh {l.price * l.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="checkout-summary__total">
            <span>Total</span>
            <span>KSh {total}</span>
          </div>
        </aside>
      </div>

      <style>{`
        .checkout-page { padding: var(--space-7) 0 var(--space-8); }
        .checkout-page h1 { font-size: 1.8rem; margin-bottom: var(--space-6); }
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: var(--space-6);
          align-items: start;
        }
        .checkout-form textarea { resize: vertical; }
        .payment-toggle { display: flex; gap: var(--space-2); }
        .payment-option {
          flex: 1;
          background: var(--ink);
          border: 1px solid var(--ink-line);
          color: var(--text-mid);
          padding: 12px;
          border-radius: var(--r-sm);
          font-size: 0.85rem;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .payment-option--active { border-color: var(--matatu-green); color: var(--text-hi); }
        .checkout-summary h3 { font-size: 1rem; margin-bottom: var(--space-4); }
        .checkout-summary__list { list-style: none; padding: 0; margin: 0 0 var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); font-size: 0.82rem; }
        .checkout-summary__list li { display: flex; justify-content: space-between; color: var(--text-mid); }
        .checkout-summary__total {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
          border-top: 1px dashed var(--ink-line);
          padding-top: var(--space-3);
        }
        @media (max-width: 860px) {
          .checkout-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );

  return (
    <div className="page">
      <h1 style={{ marginTop: "2.5rem" }}>Checkout</h1>
      <div className="two-col">
        <form className="form-card" style={{ margin: 0 }} onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="field">
            <label htmlFor="hostel">Hostel name</label>
            <input id="hostel" value={hostel} onChange={(e) => setHostel(e.target.value)} required placeholder="e.g. Sunrise Hostel" />
          </div>

          <div className="field">
            <label htmlFor="address">Room / block / address</label>
            <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="e.g. Block C, Room 14" />
          </div>

          <div className="field">
            <label htmlFor="notes">Delivery notes (optional)</label>
            <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, landmark, call on arrival…" />
          </div>

          <LocationCapture location={location} onCapture={setLocation} />

          <button className="btn btn-primary btn-block" style={{ marginTop: "1.25rem" }} disabled={submitting}>
            {submitting ? "Placing order…" : `Place order — KES ${total}`}
          </button>
        </form>

        <div className="ticket">
          <div className="ticket-header"><span>Order summary</span></div>
          {list.map((item) => (
            <div className="ticket-row" key={item.id}>
              <span>{item.quantity}x {item.name}</span>
              <span>{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="ticket-total"><span>Total</span><span>KES {total}</span></div>
        </div>
      </div>
    </div>
  );
}
