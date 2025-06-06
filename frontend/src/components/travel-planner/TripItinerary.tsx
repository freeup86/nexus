import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilIcon,
  TagIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ItineraryItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  location: string;
  address: string;
  category: string;
  cost: number;
  bookingReference: string;
  bookingUrl: string;
  notes: string;
  itemOrder: number;
}

interface TripDay {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  description: string;
  ItineraryItems: ItineraryItem[];
}

interface TripItineraryProps {
  tripId: string;
  startDate: string;
  endDate: string;
}

const TripItinerary: React.FC<TripItineraryProps> = ({ tripId, startDate, endDate }) => {
  const { token } = useAuth();
  const [itinerary, setItinerary] = useState<TripDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<TripDay | null>(null);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({
    keywords: [''],
    preferences: '',
    duration: ''
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  const categories = [
    { value: 'transport', label: 'Transport', color: 'bg-blue-500' },
    { value: 'accommodation', label: 'Accommodation', color: 'bg-purple-500' },
    { value: 'activity', label: 'Activity', color: 'bg-green-500' },
    { value: 'meal', label: 'Meal', color: 'bg-yellow-500' },
    { value: 'sightseeing', label: 'Sightseeing', color: 'bg-red-500' }
  ];

  const [itemForm, setItemForm] = useState({
    startTime: '',
    endTime: '',
    title: '',
    description: '',
    location: '',
    address: '',
    category: 'activity',
    cost: '',
    bookingReference: '',
    bookingUrl: '',
    notes: ''
  });

  useEffect(() => {
    fetchItinerary();
  }, [tripId]);

  const fetchItinerary = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/travel/trips/${tripId}/itinerary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItinerary(response.data.itinerary || []);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      toast.error('Failed to load itinerary');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDays = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayNumber = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const existingDay = itinerary.find(day => day.dayNumber === dayNumber);
      
      if (existingDay) {
        days.push(existingDay);
      } else {
        days.push({
          id: `temp-${dayNumber}`,
          dayNumber,
          date: d.toISOString().split('T')[0],
          title: `Day ${dayNumber}`,
          description: '',
          ItineraryItems: []
        });
      }
    }
    
    return days;
  };

  const handleAddItem = async () => {
    if (!selectedDay || !itemForm.title) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const itemData = {
        ...itemForm,
        cost: itemForm.cost ? parseFloat(itemForm.cost) : null,
        itemOrder: selectedDay.ItineraryItems.length + 1
      };

      const response = await axios.post(
        `${apiUrl}/travel/trips/${tripId}/itinerary/${selectedDay.id}/items`,
        itemData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Item added successfully');
      setShowAddItemModal(false);
      setItemForm({
        startTime: '',
        endTime: '',
        title: '',
        description: '',
        location: '',
        address: '',
        category: 'activity',
        cost: '',
        bookingReference: '',
        bookingUrl: '',
        notes: ''
      });
      fetchItinerary();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleDeleteItem = async (dayId: string, itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await axios.delete(
        `${apiUrl}/travel/trips/${tripId}/itinerary/${dayId}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Item deleted successfully');
      fetchItinerary();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'bg-gray-500';
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    
    // Handle ISO-8601 DateTime strings (from AI generation)
    if (time.includes('T') || time.includes('Z')) {
      try {
        return new Date(time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (error) {
        console.error('Error parsing ISO time:', time, error);
        return time; // Return original if parsing fails
      }
    }
    
    // Handle simple time strings (HH:MM format)
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error parsing simple time:', time, error);
      return time; // Return original if parsing fails
    }
  };

  const generateAIItinerary = async () => {
    const keywords = aiForm.keywords.filter(k => k.trim() !== '');
    if (keywords.length === 0) {
      toast.error('Please add at least one activity keyword');
      return;
    }

    setIsGenerating(true);
    try {
      const requestData = {
        keywords,
        preferences: aiForm.preferences,
        duration: aiForm.duration ? parseInt(aiForm.duration) : undefined
      };

      const response = await axios.post(
        `${apiUrl}/travel/trips/${tripId}/generate-itinerary`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`AI itinerary generated! Created ${response.data.itemsCreated} activities.`);
      setShowAIModal(false);
      setAiForm({ keywords: [''], preferences: '', duration: '' });
      fetchItinerary(); // Refresh the itinerary
    } catch (error: any) {
      console.error('Error generating AI itinerary:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to generate AI itinerary';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const addKeyword = () => {
    setAiForm(prev => ({
      ...prev,
      keywords: [...prev.keywords, '']
    }));
  };

  const removeKeyword = (index: number) => {
    if (aiForm.keywords.length > 1) {
      setAiForm(prev => ({
        ...prev,
        keywords: prev.keywords.filter((_, i) => i !== index)
      }));
    }
  };

  const updateKeyword = (index: number, value: string) => {
    setAiForm(prev => ({
      ...prev,
      keywords: prev.keywords.map((keyword, i) => i === index ? value : keyword)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const days = generateDays();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Trip Itinerary</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            AI Generate
          </button>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {days.map((day) => (
        <div key={day.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {day.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDay(day);
                  setShowAddItemModal(true);
                }}
                className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
          </div>

          <div className="p-4">
            {day.ItineraryItems && day.ItineraryItems.length > 0 ? (
              <div className="space-y-3">
                {day.ItineraryItems
                  .sort((a, b) => (a.itemOrder || 0) - (b.itemOrder || 0))
                  .map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(item.category)} mt-2`}></div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </h5>
                            {(item.startTime || item.endTime) && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {item.startTime && formatTime(item.startTime)}
                                {item.startTime && item.endTime && ' - '}
                                {item.endTime && formatTime(item.endTime)}
                              </div>
                            )}
                            {item.location && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {item.location}
                              </div>
                            )}
                            {item.cost && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                ${item.cost.toFixed(2)}
                              </div>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                {item.description}
                              </p>
                            )}
                            {item.bookingReference && (
                              <div className="text-xs text-blue-600 mt-1">
                                Booking: {item.bookingReference}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full text-white ${getCategoryColor(item.category)}`}>
                              {categories.find(c => c.value === item.category)?.label}
                            </span>
                            <button
                              onClick={() => handleDeleteItem(day.id, item.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No items planned for this day</p>
                <button
                  onClick={() => {
                    setSelectedDay(day);
                    setShowAddItemModal(true);
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Add your first item
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Itinerary Item</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={itemForm.title}
                  onChange={(e) => setItemForm({...itemForm, title: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Activity title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={itemForm.startTime}
                    onChange={(e) => setItemForm({...itemForm, startTime: e.target.value})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={itemForm.endTime}
                    onChange={(e) => setItemForm({...itemForm, endTime: e.target.value})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={itemForm.location}
                  onChange={(e) => setItemForm({...itemForm, location: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Location name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={itemForm.address}
                  onChange={(e) => setItemForm({...itemForm, address: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Full address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.cost}
                  onChange={(e) => setItemForm({...itemForm, cost: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Additional details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Booking Reference</label>
                <input
                  type="text"
                  value={itemForm.bookingReference}
                  onChange={(e) => setItemForm({...itemForm, bookingReference: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Confirmation number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Booking URL</label>
                <input
                  type="url"
                  value={itemForm.bookingUrl}
                  onChange={(e) => setItemForm({...itemForm, bookingUrl: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generate AI Itinerary
              </h2>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Activity Keywords *
                </label>
                <div className="space-y-2">
                  {aiForm.keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => updateKeyword(index, e.target.value)}
                        className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., museums, hiking, food tours, beaches"
                      />
                      {aiForm.keywords.length > 1 && (
                        <button
                          onClick={() => removeKeyword(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addKeyword}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    + Add another keyword
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={aiForm.duration}
                  onChange={(e) => setAiForm({...aiForm, duration: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Auto-detect from trip dates"
                  min="1"
                  max="30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Additional Preferences
                </label>
                <textarea
                  value={aiForm.preferences}
                  onChange={(e) => setAiForm({...aiForm, preferences: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="e.g., budget-friendly, family-friendly, adventure focused, cultural experiences, etc."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                onClick={generateAIItinerary}
                disabled={isGenerating}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
              >
                {isGenerating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <SparklesIcon className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Itinerary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripItinerary;