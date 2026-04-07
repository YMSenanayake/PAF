import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnalyticsDashboard from './AnalyticsDashboard'; // <-- Import the new component
import Resources from './Resources';
import BookingForm from './BookingForm';
import TicketForm from './TicketForm';
import Notifications from './Notifications';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8 flex justify-between items-center border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Smart Campus Hub</h1>
                        <p className="text-gray-500 mt-1">Logged in via Google OAuth 2.0</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2 rounded-lg transition-colors font-medium shadow-sm"
                    >
                        Sign Out
                    </button>
                </div>
                
                {/* Welcome Banner */}
                <div className="bg-blue-600 rounded-lg shadow-md p-8 text-white mb-8">
                    <h2 className="text-2xl font-bold mb-2">Welcome to the Operations Hub</h2>
                    <p className="text-blue-100">You have full access to manage facilities, review bookings, and resolve maintenance tickets.</p>
                </div>

                {/* The new Out-of-the-box Analytics Component */}
                <AnalyticsDashboard />
                <Resources />
                <BookingForm />
                <TicketForm />
                <Notifications />
            </div>
        </div>
    );
};

export default Dashboard;