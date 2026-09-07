import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/providers/AuthProvider';
import { HostelSecurityDashboard } from './HostelSecurityDashboard';
import { MessSecurityDashboard } from './MessSecurityDashboard';
import { UnassignedSecurityDashboard } from './UnassignedSecurityDashboard';

export const SecurityDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch live user profile to get fresh assigned hostel / mess
  const {
    data: profileData,
    refetch: refetchProfile,
    isFetching: isFetchingProfile,
  } = useQuery({
    queryKey: ['security-profile'],
    queryFn: () => authApi.getProfile(),
    staleTime: 15000,
  });

  const securityUser = (profileData?.data as any)?.data || user;

  const isMess =
    securityUser?.assignmentType === 'MESS' ||
    (Boolean(securityUser?.assignedMess) && !securityUser?.assignedHostel);

  const isHostel =
    securityUser?.assignmentType === 'HOSTEL' ||
    Boolean(securityUser?.assignedHostel);

  if (isMess) {
    return <MessSecurityDashboard securityUser={securityUser} />;
  }

  if (isHostel) {
    return <HostelSecurityDashboard securityUser={securityUser} />;
  }

  return (
    <UnassignedSecurityDashboard
      securityUser={securityUser}
      onRefresh={refetchProfile}
      isRefreshing={isFetchingProfile}
    />
  );
};

export default SecurityDashboard;
