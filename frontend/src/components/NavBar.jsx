import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          UP<span>TOWN</span>
        </Link>

        <nav className="navbar__links">
          <Link to="/menu" className="btn btn--outline btn--sm">
            Menu
          </Link>
          <Link to="/cart" className="btn btn--outline btn--sm navbar__cart">
            Cart
            {count > 0 && <span className="navbar__cart-badge">{count}</span>}
          </Link>
          {user && (
            <Link to="/orders" className="btn btn--outline btn--sm">
              Orders
            </Link>
          )}
          {user?.isPremium && (
            <Link to="/premium" className="btn btn--outline btn--sm navbar__premium">
              ★ Premium
            </Link>
          )}
          {user && !user.isPremium && (
            <Link to="/premium" className="btn btn--outline btn--sm">
              Go Premium
            </Link>
          )}
          {user?.isAdmin && (
            <Link to="/admin" className="btn btn--outline btn--sm">
              Admin
            </Link>
          )}
        </nav>

        <div className="navbar__auth">
          {user ? (
            <>
              <Link to="/profile" className="navbar__profile">
                {user.fullName?.split(' ')[0] || 'Profile'}
              </Link>
              <button
                className="btn btn--primary btn--sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--outline btn--sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: var(--ink-raised);
          border-bottom: 1px solid var(--ink-line);
        }
        .navbar__inner {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          padding-top: var(--space-3);
          padding-bottom: var(--space-3);
        }
        .navbar__brand {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: -0.01em;
          color: var(--text-hi);
          flex-shrink: 0;
        }
        .navbar__brand span { color: var(--mango); }

        .navbar__links {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .navbar__cart { position: relative; }
        .navbar__cart-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: var(--mango);
          color: #1c1206;
          font-size: 0.68rem;
          font-weight: 700;
          margin-left: 2px;
        }
        .navbar__premium { border-color: var(--mango); color: var(--mango); }

        /* Pushes the auth controls (and Log out) all the way to the right edge */
        .navbar__auth {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-left: auto;
          flex-shrink: 0;
        }
        .navbar__profile {
          font-size: 0.85rem;
          color: var(--text-mid);
        }
        .navbar__profile:hover { color: var(--text-hi); }

        @media (max-width: 860px) {
          .navbar__inner { flex-wrap: wrap; row-gap: var(--space-3); }
          .navbar__links { order: 3; width: 100%; }
          .navbar__auth { margin-left: auto; }
        }
      `}</style>
    </header>
  );
}