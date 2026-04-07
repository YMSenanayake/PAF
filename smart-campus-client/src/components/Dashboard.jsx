import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Delete the token from memory and send them back to the login screen
        localStorage.removeItem('jwt_token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h1 className="text-3xl font-bold text-gray-800">Smart Campus Dashboard</h1>
                    <button 
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow transition-colors"
                    >
                        Logout
                    </button>
                </div>
                
                <div className="p-10 text-center">
                    <h2 className="text-2xl text-green-600 font-semibold mb-2">🎉 Login Successful!</h2>
                    <p className="text-gray-600">You are now securely authenticated via Google OAuth 2.0 and JWT.</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;