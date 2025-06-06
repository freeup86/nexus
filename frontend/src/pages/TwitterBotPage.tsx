import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  CalendarIcon, 
  ClockIcon, 
  PaperAirplaneIcon,
  SparklesIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Tweet {
  id: string;
  content: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  aiGenerated: boolean;
  prompt?: string;
  createdAt: string;
  publishedAt?: string;
}

const TwitterBotPage: React.FC = () => {
  const { token } = useAuth();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'scheduled' | 'history'>('compose');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    if (activeTab !== 'compose') {
      fetchTweets();
    }
  }, [activeTab]);

  const fetchTweets = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'scheduled' ? '/twitter/scheduled' : '/twitter/history';
      const response = await axios.get(`${apiUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTweets(response.data.tweets || []);
    } catch (error) {
      toast.error('Failed to fetch tweets');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTweet = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(
        `${apiUrl}/twitter/generate`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent(response.data.content);
      toast.success('Tweet generated successfully!');
    } catch (error) {
      toast.error('Failed to generate tweet');
    } finally {
      setIsGenerating(false);
    }
  };

  const scheduleTweet = async () => {
    if (!content.trim()) {
      toast.error('Please enter tweet content');
      return;
    }

    try {
      const data: any = { content, aiGenerated: !!prompt };
      if (prompt) data.prompt = prompt;
      if (scheduledTime) data.scheduledFor = new Date(scheduledTime).toISOString();

      await axios.post(
        `${apiUrl}/twitter/schedule`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(scheduledTime ? 'Tweet scheduled!' : 'Tweet saved as draft!');
      setContent('');
      setPrompt('');
      setScheduledTime('');
    } catch (error) {
      toast.error('Failed to schedule tweet');
    }
  };

  const postTweetNow = async () => {
    if (!content.trim()) {
      toast.error('Please enter tweet content');
      return;
    }

    setIsPosting(true);

    try {
      // First save as draft
      const saveResponse = await axios.post(
        `${apiUrl}/twitter/schedule`,
        { 
          content, 
          aiGenerated: !!prompt,
          prompt 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const tweetId = saveResponse.data.tweet.id;

      // Then publish immediately
      await axios.post(
        `${apiUrl}/twitter/tweets/${tweetId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Tweet posted successfully!');
      setContent('');
      setPrompt('');
      setScheduledTime('');
      
      // Switch to history tab to show the posted tweet
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to post tweet');
    } finally {
      setIsPosting(false);
    }
  };

  const deleteTweet = async (id: string) => {
    try {
      await axios.delete(`${apiUrl}/twitter/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Tweet deleted');
      fetchTweets();
    } catch (error) {
      toast.error('Failed to delete tweet');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return badges[status] || badges.draft;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Twitter Bot</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Generate AI-powered tweets and schedule them for posting
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['compose', 'scheduled', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Generation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <SparklesIcon className="h-6 w-6 mr-2 text-indigo-500" />
              AI Tweet Generator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describe what you want to tweet about
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Share tips about React hooks, announce a new feature, motivational quote about coding..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                />
              </div>
              <button
                onClick={generateTweet}
                disabled={isGenerating || !prompt.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate Tweet'
                )}
              </button>
            </div>
          </div>

          {/* Tweet Composer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <PencilIcon className="h-6 w-6 mr-2 text-gray-500" />
              Compose Tweet
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tweet Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={4}
                  maxLength={280}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {content.length}/280 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={scheduleTweet}
                  disabled={!content.trim()}
                  className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  {scheduledTime ? 'Schedule Tweet' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => postTweetNow()}
                  disabled={!content.trim() || isPosting}
                  className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  {isPosting ? 'Posting...' : 'Post Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled/History Tabs */}
      {(activeTab === 'scheduled' || activeTab === 'history') && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            </div>
          ) : tweets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No tweets found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {tweets.map((tweet) => (
                <div key={tweet.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {tweet.content}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(tweet.status)}`}>
                          {tweet.status.charAt(0).toUpperCase() + tweet.status.slice(1)}
                        </span>
                        {tweet.aiGenerated && (
                          <span className="flex items-center">
                            <SparklesIcon className="h-4 w-4 mr-1" />
                            AI Generated
                          </span>
                        )}
                        {tweet.scheduledFor && (
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(tweet.scheduledFor).toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(tweet.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTweet(tweet.id)}
                      className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TwitterBotPage;