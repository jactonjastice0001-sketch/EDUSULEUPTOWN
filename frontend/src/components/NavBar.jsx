import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" style={{ textDecoration: "none" }}>
          UP<span>TOWN</span>
        </Link>
        <nav className="nav-links">
          <Link to="/menu">Menu</Link>
          <Link to="/cart">
            Cart
            {count > 0 && <span className="cart-pill">{count}</span>}
          </Link>
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              {user.isPremium ? (
                <Link to="/premium" style={{ color: "var(--flame)" }}>★ Premium</Link>
              ) : (
                <Link to="/premium">Go Premium</Link>
              )}
              {user.isAdmin && <Link to="/admin">Admin</Link>}
              <Link to="/profile">Profile</Link>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
