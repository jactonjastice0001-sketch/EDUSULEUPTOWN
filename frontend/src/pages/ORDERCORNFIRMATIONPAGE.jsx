import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import WhatsAppButton from "../components/WhatsAppButton";

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [phone, setPhone] = useState(user?.phone?.replace(/^254/, "0") || "");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [payMessage, setPayMessage] = useState("");
  const [whatsappLink, setWhatsappLink] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .getOrder(id)
      .then((data) => setOrder(data.order))
      .catch((err) => setLoadError(err.message));

    api
      .whatsappLink(id)
      .then((data) => setWhatsappLink(data.link))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!order || order.paymentStatus === "paid") return;
    const interval = setInterval(async () => {
      try {
        const data = await api.paymentStatus(id);
        if (data.paymentStatus !== order.paymentStatus) {
          setOrder((prev) => ({ ...prev, paymentStatus: data.paymentStatus, mpesaReceipt: data.mpesaReceipt }));
        }
      } catch {
        /* ignore transient polling errors */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [order, id]);

  async function handlePay(e) {
    e.preventDefault();
    setPayError("");
    setPayMessage("");
    setPaying(true);
    try {
      const data = await api.stkPush({ orderId: id, phone });
      setPayMessage(data.message);
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (loadError) return <div className="page"><p className="form-error" style={{ marginTop: "2.5rem" }}>{loadError}</p></div>;
  if (!order) return <div className="page"><p className="muted" style={{ marginTop: "2.5rem" }}>Loading order…</p></div>;

  const statusBadge =
    order.paymentStatus === "paid" ? "paid" : order.paymentStatus === "failed" ? "failed" : "unpaid";

  return (
    <div className="page">
      <h1 style={{ marginTop: "2.5rem" }}>Order placed!</h1>
      <p className="muted">Order #{order.id.slice(0, 8).toUpperCase()} — pay and confirm below.</p>

      <div className="two-col">
        <div>
          <div className="form-card" style={{ margin: 0 }}>
            <h2 style={{ fontSize: "1.1rem" }}>Pay with M-Pesa</h2>
            {order.paymentStatus === "paid" ? (
              <div className="form-success">
                Payment received{order.mpesaReceipt ? ` — receipt ${order.mpesaReceipt}` : ""}.
              </div>
            ) : (
              <form onSubmit={handlePay}>
                {payError && <div className="form-error">{payError}</div>}
                {payMessage && <div className="form-success">{payMessage}</div>}
                <div className="field">
                  <label htmlFor="phone">M-Pesa phone number</label>
                  <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" required />
                  <span className="field-hint">You'll get an STK push prompt — enter your M-Pesa PIN to pay KES {order.totalKes}.</span>
                </div>
                <button className="btn btn-primary btn-block" disabled={paying}>
                  {paying ? "Sending prompt…" : `Pay KES ${order.totalKes}`}
                </button>
              </form>
            )}
          </div>

          <div className="form-card" style={{ margin: "1.5rem 0 0" }}>
            <h2 style={{ fontSize: "1.1rem" }}>Confirm on WhatsApp</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Send your order details and live location straight to UP TOWN's WhatsApp so the kitchen and rider see
              it instantly.
            </p>
            <WhatsAppButton link={whatsappLink} />
          </div>
        </div>

        <div className="ticket">
          <div className="ticket-header">
            <span>Receipt</span>
            <span>#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          {order.items.map((item) => (
            <div className="ticket-row" key={item.id}>
              <span>{item.quantity}x {item.name}</span>
              <span>{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="ticket-total"><span>Total</span><span>KES {order.totalKes}</span></div>
          <div className="ticket-row" style={{ marginTop: "0.6rem" }}>
            <span>Deliver to</span>
            <span>{order.deliveryHostel}{order.deliveryAddress ? `, ${order.deliveryAddress}` : ""}</span>
          </div>
          {order.latitude && order.longitude && (
            <div className="ticket-row">
              <span>Pin</span>
              <span>{order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}</span>
            </div>
          )}
          <span className={`badge ${statusBadge}`} style={{ marginTop: "0.75rem" }}>
            {order.paymentStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
