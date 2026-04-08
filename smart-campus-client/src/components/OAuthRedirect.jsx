import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Decode JWT payload (base64) without a library
const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const OAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (!token) {
      navigate('/');
      return;
    }

    // Store JWT in localStorage
    localStorage.setItem('jwt_token', token);

    // Decode email from JWT payload
    const payload = decodeJwtPayload(token);
    const email = payload?.sub;

    if (!email) {
      navigate('/');
      return;
    }

    // Fetch full user profile (role, userId, fullName) from backend
    axios.get(`/api/users/email/${encodeURIComponent(email)}`)
      .then(res => {
        const userData = res.data;
        login({
          userId:   userData.userId,
          email:    userData.email,
          fullName: userData.fullName,
          role:     userData.role,
        });
        navigate('/dashboard');
      })
      .catch(() => {
        // If user lookup fails, still proceed but with minimal info
        login({ email, role: 'USER', userId: null, fullName: email });
        navigate('/dashboard');
      });
  }, [navigate, location, login]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#070c1b' }}>
      <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin-slow mb-4" />
      <p className="text-slate-400 text-sm font-medium">Authenticating with Google…</p>
    </div>
  );
};

export default OAuthRedirect;