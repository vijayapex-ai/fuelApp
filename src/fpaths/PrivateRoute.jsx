import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contextApi/UserContext';

const PrivateRoute = ({ children }) => {
  const { user } = useUser();

  return user ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
