// office-chat-frontend/src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Add basic styling in Login.css

// const API_URL = 'http://localhost:5000/api/auth';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL
const API_URL = `${API_BASE_URL}/api/auth`; // e.g., http://localhost:5000/api/chats


const Login = () => {
    const [staffId, setStaffId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Send login request to the Node/Express backend
            const response = await axios.post(`${API_URL}/login`, { staffId, password });
            
            // Store JWT token and user details upon successful login
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            console.log(response.data.user,"reee")

            navigate('/chat');
        } catch (err) {
            console.error('Login Error:', err.response || err);
            // Display error message from backend or a generic one
            setError(err.response?.data?.msg || 'Login failed. Invalid ID or password.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <h2>Staff Chat Login 💬</h2>
                {error && <p className="error-message">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Staff ID</label>
                        <input type="text" placeholder="e.g., S101" value={staffId} onChange={(e) => setStaffId(e.target.value)} required />
                    </div>
                    
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    
                    <button type="submit" className="login-button">Log In</button>
                </form>
            </div>
        </div>
    );
};

export default Login;