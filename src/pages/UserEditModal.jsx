import React, { useState } from 'react';
import axios from 'axios';
import './AdminRegisterModal.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const USER_API_URL = `${API_BASE_URL}/api/users`;

// 🟢 Added 'onDelete' to props
const UserEditModal = ({ user, onClose, onUpdate, onDelete }) => {
    const token = localStorage.getItem('token'); 
    
    const [formData, setFormData] = useState({
        name: user.name,
        staffId: user.staffId,
        email: user.email,
        role: user.role,
        password: '', 
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

    // --- 🟢 NEW: DELETE FUNCTION ---
    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to permanently delete ${user.name}?`)) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${USER_API_URL}/${user._id}`, getAxiosConfig());
            alert('User deleted successfully');
            onDelete(user._id); // Notify parent to remove user from list
            onClose(); // Close modal
        } catch (err) {
            console.error('Delete failed:', err.response?.data || err.message);
            setError(err.response?.data?.msg || 'Failed to delete user.');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const payload = {
            name: formData.name,
            staffId: formData.staffId,
            email: formData.email,
            role: formData.role,
        };
        
        if (formData.password.trim() !== '') {
            if (formData.password.trim().length < 6) {
                 setLoading(false);
                 return setError('Password must be at least 6 characters.');
            }
            payload.password = formData.password.trim();
        }
        
        try {
            const res = await axios.put(`${USER_API_URL}/${user._id}`, payload, getAxiosConfig());
            onUpdate(res.data); 
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="admin-register-container modal-content">
                <button className="modal-close-btn" onClick={onClose} disabled={loading}>&times;</button>
                
                <h2>✏️ Edit Staff Account</h2>
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
                        <label>New Password (Leave blank to keep current)</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} />
                    </div>
                    
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        {/* 🟢 DELETE BUTTON */}
                        <button 
                            type="button" 
                            onClick={handleDelete} 
                            disabled={loading} 
                            className="delete-btn-modal"
                            style={{ backgroundColor: '#ff4d4d', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            🗑️ Delete User
                        </button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={onClose} disabled={loading} className="back-button">
                                Cancel
                            </button>
                            <button type="submit" className="register-button" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;
