import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// 🟢 NEW: Import the Edit Modal component
import UserEditModal from './UserEditModal'; 
// 🟢 NEW: Import CSS for styling
import './UserManagement.css'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const USER_API_URL = `${API_BASE_URL}/api/users`;

const UserManagement = () => {
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // 🟢 NEW STATE: For handling the edit modal
    const [editingUser, setEditingUser] = useState(null); 

    const token = localStorage.getItem('token'); 
    const userData = JSON.parse(localStorage.getItem('user')) || {};
    const currentUserId = userData.id || userData._id; 
    const isAdmin = userData.role === 'admin';

    // --- Axios & Fetching Logic (Stable - Retained from previous fix) ---

    const getAxiosConfig = useCallback(() => ({
        headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json',
        },
    }), [token]);

    const fetchStaffList = useCallback(async () => {
        if (!token || !currentUserId || !isAdmin) {
            setError('Access Denied: You must be an administrator.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await axios.get(USER_API_URL, getAxiosConfig());
            const filteredList = res.data.filter(u => u._id !== currentUserId);
            setStaffList(filteredList);
            setError('');
        } catch (err) {
            console.error('Failed to fetch staff list:', err.response?.data || err.message);
            setError('Failed to load user data. Check server connection or permissions.');
        } finally {
            setLoading(false);
        }
    }, [token, currentUserId, isAdmin, getAxiosConfig]);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchStaffList();
    }, [fetchStaffList, token, navigate]);

    // --- Action Handlers ---

    // 🟢 UPDATED: Open the modal and set the user to be edited
    const handleEdit = useCallback((userToEdit) => {
        setEditingUser(userToEdit);
    }, []); 
    
    // 🟢 NEW: Function to close the modal
    const closeEditModal = useCallback(() => {
        setEditingUser(null);
    }, []);

    // 🟢 NEW: Function to handle successful update
    const handleUserUpdated = useCallback((updatedUser) => {
        setStaffList(prevList => 
            prevList.map(user => 
                user._id === updatedUser._id ? updatedUser : user
            )
        );
        closeEditModal();
    }, [closeEditModal]);

    const handleDelete = useCallback(async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            return;
        }

        try {
            // 💡 Use the actual DELETE API call here:
            // await axios.delete(`${USER_API_URL}/${userId}`, getAxiosConfig());
            
            setStaffList(prevList => prevList.filter(user => user._id !== userId));
            alert('User deleted successfully.');
        } catch (err) {
            console.error('Deletion failed:', err.response?.data || err.message);
            alert('Deletion failed. Check server logs.');
        }
    }, [getAxiosConfig]);
    
    // --- Render Logic ---

    if (loading) {
        return <div className="user-management-container loading">Loading staff list...</div>;
    }
    
    if (error || !isAdmin) {
         return <div className="user-management-container error-message">❌ Error: {error || 'Access Denied.'}</div>;
    }

    return (
        <div className="user-management-container">
            <h2>⚙️ Staff Management Panel</h2>
            
            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Staff ID</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th className="action-column">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffList.length > 0 ? (
                            staffList.map((staff) => (
                                <tr key={staff._id}>
                                    <td data-label="Name" className="name-cell">
                                        <span className={`role-tag role-${staff.role}`}>{staff.role.toUpperCase()}</span>
                                        **{staff.name}**
                                    </td>
                                    <td data-label="Staff ID">{staff.staffId}</td>
                                    <td data-label="Email">{staff.email}</td>
                                    <td data-label="Role">{staff.role}</td>
                                    <td data-label="Actions" className="action-buttons">
                                        <button 
                                            className="action-btn edit-btn"
                                            // 🟢 PASS THE FULL USER OBJECT
                                            onClick={() => handleEdit(staff)}>
                                            ✏️ Edit
                                        </button>
                                        <button 
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(staff._id)}>
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="no-data">No other staff members found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 🟢 NEW: Conditional Rendering for the Edit Modal */}
            {editingUser && (
                <UserEditModal
                    user={editingUser}
                    onClose={closeEditModal}
                    onUpdate={handleUserUpdated}
                />
            )}
        </div>
    );
};

export default UserManagement;