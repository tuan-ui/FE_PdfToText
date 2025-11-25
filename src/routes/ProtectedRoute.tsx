import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
  children: React.ReactElement;
  required?: string;
}

interface DecodedToken {
  sub: string;
  user_id: string;
  fullName: string;
  email: string;
  role: string;
  isAdmin: string;
  exp: number;
  iat: number;
  permissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  required,
}) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth/signin" replace />;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);

    // 🔒 Token hết hạn
    if (decoded.exp && decoded.exp < now) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return <Navigate to="/auth/signin" replace />;
    }

    // 🔑 Kiểm tra quyền
    const permissions = decoded.permissions || [];
    const isAdmin = decoded.isAdmin === 'true';

    // Nếu yêu cầu quyền cụ thể mà user không có và không phải admin
    if (required && !permissions.includes(required) && !isAdmin) {
      return <Navigate to="/errors/403" replace />;
    }

    return children;
  } catch (err) {
    console.error('JWT decode error:', err);
    return <Navigate to="/errors/403" replace />;
  }
};

export default ProtectedRoute;
