import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  MapIcon,
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CameraIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Import sub-components
import TripDashboard from '../components/travel-planner/TripDashboard';
import TripWizard from '../components/travel-planner/TripWizard';
import TripDetails from '../components/travel-planner/TripDetails';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
  tripType?: string;
  totalBudget?: number;
  actualSpent?: number;
  currency: string;
  coverPhoto?: string;
  description?: string;
  _count?: {
    TripExpenses: number;
    TripPhotos: number;
    TripCompanions: number;
  };
}

type ViewMode = 'dashboard' | 'new' | 'details';

const TravelPlannerPage: React.FC = () => {
  const { user, token } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    tripType: '',
    upcoming: false
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    if (viewMode === 'dashboard') {
      fetchTrips();
    }
  }, [viewMode, filter]);

  const fetchTrips = async () => {
    const userId = (user as any)?.id || (user as any)?.userId;
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.tripType) params.append('tripType', filter.tripType);
      if (filter.upcoming) params.append('upcoming', 'true');

      const response = await axios.get(`${apiUrl}/travel/trips?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async (tripData: any) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${apiUrl}/travel/trips`, tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedTrip(response.data.trip);
      setViewMode('details');
      toast.success('Trip created successfully!');
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setViewMode('details');
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setSelectedTrip(updatedTrip);
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;
    
    try {
      await axios.delete(`${apiUrl}/travel/trips/${selectedTrip.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTrips(trips.filter(t => t.id !== selectedTrip.id));
      setSelectedTrip(null);
      setViewMode('dashboard');
      toast.success('Trip deleted successfully');
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Travel & Trip Planner
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Plan your perfect journey
                </p>
              </div>
            </div>
            
            {viewMode === 'dashboard' && (
              <button
                onClick={() => setViewMode('new')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Trip
              </button>
            )}
            
            {viewMode !== 'dashboard' && (
              <button
                onClick={() => {
                  setViewMode('dashboard');
                  setSelectedTrip(null);
                }}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <MapIcon className="h-5 w-5 mr-2" />
                All Trips
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {viewMode === 'dashboard' && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{trips.length}</p>
                <p className="text-sm opacity-90">Total Trips</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {trips.filter(t => t.status === 'ongoing').length}
                </p>
                <p className="text-sm opacity-90">Ongoing</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {trips.filter(t => t.status === 'planning').length}
                </p>
                <p className="text-sm opacity-90">Planning</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {trips.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-sm opacity-90">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'dashboard' && (
          <TripDashboard
            trips={trips}
            isLoading={isLoading}
            onTripSelect={handleSelectTrip}
            onNewTrip={() => setViewMode('new')}
            filter={filter}
            onFilterChange={setFilter}
          />
        )}

        {viewMode === 'new' && (
          <TripWizard
            onCreateTrip={handleCreateTrip}
            onCancel={() => setViewMode('dashboard')}
            isLoading={isLoading}
          />
        )}

        {viewMode === 'details' && selectedTrip && (
          <TripDetails
            trip={selectedTrip}
            onUpdate={handleUpdateTrip}
            onDelete={handleDeleteTrip}
            onBack={() => {
              setViewMode('dashboard');
              setSelectedTrip(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TravelPlannerPage;