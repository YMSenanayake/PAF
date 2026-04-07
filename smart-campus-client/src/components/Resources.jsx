import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the resources from your Spring Boot API
        axios.get('http://localhost:8080/api/resources')
            .then(response => {
                setResources(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching resources:", error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4 text-gray-500">Loading resources...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">Facilities & Assets Catalogue</h2>
            
            {resources.length === 0 ? (
                <p className="text-gray-500">No resources found in the database.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {resources.map(resource => (
                        <div key={resource.resourceId} className="border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-blue-600">{resource.name}</h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${resource.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {resource.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Type:</span> {resource.type}</p>
                            <p className="text-sm text-gray-600 mb-1"><span className="font-semibold">Capacity:</span> {resource.capacity} people</p>
                            <p className="text-sm text-gray-600"><span className="font-semibold">Location:</span> {resource.location}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Resources;