import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Plus, Trash2, Edit2, Eye, UploadCloud, Box, CheckCircle, Info, Loader2, X } from 'lucide-react';

const API_GATEWAY = 'http://localhost:5000';

export default function ShopProductsList({ shop, products, onShopUpdated, onProductsUpdated }) {
  const navigate = useNavigate();
  const primaryColor = shop.config?.theme?.primary || '#6366f1';
  const secondaryColor = shop.config?.theme?.secondary || '#8b5cf6';
  
  const [arStatuses, setArStatuses] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isUploadingMap, setIsUploadingMap] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  // Filter vendor's database products that belong to this shop by matching names
  const dbProducts = products || [];
  
  // Combine shop.config.products with database products to display comprehensive details
  const shopProducts = (shop.config?.products || []).map(configProd => {
    const dbMatch = dbProducts.find(p => p.name.toLowerCase() === configProd.name.toLowerCase());
    
    // Support image from either the db product's extra_data or the config product
    let img = configProd.image || '';
    if (dbMatch && dbMatch.extra_data && dbMatch.extra_data.image) {
      img = dbMatch.extra_data.image;
    }

    return {
      ...configProd,
      dbId: dbMatch ? dbMatch.id : null,
      price: dbMatch ? dbMatch.price : configProd.price,
      description: dbMatch && dbMatch.description ? dbMatch.description : configProd.description,
      category: dbMatch ? dbMatch.category : configProd.category,
      image: img,
      isActive: !!dbMatch
    };
  });

  // Fetch AR model status for each active product
  useEffect(() => {
    const checkARModels = async () => {
      const statuses = {};
      await Promise.all(
        shopProducts.map(async (prod) => {
          if (prod.dbId) {
            try {
              const res = await axios.get(`http://localhost:5006/models/product/${prod.dbId}`);
              if (res.data.success && res.data.data) {
                statuses[prod.dbId] = res.data.data;
              }
            } catch (err) {
              // No model or service unreachable
            }
          }
        })
      );
      setArStatuses(statuses);
    };

    if (dbProducts.length > 0) {
      checkARModels();
    }
  }, [products, shop.config?.products]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('vendorToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleUploadAR = async (e, dbId, name) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingMap(prev => ({ ...prev, [name]: true }));
    const token = localStorage.getItem('vendorToken');
    const vendorId = JSON.parse(atob(token.split('.')[1])).id;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('vendor_id', vendorId);
    formData.append('shop_id', shop.id);
    formData.append('product_id', dbId);

    try {
      const res = await axios.post(`http://localhost:5006/models/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        alert('🎉 3D model optimized and ready! Customers can view it in 3D and AR.');
        // Update local AR status
        setArStatuses(prev => ({ ...prev, [dbId]: res.data.data }));
      }
    } catch (err) {
      alert('Failed to upload AR model: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploadingMap(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleDelete = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.name}"?`)) return;

    setDeletingId(prod.name);
    try {
      // 1. Delete from database if active
      if (prod.dbId) {
        await axios.delete(`${API_GATEWAY}/products/${prod.dbId}`, getAuthHeaders());
      }

      // 2. Remove from shop's config.products
      const updatedProducts = (shop.config?.products || []).filter(
        p => p.name.toLowerCase() !== prod.name.toLowerCase()
      );
      const newConfig = {
        ...shop.config,
        products: updatedProducts
      };

      const shopRes = await axios.put(
        `${API_GATEWAY}/shops/${shop.id}/config`,
        { config: newConfig },
        getAuthHeaders()
      );

      if (shopRes.data.success) {
        onShopUpdated(shopRes.data.data);
      }

      // 3. Fetch latest database products list
      const token = localStorage.getItem('vendorToken');
      const vendorId = JSON.parse(atob(token.split('.')[1])).id;
      const productsRes = await axios.get(`${API_GATEWAY}/products/vendor/${vendorId}`, getAuthHeaders());
      if (productsRes.data.success) {
        onProductsUpdated(productsRes.data.data);
      }

    } catch (err) {
      console.error(err);
      alert('Failed to delete product completely. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (prod) => {
    if (prod.dbId) {
      navigate(`/${shop.id}/products/edit/${prod.dbId}`);
    } else {
      // Placeholder: redirect to add with prefilled state
      navigate(`/${shop.id}/products/add`, {
        state: {
          prefilledName: prod.name,
          prefilledDescription: prod.description
        }
      });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header Panel */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>Inventory Catalog</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Manage products, upload 3D models, and monitor AR assets.</p>
        </div>
        <button 
          onClick={() => navigate(`/${shop.id}/products/add`)}
          style={{ 
            background: primaryColor, 
            color: 'white', 
            border: 'none', 
            padding: '12px 24px', 
            borderRadius: '12px', 
            fontWeight: '700', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            boxShadow: `0 4px 10px ${primaryColor}44`,
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* Grid List */}
      {shopProducts.length === 0 ? (
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          border: '1px dashed #cbd5e1', 
          padding: '4rem 2rem', 
          textAlign: 'center',
          color: '#64748b'
        }}>
          <Package size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>No Products Yet</h3>
          <p style={{ marginBottom: '1.5rem' }}>Add items to showcase them in your storefront.</p>
          <button 
            onClick={() => navigate(`/${shop.id}/products/add`)}
            style={{ background: primaryColor, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
          >
            Create Product
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {shopProducts.map((prod) => {
            const hasAR = arStatuses[prod.dbId];
            return (
              <div 
                key={prod.name}
                style={{ 
                  background: 'white', 
                  borderRadius: '20px', 
                  border: '1px solid #e2e8f0', 
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Image / Package representation */}
                <div style={{ 
                  height: '160px', 
                  background: prod.image ? 'none' : `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`, 
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: primaryColor,
                  overflow: 'hidden',
                  border: '1px solid #f1f5f9'
                }}>
                  {prod.image ? (
                    <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={40} style={{ opacity: 0.5 }} />
                  )}
                </div>

                {/* Details */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '700', 
                      color: primaryColor, 
                      background: `${primaryColor}12`, 
                      padding: '2px 8px', 
                      borderRadius: '50px',
                      textTransform: 'uppercase'
                    }}>
                      {prod.category || 'Uncategorized'}
                    </span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '700', 
                      color: prod.isActive ? '#10b981' : '#f59e0b',
                      background: prod.isActive ? '#dcfce7' : '#fef3c7',
                      padding: '2px 8px', 
                      borderRadius: '50px'
                    }}>
                      {prod.isActive ? 'Active' : 'Placeholder'}
                    </span>
                  </div>

                  <h3 style={{ margin: '8px 0 4px 0', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
                    {prod.name}
                  </h3>
                  
                  <span style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a' }}>
                    {prod.price ? `LKR ${parseFloat(prod.price).toLocaleString()}` : '—'}
                  </span>

                  <p style={{ 
                    margin: '8px 0 0 0', 
                    fontSize: '0.8rem', 
                    color: '#64748b', 
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {prod.description || 'No description provided.'}
                  </p>
                </div>

                {/* AR Ready Status */}
                {prod.isActive && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '0.75rem', 
                    color: hasAR ? '#10b981' : '#64748b',
                    background: hasAR ? '#dcfce7' : '#f1f5f9',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: '700'
                  }}>
                    <Box size={14} />
                    {hasAR ? '3D & AR Visualization Ready' : 'No 3D Model Uploaded'}
                  </div>
                )}

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: 'auto', 
                  borderTop: '1px solid #f1f5f9', 
                  paddingTop: '1rem' 
                }}>
                  {/* View Details */}
                  <button 
                    onClick={() => setSelectedProduct(prod)}
                    style={{ 
                      flex: 1, 
                      background: '#f8fafc', 
                      border: '1px solid #cbd5e1', 
                      padding: '8px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569'
                    }}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>

                  {/* Edit */}
                  <button 
                    onClick={() => handleEditClick(prod)}
                    style={{ 
                      flex: 1, 
                      background: '#f8fafc', 
                      border: '1px solid #cbd5e1', 
                      padding: '8px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569'
                    }}
                    title={prod.isActive ? 'Edit Product' : 'Activate Product'}
                  >
                    <Edit2 size={16} />
                  </button>

                  {/* AR Upload (If active) */}
                  {prod.isActive ? (
                    <label 
                      style={{ 
                        flex: 1, 
                        background: isUploadingMap[prod.name] ? '#f1f5f9' : '#ecfdf5', 
                        border: '1px solid #a7f3d0', 
                        padding: '8px', 
                        borderRadius: '8px', 
                        cursor: isUploadingMap[prod.name] ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#059669'
                      }}
                      title="Upload 3D/AR Model"
                    >
                      {isUploadingMap[prod.name] ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UploadCloud size={16} />
                      )}
                      <input 
                        type="file" 
                        accept=".glb,.obj,.stl" 
                        style={{ display: 'none' }} 
                        disabled={isUploadingMap[prod.name]}
                        onChange={(e) => handleUploadAR(e, prod.dbId, prod.name)} 
                      />
                    </label>
                  ) : (
                    <button 
                      disabled
                      style={{ 
                        flex: 1, 
                        background: '#f1f5f9', 
                        border: '1px solid #e2e8f0', 
                        padding: '8px', 
                        borderRadius: '8px', 
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8'
                      }}
                      title="Save product to database to enable WebAR"
                    >
                      <UploadCloud size={16} />
                    </button>
                  )}

                  {/* Delete */}
                  <button 
                    onClick={() => handleDelete(prod)}
                    disabled={deletingId === prod.name}
                    style={{ 
                      flex: 1, 
                      background: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      padding: '8px', 
                      borderRadius: '8px', 
                      cursor: deletingId === prod.name ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626'
                    }}
                    title="Delete Product"
                  >
                    {deletingId === prod.name ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '1.25rem 1.5rem', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Product Details</h2>
              <button 
                onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Product Image */}
              <div style={{ 
                height: '220px', 
                background: selectedProduct.image ? 'none' : `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`, 
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryColor,
                overflow: 'hidden',
                border: '1px solid #e2e8f0'
              }}>
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Package size={64} style={{ opacity: 0.5 }} />
                )}
              </div>

              {/* Title, Category & Status */}
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: primaryColor, background: `${primaryColor}12`, padding: '2px 8px', borderRadius: '50px' }}>
                    {selectedProduct.category || 'Uncategorized'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: selectedProduct.isActive ? '#10b981' : '#f59e0b', background: selectedProduct.isActive ? '#dcfce7' : '#fef3c7', padding: '2px 8px', borderRadius: '50px' }}>
                    {selectedProduct.isActive ? 'Active Database Sync' : 'Placeholder Item'}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#1e293b' }}>
                  {selectedProduct.name}
                </h3>
              </div>

              {/* Description */}
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', fontWeight: '800', color: '#475569' }}>Description</h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>
                  {selectedProduct.description || 'No description provided.'}
                </p>
              </div>

              {/* Pricing */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ fontWeight: '700', color: '#475569' }}>Marketplace Price</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a' }}>
                  {selectedProduct.price ? `LKR ${parseFloat(selectedProduct.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Not Set'}
                </span>
              </div>

              {/* WebAR Details */}
              {selectedProduct.isActive && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box size={16} /> 3D WebAR Details
                  </h4>
                  {arStatuses[selectedProduct.dbId] ? (
                    <div style={{ fontSize: '0.85rem', color: '#14532d', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p><strong>File Name:</strong> {arStatuses[selectedProduct.dbId].model_name}</p>
                      <p><strong>3D Views:</strong> {arStatuses[selectedProduct.dbId].views_3d}</p>
                      <p><strong>AR Placement Views:</strong> {arStatuses[selectedProduct.dbId].views_ar}</p>
                      <p><strong>Optimize Compression Ratio:</strong> {arStatuses[selectedProduct.dbId].compression_ratio ? `${(arStatuses[selectedProduct.dbId].compression_ratio * 100).toFixed(1)}%` : 'N/A'}</p>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>
                      No 3D model uploaded yet. Upload a `.glb` file using the upload icon on the product card to activate immersive 3D/AR shopping for your customers.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedProduct(null)}
                style={{ 
                  background: primaryColor, 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 20px', 
                  borderRadius: '8px', 
                  fontWeight: '700', 
                  cursor: 'pointer' 
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
