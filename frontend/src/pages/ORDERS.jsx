import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOrders()
      .then((data) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1 style={{ marginTop: "2.5rem" }}>Your orders</h1>
      {loading && <p className="muted">Loading…</p>}
      {!loading && orders.length === 0 && (
        <div className="empty-state">
          <p>No orders yet.</p>
          <Link to="/menu" className="btn btn-primary">Browse the menu</Link>
        </div>
      )}
      {orders.map((order) => (
        <Link
          to={`/orders/${order.id}`}
          key={order.id}
          className="cart-line"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div>
            <div className="cart-line-name">#{order.id.slice(0, 8).toUpperCase()}</div>
            <div className="cart-line-meta">{new Date(order.createdAt).toLocaleString()} · {order.deliveryHostel}</div>
          </div>
          <span className={`badge ${order.paymentStatus === "paid" ? "paid" : order.paymentStatus === "failed" ? "failed" : "unpaid"}`}>
            {order.paymentStatus}
          </span>
          <div style={{ fontFamily: "var(--font-mono)" }}>KES {order.totalKes}</div>
        </Link>
      ))}
    </div>
  );
}
