import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CalendarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface CommunityGalleryProps {
  onProjectSelect: (project: any) => void;
}

const CommunityGallery: React.FC<CommunityGalleryProps> = ({ onProjectSelect }) => {
  const { token } = useAuth();
  const [shares, setShares] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    projectType: '',
    difficultyLevel: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    fetchGallery();
  }, [filters, pagination.page]);

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filters.projectType && { projectType: filters.projectType }),
        ...(filters.difficultyLevel && { difficultyLevel: filters.difficultyLevel })
      });

      const response = await axios.get(
        `${apiUrl}/diy/community/gallery?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShares(response.data.shares);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load community projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchGallery();
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-100';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100';
      case 'advanced':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const projectTypes = [
    'Woodworking',
    'Plumbing',
    'Electrical',
    'Painting',
    'Landscaping',
    'Home Repair',
    'Furniture',
    'Flooring',
    'Renovation',
    'Crafts'
  ];

  if (isLoading && shares.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <select
              value={filters.projectType}
              onChange={(e) => setFilters({ ...filters, projectType: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="">All Project Types</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filters.difficultyLevel}
              onChange={(e) => setFilters({ ...filters, difficultyLevel: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            >
              <option value="">All Difficulty Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {shares.length === 0 ? (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shares.map((share) => (
            <div
              key={share.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onProjectSelect(share.project)}
            >
              {/* Featured Image */}
              {share.featuredPhoto || (share.project.photos && share.project.photos.length > 0) ? (
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={share.featuredPhoto?.thumbnailPath || share.project.photos[0]?.thumbnailPath || share.project.photos[0]?.filePath}
                    alt={share.title || share.project.title}
                    className="w-full h-full object-cover"
                  />
                  {share.project.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 rounded px-2 py-1 text-white text-xs">
                      +{share.project.photos.length - 1} photos
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Project Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {share.title || share.project.title}
                </h3>
                
                {share.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {share.description}
                  </p>
                )}

                {/* Project Type & Difficulty */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">
                    {share.project.projectType || 'DIY Project'}
                  </span>
                  {share.project.difficultyLevel && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(share.project.difficultyLevel)}`}>
                      {share.project.difficultyLevel}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {share.user.username}
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {share.viewCount}
                    </span>
                    <span className="flex items-center">
                      <HeartIcon className="h-4 w-4 mr-1" />
                      {share.likeCount}
                    </span>
                    <span className="flex items-center">
                      <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
                      {share._count?.comments || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityGallery;