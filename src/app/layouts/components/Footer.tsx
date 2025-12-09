import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-card text-text-light h-14 px-6 z-40 border-t border-border flex items-center isolate-parts"
    >
      <div className="flex justify-between items-center h-full w-full text-sm">
        <div className="footer-left">
          <span className="text-text"> &copy; {currentYear} God-Did Mart.</span> All rights reserved.
        </div>
        <div className="flex gap-4">
          <a 
            href="/terms"
            className="text-text-light no-underline transition-colors duration-200 hover:text-primary-50 "
          >
            Terms of Service
          </a>
          <a 
            href="/contact-us"
            className="text-text-light no-underline transition-colors duration-200 hover:text-primary-50 "
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;