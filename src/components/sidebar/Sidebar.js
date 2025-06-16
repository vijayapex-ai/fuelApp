import React, { useState, useEffect } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarItem from './SidebarItem';
import { menuItems } from './sidebarData';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contextApi/UserContext';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const { logout } = useUser();

  // Close all submenus when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setOpenMenus({});
    }
  }, [collapsed]);

  // Set active menu based on current route
  useEffect(() => {
    let activeMenu = '';

    menuItems.forEach(item => {
      if (item.children) {
        item.children.forEach(child => {
          if (child.path === location.pathname) {
            activeMenu = item.name;
          }
        });
      }
    });

    if (activeMenu && !collapsed) {
      setOpenMenus(prev => ({ ...prev, [activeMenu]: true }));
    }
  }, [location.pathname, collapsed]);

  const toggleSidebar = () => setCollapsed(!collapsed);

  const toggleSubMenu = (name) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = () => {
    logout()        // Clear context
    navigate('/');         // Redirect to login page
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <SidebarHeader collapsed={collapsed} toggleSidebar={toggleSidebar} />

      <div className="sidebar-content">
        <nav className="menu-list">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.name}
              item={item}
              collapsed={collapsed}
              isOpen={openMenus[item.name]}
              toggleSubMenu={() => toggleSubMenu(item.name)}
              currentPath={location.pathname}
            />
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          {!collapsed && (
            <div className="user-details">
              <p className="user-name">{user?.username}</p>
              <p className="user-role">{user?.role || 'User'}</p>
            </div>
          )}
          <div className="user-avatar">
            <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
        </div>

        {/* Logout Button */}
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white mt-3 p-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
