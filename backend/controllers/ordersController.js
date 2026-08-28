const { v4: uuid } = require('uuid');
const { readTable, writeTable } = require('../config/db');
const { initiateStkPush } = require('../services/darajaService');
const { buildOrderWhatsAppLink } = require('../services/whatsappService');

function ticketNumber() {
  // Order-ticket identity extends to the ticket number itself: UT-<date>-<short code>
  const d = new Date();
  const datePart = `${d.getMonth() + 1}${d.getDate()}`;
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UT-${datePart}-${code}`;
}

async function createOrder(req, res, next) {
  try {
    const { items, paymentMethod, deliverTo, location, notes } = req.body;
    const menu = readTable('menu');

    // Price from server-side menu data — never trust client-submitted prices.
    const lineItems = [];
    for (const line of items) {
      const menuItem = menu.find((m) => m.id === line.id && m.available);
      if (!menuItem) {
        return res.status(400).json({ error: `Item "${line.id}" is not available.` });
      }
      lineItems.push({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: line.quantity,
      });
    }

    const total = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = {
      id: uuid(),
      ticketNumber: ticketNumber(),
      userId: req.user.id,
      items: lineItems,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending_on_delivery' : 'pending',
      deliverTo,
      location: location || null,
      notes: notes || '',
      status: 'placed',
      createdAt: new Date().toISOString(),
    };

    const orders = readTable('orders');
    orders.push(order);
    writeTable('orders', orders);

    const whatsappLink = buildOrderWhatsAppLink({ order, user: req.user });

    let mpesa = null;
    if (paymentMethod === 'mpesa') {
      mpesa = await initiateStkPush({
        phone: req.user.phone,
        amount: total,
        orderId: order.ticketNumber,
      });

      if (mpesa.ok) {
        const idx = orders.findIndex((o) => o.id === order.id);
        orders[idx].mpesaCheckoutRequestId = mpesa.checkoutRequestId;
        writeTable('orders', orders);
      }
    }

    res.status(201).json({ order, whatsappLink, mpesa });
  } catch (err) {
    next(err);
  }
}

async function mpesaCallback(req, res) {
  // Safaricom posts the payment result here after the user enters their PIN.
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const orders = readTable('orders');
    const idx = orders.findIndex((o) => o.mpesaCheckoutRequestId === body.CheckoutRequestID);
    if (idx !== -1) {
      orders[idx].paymentStatus = body.ResultCode === 0 ? 'paid' : 'failed';
      orders[idx].mpesaResultDesc = body.ResultDesc;
      writeTable('orders', orders);
    }
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    // Always 200 back to Safaricom even on internal error, per Daraja convention.
    console.error(err);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

async function listMyOrders(req, res, next) {
  try {
    const orders = readTable('orders')
      .filter((o) => o.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = readTable('orders').find((o) => o.id === req.params.id && o.userId === req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

// Admin-only: every order across every customer, newest first, with the
// customer's name/phone attached so the kitchen knows who and where.
async function listAllOrders(req, res, next) {
  try {
    const orders = readTable('orders');
    const users = readTable('users');
    const userById = new Map(users.map((u) => [u.id, u]));

    const enriched = orders
      .map((order) => {
        const customer = userById.get(order.userId);
        return {
          ...order,
          customerName: customer?.fullName || 'Unknown customer',
          customerPhone: customer?.phone || null,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ orders: enriched });
  } catch (err) {
    next(err);
  }
}

const VALID_STATUSES = ['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

// Admin-only: move an order through the kitchen workflow.
async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const orders = readTable('orders');
    const idx = orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found.' });

    orders[idx].status = status;
    writeTable('orders', orders);
    res.json({ order: orders[idx] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  mpesaCallback,
  listMyOrders,
  getOrder,
  listAllOrders,
  updateOrderStatus,
};