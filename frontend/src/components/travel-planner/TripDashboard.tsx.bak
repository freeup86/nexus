import React from 'react';
import {
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CameraIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  MapIcon
} from '@heroicons/react/24/outline';
// Using native JavaScript Date methods instead of date-fns

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

interface TripDashboardProps {
  trips: Trip[];
  isLoading: boolean;
  onTripSelect: (trip: Trip) => void;
  onNewTrip: () => void;
  filter: {
    status: string;
    tripType: string;
    upcoming: boolean;
  };
  onFilterChange: (filter: any) => void;
}

const TripDashboard: React.FC<TripDashboardProps> = ({
  trips,
  isLoading,
  onTripSelect,
  onNewTrip,
  filter,
  onFilterChange
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'booked':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'ongoing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTripTypeIcon = (type?: string) => {
    switch (type) {
      case 'business':
        return '💼';
      case 'leisure':
        return '🏖️';
      case 'family':
        return '👨‍👩‍👧‍👦';
      case 'adventure':
        return '🏔️';
      case 'romantic':
        return '❤️';
      default:
        return '✈️';
    }
  };

  const getDaysUntilTrip = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days < 0) return null;
    if (days === 0) return 'Today!';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const getBudgetPercentage = (budget?: number, spent?: number) => {
    if (!budget || !spent) return 0;
    return Math.min(100, Math.round((Number(spent) / Number(budget)) * 100));
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = (trip.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trip.destination || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filter.status}
                  onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="booked">Booked</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trip Type
                </label>
                <select
                  value={filter.tripType}
                  onChange={(e) => onFilterChange({ ...filter, tripType: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="leisure">Leisure</option>
                  <option value="business">Business</option>
                  <option value="family">Family</option>
                  <option value="adventure">Adventure</option>
                  <option value="romantic">Romantic</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.upcoming}
                    onChange={(e) => onFilterChange({ ...filter, upcoming: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upcoming trips only
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-12">
          <MapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || filter.status || filter.tripType || filter.upcoming
              ? 'No trips found'
              : 'No trips yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filter.status || filter.tripType || filter.upcoming
              ? 'Try adjusting your filters'
              : 'Start planning your next adventure!'}
          </p>
          {!searchTerm && !filter.status && !filter.tripType && !filter.upcoming && (
            <button
              onClick={onNewTrip}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Trip
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const daysUntil = getDaysUntilTrip(trip.startDate);
            const budgetPercentage = getBudgetPercentage(trip.totalBudget, trip.actualSpent);
            const isUpcoming = new Date(trip.startDate) > new Date();

            return (
              <div
                key={trip.id}
                onClick={() => onTripSelect(trip)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              >
                {/* Cover Photo or Placeholder */}
                {trip.coverPhoto ? (
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                    <img
                      src={trip.coverPhoto}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="text-2xl">{getTripTypeIcon(trip.tripType)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                    <MapPinIcon className="h-16 w-16 text-white opacity-50" />
                    <div className="absolute top-2 right-2">
                      <span className="text-2xl">{getTripTypeIcon(trip.tripType)}</span>
                    </div>
                  </div>
                )}

                {/* Trip Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
                      {trip.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {trip.destination}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Days Until Trip */}
                  {daysUntil && isUpcoming && (
                    <div className="mb-3">
                      <div className="flex items-center text-sm font-medium text-blue-600">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {daysUntil} until departure
                      </div>
                    </div>
                  )}

                  {/* Budget Progress */}
                  {trip.totalBudget && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Budget</span>
                        <span className="font-medium">
                          {trip.currency} {trip.actualSpent ? Number(trip.actualSpent).toFixed(0) : '0'} / {trip.totalBudget ? Number(trip.totalBudget).toFixed(0) : '0'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            budgetPercentage > 90 ? 'bg-red-500' : 
                            budgetPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${budgetPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Trip Stats */}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CameraIcon className="h-3 w-3 mr-1" />
                      {trip._count?.TripPhotos || 0} photos
                    </div>
                    <div className="flex items-center">
                      <UserGroupIcon className="h-3 w-3 mr-1" />
                      {(trip._count?.TripCompanions || 0) + 1} people
                    </div>
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                      {trip._count?.TripExpenses || 0} expenses
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TripDashboard;