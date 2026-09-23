import { useCart } from "../context/CartContext";

export default function MenuItemCard({ item }) {
  const { items, addItem, setQuantity } = useCart();
  const quantity = items[item.id]?.quantity || 0;

  return (
    <div className="menu-card">
      <div className="menu-card-top">
        <div className="menu-card-name">{item.name}</div>
        <div className="menu-card-price">KES {item.price_kes}</div>
      </div>
      {item.description && <div className="menu-card-desc">{item.description}</div>}
      <div className="qty-row">
        {quantity === 0 ? (
          <button className="btn btn-primary btn-sm" onClick={() => addItem(item)}>
            Add to cart
          </button>
        ) : (
          <div className="stepper">
            <button onClick={() => setQuantity(item, quantity - 1)} aria-label={`Remove one ${item.name}`}>
              −
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(item, quantity + 1)} aria-label={`Add one ${item.name}`}>
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
