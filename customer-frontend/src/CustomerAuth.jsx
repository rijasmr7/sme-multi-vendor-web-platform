import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Phone, Lock, Eye, EyeOff, LogIn, UserPlus, ArrowLeft, ShoppingBag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './CustomerAuth.css';

// ---------------------------------------------------------------
// API BASE URL
// ---------------------------------------------------------------
// When running in Docker → calls go through the gateway at port 5000
// When running locally → calls go to localhost:5000
const API_BASE = 'http://localhost:5000';

function CustomerAuth({ onLoginSuccess, onBack }) {
    const navigate = useNavigate();
    // ---------------------------------------------------------------
    // STATE MANAGEMENT
    // ---------------------------------------------------------------
    const [isLogin, setIsLogin] = useState(true);         // Toggle: Login vs Register
    const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
    const [loading, setLoading] = useState(false);          // Loading spinner state
    const [message, setMessage] = useState(null);           // Success/Error messages

    // Form fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    // ---------------------------------------------------------------
    // HANDLE INPUT CHANGES
    // ---------------------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear any error/success message when user starts typing
        if (message) setMessage(null);
    };

    // ---------------------------------------------------------------
    // CLIENT-SIDE VALIDATION
    // ---------------------------------------------------------------
    const validate = () => {
        if (!isLogin && !formData.name.trim()) {
            return 'Name is required';
        }
        if (!formData.email.trim() && !formData.phone.trim()) {
            return 'At least email or phone is required';
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            return 'Please enter a valid email address';
        }
        if (!formData.password) {
            return 'Password is required';
        }
        if (!isLogin && formData.password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        return null;
    };

    // ---------------------------------------------------------------
    // HANDLE FORM SUBMISSION
    // ---------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Step 1: Client-side validation
        const validationError = validate();
        if (validationError) {
            setMessage({ type: 'error', text: validationError });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            if (isLogin) {
                // ----- LOGIN -----
                const payload = { password: formData.password };
                if (formData.email.trim()) payload.email = formData.email.trim();
                if (formData.phone.trim()) payload.phone = formData.phone.trim();

                const response = await axios.post(`${API_BASE}/customer/login`, payload);

                // Store the JWT token in localStorage
                const { token, user } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('customer', JSON.stringify(user));

                setMessage({ type: 'success', text: `Welcome back, ${user.name}! 🎉` });

                // Notify parent component and redirect after a brief delay
                setTimeout(() => {
                    if (onLoginSuccess) onLoginSuccess(user, token);
                    navigate('/'); // Redirect to home page
                }, 1200);

            } else {
                // ----- REGISTER -----
                const payload = {
                    name: formData.name.trim(),
                    password: formData.password
                };
                if (formData.email.trim()) payload.email = formData.email.trim();
                if (formData.phone.trim()) payload.phone = formData.phone.trim();

                await axios.post(`${API_BASE}/customer/register`, payload);

                setMessage({ type: 'success', text: 'Account created successfully! You can now log in. ✅' });

                // Switch to login form after successful registration
                setTimeout(() => {
                    setIsLogin(true);
                    setFormData(prev => ({ ...prev, name: '', password: '' }));
                    setMessage(null);
                }, 2000);
            }
        } catch (error) {
            // Handle error from the backend
            const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------------
    // TOGGLE BETWEEN LOGIN & REGISTER
    // ---------------------------------------------------------------
    const toggleMode = () => {
        setIsLogin(!isLogin);
        setMessage(null);
        setFormData({ name: '', email: '', phone: '', password: '' });
    };

    // ---------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------
    return (
        <div className="auth-page">
            {/* Decorative Background Shapes */}
            <div className="auth-bg-shape auth-bg-shape-1"></div>
            <div className="auth-bg-shape auth-bg-shape-2"></div>
            <div className="auth-bg-shape auth-bg-shape-3"></div>

            <div className="auth-container animate-slide-up">

                {/* Back Button */}
                {onBack && (
                    <button className="auth-back-btn" onClick={onBack} type="button">
                        <ArrowLeft size={18} />
                        Back to Shops
                    </button>
                )}

                {/* Logo / Branding */}
                <div className="auth-brand">
                    <div className="auth-logo">
                        <ShoppingBag size={32} />
                    </div>
                    <h1 className="auth-title">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="auth-subtitle">
                        {isLogin
                            ? 'Sign in to continue shopping'
                            : 'Join us and start your shopping journey'}
                    </p>
                </div>

                {/* Message Banner */}
                {message && (
                    <div className={`auth-message auth-message-${message.type} animate-fade-in`}>
                        {message.type === 'success'
                            ? <CheckCircle size={18} />
                            : <AlertCircle size={18} />
                        }
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Auth Form */}
                <form className="auth-form" onSubmit={handleSubmit}>

                    {/* Name Field (Register Only) */}
                    {!isLogin && (
                        <div className="auth-field animate-fade-in">
                            <label htmlFor="auth-name" className="auth-label">
                                Full Name
                            </label>
                            <div className="auth-input-wrapper">
                                <User size={18} className="auth-input-icon" />
                                <input
                                    id="auth-name"
                                    type="text"
                                    name="name"
                                    className="auth-input"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                />
                            </div>
                        </div>
                    )}

                    {/* Email Field */}
                    <div className="auth-field">
                        <label htmlFor="auth-email" className="auth-label">
                            Email Address
                            {!isLogin && <span className="auth-optional">(optional if phone provided)</span>}
                        </label>
                        <div className="auth-input-wrapper">
                            <Mail size={18} className="auth-input-icon" />
                            <input
                                id="auth-email"
                                type="email"
                                name="email"
                                className="auth-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    {/* Phone Field */}
                    <div className="auth-field">
                        <label htmlFor="auth-phone" className="auth-label">
                            Phone Number
                            {!isLogin && <span className="auth-optional">(optional if email provided)</span>}
                        </label>
                        <div className="auth-input-wrapper">
                            <Phone size={18} className="auth-input-icon" />
                            <input
                                id="auth-phone"
                                type="tel"
                                name="phone"
                                className="auth-input"
                                placeholder="+1 234 567 8900"
                                value={formData.phone}
                                onChange={handleChange}
                                autoComplete="tel"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="auth-field">
                        <label htmlFor="auth-password" className="auth-label">
                            Password
                        </label>
                        <div className="auth-input-wrapper">
                            <Lock size={18} className="auth-input-icon" />
                            <input
                                id="auth-password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="auth-input auth-input-password"
                                placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="auth-spinner" />
                                {isLogin ? 'Signing in...' : 'Creating account...'}
                            </>
                        ) : (
                            <>
                                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle Login / Register */}
                <div className="auth-toggle">
                    <span className="auth-toggle-text">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}
                    </span>
                    <button
                        type="button"
                        className="auth-toggle-btn"
                        onClick={toggleMode}
                    >
                        {isLogin ? 'Create one' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CustomerAuth;
