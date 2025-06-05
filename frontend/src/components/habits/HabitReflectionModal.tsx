import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  BookOpenIcon,
  LightBulbIcon,
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Habit, JournalPrompt, habitService } from '../../services/habitService';

interface HabitReflectionModalProps {
  habit: Habit;
  onClose: () => void;
  onReflectionSubmitted?: () => void;
}

const HabitReflectionModal: React.FC<HabitReflectionModalProps> = ({
  habit,
  onClose,
  onReflectionSubmitted
}) => {
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
    return () => {
      // Cleanup audio URL on unmount
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [habit.id, audioUrl]);

  const loadPrompts = async () => {
    try {
      const response = await habitService.getTodayPrompts();
      // Filter prompts related to this habit or general reflection prompts
      const relevantPrompts = response.prompts.filter(
        prompt => !prompt.habitId || prompt.habitId === habit.id
      );
      setPrompts(relevantPrompts);
      
      // Auto-select a habit-specific prompt if available
      const habitSpecificPrompt = relevantPrompts.find(p => p.habitId === habit.id);
      if (habitSpecificPrompt) {
        setSelectedPrompt(habitSpecificPrompt);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    } finally {
      setLoadingPrompts(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const handleSubmit = async () => {
    if (!reflection.trim() && !audioBlob) {
      toast.error('Please write a reflection or record your thoughts');
      return;
    }

    try {
      setLoading(true);

      let finalReflection = reflection.trim();
      let isVoiceEntry = false;

      // If we have audio, transcribe it first (mock implementation for now)
      if (audioBlob) {
        isVoiceEntry = true;
        if (!finalReflection) {
          // Mock transcription - in real implementation, you'd send audio to a transcription service
          finalReflection = "[Voice recording - transcription would be implemented here]";
          toast('ℹ️ Voice transcription feature coming soon! Using placeholder text.');
        }
      }

      const promptText = selectedPrompt 
        ? selectedPrompt.promptText 
        : customPrompt || `Reflection on completing "${habit.name}"`;

      const promptType = selectedPrompt 
        ? selectedPrompt.type 
        : 'habit_reflection';

      await habitService.createJournalEntry({
        habitId: habit.id,
        promptType,
        promptText,
        userResponse: finalReflection,
        isVoiceEntry
      });

      toast.success('Reflection saved successfully!');
      onReflectionSubmitted?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to save reflection:', error);
      toast.error(error.response?.data?.error || 'Failed to save reflection');
    } finally {
      setLoading(false);
    }
  };

  const getPromptTypeColor = (type: string) => {
    switch (type) {
      case 'reflection':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'planning':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'habit_specific':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const categoryInfo = habitService.getCategoryInfo(habit.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold mr-3"
                style={{ backgroundColor: categoryInfo.color }}
              >
                {categoryInfo.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reflect on Your Habit
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {habit.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Prompts Section */}
          {!loadingPrompts && prompts.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose a reflection prompt:
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setCustomPrompt('');
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedPrompt === prompt
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPromptTypeColor(prompt.type)}`}>
                        <LightBulbIcon className="w-3 h-3 mr-1" />
                        {prompt.type.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        prompt.priority === 'high' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : prompt.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {prompt.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{prompt.promptText}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          <div className="mb-6">
            <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or write your own prompt:
            </label>
            <input
              type="text"
              id="customPrompt"
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                if (e.target.value) {
                  setSelectedPrompt(null);
                }
              }}
              placeholder="What would you like to reflect on?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Voice Recording Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Voice Recording (Optional)
              </label>
              <div className="flex items-center space-x-2">
                {!isRecording && !audioUrl && (
                  <button
                    onClick={startRecording}
                    className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <MicrophoneIcon className="w-4 h-4 mr-1" />
                    Record
                  </button>
                )}
                
                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 animate-pulse"
                  >
                    <StopIcon className="w-4 h-4 mr-1" />
                    Stop Recording
                  </button>
                )}
                
                {audioUrl && (
                  <div className="flex items-center space-x-2">
                    <audio controls src={audioUrl} className="max-w-xs">
                      Your browser does not support the audio element.
                    </audio>
                    <button
                      onClick={clearRecording}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {isRecording && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center text-red-700 dark:text-red-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm">Recording in progress...</span>
                </div>
              </div>
            )}
          </div>

          {/* Text Reflection */}
          <div className="mb-6">
            <label htmlFor="reflection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Reflection
            </label>
            <textarea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={
                selectedPrompt 
                  ? `Reflect on: "${selectedPrompt.promptText}"`
                  : customPrompt 
                  ? `Reflect on: "${customPrompt}"`
                  : "Share your thoughts about completing this habit..."
              }
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Write your thoughts, feelings, challenges, or insights about this habit.
            </p>
          </div>

          {/* Current Prompt Display */}
          {(selectedPrompt || customPrompt) && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center mb-2">
                <LightBulbIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Current Prompt
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedPrompt ? selectedPrompt.promptText : customPrompt}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (!reflection.trim() && !audioBlob)}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookOpenIcon className="w-5 h-5 inline mr-2" />
              {loading ? 'Saving...' : 'Save Reflection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitReflectionModal;