import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, CheckCircle, Minus, Plus, Loader2 } from 'lucide-react';

function Cart({ cart, updateQuantity, removeFromCart, clearCart, showToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    // Quick validation
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      showToast('Please fill out all delivery details.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const orderData = {
        customerDetails: formData,
        items: cart.map((item) => ({
          jersey: item.jersey,
          jerseyName: item.jerseyName,
          size: item.size,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order');
      }

      setCreatedOrder(data);
      setOrderSuccess(true);
      clearCart(); // Clear local storage cart
      showToast('Order booked successfully!');
    } catch (err) {
      showToast(err.message || 'Error processing your order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Success Screen
  if (orderSuccess && createdOrder) {
    return (
      <div className="empty-state" style={{ maxWidth: '600px', margin: '4rem auto' }}>
        <CheckCircle size={64} style={{ color: 'var(--success)', marginBottom: '1.5rem' }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Order Placed Successfully!</h2>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          Thank you for shopping at CalsioClub. Your booking has been recorded.
        </p>
        
        <div 
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            padding: '1.5rem', 
            borderRadius: '16px', 
            textAlign: 'left',
            marginBottom: '2rem',
            border: '1px solid var(--card-border)'
          }}
        >
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Order ID:</strong> <span style={{ fontFamily: 'monospace' }}>{createdOrder._id}</span>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Customer:</strong> {createdOrder.customerDetails.name}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Total Amount:</strong> <span style={{ color: 'var(--accent)', fontWeight: 800 }}>₹{createdOrder.totalAmount.toFixed(2)}</span>
          </div>
          <div>
            <strong>Status:</strong> <span className={`status-badge ${createdOrder.status}`}>{createdOrder.status}</span>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          We will contact you at <strong>{createdOrder.customerDetails.phone}</strong> or <strong>{createdOrder.customerDetails.email}</strong> shortly with shipping details.
        </p>

        <Link to="/" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingBag size={48} />
        <h3>Your Shopping Bag is Empty</h3>
        <p>Looks like you haven't added any jerseys yet.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Browse Jerseys
        </Link>
      </div>
    );
  }

  // 3. Normal Cart Grid
  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Shopping Bag</h1>

      <div className="cart-layout">
        {/* Left Side: Items list */}
        <div className="cart-items-panel">
          {cart.map((item) => (
            <div key={`${item.jersey}-${item.size}`} className="cart-item">
              <div className="cart-item-image">
                <img src={item.image} alt={item.jerseyName} />
              </div>
              
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.jerseyName}</h3>
                <div className="cart-item-meta">Size: {item.size}</div>
                <div className="cart-item-price">₹{item.price.toFixed(2)}</div>
              </div>

              {/* Quantity Controls */}
              <div className="quantity-selector" style={{ marginBottom: 0 }}>
                <button 
                  onClick={() => updateQuantity(item.jersey, item.size, item.quantity - 1)} 
                  className="qty-btn"
                  disabled={item.quantity <= 1}
                  type="button"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-value" style={{ fontSize: '0.95rem' }}>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.jersey, item.size, item.quantity + 1)} 
                  className="qty-btn"
                  type="button"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Remove button */}
              <button 
                onClick={() => removeFromCart(item.jersey, item.size)} 
                className="btn-icon"
                title="Remove item"
                type="button"
                style={{ marginLeft: '1rem', color: 'var(--danger)' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Right Side: Booking details form & Summary */}
        <div className="checkout-panel">
          <h2 className="checkout-title">Order Booking</h2>

          {/* Pricing summary */}
          <div className="checkout-row">
            <span>Items Subtotal</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </div>
          <div className="checkout-row">
            <span>Shipping</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
          </div>
          <div className="checkout-row total">
            <span>Total Amount</span>
            <span className="price">₹{calculateTotal().toFixed(2)}</span>
          </div>

          {/* Customer Booking Form */}
          <form onSubmit={handleSubmitOrder}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g. John Doe"
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="e.g. +1234567890"
                required
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="e.g. john@example.com"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address</label>
              <textarea
                id="address"
                name="address"
                rows="3"
                placeholder="e.g. Street, Apt, City, Country"
                required
                value={formData.address}
                onChange={handleInputChange}
                style={{ resize: 'vertical', fontFamily: 'var(--font-family)' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  Book Order <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Cart;
