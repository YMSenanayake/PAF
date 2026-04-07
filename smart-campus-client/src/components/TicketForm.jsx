import React, { useState } from 'react';
import axios from 'axios';

const TicketForm = () => {
    const [formData, setFormData] = useState({
        resourceId: '1',
        category: 'HARDWARE',
        priority: 'MEDIUM',
        description: '',
        contactDetails: ''
    });
    const [files, setFiles] = useState(null);
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        // Limit selection to 3 files max to match backend rules
        if (e.target.files.length > 3) {
            setMessage({ type: 'error', text: 'You can only upload a maximum of 3 images.' });
            e.target.value = null; // Clear the input
            setFiles(null);
        } else {
            setFiles(e.target.files);
            setMessage(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            // Step 1: Create the ticket data (JSON)
            const ticketResponse = await axios.post('http://localhost:8080/api/tickets', {
                user: { userId: 1 }, // Simulating logged-in user
                resource: { resourceId: formData.resourceId },
                category: formData.category,
                priority: formData.priority,
                description: formData.description,
                contactDetails: formData.contactDetails
            });

            const newTicketId = ticketResponse.data.ticketId;

            // Step 2: If the user selected files, upload them to the new ticket ID
            if (files && files.length > 0) {
                const fileData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    fileData.append('files', files[i]);
                }

                await axios.post(`http://localhost:8080/api/tickets/${newTicketId}/attachments`, fileData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setMessage({ type: 'success', text: `Ticket #${newTicketId} reported successfully with attachments!` });
            
            // Clear the form
            setFormData({ ...formData, description: '', contactDetails: '' });
            setFiles(null);
            document.getElementById('fileInput').value = ""; // Reset file input UI
            
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data || 'Failed to submit ticket.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">Report an Incident</h2>
            
            {message && (
                <div className={`p-4 mb-4 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Resource ID</label>
                    <input type="number" name="resourceId" value={formData.resourceId} onChange={handleChange} required className="border rounded p-2 focus:ring-blue-500 outline-none" />
                </div>
                
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="border rounded p-2 focus:ring-blue-500 outline-none">
                        <option value="HARDWARE">Hardware Issue</option>
                        <option value="SOFTWARE">Software Issue</option>
                        <option value="FACILITY">Facility / Room Issue</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleChange} className="border rounded p-2 focus:ring-blue-500 outline-none">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Contact Phone/Email</label>
                    <input type="text" name="contactDetails" value={formData.contactDetails} onChange={handleChange} required className="border rounded p-2 focus:ring-blue-500 outline-none" placeholder="How can technicians reach you?" />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Issue Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="border rounded p-2 focus:ring-blue-500 outline-none" placeholder="Describe the problem in detail..." />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600 mb-1">Evidence Attachments (Max 3 Images)</label>
                    <input id="fileInput" type="file" multiple accept="image/*" onChange={handleFileChange} className="border rounded p-2 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>

                <div className="md:col-span-2 mt-2">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50">
                        {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TicketForm;