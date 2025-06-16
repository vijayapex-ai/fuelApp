import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/SidebarLayout.css';

const FuelIcon = ({ size = 48 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#ff0000"
  >
    <path d="M12 2C9 2 6 5.1 6 8.5C6 12 12 22 12 22C12 22 18 12 18 8.5C18 5.1 15 2 12 2z" />
  </svg>
);

const SidebarLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  const toggleSidebar = () => setCollapsed(!collapsed);

  const toggleSubMenu = (name) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const menuItems = [
    { name: 'BILL ENTRY', path: '/fuel-entry', icon: '⛽' },
    { name: 'GST BILL', path: '/gst-bill', icon: '📋' },
    { name: 'PUMP READING', path: '/pump-reading', icon: '📈' },
    {
      name: 'MASTER',
        icon: '🗃️', // Changed from 🗂️ to 🗃️ (more like a master filing system)
        children: [
          { name: 'ADD PRODUCT', path: '/add-product', icon: '🆕📦' },        // New + Package
          { name: 'ADD PRICE', path: '/add-price', icon: '💰📝' },            // Price + Edit
          { name: 'ASSIGN GST HSN', path: '/add-gst', icon: '📄💲' },         // Document + Dollar
          { name: 'PRODUCT MASTER', path: '/add-productmaster', icon: '📋' }, // List + Plus
          { name: 'ADD CUSTOMER', path: '/add-customermaster', icon: '🙍' }, // Person + Plus
          { name: 'ASSIGN VECHILE', path: '/assign-vechile', icon: '🚚' },  // Truck + Wrench
        ],
    },
  ];

  return (
    <div className="layout-container">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            {collapsed ? <FuelIcon size={54} /> : <h2 className="logo-text">RAJASHRI FUELS</h2>}
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {collapsed ? '☰' : '✖'}
          </button>
        </div>

        <nav className="menu-list">
          {menuItems.map((item) => {
            if (!item.children) {
              return (
                <NavLink
                  to={item.path}
                  key={item.name}
                  className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                >
                  <span className="icon">{item.icon}</span>
                  {!collapsed && <span className="label">{item.name}</span>}
                </NavLink>
              );
            }

            // Parent with submenu
            return (
              <div key={item.name} className="menu-group">
                <div
                  className="parent-item"
                  onClick={() => toggleSubMenu(item.name)}
                >
                  <span className="icon">{item.icon}</span>
                  {!collapsed && <span className="label">{item.name}</span>}
                  {!collapsed && (
                    <span className="arrow">{openMenus[item.name] ? '▼' : '▶'}</span>
                  )}
                </div>

                {!collapsed && openMenus[item.name] && (
                  <div className="submenu">
                    {item.children.map((child) => (
                      <NavLink
                        to={child.path}
                        key={child.name}
                        className={({ isActive }) =>
                          `sub-item ${isActive ? 'active' : ''}`
                        }
                      >
                        <span className="icon">{child.icon}</span>
                        <span className="label">{child.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="main-content">
        <div className="content-body">{children}</div>
      </main>
    </div>
  );
};

export default SidebarLayout;