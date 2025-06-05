import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChatBubbleLeftIcon, 
  DocumentTextIcon, 
  DocumentMagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  DocumentIcon,
  CalendarIcon,
  ScaleIcon,
  WrenchScrewdriverIcon,
  GlobeAltIcon,
  MoonIcon,
  FolderIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const utilities = [
  {
    name: 'Smart Habits',
    description: 'Build lasting habits with AI-powered insights and predictions',
    icon: BoltIcon,
    href: '/smart-habits',
    color: 'bg-indigo-600',
    stats: { label: 'Active Habits', value: '0' }
  },
  {
    name: 'Twitter Bot',
    description: 'Generate and schedule AI-powered tweets',
    icon: ChatBubbleLeftIcon,
    href: '/twitter-bot',
    color: 'bg-blue-500',
    stats: { label: 'Tweets', value: '0' }
  },
  {
    name: 'Text Extractor',
    description: 'Extract text from PDFs, images, and documents',
    icon: DocumentTextIcon,
    href: '/text-extractor',
    color: 'bg-green-500',
    stats: { label: 'Extractions', value: '0' }
  },
  {
    name: 'Contract Analyzer',
    description: 'AI-powered contract analysis and translation',
    icon: DocumentMagnifyingGlassIcon,
    href: '/contract-analyzer',
    color: 'bg-purple-500',
    stats: { label: 'Contracts', value: '0' }
  },
  {
    name: 'Decision Support',
    description: 'AI-powered decision analysis and recommendations',
    icon: ScaleIcon,
    href: '/decision-support',
    color: 'bg-indigo-500',
    stats: { label: 'Decisions', value: '0' }
  },
  {
    name: 'DIY Projects',
    description: 'Plan, track, and complete DIY projects with AI assistance',
    icon: WrenchScrewdriverIcon,
    href: '/diy-projects',
    color: 'bg-orange-500',
    stats: { label: 'Projects', value: '0' }
  },
  {
    name: 'Travel Planner',
    description: 'Plan and organize trips with AI-powered suggestions',
    icon: GlobeAltIcon,
    href: '/travel-planner',
    color: 'bg-teal-500',
    stats: { label: 'Trips', value: '0' }
  },
  {
    name: 'Dream Journal',
    description: 'Record and analyze your dreams with AI insights',
    icon: MoonIcon,
    href: '/dream-journal',
    color: 'bg-purple-600',
    stats: { label: 'Dreams', value: '0' }
  },
  {
    name: 'Document Organizer',
    description: 'Upload, organize, and search documents with AI-powered insights',
    icon: FolderIcon,
    href: '/document-organizer',
    color: 'bg-yellow-500',
    stats: { label: 'Documents', value: '0' }
  }
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName || user?.username}!
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Here's an overview of your AI utilities
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Activities
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    0
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Documents Processed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    0
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Member Since
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Utilities grid */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          AI Utilities
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {utilities.map((utility) => (
            <Link
              key={utility.name}
              to={utility.href}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${utility.color} rounded-md p-3`}>
                    <utility.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {utility.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {utility.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {utility.stats.label}: {utility.stats.value}
                  </div>
                  <div className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    Open →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6 text-center text-gray-500 dark:text-gray-400">
            No recent activity. Start using the utilities to see your activity here.
          </div>
        </div>
      </div>
    </div>
  );
};