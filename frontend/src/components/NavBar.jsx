import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [callNumber, setCallNumber] = useState(null);

  useEffect(() => {
    api
      .getConfig()
      .then(({ adminCallNumber }) => setCallNumber(adminCallNumber))
      .catch(() => {});
  }, []);

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Link to="/" className="nav__brand">
          UP<span>TOWN</span>
        </Link>

        <nav className="nav__links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Menu
          </NavLink>
          {user && (
            <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
              Past orders
            </NavLink>
          )}
          {user?.isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="nav__actions">
          {callNumber && (
            <a href={`tel:${callNumber}`} className="nav__call" title="Call the kitchen">
              <span className="mono">CALL</span>
            </a>
          )}
          <Link to="/cart" className="nav__cart">
            <span className="mono">CART</span>
            {count > 0 && <span className="nav__badge">{count}</span>}
          </Link>

          {user ? (
            <div className="nav__user">
              <Link to="/profile" className="nav__hello">
                {user.fullName.split(' ')[0]}
              </Link>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn--sm btn--outline">
              Log in
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(20, 19, 16, 0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--ink-line);
        }
        .nav__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-5);
          height: 64px;
        }
        .nav__brand {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.02em;
          color: var(--text-hi);
        }
        .nav__brand span { color: var(--mango); }
        .nav__links {
          display: flex;
          gap: var(--space-5);
          font-size: 0.85rem;
          color: var(--text-mid);
        }
        .nav__links a { transition: color 0.15s ease; }
        .nav__links a:hover, .nav__links a.active { color: var(--text-hi); }
        .nav__actions { display: flex; align-items: center; gap: var(--space-4); }
        .nav__cart {
          position: relative;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: var(--text-mid);
          border: 1px solid var(--ink-line);
          padding: 8px 12px;
          border-radius: var(--r-sm);
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .nav__cart:hover { border-color: var(--mango); color: var(--text-hi); }
        .nav__call {
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: var(--matatu-green);
          border: 1px solid var(--matatu-green-deep);
          padding: 8px 12px;
          border-radius: var(--r-sm);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .nav__call:hover { background: var(--matatu-green); color: var(--text-hi); }
        .nav__badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--chili);
          color: var(--text-hi);
          font-size: 0.65rem;
          font-weight: 600;
          min-width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          padding: 0 4px;
        }
        .nav__user { display: flex; align-items: center; gap: var(--space-3); }
        .nav__hello {
          font-size: 0.85rem;
          color: var(--text-mid);
        }
        .nav__hello:hover { color: var(--text-hi); }
        @media (max-width: 720px) {
          .nav__links { display: none; }
        }
      `}</style>
    </header>
  );
}
