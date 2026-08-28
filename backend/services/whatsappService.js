const axios = require('axios');

// Builds a wa.me deep link pre-filled with the order summary and a live
// Google Maps location link. Works instantly — no API setup required.
function buildOrderWhatsAppLink({ order, user }) {
  const vendorNumber = process.env.WHATSAPP_VENDOR_NUMBER;
  const lines = [
    `*UP TOWN ORDER* — #${order.ticketNumber}`,
    '',
    ...order.items.map((i) => `${i.quantity}x ${i.name} — KSh ${i.price * i.quantity}`),
    '',
    `Total: KSh ${order.total}`,
    `Payment: ${order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on delivery'}`,
    `Deliver to: ${order.deliverTo}`,
    `Name: ${user.fullName}`,
    `Phone: ${user.phone}`,
  ];

  if (order.location?.lat && order.location?.lng) {
    lines.push(`Location: https://maps.google.com/?q=${order.location.lat},${order.location.lng}`);
  }

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${vendorNumber}?text=${text}`;
}

// Optional: send an automated confirmation via WhatsApp Cloud API (Meta).
// No-ops gracefully when credentials aren't configured — the wa.me link above
// already covers the core flow without any API setup.
async function sendCloudApiMessage({ toPhone, message }) {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, reason: 'WhatsApp Cloud API not configured — skipped automated message.' };
  }

  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: message },
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
    );
    return { ok: true, data };
  } catch (err) {
    return { ok: false, reason: err.response?.data?.error?.message || 'Cloud API send failed.' };
  }
}

module.exports = { buildOrderWhatsAppLink, sendCloudApiMessage };
