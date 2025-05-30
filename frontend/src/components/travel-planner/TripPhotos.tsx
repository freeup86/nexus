import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  CameraIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface TripPhoto {
  id: string;
  filePath: string;
  thumbnailPath: string;
  caption: string;
  location: string;
  takenAt: string;
  uploadedAt: string;
  itineraryItemId?: string;
}

interface TripPhotosProps {
  tripId: string;
}

const TripPhotos: React.FC<TripPhotosProps> = ({ tripId }) => {
  const { token } = useAuth();
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<TripPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const [uploadForm, setUploadForm] = useState({
    caption: '',
    location: '',
    takenAt: new Date().toISOString().split('T')[0],
    files: [] as File[]
  });

  useEffect(() => {
    fetchPhotos();
  }, [tripId]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/travel/trips/${tripId}/photos`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size (10MB limit per file)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file.`);
        return false;
      }
      
      return true;
    });
    
    setUploadForm({ ...uploadForm, files: validFiles });
  };

  const handleUploadPhotos = async () => {
    if (uploadForm.files.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      uploadForm.files.forEach(file => {
        formData.append('photos', file);
      });
      formData.append('caption', uploadForm.caption);
      formData.append('location', uploadForm.location);
      formData.append('takenAt', uploadForm.takenAt);

      await axios.post(
        `${apiUrl}/travel/trips/${tripId}/photos`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      toast.success(`${uploadForm.files.length} photo(s) uploaded successfully`);
      setShowUploadModal(false);
      setUploadForm({
        caption: '',
        location: '',
        takenAt: new Date().toISOString().split('T')[0],
        files: []
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await axios.delete(
        `${apiUrl}/travel/trips/${tripId}/photos/${photoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Photo deleted successfully');
      fetchPhotos();
      if (selectedPhoto?.id === photoId) {
        setShowPhotoModal(false);
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleEditPhoto = async (photo: TripPhoto, newCaption: string, newLocation: string) => {
    try {
      await axios.put(
        `${apiUrl}/travel/trips/${tripId}/photos/${photo.id}`,
        { 
          caption: newCaption,
          location: newLocation
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Photo updated successfully');
      fetchPhotos();
      setEditingPhoto(null);
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error('Failed to update photo');
    }
  };

  const getPhotoUrl = (photo: TripPhoto) => {
    return `${apiUrl}/travel/trips/${tripId}/photos/${photo.id}/view`;
  };

  const getThumbnailUrl = (photo: TripPhoto) => {
    return photo.thumbnailPath ? 
      `${apiUrl}/travel/trips/${tripId}/photos/${photo.id}/thumbnail` :
      getPhotoUrl(photo);
  };

  const filteredAndSortedPhotos = photos
    .filter(photo => 
      !searchTerm || 
      photo.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.takenAt || b.uploadedAt).getTime() - new Date(a.takenAt || a.uploadedAt).getTime();
        case 'oldest':
          return new Date(a.takenAt || a.uploadedAt).getTime() - new Date(b.takenAt || b.uploadedAt).getTime();
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        default:
          return 0;
      }
    });

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
        <h3 className="text-lg font-semibold">Trip Photos</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Photos
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{photos.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Photos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {new Set(photos.map(p => p.location).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Locations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {photos.filter(p => p.takenAt).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">With Date Info</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search photos by caption or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="location">By Location</option>
        </select>
      </div>

      {/* Photos Grid */}
      {filteredAndSortedPhotos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <CameraIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {photos.length === 0 ? 'No photos uploaded yet' : 'No photos match your search'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {photos.length === 0 
              ? 'Start capturing your travel memories by uploading photos'
              : 'Try adjusting your search terms'
            }
          </p>
          {photos.length === 0 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Your First Photos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedPhoto(photo);
                setShowPhotoModal(true);
              }}
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={getThumbnailUrl(photo)}
                  alt={photo.caption || 'Travel photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(photo);
                        setShowPhotoModal(true);
                      }}
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                      title="View photo"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPhoto(photo);
                      }}
                      className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                      title="Edit photo"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                      title="Delete photo"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Photo info */}
              <div className="p-3">
                {photo.caption && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {photo.caption}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {photo.location && (
                    <div className="flex items-center truncate">
                      <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{photo.location}</span>
                    </div>
                  )}
                  
                  {photo.takenAt && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {new Date(photo.takenAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Photos Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Upload Photos</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Photos *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select multiple image files (max 10MB each)
                </p>
                {uploadForm.files.length > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    {uploadForm.files.length} file(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Caption</label>
                <input
                  type="text"
                  value={uploadForm.caption}
                  onChange={(e) => setUploadForm({...uploadForm, caption: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Describe these photos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={uploadForm.location}
                  onChange={(e) => setUploadForm({...uploadForm, location: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Where were these taken?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date Taken</label>
                <input
                  type="date"
                  value={uploadForm.takenAt}
                  onChange={(e) => setUploadForm({...uploadForm, takenAt: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({
                    caption: '',
                    location: '',
                    takenAt: new Date().toISOString().split('T')[0],
                    files: []
                  });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadPhotos}
                disabled={uploading || uploadForm.files.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {uploading && <CloudArrowUpIcon className="h-4 w-4 mr-2 animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload Photos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => {
                setShowPhotoModal(false);
                setSelectedPhoto(null);
              }}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <img
              src={getPhotoUrl(selectedPhoto)}
              alt={selectedPhoto.caption || 'Travel photo'}
              className="max-w-full max-h-full object-contain"
            />
            
            {(selectedPhoto.caption || selectedPhoto.location || selectedPhoto.takenAt) && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 rounded-lg p-4 text-white">
                {selectedPhoto.caption && (
                  <h4 className="text-lg font-medium mb-2">{selectedPhoto.caption}</h4>
                )}
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {selectedPhoto.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {selectedPhoto.location}
                    </div>
                  )}
                  
                  {selectedPhoto.takenAt && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(selectedPhoto.takenAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Photo Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Photo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Caption</label>
                <input
                  type="text"
                  defaultValue={editingPhoto.caption || ''}
                  onChange={(e) => setEditingPhoto({...editingPhoto, caption: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Photo caption"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  defaultValue={editingPhoto.location || ''}
                  onChange={(e) => setEditingPhoto({...editingPhoto, location: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Photo location"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditPhoto(editingPhoto, editingPhoto.caption, editingPhoto.location)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPhotos;