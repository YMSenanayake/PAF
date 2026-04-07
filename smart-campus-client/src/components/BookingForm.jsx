import React, { useState } from 'react';
import axios from 'axios';

const BookingForm = () => {
    const [formData, setFormData] = useState({
        resourceId: '1', // Defaulting to the Main Auditorium we created
        bookingDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: ''
    });
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null); // Clear old messages

        try {
            const response = await axios.post('http://localhost:8080/api/bookings', {
                user: { userId: 1 }, // Simulating the logged-in user
                resource: { resourceId: formData.resourceId },
                bookingDate: formData.bookingDate,
                startTime: formData.startTime + ":00", // Append seconds for Spring Boot LocalTime
                endTime: formData.endTime + ":00",
                purpose: formData.purpose,
                expectedAttendees: parseInt(formData.expectedAttendees)
            });
            
            if(response.status === 201) {
                setMessage({ type: 'success', text: 'Booking requested successfully! Status: PENDING' });
            }
        } catch (error) {
            // Catch the 409 Conflict error for overlapping times
            setMessage({ 
                type: 'error', 
                text: error.response?.data || 'Failed to book resource. Please try again.' 
            });
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">Request a Booking</h2>
            
            {message && (
                <div className={`p-4 mb-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Resource ID</label>
                    <input type="number" name="resourceId" value={formData.resourceId} onChange={handleChange} required className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Date</label>
                    <input type="date" name="bookingDate" value={formData.bookingDate} onChange={handleChange} required className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Start Time</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">End Time</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Purpose of Booking</label>
                    <input type="text" name="purpose" value={formData.purpose} onChange={handleChange} required className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., PAF Project Brainstorming" />
                </div>
                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Expected Attendees</label>
                    <input type="number" name="expectedAttendees" value={formData.expectedAttendees} onChange={handleChange} required className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2 mt-2">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                        Submit Booking Request
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BookingForm;