import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { lines, total, setQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="container cart-empty">
        <p>Your chit is empty.</p>
        <button className="btn btn--primary btn--sm" onClick={() => navigate('/menu')}>
          Browse the menu
        </button>
        <style>{`
          .cart-empty { padding: var(--space-8) 0; display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
          .cart-empty p { color: var(--text-mid); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1>Your chit</h1>

      <div className="cart-list">
        {lines.map((line) => (
          <div className="cart-row card" key={line.id}>
            <div className="cart-row__name">{line.name}</div>
            <div className="cart-row__controls">
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setQuantity({ id: line.id, name: line.name, price: line.price }, line.quantity - 1)}
                aria-label={`Remove one ${line.name}`}
              >
                −
              </button>
              <span className="cart-row__qty">{line.quantity}</span>
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setQuantity({ id: line.id, name: line.name, price: line.price }, line.quantity + 1)}
                aria-label={`Add one ${line.name}`}
              >
                +
              </button>
            </div>
            <div className="cart-row__price mono">KSh {line.price * line.quantity}</div>
            <button className="cart-row__remove" onClick={() => removeItem(line.id)} aria-label={`Remove ${line.name}`}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary card">
        <div className="cart-summary__total">
          <span>Total</span>
          <span className="mono">KSh {total}</span>
        </div>
        <button className="btn btn--primary btn--full" onClick={() => navigate('/checkout')}>
          Proceed to checkout
        </button>
      </div>

      <style>{`
        .cart-page { padding: var(--space-7) 0 var(--space-8); max-width: 640px; margin: 0 auto; }
        .cart-page h1 { font-size: 1.8rem; margin-bottom: var(--space-6); }
        .cart-list { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6); }
        .cart-row {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
        }
        .cart-row__name { flex: 1; font-size: 0.95rem; }
        .cart-row__controls { display: flex; align-items: center; gap: 8px; }
        .cart-row__qty { min-width: 1.5em; text-align: center; }
        .cart-row__price { color: var(--text-mid); min-width: 70px; text-align: right; }
        .cart-row__remove { color: var(--text-low); font-size: 0.9rem; padding: 4px 8px; }
        .cart-row__remove:hover { color: var(--chili); }
        .cart-summary { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); }
        .cart-summary__total {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.15rem;
        }
      `}</style>
    </div>
  );
}