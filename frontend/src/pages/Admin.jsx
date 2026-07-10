import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Plus, Edit, Trash2, LayoutGrid, ClipboardList, 
  X, Check, AlertTriangle, Loader2, Upload, Link as LinkIcon 
} from 'lucide-react';

function Admin({ showToast }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const [activeTab, setActiveTab] = useState('jerseys'); // 'jerseys' or 'orders'
  
  // Data lists
  const [jerseys, setJerseys] = useState([]);
  const [orders, setOrders] = useState([]);

  // Search & Pagination states for Orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const ordersPerPage = 10;
  
  // Loading states
  const [loadingJerseys, setLoadingJerseys] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    const query = orderSearchQuery.toLowerCase().trim();
    if (!query) return true;

    // Check Order ID
    const matchesId = order._id.toLowerCase().includes(query) || 
                      order._id.substring(order._id.length - 8).toLowerCase().includes(query);
    
    // Check Customer details
    const matchesCustomer = (order.customerDetails.name || '').toLowerCase().includes(query) ||
                            (order.customerDetails.phone || '').includes(query) ||
                            (order.customerDetails.email || '').toLowerCase().includes(query) ||
                            (order.customerDetails.address || '').toLowerCase().includes(query);
    
    // Check Status
    const matchesStatus = (order.status || '').toLowerCase().includes(query);

    // Check Item names
    const matchesItems = (order.items || []).some((item) => 
      (item.jerseyName || '').toLowerCase().includes(query) || 
      (item.size || '').toLowerCase() === query
    );

    return matchesId || matchesCustomer || matchesStatus || matchesItems;
  });

  // Paginate orders
  const indexOfLastOrder = ordersCurrentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Reset page when search query changes
  useEffect(() => {
    setOrdersCurrentPage(1);
  }, [orderSearchQuery]);

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [editingJersey, setEditingJersey] = useState(null);

  // Form states
  const [jerseyForm, setJerseyForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    sizes: ['S', 'M', 'L', 'XL'],
    imageUrl: '',
    imageUrls: '',
    inStock: true
  });
  const [imageType, setImageType] = useState('upload'); // 'upload' or 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Load jerseys and orders
  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchJerseys();
    fetchOrders();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    showToast('Logged out successfully.');
    navigate('/admin/login');
  };

  const fetchJerseys = async () => {
    try {
      setLoadingJerseys(true);
      const response = await fetch('/api/jerseys');
      if (!response.ok) throw new Error('Failed to load jerseys');
      const data = await response.json();
      setJerseys(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingJerseys(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.status === 401) {
        // Token expired/invalid
        handleLogout();
        return;
      }
      if (!response.ok) throw new Error('Failed to load orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Delete Jersey handler
  const handleDeleteJersey = async (id) => {
    if (!window.confirm('Are you sure you want to delete this jersey?')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/jerseys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete jersey');
      }

      showToast('Jersey removed successfully!');
      fetchJerseys(); // Refresh list
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Modal for Add
  const openAddModal = () => {
    setEditingJersey(null);
    setJerseyForm({
      name: '',
      description: '',
      price: '',
      category: '',
      sizes: ['S', 'M', 'L', 'XL'],
      imageUrl: '',
      imageUrls: '',
      inStock: true
    });
    setSelectedFile(null);
    setSelectedFiles([]);
    setImageType('upload');
    setShowModal(true);
  };

  // Open Modal for Edit
  const openEditModal = (jersey) => {
    setEditingJersey(jersey);
    setJerseyForm({
      name: jersey.name,
      description: jersey.description || '',
      price: jersey.price,
      category: jersey.category,
      sizes: jersey.sizes || [],
      imageUrl: jersey.image,
      imageUrls: jersey.images ? jersey.images.join(', ') : '',
      inStock: jersey.inStock
    });
    setSelectedFile(null);
    setSelectedFiles([]);
    setImageType(jersey.image.includes('cloudinary') ? 'upload' : 'url');
    setShowModal(true);
  };

  // Handle sizes checkbox change
  const handleSizeCheckboxChange = (size) => {
    setJerseyForm((prev) => {
      const sizes = [...prev.sizes];
      if (sizes.includes(size)) {
        return { ...prev, sizes: sizes.filter((s) => s !== size) };
      } else {
        return { ...prev, sizes: [...sizes, size] };
      }
    });
  };

  // Compress image before upload to avoid payload size limits
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Handle Add/Edit Form submission
  const handleSaveJersey = async (e) => {
    e.preventDefault();
    
    if (!jerseyForm.name || !jerseyForm.price || !jerseyForm.category) {
      showToast('Please fill out Name, Price, and Category.', 'error');
      return;
    }

    if (jerseyForm.sizes.length === 0) {
      showToast('Please select at least one available size.', 'error');
      return;
    }

    try {
      setActionLoading(true);

      const formData = new FormData();
      formData.append('name', jerseyForm.name);
      formData.append('description', jerseyForm.description);
      formData.append('price', jerseyForm.price);
      formData.append('category', jerseyForm.category);
      formData.append('inStock', jerseyForm.inStock);
      formData.append('sizes', JSON.stringify(jerseyForm.sizes));

      if (imageType === 'upload' && selectedFile) {
        showToast('Compressing image...', 'info');
        const compressedFile = await compressImage(selectedFile);
        formData.append('imageFile', compressedFile);
      } else if (imageType === 'url' && jerseyForm.imageUrl) {
        formData.append('imageUrl', jerseyForm.imageUrl);
      } else if (editingJersey) {
        formData.append('imageUrl', jerseyForm.imageUrl);
      } else {
        showToast('Please provide a cover image file or URL', 'error');
        setActionLoading(false);
        return;
      }

      // Append additional image URLs
      if (jerseyForm.imageUrls) {
        const urlsArray = jerseyForm.imageUrls.split(',').map(u => u.trim()).filter(Boolean);
        formData.append('imageUrls', JSON.stringify(urlsArray));
      } else {
        formData.append('imageUrls', JSON.stringify([]));
      }

      // Append additional uploaded files
      if (imageType === 'upload' && selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const compressedFile = await compressImage(selectedFiles[i]);
          formData.append('imageFiles', compressedFile);
        }
      }

      const url = editingJersey 
        ? `/api/jerseys/${editingJersey._id}` 
        : '/api/jerseys';
      const method = editingJersey ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON (e.g. 502 HTML from proxy)
        if (!response.ok) {
          throw new Error(`Server Error (${response.status}): The request may have timed out or the file is too large.`);
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to save jersey (${response.status})`);
      }

      showToast(editingJersey ? 'Jersey updated successfully!' : 'Jersey added successfully!');
      setShowModal(false);
      fetchJerseys();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Order Status Change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      showToast(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh orders list
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="admin-layout">
      {/* Admin Title & Tab Controls */}
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: '2rem' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to CalsioClub management console.</p>
        </div>
        
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.6rem 1rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-tabs">
          <button 
            onClick={() => setActiveTab('jerseys')} 
            className={`admin-tab-btn ${activeTab === 'jerseys' ? 'active' : ''}`}
          >
            <LayoutGrid size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Jerseys
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <ClipboardList size={16} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Orders
          </button>
        </div>

        {activeTab === 'jerseys' && (
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={18} /> Add Jersey
          </button>
        )}
      </div>

      {/* Main Admin Content Container */}
      <div className="admin-content">
        
        {/* TAB 1: JERSEYS LIST */}
        {activeTab === 'jerseys' && (
          <div>
            {loadingJerseys ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
              </div>
            ) : jerseys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <AlertTriangle size={36} style={{ marginBottom: '1rem', color: 'var(--pending)' }} />
                <h3>No jerseys in stock.</h3>
                <p>Click "Add Jersey" above to populate the list.</p>
              </div>
            ) : (
              <div className="admin-jersey-list">
                {jerseys.map((jersey) => (
                  <div key={jersey._id} className="admin-jersey-item">
                    <div className="admin-jersey-info">
                      <div className="admin-jersey-thumb">
                        <img src={jersey.image} alt={jersey.name} />
                      </div>
                      <div className="admin-jersey-meta">
                        <h4>{jersey.name}</h4>
                        <div>
                          <span>Category: <strong>{jersey.category}</strong></span>
                          <span>Price: <strong style={{ color: 'var(--accent)' }}>₹{jersey.price.toFixed(2)}</strong></span>
                          <span>Stock: <strong style={{ color: jersey.inStock ? 'var(--success)' : 'var(--danger)' }}>{jersey.inStock ? 'In Stock' : 'Out of Stock'}</strong></span>
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem' }}>Sizes: {jersey.sizes.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="admin-jersey-actions">
                      <button 
                        onClick={() => openEditModal(jersey)} 
                        className="btn-icon" 
                        title="Edit Jersey"
                        disabled={actionLoading}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteJersey(jersey._id)} 
                        className="btn-icon" 
                        title="Delete Jersey"
                        style={{ color: 'var(--danger)' }}
                        disabled={actionLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div>
            {/* Search Input for Orders */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="search-box" style={{ maxWidth: '350px', width: '100%', position: 'relative' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '16px', height: '16px', position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search orders, customers, items..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 1rem 0.55rem 2.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--input-border)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Total: <strong>{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'order' : 'orders'} found
              </div>
            </div>

            {loadingOrders ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <ClipboardList size={36} style={{ marginBottom: '1rem', color: 'var(--input-border)' }} />
                <h3>No Orders Found</h3>
                <p>{orderSearchQuery ? 'No orders match your search criteria.' : "Customers haven't submitted any bookings yet."}</p>
              </div>
            ) : (
              <div>
                <div className="orders-table-container">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID & Date</th>
                        <th>Customer Details</th>
                        <th>Items Ordered</th>
                        <th>Total Value</th>
                        <th>Tracking Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.map((order) => (
                        <tr key={order._id}>
                          <td style={{ verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                              #{order._id.substring(order._id.length - 8)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          
                          <td style={{ verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600 }}>{order.customerDetails.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              📞 {order.customerDetails.phone}<br />
                              ✉️ {order.customerDetails.email}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '200px' }}>
                              📍 {order.customerDetails.address}
                            </div>
                          </td>
                          
                          <td style={{ verticalAlign: 'top' }}>
                            <ul className="order-items-list" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                              {order.items.map((item, index) => (
                                <li key={index} style={{ marginBottom: '0.35rem' }}>
                                  <strong>{item.jerseyName}</strong>
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    {' '}(Size: {item.size}) x {item.quantity} - ₹{item.price.toFixed(2)}/ea
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          
                          <td style={{ verticalAlign: 'top', fontWeight: 800, color: 'var(--accent)' }}>
                            ₹{order.totalAmount.toFixed(2)}
                          </td>
                          
                          <td style={{ verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span className={`status-badge ${order.status}`} style={{ alignSelf: 'flex-start' }}>
                                {order.status}
                              </span>
                              
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                style={{ 
                                  padding: '0.35rem 0.5rem', 
                                  borderRadius: '8px', 
                                  border: '1px solid var(--input-border)',
                                  fontSize: '0.85rem',
                                  backgroundColor: 'var(--input-bg)',
                                  color: 'var(--text-primary)',
                                  outline: 'none'
                                }}
                              >
                                <option value="Pending">Set Pending</option>
                                <option value="Processing">Set Processing</option>
                                <option value="Shipped">Set Shipped</option>
                                <option value="Delivered">Set Delivered</option>
                                <option value="Cancelled">Set Cancelled</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalOrdersPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--card-border)' }}>
                    <button
                      onClick={() => setOrdersCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={ordersCurrentPage === 1}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: totalOrdersPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setOrdersCurrentPage(pageNum)}
                        className={`btn ${ordersCurrentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          minWidth: '32px'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setOrdersCurrentPage((p) => Math.min(p + 1, totalOrdersPages))}
                      disabled={ordersCurrentPage === totalOrdersPages}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* --- ADD/EDIT MODAL OVERLAY --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingJersey ? 'Edit Jersey Details' : 'Add New Jersey'}</h3>
              <button onClick={() => setShowModal(false)} className="close-modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveJersey} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="modal-name">Jersey Name</label>
                  <input
                    type="text"
                    id="modal-name"
                    required
                    placeholder="e.g. AC Milan 2006 Retro Home"
                    value={jerseyForm.name}
                    onChange={(e) => setJerseyForm({ ...jerseyForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-description">Description</label>
                  <textarea
                    id="modal-description"
                    rows="3"
                    placeholder="e.g. Classic red and black stripes. Embroidered logo..."
                    value={jerseyForm.description}
                    onChange={(e) => setJerseyForm({ ...jerseyForm, description: e.target.value })}
                    style={{ resize: 'vertical', fontFamily: 'var(--font-family)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="modal-price">Price (₹)</label>
                    <input
                      type="number"
                      id="modal-price"
                      required
                      min="0"
                      step="0.01"
                      placeholder="e.g. 89.99"
                      value={jerseyForm.price}
                      onChange={(e) => setJerseyForm({ ...jerseyForm, price: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-category">Category</label>
                    <input
                      type="text"
                      id="modal-category"
                      required
                      placeholder="e.g. Club, National, Retro"
                      value={jerseyForm.category}
                      onChange={(e) => setJerseyForm({ ...jerseyForm, category: e.target.value })}
                    />
                  </div>
                </div>

                {/* Available Sizes selection */}
                <div className="form-group">
                  <label>Available Sizes</label>
                  <div className="sizes-checkbox-group">
                    {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                      <label key={size} className="size-checkbox-label">
                        <input
                          type="checkbox"
                          checked={jerseyForm.sizes.includes(size)}
                          onChange={() => handleSizeCheckboxChange(size)}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Image Selection Choice */}
                <div className="form-group">
                  <label>Image Source</label>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <label className="size-checkbox-label" style={{ fontWeight: imageType === 'upload' ? 700 : 500 }}>
                      <input
                        type="radio"
                        name="imageSource"
                        checked={imageType === 'upload'}
                        onChange={() => setImageType('upload')}
                      />
                      Upload Image (Cloudinary)
                    </label>
                    <label className="size-checkbox-label" style={{ fontWeight: imageType === 'url' ? 700 : 500 }}>
                      <input
                        type="radio"
                        name="imageSource"
                        checked={imageType === 'url'}
                        onChange={() => setImageType('url')}
                      />
                      Direct Image URL
                    </label>
                  </div>

                  {imageType === 'upload' ? (
                    <div 
                      style={{ 
                        border: '2px dashed var(--input-border)', 
                        padding: '1rem', 
                        borderRadius: '10px', 
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-secondary)',
                        position: 'relative',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      <Upload size={24} style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {selectedFile ? selectedFile.name : 'Select image file to upload'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Supports JPEG, PNG, WEBP (Max 5MB)
                      </div>
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="https://example.com/jersey-image.jpg"
                      value={jerseyForm.imageUrl}
                      onChange={(e) => setJerseyForm({ ...jerseyForm, imageUrl: e.target.value })}
                    />
                  )}
                  {editingJersey && !selectedFile && imageType === 'upload' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Current Image: <a href={jerseyForm.imageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>View Image</a>
                    </div>
                  )}

                  {/* Additional Images Section */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                      Additional Detail Images (Optional)
                    </label>
                    
                    {imageType === 'upload' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div 
                          style={{ 
                            border: '1px dashed var(--input-border)', 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            textAlign: 'center',
                            backgroundColor: 'var(--bg-secondary)',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                            style={{ 
                              position: 'absolute', 
                              top: 0, 
                              left: 0, 
                              width: '100%', 
                              height: '100%', 
                              opacity: 0,
                              cursor: 'pointer'
                            }}
                          />
                          <Upload size={18} style={{ color: 'var(--text-secondary)', marginBottom: '0.15rem' }} />
                          <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                            {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Upload up to 5 additional files'}
                          </div>
                        </div>
                        
                        {editingJersey && editingJersey.images && editingJersey.images.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Has {editingJersey.images.length} existing additional image(s). Uploading new files will add to them.
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Comma-separated image URLs (e.g. url1, url2...)"
                        value={jerseyForm.imageUrls}
                        onChange={(e) => setJerseyForm({ ...jerseyForm, imageUrls: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Separate multiple image URLs with commas.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="modal-stock">Inventory Status</label>
                  <select
                    id="modal-stock"
                    value={jerseyForm.inStock}
                    onChange={(e) => setJerseyForm({ ...jerseyForm, inStock: e.target.value === 'true' })}
                  >
                    <option value="true">In Stock & Active</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    'Save Jersey'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
