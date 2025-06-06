import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Bars3Icon, 
  SunIcon, 
  MoonIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            className="text-gray-500 hover:text-gray-600 lg:hidden"
            onClick={onMenuClick}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Search bar (optional) */}
          <div className="flex-1 max-w-md mx-4">
            {/* Add search functionality if needed */}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </button>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-3">
                  {user?.profilePicture ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.profilePicture}
                      alt={user.username}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden md:block text-gray-700 dark:text-gray-300">
                    {user?.firstName || user?.username}
                  </span>
                </div>
              </Menu.Button>

              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-700 divide-y divide-gray-100 dark:divide-gray-600 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${
                          active ? 'bg-gray-100 dark:bg-gray-600' : ''
                        } flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};