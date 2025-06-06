import React, { useState } from 'react';
import {
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
// Using native JavaScript Date methods instead of date-fns
import { toast } from 'react-hot-toast';

interface TripWizardProps {
  onCreateTrip: (tripData: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const tripTypes = [
  { value: 'leisure', label: 'Leisure', icon: '🏖️' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'adventure', label: 'Adventure', icon: '🏔️' },
  { value: 'romantic', label: 'Romantic', icon: '❤️' }
];

const currencies = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { value: 'CAD', label: 'CAD ($)', symbol: '$' },
  { value: 'AUD', label: 'AUD ($)', symbol: '$' },
  { value: 'CNY', label: 'CNY (¥)', symbol: '¥' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' }
];

const TripWizard: React.FC<TripWizardProps> = ({
  onCreateTrip,
  onCancel,
  isLoading
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    tripType: '',
    totalBudget: '',
    currency: 'USD',
    description: ''
  });

  const [errors, setErrors] = useState<any>({});

  const validateStep = (step: number): boolean => {
    const newErrors: any = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = 'Trip title is required';
        }
        if (!formData.destination.trim()) {
          newErrors.destination = 'Destination is required';
        }
        break;
      case 2:
        if (!formData.startDate) {
          newErrors.startDate = 'Start date is required';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'End date is required';
        }
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
          newErrors.endDate = 'End date must be after start date';
        }
        break;
      case 3:
        // Budget is optional, so no validation needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      const tripData = {
        ...formData,
        totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : null
      };
      onCreateTrip(tripData);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === currentStep
                  ? 'bg-blue-600 text-white'
                  : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            {step < 3 && (
              <div
                className={`w-20 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Where are you going?
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Trip Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Summer vacation in Italy"
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
            errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Destination
        </label>
        <div className="relative">
          <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            placeholder="e.g., Rome, Italy"
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
              errors.destination ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
        </div>
        {errors.destination && (
          <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Trip Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tripTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, tripType: type.value })}
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.tripType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-sm font-medium">{type.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        When are you traveling?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate || new Date().toISOString().split('T')[0]}
              className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
          </div>
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {formData.startDate && formData.endDate && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Trip duration: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Budget & Details
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Total Budget (Optional)
        </label>
        <div className="flex gap-3">
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {currencies.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
          <div className="relative flex-1">
            <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={formData.totalBudget}
              onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          placeholder="Add any notes or details about your trip..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Trip Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Title:</span>
            <span className="font-medium">{formData.title || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Destination:</span>
            <span className="font-medium">{formData.destination || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Dates:</span>
            <span className="font-medium">
              {formData.startDate && formData.endDate
                ? `${new Date(formData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(formData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : '-'}
            </span>
          </div>
          {formData.tripType && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium">
                {tripTypes.find(t => t.value === formData.tripType)?.label}
              </span>
            </div>
          )}
          {formData.totalBudget && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Budget:</span>
              <span className="font-medium">
                {currencies.find(c => c.value === formData.currency)?.symbol}
                {formData.totalBudget ? Number(formData.totalBudget).toFixed(2) : '0.00'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Trip
          </h1>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Trip'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripWizard;