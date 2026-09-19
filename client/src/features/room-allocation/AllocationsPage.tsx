import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { RoomBookingPage } from '@/features/hostel/pages/RoomBookingPage';

/**
 * Consolidated Allocations Route:
 * Automatically redirects to the unified Rooms & Allocations Hub (/admin/rooms or /warden/rooms)
 * where staff can directly view live resident rosters, bed occupancy, and allocate/vacate students.
 */
export function AllocationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const target = user?.role === 'WARDEN' ? '/warden/rooms' : '/admin/rooms';
    navigate(target, { replace: true });
  }, [user, navigate]);

  return <RoomBookingPage />;
}
