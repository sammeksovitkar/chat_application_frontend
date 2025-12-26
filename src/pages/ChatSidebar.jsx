import React from 'react';

// Helper function to format the Last Seen timestamp
const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Last seen recently';
    const date = new Date(timestamp);
    // Use Intl.DateTimeFormat for better readability and safety
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const day = date.toLocaleDateString();
    return `Last seen ${time} on ${day}`;
};

const ChatSidebar = ({
    user,
    isAdmin,
    staffDirectory,
    activeChat,
    unreadCounts,
    onlineStatus,
    handleChatSelect,
    onLogout,
    onAdminRegister,
    // 🟢 NEW: Receive activeView prop
    activeView,
    // 🟢 NEW: Receive a handler to switch back to the Chat View
    setActiveView 
}) => {

    // Helper function to handle switching to the chat view and selecting a user
    const handleChatClick = (member) => {
        // 1. Ensure the view is set to 'chat'
        setActiveView('chat');
        // 2. Select the chat
        handleChatSelect(member);
    };

    return (
        <div className="chat-sidebar">
            <h3>👥 Staff Directory</h3>
            <p className="current-user-tag">Chatting as: **{user.name}**</p>
            <hr />

            {/* --- Navigation Buttons (Admin Only) --- */}
            {isAdmin && (
                <div className="sidebar-nav-buttons">
                    {/* Button to switch to Chat/Directory View */}
                    <button 
                        className={`nav-button ${activeView === 'chat' ? 'active-nav' : ''}`}
                        onClick={() => setActiveView('chat')}
                    >
                        💬 Chats
                    </button>
                    {/* Button to switch to Admin Register View */}
                    <button 
                        className={`nav-button ${activeView === 'admin-register' ? 'active-nav' : ''}`}
                        onClick={onAdminRegister} // This should set activeView to 'admin-register'
                    >
                        ➕ Add Staff
                    </button>
                </div>
            )}
            <hr />

            {/* --- Chat List Display (Only visible when activeView is 'chat') --- */}
            {activeView === 'chat' && (
                <div className="chat-list">
                    {/* Global Chat Option */}
                    <div 
                        className={`chat-item ${!activeChat ? 'active' : ''}`}
                        onClick={() => handleChatClick(null)}
                    >
                        <span className="chat-icon">🌐</span>
                        <div className="chat-info">
                            <p className="chat-name">**Global Staff Group**</p>
                        </div>
                        {unreadCounts['global-staff-group-id'] > 0 && (
                            <span className="unread-badge">{unreadCounts['global-staff-group-id']}</span>
                        )}
                    </div>

                    {/* One-on-One Chats */}
                    {staffDirectory.map(member => {
                        const oneOnOneChatId = [user._id, member._id].sort().join('_');
                        const count = unreadCounts[oneOnOneChatId] || 0;
                        const isOnline = onlineStatus[member._id];
                        
                        return (
                            <div 
                                key={member._id} 
                                className={`chat-item ${activeChat?._id === member._id ? 'active' : ''}`}
                                // Use the new handler to ensure activeView is set correctly
                                onClick={() => handleChatClick(member)}
                            >
                                <span className={`chat-icon user-status-icon ${isOnline ? 'online' : 'offline'}`}>👤</span>
                                <div className="chat-info">
                                    <p className="chat-name">**{member.name}**</p>
                                    <small className="chat-status">{isOnline ? 'Online' : formatLastSeen(member.lastActive)}</small>
                                </div>
                                {count > 0 && (
                                    <span className="unread-badge">{count}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {/* If not in 'chat' view (i.e., 'admin-register'), show a placeholder or nothing */}
            {activeView !== 'chat' && (
                <div className="chat-list-placeholder">
                    <p>Go to the Admin panel to manage users.</p>
                </div>
            )}

            {/* --- Static Buttons --- */}
            {/* The previous Admin button is now handled by the navigation above */}
            
            <button 
                className="logout-button"
                onClick={onLogout}>
                Logout
            </button>
        </div>
    );
};

export default ChatSidebar;