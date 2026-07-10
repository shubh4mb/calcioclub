import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Loader2, Minus, Plus } from 'lucide-react';

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jersey, setJersey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    if (jersey) {
      setActiveImage(jersey.image);
    }
  }, [jersey]);

  useEffect(() => {
    const fetchJerseyDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/jerseys/${id}`);
        if (!response.ok) {
          throw new Error('Jersey details not found');
        }
        const data = await response.json();
        setJersey(data);
        // Default select the first size available
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      } catch (err) {
        setError(err.message || 'Error loading product details');
      } finally {
        setLoading(false);
      }
    };

    fetchJerseyDetail();
  }, [id]);

  const handleQtyChange = (type) => {
    if (type === 'inc') {
      setQuantity((q) => q + 1);
    } else {
      setQuantity((q) => (q > 1 ? q - 1 : 1));
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    addToCart(jersey, selectedSize, quantity);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <Loader2 size={40} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
      </div>
    );
  }

  if (error || !jersey) {
    return (
      <div className="empty-state">
        <h3>Product Not Found</h3>
        <p>{error || 'The requested jersey could not be found.'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-secondary" 
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={16} /> Back to Shop
      </button>

      <div className="detail-container">
        {/* Left Side: Image & Gallery */}
        <div>
          <div className="detail-image-panel">
            <img src={activeImage} alt={jersey.name} />
          </div>
          
          {/* Thumbnail Gallery */}
          {jersey && jersey.images && [jersey.image, ...jersey.images].filter(Boolean).length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {[jersey.image, ...jersey.images].filter(Boolean).map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  style={{
                    width: '70px',
                    height: '85px',
                    borderRadius: 'var(--radius-sm)',
                    border: activeImage === imgUrl ? '2px solid var(--text-primary)' : '1px solid var(--card-border)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: 0,
                    backgroundColor: 'var(--bg-secondary)',
                    flexShrink: 0,
                    transition: 'var(--transition)'
                  }}
                >
                  <img src={imgUrl} alt={`${jersey.name} view ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Details & Actions */}
        <div className="detail-info-panel">
          <span className="detail-category">{jersey.category}</span>
          <h1 className="detail-title">{jersey.name}</h1>
          <div className="detail-price">₹{jersey.price.toFixed(2)}</div>
          
          {jersey.description && (
            <p className="detail-desc">{jersey.description}</p>
          )}

          {/* Size Selector */}
          {jersey.sizes && jersey.sizes.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="detail-option-title">Select Size</div>
              <div className="size-selector">
                {jersey.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <div className="detail-option-title">Quantity</div>
            <div className="quantity-selector">
              <button onClick={() => handleQtyChange('dec')} className="qty-btn" type="button">
                <Minus size={16} />
              </button>
              <span className="qty-value">{quantity}</span>
              <button onClick={() => handleQtyChange('inc')} className="qty-btn" type="button">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {jersey.inStock ? (
              <button 
                onClick={handleAddToCart} 
                className="btn btn-primary" 
                style={{ flexGrow: 1, padding: '1rem 2rem' }}
              >
                <ShoppingCart size={20} /> Add to Cart
              </button>
            ) : (
              <button 
                className="btn" 
                disabled 
                style={{ 
                  flexGrow: 1, 
                  backgroundColor: 'var(--input-border)', 
                  color: 'var(--text-secondary)',
                  cursor: 'not-allowed',
                  padding: '1rem 2rem'
                }}
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
