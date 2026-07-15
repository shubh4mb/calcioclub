import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <h2 className="footer-logo">CalcioClub</h2>
          <p className="footer-tagline">Where Every Jersey Tells a Story.</p>
        </div>
        
        <div className="footer-links-section">
          <div className="footer-column">
            <h3>Explore</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/track-order">Track Order</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Contact Us</h3>
            <ul>
              <li>
                <a href="mailto:calsioclub@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> calsioclub@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+917428714946" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} /> +91 7428 714 946
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/calsioclub?igsh=cGg2c2QybW1rOXY5" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Instagram size={14} /> @calsioclub
                </a>
              </li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Legal</h3>
            <ul>
              <li><Link to="#">Terms of Service</Link></li>
              <li><Link to="#">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CalcioClub. All rights reserved.</p>
        <div className="social-links">
          <a href="#" aria-label="Instagram">IG</a>
          <a href="#" aria-label="Twitter">TW</a>
          <a href="#" aria-label="Facebook">FB</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
