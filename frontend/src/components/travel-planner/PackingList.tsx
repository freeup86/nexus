import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface PackingItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  isPacked: boolean;
  isEssential: boolean;
  notes: string;
  itemOrder: number;
}

interface PackingListProps {
  tripId: string;
  tripType?: string;
  destination?: string;
}

const PackingList: React.FC<PackingListProps> = ({ tripId, tripType, destination }) => {
  const { token } = useAuth();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [showPackedOnly, setShowPackedOnly] = useState(false);
  const [showEssentialOnly, setShowEssentialOnly] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const categories = [
    { value: 'clothing', label: 'Clothing', icon: '👕' },
    { value: 'toiletries', label: 'Toiletries', icon: '🧴' },
    { value: 'electronics', label: 'Electronics', icon: '📱' },
    { value: 'documents', label: 'Documents', icon: '📋' },
    { value: 'medications', label: 'Medications', icon: '💊' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  const [itemForm, setItemForm] = useState({
    itemName: '',
    category: 'other',
    quantity: 1,
    isEssential: false,
    notes: ''
  });

  // Suggested items based on trip type and destination
  const getSuggestedItems = () => {
    const suggestions: { [key: string]: string[] } = {
      clothing: ['T-shirts', 'Pants/Jeans', 'Underwear', 'Socks', 'Sleepwear', 'Jacket/Sweater'],
      toiletries: ['Toothbrush', 'Toothpaste', 'Shampoo', 'Soap/Body wash', 'Deodorant', 'Sunscreen'],
      electronics: ['Phone charger', 'Power bank', 'Camera', 'Headphones', 'Travel adapter'],
      documents: ['Passport', 'ID', 'Travel insurance', 'Boarding passes', 'Hotel confirmations'],
      medications: ['Prescription medications', 'Pain relievers', 'First aid kit', 'Hand sanitizer'],
      other: ['Luggage locks', 'Travel pillow', 'Eye mask', 'Umbrella', 'Snacks']
    };

    // Add specific items based on trip type
    if (tripType === 'business') {
      suggestions.clothing.push('Business attire', 'Dress shoes');
      suggestions.electronics.push('Laptop', 'Business cards');
    } else if (tripType === 'adventure') {
      suggestions.clothing.push('Hiking boots', 'Rain gear', 'Athletic wear');
      suggestions.other.push('Backpack', 'Water bottle', 'Flashlight');
    } else if (tripType === 'family') {
      suggestions.other.push('Entertainment for kids', 'Snacks', 'Toys/Games');
    }

    return suggestions;
  };

  useEffect(() => {
    fetchPackingList();
  }, [tripId]);

  const fetchPackingList = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/travel/trips/${tripId}/packing`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching packing list:', error);
      toast.error('Failed to load packing list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!itemForm.itemName) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      const itemData = {
        ...itemForm,
        itemOrder: items.length + 1
      };

      if (editingItem) {
        await axios.put(
          `${apiUrl}/travel/trips/${tripId}/packing/${editingItem.id}`,
          itemData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Item updated successfully');
      } else {
        await axios.post(
          `${apiUrl}/travel/trips/${tripId}/packing`,
          itemData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Item added successfully');
      }

      setShowAddModal(false);
      setEditingItem(null);
      setItemForm({
        itemName: '',
        category: 'other',
        quantity: 1,
        isEssential: false,
        notes: ''
      });
      fetchPackingList();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await axios.delete(
        `${apiUrl}/travel/trips/${tripId}/packing/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Item deleted successfully');
      fetchPackingList();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleTogglePacked = async (item: PackingItem) => {
    try {
      await axios.put(
        `${apiUrl}/travel/trips/${tripId}/packing/${item.id}`,
        { ...item, isPacked: !item.isPacked },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchPackingList();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleEditItem = (item: PackingItem) => {
    setEditingItem(item);
    setItemForm({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      isEssential: item.isEssential,
      notes: item.notes || ''
    });
    setShowAddModal(true);
  };

  const addSuggestedItem = (categoryKey: string, itemName: string) => {
    setItemForm({
      itemName,
      category: categoryKey,
      quantity: 1,
      isEssential: false,
      notes: ''
    });
    setShowAddModal(true);
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📦';
  };

  const getPackingStats = () => {
    const total = items.length;
    const packed = items.filter(item => item.isPacked).length;
    const essential = items.filter(item => item.isEssential && !item.isPacked).length;
    const percentage = total > 0 ? Math.round((packed / total) * 100) : 0;
    
    return { total, packed, essential, percentage };
  };

  const filteredItems = items
    .filter(item => !filterCategory || item.category === filterCategory)
    .filter(item => !showPackedOnly || item.isPacked)
    .filter(item => !showEssentialOnly || item.isEssential)
    .sort((a, b) => {
      // Sort by packed status (unpacked first), then by essential (essential first), then by name
      if (a.isPacked !== b.isPacked) return a.isPacked ? 1 : -1;
      if (a.isEssential !== b.isEssential) return a.isEssential ? -1 : 1;
      return a.itemName.localeCompare(b.itemName);
    });

  const stats = getPackingStats();
  const suggestions = getSuggestedItems();

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
        <h3 className="text-lg font-semibold">Packing List</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      {/* Packing Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold">Packing Progress</h4>
          <div className="text-2xl font-bold text-blue-600">
            {stats.percentage}%
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{stats.packed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Packed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-600">{stats.total - stats.packed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{stats.essential}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Essential Left</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowPackedOnly(!showPackedOnly)}
            className={`px-3 py-2 rounded-lg text-sm ${
              showPackedOnly 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Packed Only
          </button>
          <button
            onClick={() => setShowEssentialOnly(!showEssentialOnly)}
            className={`px-3 py-2 rounded-lg text-sm ${
              showEssentialOnly 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Essential Only
          </button>
        </div>
      </div>

      {/* Packing List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {items.length === 0 ? 'No items in your packing list' : 'No items match your filters'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {items.length === 0 
              ? 'Start adding items to keep track of what to pack for your trip'
              : 'Try adjusting your filters to see more items'
            }
          </p>
          {items.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-all ${
                item.isPacked ? 'opacity-75 bg-green-50 dark:bg-green-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleTogglePacked(item)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.isPacked
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {item.isPacked && <CheckIconSolid className="h-4 w-4" />}
                  </button>
                  
                  <div className="text-2xl">{getCategoryIcon(item.category)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${
                        item.isPacked 
                          ? 'line-through text-gray-500' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {item.itemName}
                      </h4>
                      {item.isEssential && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" title="Essential item" />
                      )}
                      {item.quantity > 1 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {item.quantity}x
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {categories.find(c => c.value === item.category)?.label}
                    </div>
                    
                    {item.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Items */}
      {items.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold mb-4">Suggested Items</h4>
          <div className="space-y-4">
            {Object.entries(suggestions).map(([categoryKey, items]) => (
              <div key={categoryKey}>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <span className="mr-2">{getCategoryIcon(categoryKey)}</span>
                  {categories.find(c => c.value === categoryKey)?.label}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {items.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => addSuggestedItem(categoryKey, item)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name *</label>
                <input
                  type="text"
                  value={itemForm.itemName}
                  onChange={(e) => setItemForm({...itemForm, itemName: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="What do you need to pack?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({...itemForm, quantity: parseInt(e.target.value) || 1})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isEssential"
                  checked={itemForm.isEssential}
                  onChange={(e) => setItemForm({...itemForm, isEssential: e.target.checked})}
                  className="mr-2 h-4 w-4 text-red-600 rounded"
                />
                <label htmlFor="isEssential" className="text-sm font-medium">
                  Mark as essential item
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({...itemForm, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Additional details"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setItemForm({
                    itemName: '',
                    category: 'other',
                    quantity: 1,
                    isEssential: false,
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackingList;