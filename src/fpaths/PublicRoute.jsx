import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contextApi/UserContext';

const PublicRoute = ({ children }) => {
  const { user } = useUser();

  return user ? <Navigate to="/home" replace /> : children;
};

export default PublicRoute;
