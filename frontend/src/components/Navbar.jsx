import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Sun, Moon, ShieldAlert, Shirt, Menu, X } from 'lucide-react';
import logoImg from '../assets/logo.PNG';

function Navbar({ theme, toggleTheme, cartCount }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <img src={logoImg} alt="CalcioClub Logo" style={{ height: '32px', width: 'auto' }} />
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            Shop
          </Link>



          <Link to="/cart" className="cart-icon-container nav-link">
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          title="Toggle Menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
            <img src={logoImg} alt="CalcioClub Logo" style={{ height: '28px', width: 'auto' }} />
          </Link>
          <button
            className="close-drawer"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mobile-nav-links">
          <Link
            to="/"
            className={`mobile-nav-link ${isActive('/')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Shop
          </Link>



          <Link
            to="/cart"
            className={`mobile-nav-link mobile-cart-link ${isActive('/cart')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingBag size={20} />
              <span>Cart</span>
            </div>
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </Link>

          <div className="mobile-drawer-footer">
            <span className="mobile-footer-label">Theme Mode</span>
            <button
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              className="theme-toggle-mobile"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Moon size={18} />
                  <span>Dark Mode</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sun size={18} />
                  <span>Light Mode</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      {isMenuOpen && <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)} />}
    </nav>
  );
}

export default Navbar;
