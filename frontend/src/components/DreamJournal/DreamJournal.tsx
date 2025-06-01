import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  SparklesIcon,
  CloudIcon,
  MoonIcon,
  SunIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import dreamService from '../../services/dreamService';
import { Dream, DreamStats } from '../../types/dream';
import DreamForm from './DreamForm';
import DreamDetail from './DreamDetail';
import DreamInsights from './DreamInsights';
import DreamVisualization from './DreamVisualization';

const DreamJournal: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dreams' | 'insights' | 'visualization'>('dreams');
  const [stats, setStats] = useState<DreamStats | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchDreams();
    fetchStats();
  }, [searchTerm, selectedTag, pagination.page]);

  const fetchDreams = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await dreamService.getDreams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        tag: selectedTag || undefined,
      });
      setDreams(response.dreams);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Failed to fetch dreams:', err);
      setError(`Failed to load dreams: ${err.message}`);
      setDreams([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await dreamService.getDreamStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch dream stats:', err);
      // Don't set error state for stats - just log it
      // Stats are optional, dreams functionality should still work
    }
  };

  const handleSaveDream = async (dreamData: any) => {
    try {
      if (editingDream) {
        await dreamService.updateDream(editingDream.id, dreamData);
      } else {
        await dreamService.createDream(dreamData);
      }
      await fetchDreams();
      await fetchStats();
      setShowForm(false);
      setEditingDream(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteDream = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dream?')) {
      try {
        await dreamService.deleteDream(id);
        await fetchDreams();
        await fetchStats();
        if (selectedDream?.id === id) {
          setSelectedDream(null);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleEditDream = (dream: Dream) => {
    setEditingDream(dream);
    setShowForm(true);
  };

  const getMoodIcon = (mood?: string) => {
    if (!mood) return <CloudIcon className="h-5 w-5 text-gray-400" />;
    const lowerMood = mood.toLowerCase();
    if (lowerMood.includes('happy') || lowerMood.includes('joy')) return <SunIcon className="h-5 w-5 text-yellow-500" />;
    if (lowerMood.includes('sad') || lowerMood.includes('anxious')) return <CloudIcon className="h-5 w-5 text-blue-500" />;
    if (lowerMood.includes('nightmare') || lowerMood.includes('fear')) return <MoonIcon className="h-5 w-5 text-red-500" />;
    return <CloudIcon className="h-5 w-5 text-gray-400" />;
  };

  const getLucidityColor = (lucidity?: number): string => {
    if (!lucidity) return 'gray';
    if (lucidity >= 7) return 'green';
    if (lucidity >= 4) return 'yellow';
    return 'red';
  };

  const getLucidityBgColor = (lucidity?: number): string => {
    if (!lucidity) return 'bg-gray-100 text-gray-800';
    if (lucidity >= 7) return 'bg-green-100 text-green-800';
    if (lucidity >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading && dreams.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dream Journal</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Record and analyze your dreams to discover patterns and insights
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            {stats && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  <CloudIcon className="h-4 w-4 mr-1" />
                  {stats.totalDreams} Total Dreams
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 text-secondary-800">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {stats.recentDreams} This Month
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLucidityBgColor(stats.avgLucidity)}`}>
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  Avg Lucidity: {stats.avgLucidity.toFixed(1)}/10
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-1 text-sm text-red-600 hover:text-red-500"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dreams')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dreams'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CloudIcon className="h-5 w-5 inline-block mr-2" />
              Dreams
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'insights'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SparklesIcon className="h-5 w-5 inline-block mr-2" />
              Insights
            </button>
            <button
              onClick={() => setActiveTab('visualization')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'visualization'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
              Visualization
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'dreams' && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search dreams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Popular Tags */}
            {stats && stats.topTags.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Popular Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map((tagInfo) => (
                    <button
                      key={tagInfo.tag}
                      onClick={() => setSelectedTag(tagInfo.tag === selectedTag ? null : tagInfo.tag)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        tagInfo.tag === selectedTag
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tagInfo.tag} ({tagInfo.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dreams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dreams.map((dream) => (
                <div
                  key={dream.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedDream(dream)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {dream.title}
                      </h3>
                      {getMoodIcon(dream.mood)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {format(new Date(dream.dreamDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                      {dream.content}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {dream.lucidity !== undefined && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLucidityBgColor(dream.lucidity)}`}>
                          Lucidity: {dream.lucidity}/10
                        </span>
                      )}
                      {dream.clarity !== undefined && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Clarity: {dream.clarity}/10
                        </span>
                      )}
                    </div>
                    {dream.tags && dream.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dream.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(tag.tag);
                            }}
                          >
                            {tag.tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDream(dream);
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDream(dream.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {dreams.length === 0 && !loading && (
              <div className="text-center py-12">
                <CloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No dreams recorded yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start by recording your first dream</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Record Dream
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && <DreamInsights />}
        {activeTab === 'visualization' && <DreamVisualization dreams={dreams} />}

        {/* Floating Action Button */}
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-6 w-6" />
        </button>

        {/* Forms and Modals */}
        {showForm && (
          <DreamForm
            open={showForm}
            onClose={() => {
              setShowForm(false);
              setEditingDream(null);
            }}
            onSave={handleSaveDream}
            dream={editingDream}
          />
        )}

        {selectedDream && (
          <DreamDetail
            dream={selectedDream}
            open={!!selectedDream}
            onClose={() => setSelectedDream(null)}
            onEdit={() => handleEditDream(selectedDream)}
            onDelete={() => handleDeleteDream(selectedDream.id)}
          />
        )}
      </div>
    </div>
  );
};

export default DreamJournal;