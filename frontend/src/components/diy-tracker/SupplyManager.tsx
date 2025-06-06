import React, { useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface Supply {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  actualCost?: number;
  isOwned: boolean;
  isPurchased: boolean;
  supplier?: string;
  purchaseUrl?: string;
  notes?: string;
}

interface SupplyManagerProps {
  projectId: string;
  supplies: Supply[];
  onSuppliesUpdate: () => void;
}

const categories = [
  'lumber',
  'hardware',
  'paint',
  'electrical',
  'plumbing',
  'tools',
  'safety',
  'finishing',
  'adhesives',
  'other'
];

const units = [
  'pieces',
  'feet',
  'inches',
  'yards',
  'square feet',
  'gallons',
  'quarts',
  'pounds',
  'ounces',
  'boxes',
  'bags',
  'rolls',
  'sheets'
];

export default function SupplyManager({ projectId, supplies, onSuppliesUpdate }: SupplyManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showOnlyNeeded, setShowOnlyNeeded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    category: 'other',
    quantity: 1,
    unit: 'pieces',
    estimatedCost: 0,
    actualCost: 0,
    isOwned: false,
    isPurchased: false,
    supplier: '',
    purchaseUrl: '',
    notes: ''
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // Calculate totals
  const totalEstimatedCost = supplies.reduce((sum, s) => sum + (Number(s.estimatedCost) || 0), 0);
  const totalActualCost = supplies.reduce((sum, s) => sum + (Number(s.actualCost) || 0), 0);
  const ownedItems = supplies.filter(s => s.isOwned).length;
  const purchasedItems = supplies.filter(s => s.isPurchased && !s.isOwned).length;
  const neededItems = supplies.filter(s => !s.isOwned && !s.isPurchased).length;

  // Filter supplies
  const filteredSupplies = supplies.filter(supply => {
    const matchesSearch = supply.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supply.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || supply.category === filterCategory;
    const matchesNeeded = !showOnlyNeeded || (!supply.isOwned && !supply.isPurchased);
    
    return matchesSearch && matchesCategory && matchesNeeded;
  });

  const handleOpenDialog = (supply?: Supply) => {
    if (supply) {
      setEditingSupply(supply);
      setFormData({
        itemName: supply.itemName,
        category: supply.category,
        quantity: Number(supply.quantity),
        unit: supply.unit,
        estimatedCost: Number(supply.estimatedCost),
        actualCost: Number(supply.actualCost) || 0,
        isOwned: supply.isOwned,
        isPurchased: supply.isPurchased,
        supplier: supply.supplier || '',
        purchaseUrl: supply.purchaseUrl || '',
        notes: supply.notes || ''
      });
    } else {
      setEditingSupply(null);
      setFormData({
        itemName: '',
        category: 'other',
        quantity: 1,
        unit: 'pieces',
        estimatedCost: 0,
        actualCost: 0,
        isOwned: false,
        isPurchased: false,
        supplier: '',
        purchaseUrl: '',
        notes: ''
      });
    }
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingSupply(null);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (editingSupply) {
        await axios.put(
          `${apiUrl}/diy/supplies/${editingSupply.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
      } else {
        await axios.post(
          `${apiUrl}/diy/projects/${projectId}/supplies`,
          { supplies: [formData] },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
      }
      
      handleCloseDialog();
      onSuppliesUpdate();
    } catch (error: any) {
      console.error('Error saving supply:', error);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        alert(`Failed to save supply: ${error.response.data.errors[0]?.msg || 'Unknown error'}`);
      } else if (error.response?.data?.error) {
        alert(`Failed to save supply: ${error.response.data.error}`);
      } else {
        alert('Failed to save supply. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (supplyId: string) => {
    if (window.confirm('Are you sure you want to delete this supply?')) {
      try {
        await axios.delete(
          `${apiUrl}/diy/supplies/${supplyId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        onSuppliesUpdate();
      } catch (error) {
        console.error('Error deleting supply:', error);
      }
    }
  };

  const handleToggleOwned = async (supply: Supply) => {
    try {
      await axios.put(
        `${apiUrl}/diy/supplies/${supply.id}`,
        { isOwned: !supply.isOwned },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      onSuppliesUpdate();
    } catch (error) {
      console.error('Error updating supply:', error);
    }
  };

  const handleTogglePurchased = async (supply: Supply) => {
    try {
      await axios.put(
        `${apiUrl}/diy/supplies/${supply.id}`,
        { 
          isPurchased: !supply.isPurchased,
          actualCost: !supply.isPurchased ? supply.estimatedCost : supply.actualCost
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      onSuppliesUpdate();
    } catch (error) {
      console.error('Error updating supply:', error);
    }
  };

  const exportShoppingList = () => {
    const neededSupplies = supplies.filter(s => !s.isOwned && !s.isPurchased);
    const list = neededSupplies.map(s => 
      `${s.itemName} - ${s.quantity} ${s.unit} - Est. $${s.estimatedCost}${s.supplier ? ` - ${s.supplier}` : ''}`
    ).join('\n');
    
    const blob = new Blob([list], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Estimated</p>
          <p className="text-2xl font-bold text-blue-600">${totalEstimatedCost.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Actual</p>
          <p className="text-2xl font-bold text-green-600">${totalActualCost.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Items Status</p>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{ownedItems} owned</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{purchasedItems} bought</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">{neededItems} needed</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${supplies.length > 0 ? (ownedItems + purchasedItems) / supplies.length * 100 : 0}%` }}
              />
            </div>
            <p className="text-sm mt-1">{supplies.length > 0 ? Math.round((ownedItems + purchasedItems) / supplies.length * 100) : 0}% Complete</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search supplies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showOnlyNeeded}
              onChange={(e) => setShowOnlyNeeded(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Show only needed</span>
          </label>

          <button
            onClick={exportShoppingList}
            disabled={neededItems === 0}
            className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export List
          </button>

          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Supply
          </button>
        </div>
      </div>

      {/* Supplies Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSupplies.map((supply) => (
                <tr key={supply.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium">{supply.itemName}</p>
                      {supply.notes && (
                        <p className="text-xs text-gray-500">{supply.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                      {supply.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {supply.quantity} {supply.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    ${Number(supply.estimatedCost).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {supply.actualCost ? `$${Number(supply.actualCost).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {supply.supplier && (
                      <div className="flex items-center">
                        <span className="text-sm">{supply.supplier}</span>
                        {supply.purchaseUrl && (
                          <a
                            href={supply.purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-700"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleToggleOwned(supply)}
                        className={`p-1 rounded ${supply.isOwned ? 'text-green-600' : 'text-gray-400'}`}
                        title={supply.isOwned ? "Owned" : "Not owned"}
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleTogglePurchased(supply)}
                        className={`p-1 rounded ${supply.isPurchased ? 'text-blue-600' : 'text-gray-400'} ${supply.isOwned ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={supply.isOwned}
                        title={supply.isPurchased ? "Purchased" : "Not purchased"}
                      >
                        <ShoppingCartIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleOpenDialog(supply)}
                        className="p-1 text-gray-600 hover:text-gray-900"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(supply.id)}
                        className="p-1 text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingSupply ? 'Edit Supply' : 'Add Supply'}
              </h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  required
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700"
                    min="0"
                    step="0.1"
                  />

                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Estimated Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                      <input
                        type="number"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) })}
                        className="w-full pl-8 pr-3 py-2 border rounded-lg dark:bg-gray-700"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Actual Cost</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                      <input
                        type="number"
                        value={formData.actualCost}
                        onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) })}
                        className="w-full pl-8 pr-3 py-2 border rounded-lg dark:bg-gray-700"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                />

                <input
                  type="url"
                  placeholder="Purchase URL"
                  value={formData.purchaseUrl}
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                />

                <textarea
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  rows={2}
                />

                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isOwned}
                      onChange={(e) => setFormData({ ...formData, isOwned: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Already own this item</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPurchased}
                      onChange={(e) => setFormData({ ...formData, isPurchased: e.target.checked })}
                      disabled={formData.isOwned}
                      className="mr-2"
                    />
                    <span>Already purchased</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseDialog}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.itemName || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (editingSupply ? 'Update' : 'Add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}