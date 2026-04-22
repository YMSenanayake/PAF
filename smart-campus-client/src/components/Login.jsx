import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Login = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error === 'domain_restricted') {
      setLoginError('Access denied. Only @my.sliit.lk accounts are allowed.');
      window.history.replaceState({}, '', '/');
    } else if (error === 'oauth_failed') {
      setLoginError('Sign-in failed. Please try again or use a different account.');
      window.history.replaceState({}, '', '/');
    }
  }, [location.search]);

  // Already logged in → skip login page entirely
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    const storedUser = localStorage.getItem('campus_user');
    let params = '';
    try {
      const userData = JSON.parse(storedUser);
      if (userData?.email) {
        // Returning user: skip account chooser, auto-select their account
        params = `?login_hint=${encodeURIComponent(userData.email)}`;
      } else {
        // After sign-out or first visit: show account chooser
        params = '?prompt=select_account';
      }
    } catch {
      // No stored user (e.g. after sign-out): always show account chooser
      params = '?prompt=select_account';
    }

    window.location.href = `http://localhost:8080/oauth2/authorization/google${params}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#070c1b' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full"
          style={{
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            top: '-150px', left: '-150px',
            animation: 'pulse 8s ease-in-out infinite alternate',
          }} />
        <div className="absolute rounded-full"
          style={{
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            bottom: '-100px', right: '-100px',
            animation: 'pulse 10s ease-in-out infinite alternate-reverse',
          }} />
        <div className="absolute rounded-full"
          style={{
            width: '300px', height: '300px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
            top: '40%', left: '55%',
            animation: 'pulse 12s ease-in-out infinite alternate',
          }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        <div className="glass rounded-3xl p-10 shadow-2xl"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)' }}>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Smart Campus Logo" className="w-20 h-20 object-contain drop-shadow-xl" />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Smart Campus Hub</h1>
            <p className="text-slate-400 text-sm">
              Sign in to manage bookings, resources & maintenance
            </p>
          </div>

          {/* Error banner */}
          {loginError && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4 shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {loginError}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs text-slate-500 font-medium">CONTINUE WITH</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google Button */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 group"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          {/* Domain hint */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              className="w-3.5 h-3.5 shrink-0" style={{ color: '#6366f1' }}>
              <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
            </svg>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              Only <span className="font-semibold" style={{ color: '#a5b4fc' }}>@my.sliit.lk</span> accounts are accepted
            </p>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-500 mt-3">
            Secured with Google OAuth 2.0 · SLIIT access only
          </p>
        </div>

        {/* Bottom glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(99,102,241,0.2)' }} />
      </div>

      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(20px, 20px); }
        }
      `}</style>
    </div>
  );
};

export default Login;