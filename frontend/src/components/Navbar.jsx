import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Sun, Moon, ShieldAlert, Shirt, Menu, X, Instagram, Package, Info, Home } from 'lucide-react';
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
  const isTransparent = isHome;

  return (
    <nav className={`navbar ${isTransparent ? 'navbar-transparent' : ''} ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="logo">
          <img 
            src={logoImg} 
            alt="CalsioClub Logo" 
            style={{ 
              height: '44px', 
              width: 'auto',
              // Invert the white logo to black if theme is light, EXCEPT when over the dark hero banner
              filter: theme === 'light' && (!isTransparent || isScrolled) ? 'invert(1)' : 'none',
              transition: 'filter 0.3s ease'
            }} 
          />
        </Link>

        <div className="navbar-actions-pill">
          <Link to="/cart" className="cart-icon-container nav-link-pill">
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          <div className="navbar-pill-divider"></div>
          <button
            className="navbar-toggle-pill"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            title="Toggle Menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
            <img 
              src={logoImg} 
              alt="CalsioClub Logo" 
              style={{ 
                height: '40px', 
                width: 'auto',
                filter: theme === 'light' ? 'invert(1)' : 'none',
                transition: 'filter 0.3s ease'
              }} 
            />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Home size={20} />
              <span>Home</span>
            </div>
          </Link>

          <Link
            to="/about"
            className={`mobile-nav-link ${isActive('/about')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Info size={20} />
              <span>About Us</span>
            </div>
          </Link>

          <Link
            to="/track-order"
            className={`mobile-nav-link ${isActive('/track-order')}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Package size={20} />
              <span>Track Order</span>
            </div>
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
