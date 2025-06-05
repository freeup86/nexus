import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  ChatBubbleLeftIcon, 
  DocumentTextIcon, 
  DocumentMagnifyingGlassIcon,
  UserIcon,
  Cog6ToothIcon,
  XMarkIcon,
  BeakerIcon,
  ScaleIcon,
  WrenchScrewdriverIcon,
  GlobeAltIcon,
  SparklesIcon,
  MoonIcon,
  FolderIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Smart Habits', href: '/smart-habits', icon: BoltIcon },
  { name: 'Twitter Bot', href: '/twitter-bot', icon: ChatBubbleLeftIcon },
  { name: 'Text Extractor', href: '/text-extractor', icon: DocumentTextIcon },
  { name: 'Contract Analyzer', href: '/contract-analyzer', icon: DocumentMagnifyingGlassIcon },
  { name: 'Document Summarizer', href: '/document-summarizer', icon: SparklesIcon },
  { name: 'Document Organizer', href: '/document-organizer', icon: FolderIcon },
  { name: 'Decision Support', href: '/decision-support', icon: ScaleIcon },
  { name: 'DIY Projects', href: '/diy-projects', icon: WrenchScrewdriverIcon },
  { name: 'Travel Planner', href: '/travel-planner', icon: GlobeAltIcon },
  { name: 'Dream Journal', href: '/dream-journal', icon: MoonIcon },
];

const secondaryNavigation = [
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'API Test', href: '/api-test', icon: BeakerIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
          <h1 className="text-xl font-bold text-white">Nexus</h1>
          <button
            className="lg:hidden text-white hover:text-gray-200"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {/* Main navigation */}
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-6 w-6"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-gray-200 dark:border-gray-700" />

          {/* Secondary navigation */}
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-6 w-6"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};