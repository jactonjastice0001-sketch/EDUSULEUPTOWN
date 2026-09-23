import { useEffect, useRef, useState } from 'react';
import { api, resolveAssetUrl } from '../api/client';

function DropZone({ item, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { item: updated } = await api.uploadMenuImage(item.id, file);
      onUploaded(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      {item.image ? (
        <img src={resolveAssetUrl(item.image)} alt={item.name} className="dropzone__preview" />
      ) : (
        <span className="dropzone__placeholder">Drag a photo here, or click to browse</span>
      )}

      {uploading && <div className="dropzone__overlay">Uploading…</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <span className="dropzone__error">{error}</span>}
    </div>
  );
}

function AdminRow({ item, onChange }) {
  const [price, setPrice] = useState(item.price);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function savePrice() {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setSaving(true);
    try {
      const { item: updated } = await api.updateMenuItem(item.id, { price: parsed });
      onChange(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable() {
    const { item: updated } = await api.updateMenuItem(item.id, { available: !item.available });
    onChange(updated);
  }

  return (
    <div className="admin-row">
      <DropZone item={item} onUploaded={onChange} />

      <div className="admin-row__info">
        <div className="admin-row__title">
          <strong>{item.name}</strong>
          <span className="tag">{item.category}</span>
        </div>
        <p className="admin-row__desc">{item.description}</p>
      </div>

      <div className="admin-row__price">
        <span className="mono">KSh</span>
        <input
          type="number"
          min="0"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={savePrice}
          onKeyDown={(e) => e.key === 'Enter' && savePrice()}
        />
        {saving && <span className="admin-row__status">Saving…</span>}
        {saved && <span className="admin-row__status admin-row__status--ok">Saved ✓</span>}
      </div>

      <button
        className={`btn btn--sm ${item.available ? 'btn--outline' : 'btn--green'}`}
        onClick={toggleAvailable}
      >
        {item.available ? 'Hide from menu' : 'Make available'}
      </button>
    </div>
  );
}

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price_kes: item.price_kes,
      category: item.category,
      image_url: item.image_url || "",
      available: item.available
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = { ...form, price_kes: parseInt(form.price_kes, 10) };
      if (editingId) {
        await api.updateMenuItem(editingId, payload);
        setSuccess("Menu item updated.");
      } else {
        await api.createMenuItem(payload);
        setSuccess("Menu item added.");
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this item from the menu?")) return;
    try {
      await api.deleteMenuItem(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1 style={{ marginTop: "2.5rem" }}>Manage menu</h1>

      <div className="two-col">
        <form className="form-card" style={{ margin: 0 }} onSubmit={handleSubmit}>
          <h2 style={{ fontSize: "1.1rem" }}>{editingId ? "Edit item" : "Add a new item"}</h2>
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="price_kes">Price (KES)</label>
            <input id="price_kes" type="number" min="1" value={form.price_kes} onChange={(e) => update("price_kes", e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <input id="category" value={form.category} onChange={(e) => update("category", e.target.value)} placeholder="Mains, Snacks, Drinks…" required />
          </div>
          <div className="field">
            <label htmlFor="image_url">Image URL (optional)</label>
            <input id="image_url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://…" />
          </div>
          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: "0.6rem" }}>
            <input
              id="available"
              type="checkbox"
              style={{ width: "auto" }}
              checked={form.available}
              onChange={(e) => update("available", e.target.checked)}
            />
            <label htmlFor="available" style={{ margin: 0 }}>Visible on menu</label>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add item"}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div>
          {loading && <p className="muted">Loading…</p>}
          {items.map((item) => (
            <div className="cart-line" key={item.id}>
              <div>
                <div className="cart-line-name">
                  {item.name} {!item.available && <span className="badge failed" style={{ marginLeft: "0.4rem" }}>hidden</span>}
                </div>
                <div className="cart-line-meta">{item.category} · KES {item.price_kes}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => startEdit(item)}>Edit</button>
              <button className="btn btn-outline btn-sm" onClick={() => handleDelete(item.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

function NewItemForm({ onCreated }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Mains');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { item } = await api.createMenuItem({ name, category, price, description });
      onCreated(item);
      setName('');
      setPrice('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card new-item-form" onSubmit={handleSubmit}>
      <h3>Add a new dish</h3>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="new-item-form__grid">
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required />
        </div>
        <div className="field">
          <label>Price (KSh)</label>
          <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
      </div>
      <div className="field">
        <label>Description</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <button className="btn btn--primary btn--sm" type="submit" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add to menu'}
      </button>
    </form>
  );
}

const STATUS_FLOW = {
  placed: { label: 'Placed', next: 'preparing', nextLabel: 'Start preparing' },
  preparing: { label: 'Preparing', next: 'out_for_delivery', nextLabel: 'Out for delivery' },
  out_for_delivery: { label: 'Out for delivery', next: 'delivered', nextLabel: 'Mark delivered' },
  delivered: { label: 'Delivered', next: null, nextLabel: null },
  cancelled: { label: 'Cancelled', next: null, nextLabel: null },
};

const PAYMENT_LABEL = {
  paid: 'Paid',
  pending: 'Awaiting M-Pesa',
  pending_on_delivery: 'Pay on delivery',
  failed: 'Payment failed',
};

function OrderRow({ order, onChange }) {
  const [updating, setUpdating] = useState(false);
  const flow = STATUS_FLOW[order.status] || STATUS_FLOW.placed;

  async function setStatus(status) {
    setUpdating(true);
    try {
      const { order: updated } = await api.updateOrderStatus(order.id, status);
      onChange(updated);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className={`order-row order-row--${order.status}`}>
      <div className="order-row__top">
        <div>
          <span className="mono order-row__ticket">#{order.ticketNumber}</span>
          <span className="order-row__time">{new Date(order.createdAt).toLocaleString('en-KE')}</span>
        </div>
        <span className={`tag order-row__status-tag order-row__status-tag--${order.status}`}>
          {flow.label}
        </span>
      </div>

      <div className="order-row__body">
        <div className="order-row__items mono">
          {order.items.map((i) => (
            <div key={i.id}>
              {i.quantity}× {i.name} <span className="order-row__item-price">KSh {i.price * i.quantity}</span>
            </div>
          ))}
        </div>

        <div className="order-row__meta">
          <div>
            <strong>{order.customerName}</strong>
            {order.customerPhone && (
              <a href={`tel:${order.customerPhone}`} className="order-row__phone">
                {order.customerPhone}
              </a>
            )}
          </div>
          <div className="order-row__deliver">→ {order.deliverTo}</div>
          {order.location?.lat && (
            <a
              href={`https://maps.google.com/?q=${order.location.lat},${order.location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="order-row__map"
            >
              View pinned location
            </a>
          )}
          {order.notes && <div className="order-row__notes">"{order.notes}"</div>}
        </div>
      </div>

      <div className="order-row__footer">
        <span className="tag">{PAYMENT_LABEL[order.paymentStatus] || order.paymentStatus}</span>
        <span className="mono order-row__total">KSh {order.total}</span>
        <div className="order-row__actions">
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button className="btn btn--outline btn--sm" disabled={updating} onClick={() => setStatus('cancelled')}>
              Cancel
            </button>
          )}
          {flow.next && (
            <button className="btn btn--green btn--sm" disabled={updating} onClick={() => setStatus(flow.next)}>
              {updating ? 'Updating…' : flow.nextLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api
      .listAllOrders()
      .then(({ orders }) => setOrders(orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(updated) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
  }

  return (
    <div>
      <div className="orders-tab__header">
        <p className="orders-tab__count">
          {loading ? 'Loading…' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
        </p>
        <button className="btn btn--outline btn--sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {!loading && orders.length === 0 && <p className="admin-loading">No orders yet.</p>}

      <div className="orders-tab__list">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} onChange={handleChange} />
        ))}
      </div>
    </div>
  );
}

function MenuTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listMenuAdmin()
      .then(({ menu }) => setItems(menu))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(updated) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleCreated(item) {
    setItems((prev) => [...prev, item]);
  }

  return (
    <div>
      {error && <div className="alert alert--error">{error}</div>}

      <NewItemForm onCreated={handleCreated} />

      {loading ? (
        <p className="admin-loading">Loading items…</p>
      ) : (
        <div className="admin-list">
          {items.map((item) => (
            <AdminRow key={item.id} item={item} onChange={handleChange} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('orders');

  return (
    <div className="container admin-page">
      <span className="tag">Kitchen dashboard</span>
      <h1>{tab === 'orders' ? 'Incoming orders' : 'Manage the menu'}</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'orders' ? 'admin-tab--active' : ''}`} onClick={() => setTab('orders')}>
          Orders
        </button>
        <button className={`admin-tab ${tab === 'menu' ? 'admin-tab--active' : ''}`} onClick={() => setTab('menu')}>
          Menu
        </button>
      </div>

      {tab === 'orders' ? <OrdersTab /> : <MenuTab />}

      <style>{`
        .admin-page { padding: var(--space-7) 0 var(--space-8); }
        .admin-page h1 { font-size: 1.8rem; margin: var(--space-2) 0 var(--space-5); }
        .admin-loading { color: var(--text-mid); }

        .admin-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-6); border-bottom: 1px solid var(--ink-line); }
        .admin-tab {
          background: transparent;
          color: var(--text-mid);
          padding: 10px 4px;
          margin-right: var(--space-4);
          font-size: 0.9rem;
          font-weight: 600;
          border-bottom: 2px solid transparent;
        }
        .admin-tab--active { color: var(--text-hi); border-bottom-color: var(--mango); }

        .orders-tab__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
        .orders-tab__count { color: var(--text-mid); font-size: 0.85rem; }
        .orders-tab__list { display: flex; flex-direction: column; gap: var(--space-4); }

        .order-row {
          background: var(--ink-raised);
          border: 1px solid var(--ink-line);
          border-left: 3px solid var(--ink-line);
          border-radius: var(--r-md);
          padding: var(--space-4);
        }
        .order-row--placed { border-left-color: var(--mango); }
        .order-row--preparing { border-left-color: var(--matatu-green); }
        .order-row--out_for_delivery { border-left-color: var(--matatu-green); }
        .order-row--delivered { opacity: 0.6; }
        .order-row--cancelled { opacity: 0.5; border-left-color: var(--chili); }

        .order-row__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
        .order-row__ticket { color: var(--mango); font-size: 0.9rem; margin-right: var(--space-3); }
        .order-row__time { font-size: 0.72rem; color: var(--text-low); }

        .order-row__status-tag--preparing, .order-row__status-tag--out_for_delivery { border-color: var(--matatu-green); color: var(--matatu-green); }
        .order-row__status-tag--delivered { border-color: var(--text-low); color: var(--text-low); }
        .order-row__status-tag--cancelled { border-color: var(--chili); color: var(--chili); }

        .order-row__body { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4); }
        @media (max-width: 640px) { .order-row__body { grid-template-columns: 1fr; } }
        .order-row__items { font-size: 0.85rem; display: flex; flex-direction: column; gap: 4px; }
        .order-row__item-price { color: var(--text-low); }
        .order-row__meta { font-size: 0.82rem; color: var(--text-mid); display: flex; flex-direction: column; gap: 4px; }
        .order-row__phone { margin-left: 8px; color: var(--matatu-green); }
        .order-row__deliver { color: var(--text-hi); }
        .order-row__map { color: var(--mango); font-size: 0.78rem; }
        .order-row__notes { font-style: italic; color: var(--text-low); }

        .order-row__footer {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          border-top: 1px dashed var(--ink-line);
          padding-top: var(--space-3);
        }
        .order-row__total { font-weight: 600; margin-right: auto; }
        .order-row__actions { display: flex; gap: var(--space-2); }

        .new-item-form { margin-bottom: var(--space-6); }
        .new-item-form h3 { font-size: 1rem; margin-bottom: var(--space-4); }
        .new-item-form__grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0 var(--space-4); }
        @media (max-width: 720px) { .new-item-form__grid { grid-template-columns: 1fr; } }

        .admin-list { display: flex; flex-direction: column; gap: var(--space-4); }
        .admin-row {
          display: grid;
          grid-template-columns: 96px 1fr 160px auto;
          gap: var(--space-4);
          align-items: center;
          background: var(--ink-raised);
          border: 1px solid var(--ink-line);
          border-radius: var(--r-md);
          padding: var(--space-4);
        }
        @media (max-width: 780px) {
          .admin-row { grid-template-columns: 72px 1fr; grid-template-areas: 'drop info' 'price price' 'toggle toggle'; }
        }

        .dropzone {
          position: relative;
          width: 96px;
          height: 96px;
          border: 1.5px dashed var(--ink-line);
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
          background: var(--ink);
        }
        .dropzone--active { border-color: var(--mango); background: rgba(242, 163, 15, 0.08); }
        .dropzone__placeholder { font-size: 0.62rem; color: var(--text-low); padding: 6px; line-height: 1.3; }
        .dropzone__preview { width: 100%; height: 100%; object-fit: cover; }
        .dropzone__overlay {
          position: absolute;
          inset: 0;
          background: rgba(20, 19, 16, 0.75);
          color: var(--text-hi);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
        }
        .dropzone__error {
          position: absolute;
          bottom: -22px;
          left: 0;
          right: 0;
          font-size: 0.6rem;
          color: var(--chili);
          text-align: center;
        }

        .admin-row__title { display: flex; align-items: center; gap: var(--space-2); margin-bottom: 4px; }
        .admin-row__title strong { font-size: 0.95rem; }
        .admin-row__desc { font-size: 0.8rem; color: var(--text-mid); }

        .admin-row__price {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-mid);
        }
        .admin-row__price input {
          width: 80px;
          background: var(--ink);
          border: 1px solid var(--ink-line);
          color: var(--text-hi);
          padding: 8px 10px;
          border-radius: var(--r-sm);
          font-family: var(--font-mono);
        }
        .admin-row__price input:focus { border-color: var(--mango); outline: none; }
        .admin-row__status { font-size: 0.7rem; color: var(--text-low); }
        .admin-row__status--ok { color: var(--matatu-green); }
      `}</style>
    </div>
  );
}
