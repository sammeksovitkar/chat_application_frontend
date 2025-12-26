// office-chat-frontend/src/components/ProtectedRoutes.js (FINAL)
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoutes = () => {
    // Check for the authentication token
    const token = localStorage.getItem('token'); 
    
    // Check if authenticated
    const isAuthenticated = !!token; 

    // Renders child component if authenticated, otherwise redirects to login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoutes;