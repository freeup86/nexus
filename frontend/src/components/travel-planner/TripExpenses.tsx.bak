import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  CurrencyDollarIcon,
  TrashIcon,
  PencilIcon,
  ReceiptPercentIcon,
  CalendarIcon,
  TagIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  receipt: string;
  notes: string;
  createdAt: string;
}

interface TripExpensesProps {
  tripId: string;
  currency: string;
  totalBudget?: number;
}

const TripExpenses: React.FC<TripExpensesProps> = ({ tripId, currency, totalBudget }) => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const categories = [
    { value: 'accommodation', label: 'Accommodation', color: 'bg-purple-500' },
    { value: 'transport', label: 'Transport', color: 'bg-blue-500' },
    { value: 'food', label: 'Food & Drinks', color: 'bg-green-500' },
    { value: 'activities', label: 'Activities', color: 'bg-yellow-500' },
    { value: 'shopping', label: 'Shopping', color: 'bg-pink-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'digital_wallet', label: 'Digital Wallet' }
  ];

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    description: '',
    amount: '',
    paymentMethod: 'credit_card',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [tripId]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/travel/trips/${tripId}/expenses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        currency
      };

      if (editingExpense) {
        await axios.put(
          `${apiUrl}/travel/trips/${tripId}/expenses/${editingExpense.id}`,
          expenseData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Expense updated successfully');
      } else {
        await axios.post(
          `${apiUrl}/travel/trips/${tripId}/expenses`,
          expenseData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Expense added successfully');
      }

      setShowAddModal(false);
      setEditingExpense(null);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        description: '',
        amount: '',
        paymentMethod: 'credit_card',
        notes: ''
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await axios.delete(
        `${apiUrl}/travel/trips/${tripId}/expenses/${expenseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Expense deleted successfully');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || ''
    });
    setShowAddModal(true);
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'bg-gray-500';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accommodation': return '🏨';
      case 'transport': return '🚗';
      case 'food': return '🍽️';
      case 'activities': return '🎯';
      case 'shopping': return '🛍️';
      default: return '💰';
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  const filteredAndSortedExpenses = expenses
    .filter(expense => !filterCategory || expense.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  const totalSpent = getTotalExpenses();
  const budgetPercentage = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0;

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
        <h3 className="text-lg font-semibold">Trip Expenses</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Budget Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {currency} {totalSpent.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Spent</div>
          </div>
          
          {totalBudget && (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currency} {totalBudget.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Budget</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${budgetPercentage > 90 ? 'text-red-600' : 'text-green-600'}`}>
                  {budgetPercentage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Budget Used</div>
              </div>
            </>
          )}
        </div>

        {totalBudget && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  budgetPercentage > 90 ? 'bg-red-500' : 
                  budgetPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, budgetPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4">Expenses by Category</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(getExpensesByCategory()).map(([category, amount]) => {
            const categoryInfo = categories.find(c => c.value === category);
            return (
              <div key={category} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getCategoryColor(category)}`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{categoryInfo?.label || category}</div>
                  <div className="text-lg font-bold">{currency} {amount.toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="category">Sort by Category</option>
          </select>
        </div>
      </div>

      {/* Expenses List */}
      {filteredAndSortedExpenses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <ReceiptPercentIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No expenses yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start tracking your trip expenses to stay within budget
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Your First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedExpenses.map((expense) => (
            <div key={expense.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getCategoryIcon(expense.category)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full text-white ${getCategoryColor(expense.category)}`}>
                        {categories.find(c => c.value === expense.category)?.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <CreditCardIcon className="h-4 w-4 mr-1" />
                        {paymentMethods.find(p => p.value === expense.paymentMethod)?.label}
                      </div>
                    </div>
                    
                    {expense.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {currency} {expense.amount.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
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
      )}

      {/* Add/Edit Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="What did you spend on?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>{method.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
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
                  setEditingExpense(null);
                  setExpenseForm({
                    date: new Date().toISOString().split('T')[0],
                    category: 'other',
                    description: '',
                    amount: '',
                    paymentMethod: 'credit_card',
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingExpense ? 'Update' : 'Add'} Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripExpenses;