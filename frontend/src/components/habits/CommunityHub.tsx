import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  HandRaisedIcon,
  BoltIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Habit, habitService } from '../../services/habitService';

interface CommunityHubProps {
  habits: Habit[];
}

interface Partner {
  id: string;
  name: string;
  avatar?: string;
  sharedHabits: string[];
  streak: number;
  completionRate: number;
  lastActive: string;
  status: 'active' | 'pending' | 'invited';
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'habit_specific' | 'general' | 'streak';
  duration: number; // days
  participants: number;
  startDate: string;
  endDate: string;
  reward?: string;
  isJoined: boolean;
  category?: string;
}

interface Message {
  id: string;
  partnerId: string;
  partnerName: string;
  content: string;
  type: 'encouragement' | 'check_in' | 'milestone' | 'challenge';
  timestamp: string;
  isRead: boolean;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ habits }) => {
  const [activeTab, setActiveTab] = useState<'partners' | 'challenges' | 'messages'>('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API calls when backend endpoints are implemented
      // For now, initialize with empty arrays since community features are not yet implemented
      setPartners([]);
      setChallenges([]);
      setMessages([]);
    } catch (error) {
      console.error('Failed to load community data:', error);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitePartner = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // TODO: Implement real invitation API call
      toast('🚧 Partner invitations coming soon! This feature is under development.');
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      // TODO: Implement real challenge API call
      toast('🚧 Group challenges coming soon! This feature is under development.');
    } catch (error) {
      toast.error('Failed to join challenge');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    try {
      // TODO: Implement real challenge API call
      toast('🚧 Group challenges coming soon! This feature is under development.');
    } catch (error) {
      toast.error('Failed to leave challenge');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return time.toLocaleDateString();
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'habit_specific':
        return <BoltIcon className="w-4 h-4" />;
      case 'streak':
        return <FireIcon className="w-4 h-4" />;
      case 'general':
        return <CalendarDaysIcon className="w-4 h-4" />;
      default:
        return <TrophyIcon className="w-4 h-4" />;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'encouragement':
        return <HandRaisedIcon className="w-4 h-4 text-green-500" />;
      case 'check_in':
        return <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500" />;
      case 'milestone':
        return <TrophyIcon className="w-4 h-4 text-yellow-500" />;
      case 'challenge':
        return <BoltIcon className="w-4 h-4 text-purple-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const unreadMessages = messages.filter(m => !m.isRead).length;

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Community Hub
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect with accountability partners and join challenges
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Invite Partner
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('partners')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'partners'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <UsersIcon className="w-5 h-5 inline-block mr-2" />
            Partners ({partners.filter(p => p.status === 'active').length})
          </button>
          
          <button
            onClick={() => setActiveTab('challenges')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'challenges'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <TrophyIcon className="w-5 h-5 inline-block mr-2" />
            Challenges ({challenges.filter(c => c.isJoined).length})
          </button>
          
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
              activeTab === 'messages'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 inline-block mr-2" />
            Messages
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadMessages}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'partners' && (
          <div className="space-y-4">
            {partners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map(partner => (
                  <div key={partner.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {partner.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">{partner.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {partner.status === 'pending' ? 'Invitation pending' : `Active ${formatTimeAgo(partner.lastActive)}`}
                          </p>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        partner.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                    </div>

                    {partner.status === 'active' && (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <FireIcon className="w-4 h-4 text-orange-500 mr-1" />
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">{partner.streak}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Day Streak</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">{partner.completionRate}%</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
                          </div>
                        </div>

                        {partner.sharedHabits.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shared Habits:</p>
                            <div className="flex flex-wrap gap-1">
                              {partner.sharedHabits.slice(0, 2).map((habit, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                  {habit}
                                </span>
                              ))}
                              {partner.sharedHabits.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                  +{partner.sharedHabits.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Accountability Partners Coming Soon!</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  🚧 We're building features to connect you with habit accountability partners. Stay tuned!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {challenges.length > 0 ? (
              challenges.map(challenge => (
              <div key={challenge.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`p-2 rounded-lg mr-3 ${
                        challenge.category === 'health' ? 'bg-green-100 dark:bg-green-900/20' :
                        challenge.category === 'mindfulness' ? 'bg-purple-100 dark:bg-purple-900/20' :
                        'bg-blue-100 dark:bg-blue-900/20'
                      }`}>
                        {getChallengeTypeIcon(challenge.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{challenge.name}</h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <UsersIcon className="w-4 h-4 mr-1" />
                          {challenge.participants} participants
                          <span className="mx-2">•</span>
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {challenge.duration} days
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{challenge.description}</p>
                    
                    {challenge.reward && (
                      <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 mb-3">
                        <TrophyIcon className="w-4 h-4 mr-1" />
                        Reward: {challenge.reward}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(challenge.startDate) > new Date() 
                        ? `Starts ${new Date(challenge.startDate).toLocaleDateString()}`
                        : `Ends ${new Date(challenge.endDate).toLocaleDateString()}`
                      }
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {challenge.isJoined ? (
                      <div className="flex flex-col items-end space-y-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Joined
                        </span>
                        <button
                          onClick={() => handleLeaveChallenge(challenge.id)}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          Leave Challenge
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        Join Challenge
                      </button>
                    )}
                  </div>
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-12">
                <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Group Challenges Coming Soon!</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  🚧 We're developing community challenges to help you stay motivated. Check back soon!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map(message => (
                  <div key={message.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 ${
                    message.isRead 
                      ? 'border-gray-200 dark:border-gray-700' 
                      : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                          {message.partnerName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{message.partnerName}</span>
                            <span className="mx-2 text-gray-300">•</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(message.timestamp)}</span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{message.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getMessageTypeIcon(message.type)}
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full ml-2"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Messaging Coming Soon!</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  🚧 Partner messaging and encouragement features are in development. Stay tuned!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Partner Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Invite Accountability Partner
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your friend will receive an invitation to join Smart Habits and become your accountability partner.
                </p>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvitePartner}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityHub;