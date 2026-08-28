import { useEffect, useState, useMemo } from 'react';
import { api, resolveAssetUrl } from '../api/client';
import { useCart } from '../context/CartContext';

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const { addItem, lines } = useCart();
  const [justAdded, setJustAdded] = useState(null);

  useEffect(() => {
    api
      .getMenu()
      .then(({ menu }) => setMenu(menu))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(menu.map((m) => m.category));
    return ['All', ...set];
  }, [menu]);

  const visible = activeCategory === 'All' ? menu : menu.filter((m) => m.category === activeCategory);

  function handleAdd(item) {
    addItem(item);
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(null), 900);
  }

  function qtyInCart(id) {
    return lines.find((l) => l.id === id)?.quantity || 0;
  }

  return (
    <div className="container menu">
      <section className="menu__hero">
        <span className="tag">Order chit №{new Date().getMonth() + 1}/{new Date().getDate()}</span>
        <h1>
          Campus food, <span>ticketed and on the way.</span>
        </h1>
        <p>
          Pick your plate, pay by M-Pesa or cash on delivery, and we'll send your chit straight
          to the kitchen on WhatsApp — with your hostel pinned on the map.
        </p>
      </section>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="menu__categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? 'chip--active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="menu__loading">Loading the board…</p>
      ) : (
        <div className="menu__grid">
          {visible.map((item) => (
            <article className="dish" key={item.id}>
              {item.image && (
                <div className="dish__image">
                  <img src={resolveAssetUrl(item.image)} alt={item.name} loading="lazy" />
                </div>
              )}
              <div className="dish__top">
                <h3>{item.name}</h3>
                <span className="dish__price mono">KSh {item.price}</span>
              </div>
              <p className="dish__desc">{item.description}</p>
              <div className="dish__footer">
                <span className="tag">{item.category}</span>
                <button
                  className={`btn btn--sm ${justAdded === item.id ? 'btn--green' : 'btn--primary'}`}
                  onClick={() => handleAdd(item)}
                >
                  {justAdded === item.id ? 'Added ✓' : qtyInCart(item.id) > 0 ? `Add another (${qtyInCart(item.id)})` : 'Add to order'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .menu { padding: var(--space-7) 0 var(--space-8); }
        .menu__hero { max-width: 640px; margin-bottom: var(--space-7); }
        .menu__hero h1 {
          font-size: clamp(2rem, 4vw, 2.75rem);
          line-height: 1.08;
          margin-top: var(--space-3);
          margin-bottom: var(--space-4);
        }
        .menu__hero h1 span { color: var(--mango); }
        .menu__hero p { color: var(--text-mid); font-size: 1.02rem; max-width: 52ch; }
        .menu__loading { color: var(--text-mid); }
        .menu__categories {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
          margin-bottom: var(--space-6);
        }
        .chip {
          background: transparent;
          border: 1px solid var(--ink-line);
          color: var(--text-mid);
          font-size: 0.78rem;
          padding: 8px 14px;
          border-radius: 999px;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .chip:hover { color: var(--text-hi); }
        .chip--active { border-color: var(--mango); color: var(--mango); }
        .menu__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: var(--space-4);
        }
        .dish {
          background: var(--ink-raised);
          border: 1px solid var(--ink-line);
          border-radius: var(--r-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          transition: border-color 0.15s ease;
        }
        .dish:hover { border-color: var(--matatu-green); }
        .dish__image {
          margin: calc(var(--space-4) * -1) calc(var(--space-4) * -1) 0;
          height: 140px;
          overflow: hidden;
          border-radius: var(--r-md) var(--r-md) 0 0;
        }
        .dish__image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .dish__top { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-2); }
        .dish__top h3 { font-size: 1.02rem; }
        .dish__price { color: var(--mango); font-size: 0.9rem; }
        .dish__desc { color: var(--text-mid); font-size: 0.85rem; flex: 1; }
        .dish__footer { display: flex; align-items: center; justify-content: space-between; }
      `}</style>
    </div>
  );
}
