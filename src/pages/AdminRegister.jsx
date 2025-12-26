// office-chat-frontend/src/pages/AdminRegister.js (FINAL)

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminRegister.css'; 

// const API_URL = 'http://localhost:5000/api/auth';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
const API_URL = `${API_BASE_URL}/api/auth`; // e.g., http://localhost:5000/api/chats


const AdminRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        staffId: '',
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (formData.password.length < 6) {
            return setError('Password must be at least 6 characters.');
        }

        try {
            const response = await axios.post(`${API_URL}/register`, formData);
            
            setMessage(`User ${response.data.user.name} (ID: ${response.data.user.staffId}) created successfully!`);
            setError('');
            setFormData({ name: '', staffId: '', email: '', password: '' }); 

        } catch (err) {
            console.error('Registration Error:', err.response || err);
            setError(err.response?.data?.msg || 'Registration failed. User ID or email might already exist.');
            setMessage('');
        }
    };

    return (
        <div className="admin-register-wrapper">
            <div className="admin-register-container">
                <h2>👤 Create New Staff Account</h2>
                {message && <p className="success-message">✅ {message}</p>}
                {error && <p className="error-message">🛑 {error}</p>}
                
                <form onSubmit={handleSubmit}>
                    
                    <div className="input-group">
                        <label>Staff Name</label>
                        <input type="text" name="name" placeholder="Sanket" value={formData.name} onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label>Staff ID</label>
                        <input type="text" name="staffId" placeholder="S103 (Unique ID)" value={formData.staffId} onChange={handleChange} required />
                    </div>
                    
                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="sanket@office.com" value={formData.email} onChange={handleChange} required />
                    </div>
                    
                    <div className="input-group">
                        <label>Password (Min 6 chars)</label>
                        <input type="password" name="password" placeholder="********" value={formData.password} onChange={handleChange} required />
                    </div>
                    
                    <button type="submit" className="register-button">Register User</button>
                    
                    <button type="button" className="back-button" onClick={() => navigate('/chat')}>
                        Back to Chat
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminRegister;