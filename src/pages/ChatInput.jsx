import React from 'react';

const ChatInput = ({
    messageInput,
    typingStatus,
    handleTyping,
    sendTextMessage,
    sendFileMessage
}) => {
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        let type = file.type.startsWith('image/') ? 'image' : 
                   file.type === 'application/pdf' ? 'pdf' : 
                   'document';
        
        sendFileMessage(file, type);
        e.target.value = null; // Reset input for next file
    };

    return (
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
                    onKeyDown={(e) => { 
                        // Allow shift+enter for new line, only send on simple Enter
                        if (e.key === 'Enter' && !e.shiftKey) { 
                            e.preventDefault(); // Prevent default newline
                            sendTextMessage(); 
                        } 
                    }}
                    className="message-input"
                />
                <button onClick={sendTextMessage} disabled={!messageInput.trim()} className="send-btn">Send</button>
            </div>
        </div>
    );
};

export default ChatInput;