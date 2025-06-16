import React, { useEffect, useState } from 'react';
import { useUser } from '../contextApi/UserContext';

const Dashboard = () => {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="bg-white shadow-md p-8 rounded-lg text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-700">📊 Dashboard Overview</h2>
        <p className="text-lg text-gray-600">👤 User: <span className="font-medium">{user.username}</span></p>
        <p className="text-lg text-gray-600">🕒 Time: <span className="font-medium">{currentTime}</span></p>
        <p className="text-lg text-gray-600">🔄 Shift: <span className="font-medium">{user.shiftNo}</span></p>
        <p className="text-lg text-gray-600">📅 Shift Date: <span className="font-medium">{user.shiftDate}</span></p>
      </div>
    </div>
  );
};

export default Dashboard;
