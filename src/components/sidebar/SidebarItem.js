import React, { useRef, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const SidebarItem = ({
  item,
  collapsed,
  isOpen = false,
  toggleSubMenu,
  currentPath
}) => {
  const submenuRef = useRef(null);
  const [submenuHeight, setSubmenuHeight] = useState(null);
  
  // Determine if any child is active
  const hasActiveChild = item.children?.some(child => child.path === currentPath);
  
  // Calculate submenu height for animation
  useEffect(() => {
    if (submenuRef.current) {
      setSubmenuHeight(submenuRef.current.scrollHeight);
    }
  }, [item.children]);

  // Handle simple menu item (without children)
  if (!item.children) {
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
      >
        <div className="menu-icon">{item.icon}</div>
        {!collapsed && <span className="menu-label">{item.name}</span>}
        {!collapsed && <div className="hover-indicator" />}
      </NavLink>
    );
  }

  // Handle parent menu item with children
  return (
    <div className={`menu-group ${hasActiveChild ? 'has-active-child' : ''}`}>
      <div
        className={`parent-item ${isOpen ? 'open' : ''}`}
        onClick={toggleSubMenu}
      >
        <div className="menu-icon">{item.icon}</div>
        {!collapsed && (
          <>
            <span className="menu-label">{item.name}</span>
            <ChevronDown 
              className={`arrow-icon ${isOpen ? 'open' : ''}`}
              size={16}
            />
            <div className="hover-indicator" />
          </>
        )}
      </div>

      {!collapsed && (
        <div 
          className="submenu-container" 
          style={{ 
            height: isOpen && submenuHeight ? submenuHeight : 0 
          }}
        >
          <div className="submenu" ref={submenuRef}>
            {item.children.map((child) => (
              <NavLink
                to={child.path}
                key={child.name}
                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
              >
                <div className="submenu-icon">{child.icon}</div>
                <span className="submenu-label">{child.name}</span>
                <div className="hover-indicator" />
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
