import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import Lenis from 'lenis';

function App() {
  // Initialize Lenis for premium smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      window.lenis = null;
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);
  // Theme state: default to 'dark' for premium sports look
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Cart state
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync cart with localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Cart helper functions
  const addToCart = (jersey, size, quantity) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.jersey === jersey._id && item.size === size
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        showToast(`Updated ${jersey.name} (${size}) quantity in cart!`);
        return updatedCart;
      } else {
        showToast(`Added ${jersey.name} (${size}) to cart!`);
        return [
          ...prevCart,
          {
            jersey: jersey._id,
            jerseyName: jersey.name,
            size,
            quantity,
            price: jersey.price,
            image: jersey.image
          }
        ];
      }
    });
  };

  const updateQuantity = (jerseyId, size, newQty) => {
    if (newQty < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.jersey === jerseyId && item.size === size
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const removeFromCart = (jerseyId, size) => {
    setCart((prevCart) => {
      const itemToRemove = prevCart.find((i) => i.jersey === jerseyId && i.size === size);
      if (itemToRemove) {
        showToast(`Removed ${itemToRemove.jerseyName} from cart.`, 'info');
      }
      return prevCart.filter((item) => !(item.jersey === jerseyId && item.size === size));
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Helper component to guard admin dashboard
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          cartCount={cart.reduce((total, item) => total + item.quantity, 0)}
        />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/product/:id"
              element={<ProductDetail addToCart={addToCart} />}
            />
            <Route
              path="/cart"
              element={
                <Cart
                  cart={cart}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/admin/login"
              element={<AdminLogin showToast={showToast} />}
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin showToast={showToast} />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {toast && (
          <div className="toast">
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
