import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Dream } from '../../types/dream';

interface DreamVisualizationProps {
  dreams: Dream[];
}

const DreamVisualization: React.FC<DreamVisualizationProps> = ({ dreams }) => {
  const stats = useMemo(() => {
    if (dreams.length === 0) return null;

    // Monthly distribution
    const monthlyMap = new Map<string, number>();
    dreams.forEach(dream => {
      const monthKey = format(new Date(dream.dreamDate), 'MMM yyyy');
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });

    // Mood distribution
    const moodMap = new Map<string, number>();
    dreams.forEach(dream => {
      if (dream.mood) {
        moodMap.set(dream.mood, (moodMap.get(dream.mood) || 0) + 1);
      }
    });

    // Lucidity distribution
    const lucidityRanges = [
      { range: '0-2', min: 0, max: 2, count: 0 },
      { range: '3-5', min: 3, max: 5, count: 0 },
      { range: '6-8', min: 6, max: 8, count: 0 },
      { range: '9-10', min: 9, max: 10, count: 0 },
    ];

    dreams.forEach(dream => {
      const lucidity = dream.lucidity || 0;
      const range = lucidityRanges.find(r => lucidity >= r.min && lucidity <= r.max);
      if (range) range.count++;
    });

    // Top themes
    const themeMap = new Map<string, number>();
    dreams.forEach(dream => {
      if (dream.themes && Array.isArray(dream.themes)) {
        dream.themes.forEach(theme => {
          themeMap.set(theme, (themeMap.get(theme) || 0) + 1);
        });
      }
    });

    return {
      total: dreams.length,
      lucidDreams: dreams.filter(d => (d.lucidity || 0) >= 5).length,
      uniqueThemes: themeMap.size,
      avgClarity: Math.round(dreams.reduce((sum, d) => sum + (d.clarity || 5), 0) / dreams.length),
      monthlyData: Array.from(monthlyMap.entries()),
      moodData: Array.from(moodMap.entries()),
      lucidityData: lucidityRanges,
      topThemes: Array.from(themeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [dreams]);

  if (dreams.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Record more dreams to see visualizations</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Dreams</p>
          <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lucid Dreams</p>
          <p className="text-3xl font-bold text-secondary-600">{stats.lucidDreams}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Themes</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.uniqueThemes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Clarity</p>
          <p className="text-3xl font-bold text-green-600">{stats.avgClarity}/10</p>
        </div>
      </div>

      {/* Dreams Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Dreams Over Time</h3>
        <div className="space-y-2">
          {stats.monthlyData.map(([month, count]) => (
            <div key={month} className="flex items-center gap-4">
              <span className="text-sm w-24">{month}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div
                  className="bg-primary-600 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(count / Math.max(...stats.monthlyData.map(d => d[1]))) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">{count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Mood Distribution</h3>
          <div className="space-y-2">
            {stats.moodData.map(([mood, count]) => (
              <div key={mood} className="flex items-center justify-between">
                <span className="text-sm">{mood}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {Math.round((count / stats.total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lucidity Levels */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Lucidity Levels</h3>
          <div className="space-y-2">
            {stats.lucidityData.map((range) => (
              <div key={range.range} className="flex items-center justify-between">
                <span className="text-sm">{range.range}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${(range.count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{range.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Themes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4">Top Themes</h3>
          {stats.topThemes.length > 0 ? (
            <div className="space-y-2">
              {stats.topThemes.map(([theme, count]) => (
                <div key={theme} className="flex items-center justify-between">
                  <span className="text-sm">{theme}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    {count} dreams
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No themes recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DreamVisualization;