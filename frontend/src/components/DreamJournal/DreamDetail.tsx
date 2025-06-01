import React from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  MoonIcon,
  SunIcon,
  SparklesIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Dream } from '../../types/dream';

interface DreamDetailProps {
  dream: Dream;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DreamDetail: React.FC<DreamDetailProps> = ({
  dream,
  open,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!open) return null;

  const getLucidityColor = (value: number): string => {
    if (value >= 7) return 'text-green-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getClarityColor = (value: number): string => {
    if (value >= 7) return 'text-blue-600';
    if (value >= 4) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{dream.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={onEdit}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-5 w-5" />
                <span>{format(new Date(dream.dreamDate), 'EEEE, MMMM d, yyyy - h:mm a')}</span>
              </div>

              {dream.mood && (
                <div className="flex items-center gap-2">
                  {dream.mood.toLowerCase().includes('happy') ? (
                    <SunIcon className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <MoonIcon className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="text-lg font-medium">Mood: {dream.mood}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lucidity Level</p>
                  <p className={`text-3xl font-bold ${getLucidityColor(dream.lucidity || 0)}`}>
                    {dream.lucidity || 0}/10
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                      style={{ width: `${(dream.lucidity || 0) * 10}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Dream Clarity</p>
                  <p className={`text-3xl font-bold ${getClarityColor(dream.clarity || 5)}`}>
                    {dream.clarity || 5}/10
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-gray-500 via-purple-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${(dream.clarity || 5) * 10}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dream Content</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{dream.content}</p>
                </div>
              </div>

              {dream.analysis && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="h-5 w-5 text-primary-600" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">AI Analysis</h4>
                  </div>
                  <div className="bg-primary-50 dark:bg-primary-900 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300">{dream.analysis}</p>
                  </div>
                </div>
              )}

              {dream.themes && dream.themes.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {dream.themes.map((theme, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 text-secondary-800"
                      >
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dream.symbols && dream.symbols.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Symbols & Meanings</h4>
                  <div className="space-y-2">
                    {dream.symbols.map((symbol, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500">✦</span>
                        <div>
                          <span className="font-medium">{symbol.symbol}:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-2">{symbol.meaning}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dream.emotions && dream.emotions.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Emotions Experienced</h4>
                  <div className="flex flex-wrap gap-2">
                    {dream.emotions.map((emotion, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dream.tags && dream.tags.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {dream.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        <TagIcon className="h-3 w-3 mr-1" />
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamDetail;