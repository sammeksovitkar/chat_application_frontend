// src/components/UserEditModal.js

import React, { useState } from 'react';
import axios from 'axios';
import './AdminRegisterModal.css'; // Reusing general modal styling

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const USER_API_URL = `${API_BASE_URL}/api/users`;

const UserEditModal = ({ user, onClose, onUpdate }) => {
    const token = localStorage.getItem('token'); 
        const adminuser = localStorage.getItem('user'); 

console.log(adminuser,"user")
    const [formData, setFormData] = useState({
        name: user.name,
        staffId: user.staffId,
        email: user.email,
        role: user.role,
        password: '', // New password field
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAxiosConfig = () => ({
        headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json',
        },
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // 1. Prepare the payload with core fields
        const payload = {
            name: formData.name,
            staffId: formData.staffId,
            email: formData.email,
            role: formData.role,
        };
        
        // 2. 🟢 CRITICAL FIX: Only include the password if the field is not empty
        if (formData.password.trim() !== '') {
            if (formData.password.trim().length < 6) {
                 setLoading(false);
                 return setError('Password must be at least 6 characters.');
            }
            payload.password = formData.password.trim();
        }
        
        try {
            // Use the PUT method to update the user
            const res = await axios.put(`${USER_API_URL}/${user._id}`, payload, getAxiosConfig());
            
            // Notify parent component with the newly updated user data
            onUpdate(res.data); 
            
        } catch (err) {
            console.error('Update failed:', err.response?.data || err.message);
            setError(err.response?.data?.msg || 'Failed to update user. Check if ID/Email is duplicated.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="admin-register-container modal-content">
                <button className="modal-close-btn" onClick={onClose} disabled={loading}>&times;</button>
                
                <h2>✏️ Edit Staff Account: {user.name}</h2>
                {error && <p className="error-message">🛑 {error}</p>}

                <form onSubmit={handleSubmit}>
                    
                    <div className="input-group">
                        <label>Staff Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label>Staff ID</label>
                        <input type="text" name="staffId" value={formData.staffId} onChange={handleChange} required />
                    </div>
                    
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    
                    <div className="input-group">
                        <label>Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} required>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>New Password (Min 6 chars. Leave blank to keep existing)</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            placeholder="********"
                        />
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} disabled={loading} className="back-button">
                            Cancel
                        </button>
                        <button type="submit" className="register-button" disabled={loading}>
                            {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;