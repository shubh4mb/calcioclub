import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shirt, Loader2, ShoppingCart } from 'lucide-react';
import bannerImg from '../assets/banner.png';

function Home() {
  const [jerseys, setJerseys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchJerseys();
  }, []);

  const fetchJerseys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jerseys');
      if (!response.ok) {
        throw new Error('Failed to fetch jerseys');
      }
      const data = await response.json();
      setJerseys(data);
    } catch (err) {
      setError(err.message || 'Something went wrong while loading jerseys');
    } finally {
      setLoading(false);
    }
  };

  // Compile categories dynamically
  const categories = ['All', ...new Set(jerseys.map((j) => j.category))];

  // Filter jerseys based on search query and category selector
  const filteredJerseys = jerseys.filter((jersey) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      jersey.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      jersey.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (jersey.description &&
        jersey.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      jersey.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: `url(${bannerImg})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>CalsioClub</h1>
          <p>
            Discover premium quality, authentic retro and current-season jerseys.
            Find your club, represent your national squad, and wear the passion.
          </p>
        </div>
        <button 
          onClick={() => {
            if (window.lenis) {
              window.lenis.scrollTo('#products-section', { offset: -100 });
            } else {
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }} 
          className="hero-scroll-btn"
          aria-label="Scroll to products"
        >
          Shop Now
        </button>
      </section>



      {/* Main Jerseys Listing */}
      <div id="products-section" style={{ scrollMarginTop: '100px' }}>
        <div className="section-header">
          <h2>Latest Collection</h2>
          {/* <span className="section-subtitle">Curated premium retro & football jerseys</span> */}
        </div>
        {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
          <Loader2 size={40} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h3>Error loading jerseys</h3>
          <p>{error}</p>
          <button onClick={fetchJerseys} className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      ) : filteredJerseys.length === 0 ? (
        <div className="empty-state">
          <Shirt size={48} />
          <h3>No Jerseys Found</h3>
          <p>We couldn't find any jerseys matching your criteria. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="jersey-grid">
          {filteredJerseys.map((jersey) => (
            <Link key={jersey._id} to={`/product/${jersey._id}`} className="jersey-card">
              <div className="jersey-card-image">
                <img src={jersey.image} alt={jersey.name} loading="lazy" />
              </div>

              <div className="jersey-card-content">
                <h3 className="jersey-card-title">{jersey.name}</h3>

                {jersey.sizes && jersey.sizes.length > 0 && (
                  <div className="jersey-card-sizes">
                    {jersey.sizes.map((size) => (
                      <span key={size} className="jersey-size-tag">
                        {size}
                      </span>
                    ))}
                  </div>
                )}

                <div className="jersey-card-footer">
                  <span className="jersey-card-price">₹{jersey.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default Home;
