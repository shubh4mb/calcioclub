import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './TrackOrder.css';

const TrackOrder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a valid Phone, Email or Order ID.');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);
    setOrders([]);

    try {
      const response = await fetch(`/api/orders/track?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Could not fetch orders.');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'var(--pending)';
      case 'processing': return 'var(--processing)';
      case 'shipped': return 'var(--shipped)';
      case 'delivered': return 'var(--success)';
      case 'cancelled': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="track-order-wrapper">
      <div className="track-header">
        <h1>Track Your Order</h1>
        <p>Enter your Email, Phone number, or Order ID to check your order status.</p>
      </div>

      <div className="track-search-box">
        <form onSubmit={handleSearch} className="track-search-form">
          <input 
            type="text" 
            placeholder="Email, Phone, or Order ID" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="track-input"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary track-submit-btn"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>
        {error && <p className="track-error">{error}</p>}
      </div>

      <div className="track-results">
        {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>}
        
        {!loading && hasSearched && orders.length === 0 && !error && (
          <div className="track-empty-state">
            <h3>No orders found</h3>
            <p>We couldn't find any orders matching your details. Please check and try again.</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-meta-item">
                    <span className="order-meta-label">Order ID</span>
                    <span className="order-meta-value">{order._id}</span>
                  </div>
                  <div className="order-meta-item order-meta-right">
                    <span className="order-meta-label">Date</span>
                    <span className="order-meta-value">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                <div className={`order-status-banner ${getStatusClass(order.status)}`}>
                  <span className="status-label">Status:</span>
                  <span className="status-badge" style={{ background: getStatusColor(order.status) }}>
                    {order.status || 'Pending'}
                  </span>
                </div>

                <div className="order-items-section">
                  <h4>Items</h4>
                  <div className="order-items-list">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="item-details">
                          <p className="item-name">{item.jerseyName}</p>
                          <p className="item-meta">Size: {item.size} | Qty: {item.quantity}</p>
                        </div>
                        <div className="item-price">
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="order-footer">
                  <div className="order-summary">
                    <p className="delivery-charge">Delivery Charge: ₹{order.deliveryCharge || 0}</p>
                    <h3 className="total-amount">Total: ₹{order.totalAmount}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
