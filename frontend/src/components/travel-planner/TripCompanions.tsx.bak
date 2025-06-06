import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  UserGroupIcon,
  TrashIcon,
  PencilIcon,
  EnvelopeIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface TripCompanion {
  id: string;
  userId?: string;
  email?: string;
  name: string;
  role: string;
  status: string;
  joinedAt?: string;
  createdAt: string;
}

interface TripCompanionsProps {
  tripId: string;
  currentUserId: string;
}

const TripCompanions: React.FC<TripCompanionsProps> = ({ tripId, currentUserId }) => {
  const { token } = useAuth();
  const [companions, setCompanions] = useState<TripCompanion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState<TripCompanion | null>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const roles = [
    { value: 'organizer', label: 'Organizer', color: 'bg-purple-500' },
    { value: 'companion', label: 'Companion', color: 'bg-blue-500' }
  ];

  const statusTypes = [
    { value: 'invited', label: 'Invited', color: 'bg-yellow-500' },
    { value: 'accepted', label: 'Accepted', color: 'bg-green-500' },
    { value: 'declined', label: 'Declined', color: 'bg-red-500' }
  ];

  const [companionForm, setCompanionForm] = useState({
    name: '',
    email: '',
    role: 'companion'
  });

  useEffect(() => {
    fetchCompanions();
  }, [tripId]);

  const fetchCompanions = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/travel/trips/${tripId}/companions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCompanions(response.data.companions || []);
    } catch (error) {
      console.error('Error fetching companions:', error);
      toast.error('Failed to load companions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompanion = async () => {
    if (!companionForm.name) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const companionData = {
        ...companionForm,
        status: 'invited'
      };

      if (editingCompanion) {
        await axios.put(
          `${apiUrl}/travel/trips/${tripId}/companions/${editingCompanion.id}`,
          companionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Companion updated successfully');
      } else {
        await axios.post(
          `${apiUrl}/travel/trips/${tripId}/companions`,
          companionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Companion added successfully');
      }

      setShowAddModal(false);
      setEditingCompanion(null);
      setCompanionForm({
        name: '',
        email: '',
        role: 'companion'
      });
      fetchCompanions();
    } catch (error) {
      console.error('Error saving companion:', error);
      toast.error('Failed to save companion');
    }
  };

  const handleDeleteCompanion = async (companionId: string) => {
    if (!window.confirm('Are you sure you want to remove this traveler?')) return;

    try {
      await axios.delete(
        `${apiUrl}/travel/trips/${tripId}/companions/${companionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Companion removed successfully');
      fetchCompanions();
    } catch (error) {
      console.error('Error deleting companion:', error);
      toast.error('Failed to remove companion');
    }
  };

  const handleEditCompanion = (companion: TripCompanion) => {
    setEditingCompanion(companion);
    setCompanionForm({
      name: companion.name,
      email: companion.email || '',
      role: companion.role
    });
    setShowAddModal(true);
  };

  const handleUpdateStatus = async (companionId: string, newStatus: string) => {
    try {
      await axios.put(
        `${apiUrl}/travel/trips/${tripId}/companions/${companionId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Status updated successfully');
      fetchCompanions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getRoleColor = (role: string) => {
    const roleInfo = roles.find(r => r.value === role);
    return roleInfo?.color || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const statusInfo = statusTypes.find(s => s.value === status);
    return statusInfo?.color || 'bg-gray-500';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'organizer':
        return '👑';
      case 'companion':
        return '👤';
      default:
        return '👤';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return '✅';
      case 'declined':
        return '❌';
      case 'invited':
        return '⏳';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Trip Companions</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Traveler
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{companions.length + 1}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Travelers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {companions.filter(c => c.status === 'accepted').length + 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Confirmed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {companions.filter(c => c.status === 'invited').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {companions.filter(c => c.role === 'organizer').length + 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Organizers</div>
          </div>
        </div>
      </div>

      {/* Companions List */}
      <div className="space-y-4">
        {/* Current User (Trip Creator) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">👑</div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    You (Trip Creator)
                  </h4>
                  <span className="px-2 py-1 text-xs rounded-full text-white bg-purple-500">
                    Organizer
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full text-white bg-green-500">
                    ✅ Confirmed
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Trip organizer and main contact
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Added Companions */}
        {companions.map((companion) => (
          <div
            key={companion.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 ${
              companion.status === 'accepted' ? 'border-green-500' :
              companion.status === 'declined' ? 'border-red-500' :
              'border-yellow-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{getRoleIcon(companion.role)}</div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {companion.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${getRoleColor(companion.role)}`}>
                      {roles.find(r => r.value === companion.role)?.label}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(companion.status)}`}>
                      {getStatusIcon(companion.status)} {statusTypes.find(s => s.value === companion.status)?.label}
                    </span>
                  </div>
                  
                  {companion.email && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {companion.email}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Added {new Date(companion.createdAt).toLocaleDateString()}
                    {companion.joinedAt && companion.status === 'accepted' && (
                      <span className="ml-2">
                        • Joined {new Date(companion.joinedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Status Update Buttons */}
                {companion.status === 'invited' && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleUpdateStatus(companion.id, 'accepted')}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Mark as accepted"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(companion.id, 'declined')}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Mark as declined"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => handleEditCompanion(companion)}
                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  title="Edit companion"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteCompanion(companion.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Remove companion"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {companions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No companions added yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add travel companions to share this trip with friends and family
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Traveler
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Companion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCompanion ? 'Edit Traveler' : 'Add Traveler'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={companionForm.name}
                  onChange={(e) => setCompanionForm({...companionForm, name: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={companionForm.email}
                  onChange={(e) => setCompanionForm({...companionForm, email: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Email address (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email can be used to send trip invitations in the future
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={companionForm.role}
                  onChange={(e) => setCompanionForm({...companionForm, role: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Organizers can edit trip details, companions can view and contribute
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCompanion(null);
                  setCompanionForm({
                    name: '',
                    email: '',
                    role: 'companion'
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompanion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingCompanion ? 'Update' : 'Add'} Traveler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripCompanions;