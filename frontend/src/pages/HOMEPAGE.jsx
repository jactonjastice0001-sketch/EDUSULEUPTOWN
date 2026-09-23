import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-eyebrow">Hostel delivery · Nairobi</div>
        <h1>Real food, straight to your room. Pay by M-Pesa.</h1>
        <p>
          Order from the UP TOWN menu, drop a pin on your hostel block so the rider finds you fast, pay with
          M-Pesa, and confirm on WhatsApp — all in one order.
        </p>
        <div className="hero-actions">
          <Link to="/menu" className="btn btn-primary">
            See the menu
          </Link>
          <Link to="/register" className="btn btn-outline">
            Create an account
          </Link>
        </div>
      </section>

      <div className="two-col" style={{ marginTop: "2rem" }}>
        <div className="ticket">
          <div className="ticket-header">
            <span>How it works</span>
            <span>#UP-TOWN</span>
          </div>
          <div className="ticket-row"><span>1. Pick items</span><span>Menu → Cart</span></div>
          <div className="ticket-row"><span>2. Drop your pin</span><span>Hostel + live location</span></div>
          <div className="ticket-row"><span>3. Pay</span><span>M-Pesa STK push</span></div>
          <div className="ticket-row"><span>4. Confirm</span><span>One-tap WhatsApp</span></div>
          <div className="ticket-total"><span>Delivered to</span><span>Your door</span></div>
          <div className="ticket-stamp pending">Fresh &amp; hot</div>
        </div>

        <div>
          <h2 style={{ fontSize: "1.4rem" }}>Built for hostel life</h2>
          <p className="muted">
            Your profile stores your hostel, room/address and contact details once, so every future order is a
            couple of taps. Payments run through Safaricom's Daraja API, and your ID number is encrypted at rest —
            never stored or shown in plain text.
          </p>
        </div>
      </div>
    </div>
  );
}
