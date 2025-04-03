import React, { useState } from 'react';
import './ChatBubble.css';

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chat-container">
      {isOpen ? (
        <div className="chat-window">
          <div className="chat-header">
            <span>数据处理报告</span>
            <button className="close-btn" onClick={toggleChat}>×</button>
          </div>
          <div className="chat-body">
            <iframe 
              src="https://uat.agentspro.cn/agent/outlink?hash=CINDQ1SSSDB" 
              title="数据处理报告"
              width="100%"
              height="100%"
              frameBorder="0"
            />
          </div>
        </div>
      ) : (
        <div className="chat-bubble" onClick={toggleChat}>
          <i className="bi bi-chat-dots-fill"></i>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;