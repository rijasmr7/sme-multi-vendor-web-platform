import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, UploadCloud, FileUp, Image as ImageIcon, Link2, Box, Loader2, X } from 'lucide-react';

const API_GATEWAY = 'http://localhost:5000';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export default function EditProduct() {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();

  // Loading states
  const [shop, setShop] = useState(null);
  const [dbProduct, setDbProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form Fields
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState(''); // Need this to find the match in shop config
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');

  // Image states: supports file or url
  const [imageType, setImageType] = useState('file'); // 'file' or 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileBase64, setImageFileBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // AR file state
  const [arFile, setArFile] = useState(null);
  const [hasExistingAR, setHasExistingAR] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      const token = localStorage.getItem('vendorToken');
      if (!token) {
        navigate('/auth');
        return;
      }
      const vendorId = parseJwt(token)?.id;
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // 1. Fetch Shop
        const shopRes = await axios.get(`${API_GATEWAY}/shops/${vendorId}`, { headers });
        let matchedShop = null;
        if (shopRes.data.success) {
          matchedShop = shopRes.data.data.find(s => s.id.toString() === shopId);
          if (matchedShop) setShop(matchedShop);
        }

        // 2. Fetch Product from Vendor List
        const productRes = await axios.get(`${API_GATEWAY}/products/vendor/${vendorId}`, { headers });
        if (productRes.data.success) {
          const match = productRes.data.data.find(p => p.id.toString() === productId);
          if (match) {
            setDbProduct(match);
            setName(match.name);
            setOriginalName(match.name);
            setPrice(match.price);
            setDescription(match.description || '');

            // Handle category
            const nav = matchedShop?.config?.navigation || [];
            const nonProductLinks = ['home', 'contact', 'offers', 'offres', 'about us'];
            const shopCategories = nav.filter(link => !nonProductLinks.includes(link.toLowerCase()));
            
            if (shopCategories.includes(match.category)) {
              setCategory(match.category);
              setIsCustomCategory(false);
            } else {
              setCustomCategory(match.category);
              setIsCustomCategory(true);
            }

            // Handle image representation
            const img = match.extra_data?.image || '';
            if (img) {
              setImagePreview(img);
              if (img.startsWith('http') || img.startsWith('https')) {
                setImageType('url');
                setImageUrl(img);
              } else {
                setImageType('file');
                setImageFileBase64(img);
              }
            }
          } else {
            setError('Product not found in your catalog');
          }
        }

        // 3. Check WebAR Model status
        try {
          const arRes = await axios.get(`http://localhost:5006/models/product/${productId}`);
          if (arRes.data.success && arRes.data.data) {
            setHasExistingAR(true);
          }
        } catch (arErr) {
          // No AR model exists
        }

      } catch (err) {
        console.error(err);
        setError('Failed to fetch product or shop details');
      } finally {
        setIsLoading(false);
      }
    };

    loadDetails();
  }, [shopId, productId]);

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size exceeds 2MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFileBase64(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
    setImagePreview(e.target.value);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const token = localStorage.getItem('vendorToken');
    const headers = { Authorization: `Bearer ${token}` };
    const vendorId = parseJwt(token)?.id;

    const finalCategory = isCustomCategory ? customCategory : category;
    if (!finalCategory) {
      setError('Please specify a category');
      setIsSaving(false);
      return;
    }

    const finalImage = imageType === 'file' ? imageFileBase64 : imageUrl;

    try {
      // 1. Update the database product details
      const productPayload = {
        name,
        price: parseFloat(price),
        category: finalCategory,
        description,
        extraData: {
          image: finalImage
        }
      };

      const productRes = await axios.put(`${API_GATEWAY}/products/${productId}`, productPayload, { headers });
      if (!productRes.data.success) {
        throw new Error('Failed to update product details');
      }

      // 2. Upload new AR Model if selected
      if (arFile) {
        const formData = new FormData();
        formData.append('file', arFile);
        formData.append('vendor_id', vendorId);
        formData.append('shop_id', shopId);
        formData.append('product_id', productId);

        try {
          await axios.post(`http://localhost:5006/models/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (webarErr) {
          console.error("AR Model upload failed:", webarErr);
          alert('Product updated, but AR model upload failed: ' + (webarErr.response?.data?.message || webarErr.message));
        }
      }

      // 3. Update the shop's config products list
      const updatedProductConfig = {
        name,
        price: parseFloat(price),
        description,
        category: finalCategory,
        image: finalImage
      };

      const currentProducts = shop.config?.products || [];
      
      // Update by matching the originalName or name (case-insensitive)
      const updatedProducts = currentProducts.map(p => {
        if (p.name.toLowerCase() === originalName.toLowerCase() || p.name.toLowerCase() === name.toLowerCase()) {
          return updatedProductConfig;
        }
        return p;
      });

      // If for some reason it wasn't in config products, append it
      const existsInConfig = currentProducts.some(p => p.name.toLowerCase() === originalName.toLowerCase() || p.name.toLowerCase() === name.toLowerCase());
      if (!existsInConfig) {
        updatedProducts.push(updatedProductConfig);
      }

      const newConfig = {
        ...shop.config,
        products: updatedProducts
      };

      const configRes = await axios.put(`${API_GATEWAY}/shops/${shopId}/config`, { config: newConfig }, { headers });
      if (configRes.data.success) {
        navigate(`/${shopId}/dashboard`);
      } else {
        throw new Error('Failed to update shop configuration');
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 size={40} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const primaryColor = shop?.config?.theme?.primary || '#6366f1';
  const nav = shop?.config?.navigation || [];
  const nonProductLinks = ['home', 'contact', 'offers', 'offres', 'about us'];
  const shopCategories = nav.filter(link => !nonProductLinks.includes(link.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: isMobile ? '1.5rem 0.75rem' : '2rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(`/${shopId}/dashboard`)}
          style={{ 
            background: 'white', 
            border: '1px solid #cbd5e1', 
            color: primaryColor,
            padding: '8px 16px', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontWeight: '700',
            marginBottom: '2rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Form Card */}
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', 
          border: '1px solid #e2e8f0', 
          overflow: 'hidden' 
        }}>
          {/* Header */}
          <div style={{ 
            padding: isMobile ? '1.25rem 1.5rem' : '1.5rem 2rem', 
            borderBottom: '1px solid #e2e8f0', 
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: `${primaryColor}15`, 
              color: primaryColor, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Box size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Edit Product</h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Update product details and upload 3D visual assets</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} style={{ padding: isMobile ? '1.25rem' : '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600' }}>
                {error}
              </div>
            )}

            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Product Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Organic Apple"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#1e293b', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Price & Category Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
              {/* Price */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Price (LKR)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  placeholder="e.g. 250"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#1e293b', backgroundColor: '#ffffff' }}
                />
              </div>

              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Category</label>
                {!isCustomCategory ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#1e293b', backgroundColor: '#ffffff' }}
                    >
                      {shopCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={() => setIsCustomCategory(true)}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}
                    >
                      Custom
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value)}
                      required
                      placeholder="e.g. Apparel"
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#1e293b', backgroundColor: '#ffffff' }}
                    />
                    {shopCategories.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setIsCustomCategory(false)}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}
                      >
                        List
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Product characteristics, benefits..."
                rows={3}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', resize: 'none', fontFamily: 'inherit', color: '#1e293b', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Product Image Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Product Image</label>
                <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '2px', borderRadius: '8px' }}>
                  <button 
                    type="button"
                    onClick={() => setImageType('file')}
                    style={{ background: imageType === 'file' ? 'white' : 'transparent', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <FileUp size={12} /> File
                  </button>
                  <button 
                    type="button"
                    onClick={() => setImageType('url')}
                    style={{ background: imageType === 'url' ? 'white' : 'transparent', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Link2 size={12} /> URL
                  </button>
                </div>
              </div>

              {imageType === 'file' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label 
                    htmlFor="product-image-upload"
                    style={{
                      height: '100px', border: '2px dashed #cbd5e1', borderRadius: '12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', background: 'white', gap: '4px'
                    }}
                  >
                    <UploadCloud size={20} style={{ color: '#64748b' }} />
                    <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>Choose local image file</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>JPEG, PNG (Max 2MB)</span>
                  </label>
                  <input 
                    type="file" 
                    id="product-image-upload" 
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#1e293b', backgroundColor: '#ffffff' }}
                />
              )}

              {imagePreview && (
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', marginTop: '4px' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <button 
                    type="button"
                    onClick={() => { setImagePreview(''); setImageFileBase64(''); setImageUrl(''); }}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Optional 3D Model WebAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f0fdf4', padding: '1rem', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box size={16} /> 3D WebAR Model {hasExistingAR ? '(Replace Existing)' : '(Optional)'}
              </label>
              <label 
                htmlFor="webar-model-upload"
                style={{
                  height: '80px', border: '2px dashed #86efac', borderRadius: '12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', background: 'white', gap: '4px'
                }}
              >
                <FileUp size={18} style={{ color: '#16a34a' }} />
                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600' }}>
                  {arFile ? arFile.name : hasExistingAR ? 'Keep current model (or click to upload new)' : 'Select 3D Model File'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#15803d' }}>Supports .glb, .obj, .stl</span>
              </label>
              <input 
                type="file" 
                id="webar-model-upload"
                accept=".glb,.obj,.stl"
                onChange={e => setArFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              {arFile && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#dcfce7', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <span style={{ color: '#14532d', overflow: 'hidden', textOverflow: 'ellipsis' }}>{arFile.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setArFile(null)} 
                    style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Save Buttons */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <button 
                type="button"
                onClick={() => navigate(`/${shopId}/dashboard`)}
                disabled={isSaving}
                style={{ flex: isMobile ? 'none' : 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                style={{ 
                  flex: isMobile ? 'none' : 2, 
                  padding: '12px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: primaryColor, 
                  color: 'white', 
                  fontWeight: '700', 
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 12px ${primaryColor}33`,
                  width: '100%'
                }}
              >
                {isSaving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                {isSaving ? 'Saving Updates...' : 'Save Product Updates'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
