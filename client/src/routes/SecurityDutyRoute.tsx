import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

interface SecurityDutyRouteProps {
  children: React.ReactNode;
  allowedDuty: 'HOSTEL' | 'MESS';
}

export const SecurityDutyRoute: React.FC<SecurityDutyRouteProps> = ({ children, allowedDuty }) => {
  const { user } = useAuth();

  if (!user || user.role !== 'SECURITY') {
    return <>{children}</>;
  }

  const isMess =
    user.assignmentType === 'MESS' ||
    (Boolean(user.assignedMess) && !user.assignedHostel);

  const isHostel =
    user.assignmentType === 'HOSTEL' ||
    Boolean(user.assignedHostel);

  if (allowedDuty === 'HOSTEL' && isMess) {
    return <Navigate to="/security/mess-entry" replace />;
  }

  if (allowedDuty === 'MESS' && isHostel) {
    return <Navigate to="/security/attendance" replace />;
  }

  if (!isMess && !isHostel) {
    return <Navigate to="/security/dashboard" replace />;
  }

  return <>{children}</>;
};
