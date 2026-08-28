import { useEffect, useState } from 'react';
import { api } from '../api/client';

const STATUS_LABEL = {
  paid: 'Paid',
  pending: 'Awaiting payment',
  pending_on_delivery: 'Pay on delivery',
  failed: 'Payment failed',
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listOrders()
      .then(({ orders }) => setOrders(orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container orders-page">
      <h1>Past orders</h1>
      {error && <div className="alert alert--error">{error}</div>}
      {loading ? (
        <p>Pulling up your chits…</p>
      ) : orders.length === 0 ? (
        <p className="orders-empty">No orders yet — your first chit will show up here.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-row card" key={order.id}>
              <div className="order-row__main">
                <span className="mono order-row__number">#{order.ticketNumber}</span>
                <span className="order-row__items">
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </span>
                <span className="order-row__date">{new Date(order.createdAt).toLocaleString('en-KE')}</span>
              </div>
              <div className="order-row__side">
                <span className={`tag order-row__status order-row__status--${order.paymentStatus}`}>
                  {STATUS_LABEL[order.paymentStatus] || order.paymentStatus}
                </span>
                <span className="mono order-row__total">KSh {order.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .orders-page { padding: var(--space-7) 0 var(--space-8); }
        .orders-page h1 { font-size: 1.8rem; margin-bottom: var(--space-6); }
        .orders-empty { color: var(--text-mid); }
        .orders-list { display: flex; flex-direction: column; gap: var(--space-3); }
        .order-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .order-row__main { display: flex; flex-direction: column; gap: 4px; }
        .order-row__number { color: var(--mango); font-size: 0.85rem; }
        .order-row__items { font-size: 0.85rem; color: var(--text-hi); }
        .order-row__date { font-size: 0.75rem; color: var(--text-low); }
        .order-row__side { display: flex; align-items: center; gap: var(--space-3); }
        .order-row__total { font-weight: 600; }
        .order-row__status--paid { border-color: var(--matatu-green); color: var(--matatu-green); }
        .order-row__status--failed { border-color: var(--chili); color: var(--chili); }
      `}</style>
    </div>
  );
}
