import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  Store, 
  MapPin, 
  Lock, 
  Trash2, 
  Save, 
  AlertTriangle, 
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';

const API_GATEWAY = 'http://localhost:5000';

export default function Profile({ primaryColor, handleLogout }) {
  const [profile, setProfile] = useState(null);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const primary = primaryColor || '#6366f1';

  const getHeaders = () => {
    const token = localStorage.getItem('vendorToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchProfileAndShops = async () => {
      try {
        const res = await axios.get(`${API_GATEWAY}/profile`, getHeaders());
        if (res.data.success && res.data.data) {
          const u = res.data.data;
          setProfile(u);
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setCity(u.city || '');

          // Fetch shops associated with the vendor
          try {
            const shopsRes = await axios.get(`${API_GATEWAY}/shops/${u.id}`);
            if (shopsRes.data.success) {
              setShops(shopsRes.data.data || []);
            }
          } catch (shopErr) {
            console.error('Fetch Shops Error:', shopErr);
          }
        } else {
          setErrorMessage('Failed to load profile.');
        }
      } catch (err) {
        console.error('Fetch Profile Error:', err);
        setErrorMessage(err.response?.data?.message || 'Error loading profile details. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndShops();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (password && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        email: email || null,
        phone: phone || null,
        shop_name: profile?.shop_name || 'My Shop', // keep existing shop name in db
        city,
        ...(password ? { password } : {})
      };

      const res = await axios.put(`${API_GATEWAY}/profile`, payload, getHeaders());
      if (res.data.success) {
        setSuccessMessage('Profile updated successfully!');
        setProfile(res.data.data);
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Update Profile Error:', err);
      setErrorMessage(err.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteAccount = async () => {
    setErrorMessage('');
    setIsDeleting(true);
    try {
      const res = await axios.delete(`${API_GATEWAY}/profile`, getHeaders());
      if (res.data.success) {
        alert('Your account was deleted successfully.');
        handleLogout();
      } else {
        setErrorMessage(res.data.message || 'Failed to delete account.');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Delete Account Error:', err);
      setErrorMessage(err.response?.data?.message || 'An error occurred while deleting your account.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <Loader2 size={40} style={{ color: primary, animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748b', fontWeight: '500' }}>Retrieving vendor profile...</span>
      </div>
    );
  }

  const liveShops = shops.filter(s => s.is_published);
  const draftShops = shops.filter(s => !s.is_published);

  return (
    <div style={{ minHeight: '85vh', background: '#f8fafc', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '750px', margin: '0 auto' }}>
        
        {/* Banner Notification */}
        {successMessage && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontWeight: '600' }}>
            <CheckCircle size={18} /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontWeight: '600' }}>
            <AlertTriangle size={18} /> {errorMessage}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          {/* Cover Header */}
          <div style={{ background: `linear-gradient(135deg, ${primary}22, ${primary}55)`, padding: '3rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'white', color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <User size={40} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '900', color: '#0f172a' }}>Vendor Profile</h1>
              <p style={{ margin: '4px 0 0 0', color: '#475569', fontWeight: '500' }}>Logged in as <strong style={{ color: primary }}>{profile?.name}</strong> (ID: #{profile?.id})</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>Personal & Store Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'window.innerWidth < 768 ? "1fr" : "1fr 1fr"', gap: '1.25rem' }} className="profile-grid">
              
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    style={inputStyle(primary)} 
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle(primary)} 
                  />
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    style={inputStyle(primary)} 
                  />
                </div>
              </div>

              {/* City */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Business City / Location</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    style={inputStyle(primary)} 
                  />
                </div>
              </div>

            </div>

            <h3 style={{ margin: '1rem 0 0 0', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>Security Settings</h3>
            
            {/* Password Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'window.innerWidth < 768 ? "1fr" : "1fr 1fr"', gap: '1.25rem' }} className="profile-grid">
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>New Password (Leave blank to keep current)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    style={inputStyle(primary)} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={inputStyle(primary)} 
                  />
                </div>
              </div>

            </div>

            {/* Form Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  background: 'none', border: 'none', color: '#ef4444', 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                  padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                <Trash2 size={16} /> Delete Account
              </button>

              <button 
                type="submit"
                disabled={isSaving}
                style={{
                  background: primary, color: 'white', border: 'none',
                  padding: '10px 24px', borderRadius: '10px', fontWeight: '700',
                  fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '8px', boxShadow: `0 4px 6px -1px ${primary}44`,
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>

        </div>

        {/* Shops Directory Section */}
        <div style={{ marginTop: '2rem', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', padding: '2rem' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} style={{ color: primary }} /> Your Storefronts
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            {/* Live Shops */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Shops ({liveShops.length})
              </h3>
              {liveShops.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  {liveShops.map(shop => (
                    <ShopRow key={shop.id} shop={shop} primary={primary} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.5rem', border: '1px dashed #cbd5e1', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  No published shops found. Go to the Generator to launch one!
                </div>
              )}
            </div>

            {/* Draft Shops */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Draft Shops ({draftShops.length})
              </h3>
              {draftShops.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                  {draftShops.map(shop => (
                    <ShopRow key={shop.id} shop={shop} primary={primary} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.5rem', border: '1px dashed #cbd5e1', borderRadius: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  No draft shops.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 4000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '100%', maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '50%', background: '#ffe4e6', 
                color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 1.25rem' 
              }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Delete Vendor Account?</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5' }}>
                Are you sure you want to delete your account? This action is permanent and will delete all your shop configurations, listings, and order records forever. This cannot be undone.
              </p>
            </div>
            
            <div style={{ 
              padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0',
              display: 'flex', gap: '10px'
            }}>
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#475569', fontWeight: '700', cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                style={{ 
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: '#e11d48', color: 'white', fontWeight: '700', cursor: 'pointer',
                  fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive layout CSS injection */}
      <style>{`
        @media (max-width: 600px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
          .profile-grid > div {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

// Inner helper component for shop list rows
function ShopRow({ shop, primary }) {
  const isApproved = shop.is_approved;
  const isPublished = shop.is_published;
  
  let statusText = 'Draft';
  let statusColor = '#f59e0b';
  let statusBg = '#fef3c7';
  
  if (isPublished) {
    if (isApproved) {
      statusText = 'Live';
      statusColor = '#10b981';
      statusBg = '#dcfce7';
    } else {
      statusText = 'Pending Approval';
      statusColor = '#3b82f6';
      statusBg = '#dbeafe';
    }
  }

  return (
    <div 
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        transition: 'all 0.2s',
        gap: '1rem',
        flexWrap: 'wrap'
      }}
      className="shop-row-hover"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${primary}12`, color: primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Store size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1e293b' }}>{shop.shop_name}</h4>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: '700', 
            color: statusColor, 
            background: statusBg, 
            padding: '2px 8px', 
            borderRadius: '50px',
            marginTop: '4px',
            display: 'inline-block'
          }}>
            {statusText}
          </span>
        </div>
      </div>

      <Link 
        to={`/${shop.id}/dashboard`}
        style={{
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: '700',
          color: primary,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'white',
          border: `1px solid ${primary}44`,
          transition: 'all 0.2s'
        }}
        onMouseOver={e => { e.currentTarget.style.background = primary; e.currentTarget.style.color = 'white'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = primary; }}
      >
        Dashboard <ChevronRight size={16} />
      </Link>
    </div>
  );
}

// Input styles helper
const inputStyle = (primaryColor) => ({
  width: '100%',
  padding: '10px 12px 10px 40px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit'
});
