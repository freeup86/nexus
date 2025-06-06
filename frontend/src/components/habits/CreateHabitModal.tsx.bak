import React, { useState } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ClockIcon,
  BellIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Habit, habitService, HABIT_CATEGORIES } from '../../services/habitService';

interface CreateHabitModalProps {
  onClose: () => void;
  onHabitCreated: (habit: Habit) => void;
}

const CreateHabitModal: React.FC<CreateHabitModalProps> = ({
  onClose,
  onHabitCreated
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'health',
    frequencyType: 'daily' as 'daily' | 'weekly' | 'custom',
    frequencyDetails: {},
    targetTime: '',
    reminderEnabled: false,
    microHabits: ['']
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMicroHabitChange = (index: number, value: string) => {
    const newMicroHabits = [...formData.microHabits];
    newMicroHabits[index] = value;
    setFormData(prev => ({
      ...prev,
      microHabits: newMicroHabits
    }));
  };

  const addMicroHabit = () => {
    if (formData.microHabits.length < 5) {
      setFormData(prev => ({
        ...prev,
        microHabits: [...prev.microHabits, '']
      }));
    }
  };

  const removeMicroHabit = (index: number) => {
    if (formData.microHabits.length > 1) {
      const newMicroHabits = formData.microHabits.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        microHabits: newMicroHabits
      }));
    }
  };

  const handleFrequencyDetailsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      frequencyDetails: {
        ...prev.frequencyDetails,
        [field]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0 && formData.category.length > 0;
      case 2:
        return formData.frequencyType.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const cleanMicroHabits = formData.microHabits
        .filter(habit => habit.trim().length > 0)
        .map(habit => habit.trim());

      const habitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        frequencyType: formData.frequencyType,
        frequencyDetails: Object.keys(formData.frequencyDetails).length > 0 
          ? formData.frequencyDetails 
          : undefined,
        microHabits: cleanMicroHabits,
        targetTime: formData.targetTime || undefined,
        reminderEnabled: formData.reminderEnabled,
        isActive: true
      };

      const response = await habitService.createHabit(habitData);
      onHabitCreated(response.habit);
    } catch (error: any) {
      console.error('Failed to create habit:', error);
      toast.error(error.response?.data?.error || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = HABIT_CATEGORIES.find(cat => cat.value === formData.category);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Basic Information
            </h3>
            
            {/* Habit Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Habit Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Morning meditation, Daily exercise"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What is this habit about? Why is it important to you?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                maxLength={500}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {HABIT_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleInputChange('category', category.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.category === category.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-sm mr-2"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Frequency & Schedule
            </h3>
            
            {/* Frequency Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How often? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('frequencyType', 'daily')}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    formData.frequencyType === 'daily'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Daily</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Every day</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInputChange('frequencyType', 'weekly')}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    formData.frequencyType === 'weekly'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Weekly</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Specific days of the week</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleInputChange('frequencyType', 'custom')}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    formData.frequencyType === 'custom'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">Custom</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">X times per week</div>
                </button>
              </div>
            </div>

            {/* Frequency Details */}
            {formData.frequencyType === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Which days?
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                    const isSelected = (formData.frequencyDetails as any)?.days?.includes(index) || false;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const currentDays = (formData.frequencyDetails as any)?.days || [];
                          const newDays = isSelected
                            ? currentDays.filter((d: number) => d !== index)
                            : [...currentDays, index];
                          handleFrequencyDetailsChange('days', newDays);
                        }}
                        className={`p-2 text-sm rounded-md border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.frequencyType === 'custom' && (
              <div>
                <label htmlFor="timesPerWeek" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Times per week
                </label>
                <input
                  type="number"
                  id="timesPerWeek"
                  value={(formData.frequencyDetails as any)?.times_per_week || ''}
                  onChange={(e) => handleFrequencyDetailsChange('times_per_week', parseInt(e.target.value) || 1)}
                  min="1"
                  max="7"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Target Time */}
            <div>
              <label htmlFor="targetTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Preferred Time (Optional)
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  id="targetTime"
                  value={formData.targetTime}
                  onChange={(e) => handleInputChange('targetTime', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Break It Down (Optional)
            </h3>
            <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Micro-habits make big habits easier!</p>
                <p>Break your habit into small, manageable steps that take less than 2 minutes each.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Micro-habits (Optional)
              </label>
              <div className="space-y-2">
                {formData.microHabits.map((microHabit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={microHabit}
                      onChange={(e) => handleMicroHabitChange(index, e.target.value)}
                      placeholder={`Step ${index + 1}: e.g., Put on workout clothes`}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      maxLength={100}
                    />
                    {formData.microHabits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMicroHabit(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {formData.microHabits.length < 5 && (
                  <button
                    type="button"
                    onClick={addMicroHabit}
                    className="flex items-center px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add another step
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Settings & Review
            </h3>
            
            {/* Reminders */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.reminderEnabled}
                  onChange={(e) => handleInputChange('reminderEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <div className="flex items-center">
                  <BellIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable reminders
                  </span>
                </div>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                Get notified when it's time to work on this habit
              </p>
            </div>

            {/* Review */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Review your habit:</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs mr-3"
                    style={{ backgroundColor: selectedCategory?.color }}
                  >
                    {selectedCategory?.icon}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{formData.name}</span>
                </div>
                
                {formData.description && (
                  <p className="text-gray-600 dark:text-gray-300 ml-9">{formData.description}</p>
                )}
                
                <div className="ml-9 text-gray-500 dark:text-gray-400">
                  <p>Category: {selectedCategory?.label}</p>
                  <p>
                    Frequency: {
                      formData.frequencyType === 'daily' ? 'Every day' :
                      formData.frequencyType === 'weekly' ? 'Weekly' :
                      `${(formData.frequencyDetails as any)?.times_per_week || 1} times per week`
                    }
                  </p>
                  {formData.targetTime && (
                    <p>Target time: {habitService.formatTime(formData.targetTime)}</p>
                  )}
                  {formData.microHabits.filter(h => h.trim()).length > 0 && (
                    <p>Micro-habits: {formData.microHabits.filter(h => h.trim()).length} steps</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Habit
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <React.Fragment key={step}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>
                    {step}
                  </div>
                  {step < totalSteps && (
                    <div className={`flex-1 h-1 mx-2 ${
                      step < currentStep
                        ? 'bg-indigo-600'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !validateStep(1)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Habit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateHabitModal;