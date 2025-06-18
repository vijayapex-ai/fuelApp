import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import '../../styles/layout/sidebar.css';
import { useUser } from '../../contextApi/UserContext';

const SidebarLayout = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const logoutWarningShown = useRef(false);

  useEffect(() => {
    if (!user) return;

    const checkLogoutTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Get shift info from user context
      const shiftEndTime = user.shiftNo === 1 ? 
        { hours: 19, minutes: 30 } : // Evening shift ends at 7:30 PM
        { hours: 6, minutes: 0 };    // Morning shift ends at 6:00 AM

      // Check if current time is within 5 minutes of shift end
      const nearLogoutTime = 
        hours === shiftEndTime.hours && 
        minutes >= shiftEndTime.minutes - 5 &&
        minutes <= shiftEndTime.minutes + 5;

      // Exact logout time
      const isLogoutTime = 
        hours === shiftEndTime.hours && 
        minutes >= shiftEndTime.minutes;

      if (nearLogoutTime && !logoutWarningShown.current) {
        alert(`Your shift will end in ${shiftEndTime.minutes - minutes} minutes!`);
        logoutWarningShown.current = true;
      }

      if (isLogoutTime) {
        alert('Auto logout due to shift time!');
        setUser(null);
        navigate('/');
        return true; // Indicate logout occurred
      }
      return false;
    };

    const interval = setInterval(() => {
      checkLogoutTime();
    }, 30000); // check every 30 seconds

    // Initial check
    const didLogout = checkLogoutTime();
    if (didLogout) clearInterval(interval);

    return () => clearInterval(interval);
  }, [navigate, setUser, user]);

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content" style={{padding:'10px'}}>
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;