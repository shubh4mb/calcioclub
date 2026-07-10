import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, ShieldAlert, Shirt, Menu, X, Instagram } from 'lucide-react';
import logoImg from '../assets/logo.PNG';

function Navbar({ theme, toggleTheme, cartCount }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const isHome = location.pathname === '/';

  return (
    <nav className={`navbar ${isHome ? 'navbar-transparent' : ''} ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="logo">
          <img src={logoImg} alt="CalsioClub Logo" style={{ height: '32px', width: 'auto' }} />
        </Link>

        <div className="nav-links">
          <Link to="/cart" className="cart-icon-container nav-link">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <a 
            href="https://www.instagram.com/calsioclub?igsh=cGg2c2QybW1rOXY5" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="nav-link"
            aria-label="Instagram"
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <Instagram size={20} />
          </a>

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
            <img src={logoImg} alt="CalsioClub Logo" style={{ height: '28px', width: 'auto' }} />
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
            to="/cart"
            className={`mobile-nav-link mobile-cart-link ${isActive('/cart')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShoppingCart size={20} />
              <span>Cart</span>
            </div>
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </Link>

          <a
            href="https://www.instagram.com/calsioclub?igsh=cGg2c2QybW1rOXY5"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Instagram size={20} />
              <span>Instagram</span>
            </div>
          </a>

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
