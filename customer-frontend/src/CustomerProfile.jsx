import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Trash2, 
  Save, 
  AlertTriangle, 
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

function CustomerProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
    navigate('/');
    window.location.reload();
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('customer');
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/profile`, getHeaders());
        if (res.data.success && res.data.data) {
          const u = res.data.data;
          setProfile(u);
          setName(u.name || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setCity(u.city || '');
        } else {
          setErrorMessage('Failed to load profile.');
        }
      } catch (err) {
        console.error('Fetch Customer Profile Error:', err);
        setErrorMessage(err.response?.data?.message || 'Error loading profile details. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!name.trim()) {
      setErrorMessage('Name is required.');
      return;
    }

    if (!city.trim()) {
      setErrorMessage('City is required.');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setErrorMessage('At least email or phone must be provided.');
      return;
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

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
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        city: city.trim(),
        ...(password ? { password } : {})
      };

      const res = await axios.put(`${API_BASE}/profile`, payload, getHeaders());
      if (res.data.success) {
        setSuccessMessage('Profile updated successfully!');
        const updatedUser = res.data.data;
        setProfile(updatedUser);
        localStorage.setItem('customer', JSON.stringify(updatedUser));
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(res.data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Update Customer Profile Error:', err);
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
      const res = await axios.delete(`${API_BASE}/profile`, getHeaders());
      if (res.data.success) {
        alert('Your account was deleted successfully.');
        localStorage.removeItem('token');
        localStorage.removeItem('customer');
        navigate('/');
        window.location.reload();
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

  const token = localStorage.getItem('token');
  const storedCustomer = localStorage.getItem('customer');

  if (!token || !storedCustomer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbeb' }}>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', margin: '1.5rem', background: 'white', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '24px' }}>
          <User size={48} style={{ color: '#f97316', marginBottom: '1rem' }} />
          <h2 style={{ color: '#451a03', marginBottom: '0.5rem', fontWeight: '850' }}>Sign in to view your profile</h2>
          <p style={{ color: '#92400e', opacity: 0.8, marginBottom: '1.5rem', fontWeight: '600' }}>You need to be logged in as a customer to access your profile settings.</p>
          <Link to="/auth" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #f97316, #eab308)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', display: 'inline-block', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '15px', background: '#fffbeb' }}>
        <Loader2 size={40} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#92400e', fontWeight: '700' }}>Retrieving your profile...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fffbeb' }}>
      {/* NAVIGATION */}
      <nav className="glass-nav" style={{
        padding: isMobile ? '1rem 1.25rem' : '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        boxSizing: 'border-box',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1.5rem', minWidth: 0 }}>
          <Link to="/" style={{ color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
            <ChevronLeft size={20} /> {!isMobile && "Marketplace"}
          </Link>
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', flexShrink: 0 }}></div>
          <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: '800', color: '#451a03', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <User size={isMobile ? 18 : 22} style={{ flexShrink: 0 }} /> My Profile
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', opacity: 0.7, fontWeight: '600' }}>Logged in as</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#451a03', fontWeight: '800' }}>{profile?.name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: `1px solid #f97316`, color: '#f97316', padding: '4px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* CONTENT AREA */}
      <div style={{ maxWidth: '750px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '3.5rem 1.5rem' }}>
        
        {/* Banner Notifications */}
        {successMessage && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#15803d', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontWeight: '700' }}>
            <CheckCircle size={18} /> {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontWeight: '700' }}>
            <AlertTriangle size={18} /> {errorMessage}
          </div>
        )}

        <div className="glass-card animate-fade-in" style={{ background: 'white', borderRadius: '24px', border: '1px solid rgba(251, 191, 36, 0.25)', boxShadow: '0 10px 30px -10px rgba(249, 115, 22, 0.08)', overflow: 'hidden' }}>
          
          {/* Header Banner */}
          <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,179,8,0.08))', padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem', borderBottom: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #f97316, #eab308)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px -4px rgba(249,115,22,0.3)', flexShrink: 0 }}>
              <User size={36} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '900', color: '#451a03', letterSpacing: '-0.02em' }}>Profile Settings</h1>
              <p style={{ margin: '4px 0 0 0', color: '#92400e', fontWeight: '600', fontSize: '0.9rem' }}>Manage your personal marketplace account info</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} style={{ padding: isMobile ? '1.5rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '850', color: '#451a03', borderBottom: '1px solid #fef3c7', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} /> Account details
            </h3>

            {/* Form grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
              
              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: '1px solid #fcd34d', background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', fontSize: '0.95rem' }} 
                    placeholder="John Doe" 
                  />
                </div>
              </div>

              {/* City */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>City</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: '1px solid #fcd34d', background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', fontSize: '0.95rem' }} 
                    placeholder="e.g. Colombo" 
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: '1px solid #fcd34d', background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', fontSize: '0.95rem' }} 
                    placeholder="john@example.com" 
                  />
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: '1px solid #fcd34d', background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', fontSize: '0.95rem' }} 
                    placeholder="e.g. 0771234567" 
                  />
                </div>
              </div>

            </div>

            <h3 style={{ margin: '1.5rem 0 0 0', fontSize: '1.1rem', fontWeight: '850', color: '#451a03', borderBottom: '1px solid #fef3c7', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} /> Security
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem' }}>
              
              {/* New Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>New Password <span style={{ fontWeight: '400', fontStyle: 'italic' }}>(optional)</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    style={{ width: '100%', padding: '12px 38px 12px 38px', borderRadius: '12px', border: '1px solid #fcd34d', background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', fontSize: '0.95rem' }} 
                    placeholder="Min. 6 characters" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#d97706' }} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    style={{ width: '100%', padding: '12px 12px 12px 38px', borderRadius: '12px', border: '1px solid #fcd34d', background: '#fffbeb', outline: 'none', fontWeight: '600', color: '#451a03', fontSize: '0.95rem' }} 
                    placeholder="Re-type new password" 
                  />
                </div>
              </div>

            </div>

            {/* Save Button */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={isSaving} 
                style={{ 
                  background: 'linear-gradient(135deg, #f97316, #eab308)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '14px 28px', 
                  borderRadius: '12px', 
                  fontWeight: '800', 
                  cursor: isSaving ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  boxShadow: '0 8px 20px -4px rgba(249,115,22,0.3)', 
                  transition: 'all 0.25s ease',
                  fontSize: '0.95rem'
                }}
                onMouseOver={e => { if(!isSaving) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { if(!isSaving) e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Danger Zone */}
          <div style={{ background: '#fef2f2', borderTop: '1px solid #fee2e2', padding: isMobile ? '1.5rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#991b1b' }}>Danger Zone</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#b91c1c', fontWeight: '600', lineHeight: '1.5' }}>
                  Once you delete your customer account, all your carts and order logs will be detached. This action is irreversible.
                </p>
              </div>
            </div>
            
            <div>
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(true)} 
                style={{ 
                  background: 'none', 
                  border: '1.5px solid #ef4444', 
                  color: '#ef4444', 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  fontWeight: '800', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  transition: 'all 0.2s',
                  fontSize: '0.85rem'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#ef4444'; }}
              >
                <Trash2 size={16} />
                Delete Customer Account
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{
            background: 'white', width: '100%', maxWidth: '450px',
            borderRadius: '24px', padding: '2.25rem', border: '1px solid #fca5a5',
            boxShadow: '0 20px 50px rgba(239,68,68,0.15)'
          }}>
            <h3 style={{ color: '#b91c1c', margin: '0 0 1rem 0', fontSize: '1.4rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={24} /> Confirm Account Deletion
            </h3>
            
            <p style={{ color: '#451a03', fontWeight: '600', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 2rem 0' }}>
              Are you absolutely sure you want to permanently delete your account? This will erase your personal details and order history from the platform. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                disabled={isDeleting}
                style={{ 
                  padding: '12px 20px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer',
                  background: 'none', border: '1px solid #fcd34d', color: '#92400e', transition: 'all 0.2s', fontSize: '0.85rem'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#fef3c7'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                style={{ 
                  padding: '12px 20px', borderRadius: '10px', fontWeight: '800', cursor: isDeleting ? 'not-allowed' : 'pointer',
                  background: '#ef4444', border: 'none', color: 'white', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                onMouseOut={e => e.currentTarget.style.opacity = 1}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProfile;
