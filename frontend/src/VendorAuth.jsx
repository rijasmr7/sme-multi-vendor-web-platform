import { useState } from 'react';
import axios from 'axios';
import { LogIn, UserPlus } from 'lucide-react';
import './VendorAuth.css';

// Point at the API Gateway
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function VendorAuth({ onLogin, defaultMode = 'login' }) {
  // ─── State ──────────────────────────────────────────────
  const [mode, setMode]         = useState(defaultMode);   // 'login' | 'register'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState(null);      // { text, type }

  // ─── Helpers ────────────────────────────────────────────
  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setMessage(null);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  // ─── Submit Handler ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // At least one identifier (email or phone) is required
    if (!email.trim() && !phone.trim()) {
      setMessage({ text: 'Please provide at least an email or phone number.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'register') {
        // ── Register ──────────────────────────────────────
        const { data } = await axios.post(`${API}/register`, {
          name,
          email:    email.trim() || undefined,
          phone:    phone.trim() || undefined,
          password,
        });

        console.log('[VendorAuth] Register success:', data);
        setMessage({ text: '🎉 Account created! You can now log in.', type: 'success' });

        // Auto-switch to login after a short delay
        setTimeout(() => switchMode('login'), 1500);

      } else {
        // ── Login ─────────────────────────────────────────
        const { data } = await axios.post(`${API}/login`, {
          email:  email.trim() || undefined,
          phone:  phone.trim() || undefined,
          password,
        });

        console.log('[VendorAuth] Login success:', data);

        // Extract token from response (backend returns { success: true, data: { token: '...' } })
        const token = data.data?.token || data.token;

        if (!token) throw new Error('No token received from server');

        // Persist token instead of full user object
        localStorage.setItem('vendorToken', token);

        setMessage({ text: `✅ Welcome back!`, type: 'success' });

        // Notify parent component
        if (onLogin) onLogin(token);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Something went wrong. Please try again.';
      console.error('[VendorAuth] Error:', errorMsg);
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            {mode === 'login' ? <LogIn size={26} color="#fff" /> : <UserPlus size={26} color="#fff" />}
          </div>
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{mode === 'login' ? 'Sign in to your vendor dashboard' : 'Register as a new vendor'}</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            id="auth-tab-login"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            id="auth-tab-register"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-name">Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-hint">
            Enter email, phone, or both
          </div>

          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="vendor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-phone">Phone</label>
            <input
              id="auth-phone"
              type="tel"
              placeholder="+94 77 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} /> Sign In
              </>
            ) : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Feedback message */}
        {message && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Footer toggle */}
        <div className="auth-footer">
          {mode === 'login' ? (
            <>Don't have an account?{' '}<span onClick={() => switchMode('register')}>Register</span></>
          ) : (
            <>Already have an account?{' '}<span onClick={() => switchMode('login')}>Sign In</span></>
          )}
        </div>
      </div>
    </div>
  );
}
