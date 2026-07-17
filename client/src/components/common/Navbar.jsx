import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Menu, X, Ticket } from 'lucide-react';
import GlobalSearch from './GlobalSearch.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMenu}>
        <Ticket size={22} />
        CineCosmos
      </Link>
      
      <GlobalSearch closeMenu={closeMenu} />

      <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/" className="btn btn-ghost" onClick={closeMenu}>
          Home
        </NavLink>
        {user ? (
          <>
            <span className="navbar-greeting">Hi, {user.name}</span>
            <NavLink to="/my-bookings" className="btn btn-ghost" onClick={closeMenu}>
              My Bookings
            </NavLink>
            {user.role === 'admin' && (
              <NavLink to="/admin" className="btn btn-ghost" onClick={closeMenu}>
                Dashboard
              </NavLink>
            )}
            <button
              onClick={() => { logout(); closeMenu(); }}
              className="btn btn-outline"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="btn btn-outline" onClick={closeMenu}>
              Login
            </NavLink>
            <NavLink to="/register" className="btn btn-primary" onClick={closeMenu}>
              Sign Up
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
