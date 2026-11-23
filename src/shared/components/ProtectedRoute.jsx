import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApar } from '../context/AparContext';

export default function ProtectedRoute({ children }) {
  const { currentUser } = useApar();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
