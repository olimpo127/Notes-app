import { Outlet, Navigate } from 'react-router-dom';
import { Context } from '../store/context';
import React, { useContext } from 'react';

const PrivateRoutes = () => {
  const contextValue = useContext(Context);

  // Check if the context value is null or undefined
  if (!contextValue) {
    // Handle the case where the context value is null, e.g., redirect to login
    return <Navigate to="/" />;
  }

  // Destructure the 'store' property from the context value
  const { store } = contextValue;
  const { token } = store;
  const isAuthenticated = token !== '';

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoutes;
