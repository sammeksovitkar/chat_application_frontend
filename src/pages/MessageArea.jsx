import React from 'react';

// Helper function to render different message types (text, image, document)
const renderMessageContent = (msg, socketUrl) => {
    const content = msg.content || msg.fileUrl; 
    
    // Convert escaped newlines back to HTML breaks for display
    const displayContent = (msg.type === 'text' && content) 
        ? content.replace(/\\n/g, '<br/>') 
        : content;

    const fileSrc = content.startsWith('/uploads/') ? `${socketUrl}${content}` : content;

    if (msg.type === 'image') { 
        return <img src={fileSrc} alt="shared image" className="chat-image" />; 
    } 
    if (msg.type === 'document' || msg.type === 'pdf') { 
        return <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="chat-document-link">📄 {msg.type === 'pdf' ? 'PDF' : 'Document'}: {content.split('/').pop()}</a>; 
    }
    // For text messages, use dangerouslySetInnerHTML to render <br/>
    return <div dangerouslySetInnerHTML={{ __html: displayContent }} />;
};

const MessageArea = ({
    messageList,
    currentUserId,
    editingMessageId,
    editedContent,
    setEditedContent,
    setEditingMessageId,
    handleSaveEdit,
    handleDeleteClick,
    messagesEndRef,
    socketUrl,
    onEditClick
}) => {
    return (
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
                                            {renderMessageContent(msg, socketUrl)}
                                            {msg.edited && <small className="edited-tag">(edited)</small>}
                                        </div>
                                        {isSentByMe && (
                                            <div className="message-controls">
                                                <button onClick={() => onEditClick(msg)} title="Edit">✏️</button>
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
    );
};

export default MessageArea;