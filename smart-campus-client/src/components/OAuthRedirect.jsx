import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthRedirect = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Grab the URL parameters (e.g., ?token=eyJh...)
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            // Save the token to the browser's Local Storage so we can use it for API calls later
            localStorage.setItem('jwt_token', token);
            // Instantly redirect the user to the Dashboard
            navigate('/dashboard');
        } else {
            // If something went wrong, send them back to login
            navigate('/');
        }
    }, [navigate, location]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600 font-semibold animate-pulse">Authenticating...</p>
        </div>
    );
};

export default OAuthRedirect;