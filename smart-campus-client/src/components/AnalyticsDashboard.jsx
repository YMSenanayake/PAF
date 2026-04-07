import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const AnalyticsDashboard = () => {
    // Realistic data for the Viva demonstration
    const bookingData = [
        { name: 'Main Auditorium', bookings: 45 },
        { name: 'Lab A', bookings: 32 },
        { name: 'Lab B', bookings: 28 },
        { name: 'Meeting Room 1', bookings: 60 },
        { name: 'Projector Kit', bookings: 15 },
    ];

    const ticketData = [
        { name: 'Open', value: 8 },
        { name: 'In Progress', value: 5 },
        { name: 'Resolved', value: 24 },
    ];
    
    // Tailwind colors for the Pie Chart: Red, Yellow, Green
    const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-6 border-b pb-2">Admin Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bookings Bar Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-600 mb-4 text-center">Resource Popularity</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bookingData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{fill: '#f3f4f6'}} />
                                <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tickets Pie Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-600 mb-4 text-center">Maintenance Ticket Status</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ticketData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ticketData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;