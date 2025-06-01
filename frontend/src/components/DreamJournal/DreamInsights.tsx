import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  SparklesIcon,
  ArrowPathIcon,
  ClockIcon,
  FaceSmileIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import dreamService from '../../services/dreamService';
import { DreamPattern, PatternAnalysis } from '../../types/dream';

const DreamInsights: React.FC = () => {
  const [patterns, setPatterns] = useState<DreamPattern[]>([]);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const patternsData = await dreamService.getDreamPatterns();
      setPatterns(patternsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzePatterns = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      const analysisData = await dreamService.analyzePatterns();
      setAnalysis(analysisData);
      await fetchPatterns();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'recurring_theme':
        return <ClockIcon className="h-5 w-5" />;
      case 'emotional_trend':
        return <FaceSmileIcon className="h-5 w-5" />;
      case 'symbol_frequency':
        return <LightBulbIcon className="h-5 w-5" />;
      default:
        return <SparklesIcon className="h-5 w-5" />;
    }
  };

  const formatPatternData = (pattern: any, type: string) => {
    if (typeof pattern === 'string') return pattern;
    
    switch (type) {
      case 'recurring_theme':
        return pattern.theme || 'Unknown theme';
      case 'symbol_frequency':
        return pattern.symbol || 'Unknown symbol';
      case 'emotional_trend':
        return pattern.emotion || 'Unknown emotion';
      default:
        return JSON.stringify(pattern);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dream Insights & Patterns</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Discover recurring themes and patterns in your dreams
          </p>
        </div>
        <button
          onClick={analyzePatterns}
          disabled={analyzing}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {analyzing ? (
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <ArrowPathIcon className="h-5 w-5 mr-2" />
          )}
          {analyzing ? 'Analyzing...' : 'Analyze Patterns'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {analysis && analysis.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold">Recurring Themes</h3>
            </div>
            {analysis.summary.recurringThemes.length > 0 ? (
              <div className="space-y-2">
                {analysis.summary.recurringThemes.map((theme, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{theme.theme}</span>
                    <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                      {theme.count} dreams
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recurring themes found yet</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <LightBulbIcon className="h-6 w-6 text-secondary-600" />
              <h3 className="text-lg font-semibold">Frequent Symbols</h3>
            </div>
            {analysis.summary.frequentSymbols.length > 0 ? (
              <div className="space-y-2">
                {analysis.summary.frequentSymbols.map((symbol, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{symbol.symbol}</span>
                    <span className="text-xs bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full">
                      {symbol.count} dreams
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No frequent symbols detected</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaceSmileIcon className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold">Emotional Trends</h3>
            </div>
            {analysis.summary.emotionalTrends.length > 0 ? (
              <div className="space-y-2">
                {analysis.summary.emotionalTrends.slice(0, 5).map((emotion, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{emotion.emotion}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${emotion.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{emotion.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No emotional trends identified</p>
            )}
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4">Discovered Patterns</h3>

      {patterns.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No patterns discovered yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Record more dreams and run pattern analysis to discover insights
          </p>
          <button
            onClick={analyzePatterns}
            disabled={analyzing}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Run Analysis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                {getPatternIcon(pattern.patternType)}
                <h4 className="text-lg font-semibold">
                  {formatPatternData(pattern.pattern, pattern.patternType)}
                </h4>
              </div>
              <div className="flex gap-2 mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {pattern.patternType.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
                  Frequency: {pattern.frequency}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                First seen: {new Date(pattern.firstSeen).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last seen: {new Date(pattern.lastSeen).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {patterns.length > 0 && (
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Understanding Your Patterns</h4>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              <strong>Recurring Themes:</strong> These are concepts, situations, or ideas that appear
              frequently in your dreams. They may reflect ongoing concerns, desires, or unresolved issues
              in your waking life.
            </p>
            <p>
              <strong>Symbol Frequency:</strong> Symbols that appear repeatedly in dreams often carry
              personal significance. They can represent aspects of yourself, important people, or
              situations in your life.
            </p>
            <p>
              <strong>Emotional Trends:</strong> The emotions you experience in dreams can provide
              insights into your subconscious feelings and help you understand your emotional state
              over time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamInsights;