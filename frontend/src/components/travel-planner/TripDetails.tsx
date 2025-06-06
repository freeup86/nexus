import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CameraIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ClipboardDocumentListIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
// Using native JavaScript Date methods instead of date-fns
import { toast } from 'react-hot-toast';
import TripItinerary from './TripItinerary';
import TripExpenses from './TripExpenses';
import PackingList from './PackingList';
import TripDocuments from './TripDocuments';
import TripPhotos from './TripPhotos';
import TripCompanions from './TripCompanions';

interface TripDetailsProps {
  trip: any;
  onUpdate: (trip: any) => void;
  onDelete: () => void;
  onBack: () => void;
}

type TabType = 'overview' | 'itinerary' | 'expenses' | 'packing' | 'documents' | 'photos' | 'companions';

const TripDetails: React.FC<TripDetailsProps> = ({
  trip: initialTrip,
  onUpdate,
  onDelete,
  onBack
}) => {
  const { token, user } = useAuth();
  const [trip, setTrip] = useState(initialTrip);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    fetchTripDetails();
  }, [initialTrip.id]);

  const fetchTripDetails = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/travel/trips/${initialTrip.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(response.data.trip);
      onUpdate(response.data.trip);
    } catch (error) {
      console.error('Error fetching trip details:', error);
      toast.error('Failed to load trip details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await axios.put(
        `${apiUrl}/travel/trips/${trip.id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTrip({ ...trip, status: newStatus });
      onUpdate(response.data.trip);
      toast.success('Trip status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
    { id: 'itinerary', name: 'Itinerary', icon: CalendarIcon },
    { id: 'expenses', name: 'Expenses', icon: ReceiptPercentIcon },
    { id: 'packing', name: 'Packing List', icon: ClipboardDocumentListIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
    { id: 'photos', name: 'Photos', icon: CameraIcon },
    { id: 'companions', name: 'Travelers', icon: UserGroupIcon }
  ];

  const renderOverview = () => {
    const budgetPercentage = trip.totalBudget && trip.actualSpent ? 
      Math.round((Number(trip.actualSpent) / Number(trip.totalBudget)) * 100) : 0;
    
    return (
      <div className="space-y-6">
        {/* Trip Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {trip.title}
              </h2>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPinIcon className="h-5 w-5 mr-2" />
                {trip.destination}
              </div>
            </div>
            <select
              value={trip.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}
            >
              <option value="planning">Planning</option>
              <option value="booked">Booked</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
              <span className="text-sm">
                {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {trip.tripType && (
              <div className="flex items-center">
                <span className="text-sm">Type: {trip.tripType}</span>
              </div>
            )}
          </div>

          {trip.description && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {trip.description}
            </p>
          )}
        </div>

        {/* Budget Overview */}
        {trip.totalBudget && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span>Total Budget</span>
                <span className="font-semibold">
                  {trip.currency} {trip.totalBudget ? Number(trip.totalBudget).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Spent</span>
                <span className={`font-semibold ${budgetPercentage > 90 ? 'text-red-600' : ''}`}>
                  {trip.currency} {trip.actualSpent ? Number(trip.actualSpent).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Remaining</span>
                <span className="font-semibold text-green-600">
                  {trip.currency} {trip.totalBudget && trip.actualSpent ? (Number(trip.totalBudget) - Number(trip.actualSpent)).toFixed(2) : (trip.totalBudget ? Number(trip.totalBudget).toFixed(2) : '0.00')}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  budgetPercentage > 90 ? 'bg-red-500' : 
                  budgetPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, budgetPercentage)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {budgetPercentage}% of budget used
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <CameraIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-2xl font-bold">{trip.TripPhotos?.length || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Photos</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <UserGroupIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-2xl font-bold">{(trip.TripCompanions?.length || 0) + 1}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Travelers</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <ReceiptPercentIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-2xl font-bold">{trip.TripExpenses?.length || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
            <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-2xl font-bold">{trip.TripDocuments?.length || 0}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
          </div>
        </div>
      </div>
    );
  };

  const renderComingSoon = (feature: string) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {feature} Coming Soon!
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        This feature is under development and will be available shortly.
      </p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Trips
        </button>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trip Details
          </h1>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'itinerary' && (
            <TripItinerary 
              tripId={trip.id} 
              startDate={trip.startDate} 
              endDate={trip.endDate} 
            />
          )}
          {activeTab === 'expenses' && (
            <TripExpenses 
              tripId={trip.id} 
              currency={trip.currency} 
              totalBudget={trip.totalBudget ? Number(trip.totalBudget) : undefined} 
            />
          )}
          {activeTab === 'packing' && (
            <PackingList 
              tripId={trip.id} 
              tripType={trip.tripType} 
              destination={trip.destination} 
            />
          )}
          {activeTab === 'documents' && (
            <TripDocuments tripId={trip.id} />
          )}
          {activeTab === 'photos' && (
            <TripPhotos tripId={trip.id} />
          )}
          {activeTab === 'companions' && (
            <TripCompanions tripId={trip.id} currentUserId={user?.id || ''} />
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Trip?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this trip? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetails;