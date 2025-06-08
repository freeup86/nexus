import React from 'react';
import { BookOpenIcon, SparklesIcon } from '@heroicons/react/24/outline';
import InteractiveJournal from '../components/habits/InteractiveJournal';

const JournalPage: React.FC = () => {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <BookOpenIcon className="h-8 w-8 mr-3 text-indigo-600" />
              AI Journal
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your personal AI-powered journaling companion for reflection and growth
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6 bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mb-1">
                  <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">AI</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Powered</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full mb-1">
                  <BookOpenIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24/7</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Content */}
      <InteractiveJournal />
    </div>
  );
};

export default JournalPage;