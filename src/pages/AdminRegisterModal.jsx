// office-chat-frontend/src/components/AdminRegisterModal.js

import React, { useState } from 'react';
import axios from 'axios';
import './AdminRegisterModal.css';

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/auth`; 

const AdminRegisterModal = ({ onClose, onUserRegistered }) => {
    const [formData, setFormData] = useState({
        name: '',
        staffId: '',
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state
    
    // Retrieve token for authenticated registration
    const token = localStorage.getItem('token'); 

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true); // Start loading

        if (formData.password.length < 6) {
            setLoading(false);
            return setError('Password must be at least 6 characters.');
        }

        try {
            const config = {
                headers: { 'x-auth-token': token }
            };
            
            const response = await axios.post(`${API_URL}/register`, formData, config);
            
            // 🟢 CRITICAL FIX: Directly use the 'msg' property from the response data.
            // This prevents an error when trying to access response.data.user (which is not present).
            const successMsg = response.data.msg || 'Staff registered successfully.';
            
            setMessage(`✅ ${successMsg}`);
            setError('');
            
            // Clear the form fields after successful registration
            setFormData({ name: '', staffId: '', email: '', password: '' }); 
            
            // Notify parent if needed
            // onUserRegistered(); 

        } catch (err) {
            console.error('Registration Error:', err.response || err);
            // Error handling remains the same
            setError(`🛑 ${err.response?.data?.msg || 'Registration failed. User ID or email might already exist.'}`);
            setMessage('');
        } finally {
             setLoading(false); // Stop loading regardless of success/fail
        }
    };

    return (
        // Modal overlay and container for styling
        <div className="modal-overlay">
            <div className="admin-register-container modal-content">
                <button className="modal-close-btn" onClick={onClose} disabled={loading}>&times;</button>
                
                <h2>👤 Create New Staff Account</h2>
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    
                    <div className="input-group">
                        <label>Staff Name</label>
                        <input type="text" name="name" placeholder="Sanket" value={formData.name} onChange={handleChange} required disabled={loading} />
                    </div>

                    <div className="input-group">
                        <label>Staff ID</label>
                        <input type="text" name="staffId" placeholder="S103 (Unique ID)" value={formData.staffId} onChange={handleChange} required disabled={loading} />
                    </div>
                    
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="sanket@office.com" value={formData.email} onChange={handleChange} required disabled={loading} />
                    </div>
                    
                    <div className="input-group">
                        <label>Password (Min 6 chars)</label>
                        <input type="password" name="password" placeholder="********" value={formData.password} onChange={handleChange} required disabled={loading} />
                    </div>
                    
                    <button type="submit" className="register-button" disabled={loading}>
                        {loading ? 'Registering...' : 'Register User'}
                    </button>
                    
                    <button type="button" className="back-button" onClick={onClose} disabled={loading}>
                        Done
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminRegisterModal;