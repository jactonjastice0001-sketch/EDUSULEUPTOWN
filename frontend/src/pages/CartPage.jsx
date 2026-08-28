import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { lines, setQuantity, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  function goToCheckout() {
    if (!user) {
      navigate('/login?next=/checkout');
      return;
    }
    navigate('/checkout');
  }

  return (
    <div className="container cart-page">
      <h1>Your order chit</h1>

      {lines.length === 0 ? (
        <div className="card cart-empty">
          <p>No items on this chit yet.</p>
          <Link to="/" className="btn btn--primary btn--sm">
            Browse the menu
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="ticket">
            <div className="ticket__stamp">unpaid</div>
            <div className="ticket__header">
              <span className="ticket__brand">
                UP<span>TOWN</span>
              </span>
              <span className="ticket__number">DRAFT CHIT</span>
            </div>
            <div className="ticket__meta">
              <span>{new Date().toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span>{lines.reduce((n, l) => n + l.quantity, 0)} item(s)</span>
            </div>

            {lines.map((line) => (
              <div className="ticket__line" key={line.id}>
                <span>{line.name}</span>
                <span className="ticket__line-qty">
                  <button className="qty-btn" onClick={() => setQuantity(line.id, line.quantity - 1)} aria-label={`Decrease ${line.name}`}>
                    −
                  </button>
                  {line.quantity}
                  <button className="qty-btn" onClick={() => setQuantity(line.id, line.quantity + 1)} aria-label={`Increase ${line.name}`}>
                    +
                  </button>
                </span>
                <span className="ticket__line-price">KSh {line.price * line.quantity}</span>
              </div>
            ))}

            <hr className="ticket__tear" />

            <div className="ticket__total-row">
              <span className="ticket__total-label">Total due</span>
              <span>KSh {total}</span>
            </div>

            <div className="ticket__barcode" />
          </div>

          <aside className="cart-side">
            <button className="btn btn--primary btn--full" onClick={goToCheckout}>
              Proceed to checkout
            </button>
            <button className="btn btn--ghost btn--full btn--sm" onClick={clearCart}>
              Clear chit
            </button>
            <div className="cart-side__note">
              <p>Every item here is priced by the kitchen, not the app — the total on your chit is final.</p>
            </div>
            <ul className="cart-remove-list">
              {lines.map((line) => (
                <li key={line.id}>
                  <span>{line.name}</span>
                  <button className="btn btn--danger btn--sm" onClick={() => removeItem(line.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      <style>{`
        .cart-page { padding: var(--space-7) 0 var(--space-8); }
        .cart-page h1 { font-size: 1.8rem; margin-bottom: var(--space-6); }
        .cart-empty {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          align-items: flex-start;
          max-width: 420px;
        }
        .cart-empty p { color: var(--text-mid); }
        .cart-layout {
          display: grid;
          grid-template-columns: minmax(320px, 480px) 260px;
          gap: var(--space-7);
          align-items: start;
        }
        .qty-btn {
          background: transparent;
          border: 1px solid var(--text-on-paper-low);
          color: var(--text-on-paper);
          width: 20px;
          height: 20px;
          border-radius: 4px;
          font-size: 0.8rem;
          line-height: 1;
          margin: 0 6px;
        }
        .cart-side { display: flex; flex-direction: column; gap: var(--space-3); }
        .cart-side__note {
          font-size: 0.8rem;
          color: var(--text-low);
          border-top: 1px solid var(--ink-line);
          padding-top: var(--space-3);
          margin-top: var(--space-2);
        }
        .cart-remove-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
        .cart-remove-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
          color: var(--text-mid);
        }
        @media (max-width: 860px) {
          .cart-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
