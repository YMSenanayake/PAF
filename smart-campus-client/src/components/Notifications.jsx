import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    // Fetch notifications for our simulated user (userId: 1)
    const fetchNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/notifications/user/1');
            setNotifications(response.data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        
        // Optional Bonus: Automatically check for new notifications every 10 seconds!
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.put(`http://localhost:8080/api/notifications/${id}/read`);
            fetchNotifications(); // Refresh the list to remove the blue highlighting
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2 flex items-center justify-between">
                Your Notifications
                <span className="bg-blue-600 text-white text-sm py-1 px-3 rounded-full font-semibold shadow-sm">
                    {notifications.filter(n => !n.read).length} Unread
                </span>
            </h2>
            
            {notifications.length === 0 ? (
                <p className="text-gray-500 italic">You have no notifications at this time.</p>
            ) : (
                <div className="space-y-3 mt-4 max-h-96 overflow-y-auto pr-2">
                    {notifications.map(notification => (
                        <div 
                            key={notification.notificationId} 
                            className={`p-4 border rounded-lg flex justify-between items-center transition-colors ${!notification.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <div>
                                <p className={`text-sm ${!notification.read ? 'text-blue-900 font-semibold' : 'text-gray-600'}`}>
                                    {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.createdAt).toLocaleString()}
                                </p>
                            </div>
                            {!notification.read && (
                                <button 
                                    onClick={() => markAsRead(notification.notificationId)}
                                    className="text-xs bg-white border border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white py-1.5 px-3 rounded-md transition-colors shadow-sm font-medium"
                                >
                                    Mark as Read
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;