// office-chat-frontend/src/App.js (Example structure)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import the components
import Login from './pages/Login';
import Chat from './pages/Chat';
import ProtectedRoutes from './pages/ProtectedRoutes'; // <--- NEW IMPORT
import UserManagement from './pages/UserManagement';

function App() {
    return (
        <Router>
            <Routes>
                {/* 1. Public Route: Anyone can access the login page */}
                <Route path="/login" element={<Login />} />
                
                {/* Optional: Redirect root to login page initially */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                {/* <Route path="/admin/register" element={<AdminRegister />} /> */}

                {/* 2. Protected Routes: Wrap all secured pages inside the <ProtectedRoutes> */}
                <Route element={<ProtectedRoutes />}>
                    <Route path="/chat" element={<Chat />} />
                    {/* Add any other secure routes here */}
                </Route>
                <Route path="/admin/users" element={<UserManagement />} />

                {/* 3. Catch-all for 404s (optional) */}
                <Route path="*" element={<h1>404 Not Found</h1>} />
            </Routes>
        </Router>
    );
}

export default App;