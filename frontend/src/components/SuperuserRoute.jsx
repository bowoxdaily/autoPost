import { Navigate } from 'react-router-dom';

export default function SuperuserRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('authToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'superuser') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
