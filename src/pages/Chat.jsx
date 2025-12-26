// office-chat-frontend/src/components/Chat.js

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Chat.css'; 
import AdminRegisterModal from './AdminRegisterModal'; 
import UserManagement from './UserManagement'; 

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'; 
const SOCKET_URL = API_BASE_URL; 
const API_URL = `${API_BASE_URL}/api/chats`;
const USER_API_URL = `${API_BASE_URL}/api/users`;

const playNotificationSound = () => {
    // 💡 Ensure you have a /public/notification.mp3 file
    const audio = new Audio('/notification.mp3'); 
    audio.play().catch(e => console.log('Autoplay blocked:', e)); 
};

const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Last seen recently';
    const date = new Date(timestamp);
    return `Last seen ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${date.toLocaleDateString()}`;
};

const Chat = () => {
    const navigate = useNavigate(); 
    
    // 🟢 Stable User/Admin check
    const user = JSON.parse(localStorage.getItem('user')) || null;
    const token = localStorage.getItem('token'); 
    const currentUserId = user ? (user.id || user._id) : null; 
    const isAdmin = user && user.role === 'admin'; // Correctly reads role

    const [messageInput, setMessageInput] = useState('');
    const [messageList, setMessageList] = useState([]);
    const [typingStatus, setTypingStatus] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    
    const [staffDirectory, setStaffDirectory] = useState([]);
    const [activeChat, setActiveChat] = useState(null); 
    
    const [unreadCounts, setUnreadCounts] = useState({}); 
    const [onlineStatus, setOnlineStatus] = useState({}); 
    const [lastSeenData, setLastSeenData] = useState({}); 
    
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [currentView, setCurrentView] = useState('chat'); 

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null); 
    const activeChatIdRef = useRef(null); 
    const hasFetchedStaffRef = useRef(false);

    const activeChatId = useMemo(() => {
        if (!currentUserId) return 'loading'; 
        if (!activeChat) { return 'global-staff-group-id'; } 
        const ids = [currentUserId, activeChat._id].filter(id => id).sort();
        return ids.join('_');
    }, [currentUserId, activeChat]);
    
    useEffect(() => {
        activeChatIdRef.current = activeChatId;
    }, [activeChatId]);

    const socket = useMemo(() => {
        if (token) {
            return io(SOCKET_URL, { auth: { token: token }, autoConnect: true });
        }
        return { connected: false, emit: () => {}, on: () => () => {}, off: () => () => {}, disconnect: () => {} };
    }, [token]);

    const getAxiosConfig = useCallback((isMultipart = false) => ({
        headers: {
            'x-auth-token': token,
            'Content-Type': isMultipart ? undefined : 'application/json',
        },
    }), [token]);

    const fetchMessages = useCallback(async () => {
        if (!token || activeChatId === 'loading' || !socket.connected) return; 
        try {
            const res = await axios.get(`${API_URL}/${activeChatId}`, getAxiosConfig());
            setMessageList(res.data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    }, [activeChatId, token, socket.connected, getAxiosConfig]);

    const fetchStaffDirectory = useCallback(async () => {
        if (!currentUserId || !token) return;
        try {
            const res = await axios.get(`${USER_API_URL}`, getAxiosConfig()); 
            const filteredUsers = res.data.filter(u => u._id !== currentUserId);
            
            setStaffDirectory(filteredUsers); 
            
            const initialLastSeen = {};
            filteredUsers.forEach(u => {
                if (u.lastActive) {
                    initialLastSeen[u._id] = u.lastActive;
                }
            });
            setLastSeenData(prev => ({ ...prev, ...initialLastSeen }));

        } catch (err) {
            console.error('Failed to fetch staff directory:', err);
        }
    }, [currentUserId, token, getAxiosConfig]); 

    const handleChatSelect = useCallback((chatMember) => {
        setCurrentView('chat'); 
        setMessageList([]); 
        setEditingMessageId(null); 
        setTypingStatus('');
        setMessageInput('');
        setActiveChat(chatMember);
        
        const targetChatId = chatMember ? [currentUserId, chatMember._id].sort().join('_') : 'global-staff-group-id';
        setUnreadCounts(prev => ({ ...prev, [targetChatId]: 0 })); 
        
    }, [currentUserId]); 

    const handleManageUsers = () => {
        setCurrentView('manage-users');
        setActiveChat(null); 
        setMessageList([]); 
    };

    // --- EFFECT FOR INITIAL DATA FETCHING ---
    useEffect(() => {
        if (!user || !token) { 
            navigate('/login'); 
            return; 
        }
        if (user && !hasFetchedStaffRef.current) {
            fetchStaffDirectory();
            hasFetchedStaffRef.current = true;
        }
    }, [user, token, navigate, fetchStaffDirectory]); 

    // ... (useEffect for Socket Joining and Message Fetching) ...
    useEffect(() => {
        if (!currentUserId || activeChatId === 'loading' || !socket.connected) return;
        socket.emit('join_chat', activeChatId); 
        fetchMessages(); 
    }, [currentUserId, activeChatId, socket, fetchMessages, socket.connected]); 

    // --- EFFECT FOR SOCKET LISTENERS (Updated Notification Logic) ---
    useEffect(() => {
        if (!user || !token) { return; } 

        socket.on('user_status_update', (data) => {
            setOnlineStatus(prev => ({ ...prev, [data.userId]: data.isOnline }));
            if (!data.isOnline && data.lastActive) {
                setLastSeenData(prev => ({ ...prev, [data.userId]: data.lastActive }));
            }
        });

        socket.on('receive_message', (data) => {
            const messageChatId = data.chatId;
            const isSentByMe = data.sender?._id === currentUserId;
            
            if (messageChatId === activeChatIdRef.current) { 
                // Message for ACTIVE chat: Add message, but DO NOT play sound.
                const newMessage = { 
                    ...data, 
                    sender: data.sender?._id ? data.sender : { name: data.senderName, _id: data.senderId } 
                };
                setMessageList((list) => [...list, newMessage]);
                setTypingStatus(''); 
                
                // 💥 FIX: Removed 'playNotificationSound()' from the active chat block.
                // It only plays sound for non-active chats now, avoiding disturbance in the current chat.
                
                setUnreadCounts(prev => ({ ...prev, [messageChatId]: 0 })); 
            } else if (!isSentByMe) {
                // Message for NON-ACTIVE chat: Play sound and increment unread count.
                playNotificationSound();
                setUnreadCounts(prev => ({ 
                    ...prev, 
                    [messageChatId]: (prev[messageChatId] || 0) + 1 
                }));
            }
        });

        socket.on('typing_status', (data) => {
            if (currentUserId && data.isTyping && data.senderId !== currentUserId && data.chatId === activeChatIdRef.current) {
                setTypingStatus(`${data.senderName} is typing...`);
            } else if (data.chatId === activeChatIdRef.current) {
                setTypingStatus('');
            }
        });
        
        socket.on('message_edited', (data) => {
            if (data.chatId === activeChatIdRef.current) {
                setMessageList(list => list.map(msg => 
                    msg._id === data.messageId ? { ...msg, content: data.newContent, edited: true } : msg
                ));
            }
        });

        socket.on('message_deleted', (data) => {
            if (data.chatId === activeChatIdRef.current && data.deleteForEveryone) {
                setMessageList(list => list.filter(msg => msg._id !== data.messageId));
            }
        });

        return () => {
            socket.off('receive_message');
            socket.off('typing_status');
            socket.off('message_edited');
            socket.off('message_deleted');
            socket.off('user_status_update'); 
        };
    }, [user, token, socket, currentUserId, activeChat]); 


    // --- Modal Handlers ---
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    
    const handleUserRegistered = () => {
        fetchStaffDirectory(); 
        closeModal();
        setCurrentView('manage-users');
    };

    // --- Input and Message Handlers ---
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList]);

    const handleTyping = (e) => {
        setMessageInput(e.target.value);
        if (!currentUserId) return; 
        
        socket.emit('typing', { chatId: activeChatId, senderId: currentUserId, senderName: user.name, isTyping: true });

        if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); }
        
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing', { chatId: activeChatId, senderId: currentUserId, senderName: user.name, isTyping: false });
        }, 1000); 
    };

    const sendTextMessage = async () => {
        if (!messageInput.trim()) return;
        
        const sanitizedContent = messageInput.trim().replace(/\n/g, '\\n');
        setMessageInput('');

        try {
            const res = await axios.post(`${API_URL}/text`, { chatId: activeChatId, content: sanitizedContent }, getAxiosConfig());
            
            const broadcastData = { ...res.data, chatId: activeChatId };

            setMessageList(list => [...list, broadcastData]); 
            socket.emit('send_message', broadcastData);

        } catch (err) {
            console.error('Failed to send text message:', err.response?.data || err.message); 
            setMessageInput(sanitizedContent.replace(/\\n/g, '\n')); 
        }
    };
    
    const sendFileMessage = async (file, type) => {
        if (!currentUserId || !file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', activeChatId);
        formData.append('type', type);

        try {
            const res = await axios.post(`${API_URL}/upload`, formData, getAxiosConfig(true)); 
            
            const broadcastData = { ...res.data, chatId: activeChatId };

            setMessageList(list => [...list, broadcastData]); 
            socket.emit('send_message', broadcastData);

        } catch (err) {
            console.error('Failed to send file message:', err.response?.data || err.message);
            alert('File upload failed.');
        } 
    };

    // 🟢 FIX 1: Robust file type checking
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        let type;
        const mimeType = file.type;

        if (mimeType.startsWith('image/')) {
            type = 'image';
        } else if (mimeType === 'application/pdf') {
            type = 'pdf';
        // 🟢 CRITICAL FIX: Add ODT MIME type check
        } else if (mimeType === 'application/vnd.oasis.opendocument.text' || 
                   mimeType === 'application/msword' || 
                   mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   mimeType === 'application/vnd.ms-excel' ||
                   mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
             type = 'document';
        } else {
            // Treat everything else as a general document
            type = 'document'; 
        }
        
        // Basic file size check (e.g., limit to 10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            alert("File is too large. Max size is 10MB.");
            e.target.value = null; 
            return;
        }

        sendFileMessage(file, type);
        e.target.value = null; 
    };

    const handleEditClick = (message) => { 
        setEditingMessageId(message._id); 
        setEditedContent(message.content.replace(/\\n/g, '\n')); 
    };
    
    const handleSaveEdit = async (messageId) => { 
        if (!editedContent.trim()) return;
        
        const sanitizedEditedContent = editedContent.trim().replace(/\n/g, '\\n');

        try {
            await axios.put(`${API_URL}/${messageId}`, { content: sanitizedEditedContent }, getAxiosConfig());
            
            setMessageList(list => list.map(msg => 
                msg._id === messageId ? { ...msg, content: sanitizedEditedContent, edited: true } : msg
            ));
            
            socket.emit('edit_message', { messageId, chatId: activeChatId, newContent: sanitizedEditedContent });

            setEditingMessageId(null);
            setEditedContent('');
        } catch (err) {
            console.error('Failed to save edit:', err);
        }
    };

    const handleDeleteClick = async (messageId, deleteForEveryone) => { 
        if (!window.confirm(`Are you sure you want to delete this message ${deleteForEveryone ? 'for everyone' : 'just for you'}?`)) {
            return;
        }
        
        try {
            await axios.delete(`${API_URL}/${messageId}`, { 
                ...getAxiosConfig(),
                data: { deleteForEveryone, chatId: activeChatId }
            });
            
            if (!deleteForEveryone) {
                setMessageList(list => list.filter(msg => msg._id !== messageId));
            }
            // If deleteForEveryone is true, the socket will handle updating the list
        } catch (err) {
            console.error('Failed to delete message:', err);
        }
    };
    
    // 🟢 FIX 2: Restrict image size display and differentiate documents
    const renderMessageContent = (msg) => {
        const content = msg.content || msg.fileUrl; 
        
        const displayContent = (msg.type === 'text' && content) 
            ? content.replace(/\\n/g, '<br/>') 
            : content;

        const fileSrc = content.startsWith('/uploads/') ? `${SOCKET_URL}${content}` : content;

        if (msg.type === 'image') { 
            // 💡 Uses CSS class .chat-image for max-width/max-height
            return <img src={fileSrc} alt="shared image" className="chat-image" />; 
        } 
        
        const fileName = content.split('/').pop();

        if (msg.type === 'pdf') {
             return <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="chat-document-link pdf-link">
                <span className="file-icon">📄 PDF:</span> {fileName}
            </a>;
        }
        
        if (msg.type === 'document') { 
            return <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="chat-document-link">
                <span className="file-icon">📎 File:</span> {fileName}
            </a>; 
        }
        
        return <div dangerouslySetInnerHTML={{ __html: displayContent }} />;
    };

    if (!user || !currentUserId) { return <div>Redirecting to login...</div>; }

    return (
        <>
            <div className="chat-app-container">
                <div className="chat-sidebar">
                    <h3>👥 Staff Directory</h3>
                    <p className="current-user-tag">Chatting as: **{user.name}**</p>
                    <hr />

                    {/* ADMIN MANAGEMENT OPTION */}
                    {isAdmin && (
                        <div 
                            className={`chat-item admin-view-toggle ${currentView === 'manage-users' ? 'active' : ''}`}
                            onClick={handleManageUsers}
                        >
                            <span className="chat-icon">🛠️</span>
                            <div className="chat-info">
                                <p className="chat-name">**Manage Staff**</p>
                            </div>
                        </div>
                    )}

                    <div className="chat-list">
                        {/* Global Chat Option */}
                        <div 
                            className={`chat-item ${!activeChat && currentView === 'chat' ? 'active' : ''}`}
                            onClick={() => handleChatSelect(null)}
                        >
                            <span className="chat-icon">🌐</span>
                            <div className="chat-info">
                                <p className="chat-name">**Global Staff Group**</p>
                            </div>
                            {unreadCounts['global-staff-group-id'] > 0 && (
                                <span className="unread-badge">{unreadCounts['global-staff-group-id']}</span>
                            )}
                        </div>

                        {staffDirectory.map(member => {
                            const oneOnOneChatId = [currentUserId, member._id].sort().join('_');
                            const count = unreadCounts[oneOnOneChatId] || 0;
                            const isOnline = onlineStatus[member._id];
                            
                            return (
                                <div 
                                    key={member._id} 
                                    className={`chat-item ${activeChat?._id === member._id && currentView === 'chat' ? 'active' : ''}`}
                                    onClick={() => handleChatSelect(member)}
                                >
                                    <span className={`chat-icon user-status-icon ${isOnline ? 'online' : 'offline'}`}>👤</span>
                                    <div className="chat-info">
                                        <p className="chat-name">**{member.name}**</p>
                                        <small className="chat-status">{isOnline ? 'Online' : 'Offline'}</small>
                                    </div>
                                    {count > 0 && (
                                        <span className="unread-badge">{count}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {isAdmin && (
                        <button 
                            className="admin-add-user-button"
                            onClick={openModal}> 
                            ➕ Add New Staff User
                        </button>
                    )}
                    
                    <button 
                        className="logout-button"
                        onClick={() => { 
                            localStorage.clear(); 
                            socket.disconnect(); 
                            navigate('/login'); 
                        }}>
                        Logout
                    </button>
                </div>
                
                <div className="chat-main-area">
                    {currentView === 'chat' ? (
                        <>
                            {/* --- CHAT VIEW --- */}
                            <div className="chat-header">
                                <h4>Current Chat: **{activeChat ? activeChat.name : 'Global Staff Group'}**</h4>
                                {activeChat && (
                                    <small className="chat-header-status">
                                        {onlineStatus[activeChat._id] ? (
                                            <span className="status-online">Online</span>
                                        ) : (
                                            <span className="status-offline">
                                                {formatLastSeen(lastSeenData[activeChat._id] || activeChat.lastActive)}
                                            </span>
                                        )}
                                    </small>
                                )}
                            </div>

                            <div className="message-area">
                                {messageList.map((msg, index) => {
                                    const senderName = msg.sender?.name || 'System';
                                    const isSentByMe = (msg.sender?._id || msg.sender?.id) === currentUserId;

                                    return (
                                        <div key={msg._id || index} className={`message-bubble-wrapper ${isSentByMe ? 'sent' : 'received'}`}>
                                            <div className="message-bubble">
                                                {!isSentByMe && <span className="sender-name-label">{senderName}</span>}
                                                
                                                <div className="message-content">
                                                    
                                                    {editingMessageId === msg._id && isSentByMe ? (
                                                        <div className="edit-mode">
                                                            <textarea 
                                                                value={editedContent}
                                                                onChange={(e) => setEditedContent(e.target.value)}
                                                                rows={Math.min(10, editedContent.split('\n').length + 1)}
                                                            />
                                                            <button onClick={() => handleSaveEdit(msg._id)} disabled={!editedContent.trim()}>Save</button>
                                                            <button onClick={() => setEditingMessageId(null)}>Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="message-text">
                                                                {renderMessageContent(msg)}
                                                                {msg.edited && <small className="edited-tag">(edited)</small>}
                                                            </div>
                                                            {isSentByMe && (
                                                                <div className="message-controls">
                                                                    <button onClick={() => handleEditClick(msg)} title="Edit">✏️</button>
                                                                    <button onClick={() => handleDeleteClick(msg._id, false)} title="Delete Just For Me">🗑️</button>
                                                                    <button onClick={() => handleDeleteClick(msg._id, true)} title="Delete For Everyone">❌</button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <small className="message-timestamp">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </small>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} /> 
                            </div>

                            <div className="input-footer">
                                <div className="typing-status">{typingStatus}</div>
                                <div className="input-area">
                                    <label className="file-upload-btn">
                                        📁
                                        <input type="file" onChange={handleFileChange} style={{display: 'none'}} />
                                    </label>
                                    
                                    <input 
                                        type="text" 
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={handleTyping}
                                        onKeyDown={(e) => { if (e.key === 'Enter') sendTextMessage(); }}
                                        className="message-input"
                                    />
                                    <button onClick={sendTextMessage} disabled={!messageInput.trim()} className="send-btn">Send</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        // --- ADMIN MANAGEMENT VIEW ---
                        <div className="admin-management-view">
                            <UserManagement />
                        </div>
                    )}
                </div>
            </div>
            
            {isModalOpen && isAdmin && (
                <AdminRegisterModal 
                    onClose={closeModal} 
                    onUserRegistered={handleUserRegistered}
                />
            )}
        </>
    );
};

export default Chat;