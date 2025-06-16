import React from 'react';
import FuelIcon from '../icons/Icons'; // Import FuelIcon as default export
import { ChevronLeft, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';


const SidebarHeader = ({ collapsed, toggleSidebar }) => {
  return (
    <div className="sidebar-header">
      <div className="logo-container">
  
        {!collapsed && (
          <Link to="/" className="logo-text" style={{ textDecoration: 'none' }}>
          <h2>RAJASHRI</h2>
          <p>FUELS</p>
        </Link>
        )}
      </div>
      
      <button 
        className="toggle-btn" 
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
      </button>
    </div>
  );
};

export default SidebarHeader;
