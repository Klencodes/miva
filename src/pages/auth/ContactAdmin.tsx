// src/pages/ContactAdmin.tsx
import React from 'react';
import { useUser } from '../../core/contexts/StoreProvider';

const ContactAdmin: React.FC = () => {
  const { user } = useUser();
  
  return (
    <div className="contact-admin-container">
      <h1>Contact Your Administrator</h1>
      <p>You don't have any entities assigned to your account.</p>
      <p>Please contact your system administrator to get entity access.</p>
      {user?.email && (
        <div className="user-info">
          <p><strong>Your Email:</strong> {user.email}</p>
          <p><strong>Your Role:</strong> {user.role}</p>
        </div>
      )}
      <div className="contact-actions">
        <button 
          onClick={() => window.location.href = "mailto:admin@example.com"}
          className="contact-button"
        >
          Contact Admin
        </button>
        <button 
          onClick={() => window.location.href = "/account/login"}
          className="logout-button"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ContactAdmin;