import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  MicrophoneIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Dream } from '../../types/dream';

interface DreamFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (dreamData: any) => Promise<void>;
  dream?: Dream | null;
  saving?: boolean;
  error?: string | null;
}

const moods = [
  'Happy', 'Sad', 'Anxious', 'Peaceful', 'Excited', 'Fearful',
  'Confused', 'Nostalgic', 'Angry', 'Hopeful', 'Neutral'
];

const commonEmotions = [
  'Joy', 'Fear', 'Anger', 'Sadness', 'Surprise', 'Love',
  'Anxiety', 'Peace', 'Confusion', 'Wonder', 'Loneliness'
];

const DreamForm: React.FC<DreamFormProps> = ({ open, onClose, onSave, dream, saving = false, error: parentError }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dreamDate, setDreamDate] = useState(new Date().toISOString().slice(0, 16));
  const [mood, setMood] = useState('');
  const [lucidity, setLucidity] = useState(0);
  const [clarity, setClarity] = useState(5);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (dream) {
      setTitle(dream.title);
      setContent(dream.content);
      setDreamDate(new Date(dream.dreamDate).toISOString().slice(0, 16));
      setMood(dream.mood || '');
      setLucidity(dream.lucidity || 0);
      setClarity(dream.clarity || 5);
      setEmotions(dream.emotions || []);
      setTags(dream.tags?.map(t => t.tag) || []);
    }
  }, [dream]);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setContent((prev) => {
          const lastChar = prev.charAt(prev.length - 1);
          const needsSpace = lastChar && lastChar !== ' ' && lastChar !== '\n';
          return prev + (needsSpace ? ' ' : '') + transcript;
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError('Speech recognition error: ' + event.error);
        setIsRecording(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please provide both title and content');
      return;
    }

    const dreamData = {
      title: title.trim(),
      content: content.trim(),
      dreamDate: new Date(dreamDate).toISOString(),
      mood,
      lucidity,
      clarity,
      emotions: emotions.length > 0 ? emotions : undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      setError(null);
      await onSave(dreamData);
    } catch (err: any) {
      // Error is already handled by parent, just prevent form close
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleEmotion = (emotion: string) => {
    if (emotions.includes(emotion)) {
      setEmotions(emotions.filter(e => e !== emotion));
    } else {
      setEmotions([...emotions, emotion]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {dream ? 'Edit Dream' : 'Record New Dream'}
              </h3>
              <div className="mt-4">
                {(error || parentError) && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error || parentError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dream Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={saving}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dream Content *
                    </label>
                    <div className="relative">
                      <textarea
                        id="content"
                        required
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe your dream in detail..."
                        disabled={saving}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`absolute bottom-2 right-2 p-2 rounded-md ${
                          isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        } hover:bg-opacity-80`}
                      >
                        <MicrophoneIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dreamDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dream Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      id="dreamDate"
                      value={dreamDate}
                      onChange={(e) => setDreamDate(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="mood" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Overall Mood
                    </label>
                    <select
                      id="mood"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Select mood...</option>
                      {moods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lucidity Level: {lucidity}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={lucidity}
                      onChange={(e) => setLucidity(Number(e.target.value))}
                      className="mt-1 block w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">How aware were you that you were dreaming?</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Dream Clarity: {clarity}/10
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={clarity}
                      onChange={(e) => setClarity(Number(e.target.value))}
                      className="mt-1 block w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">How clear and vivid was the dream?</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Emotions Experienced
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {commonEmotions.map((emotion) => (
                        <button
                          key={emotion}
                          type="button"
                          onClick={() => toggleEmotion(emotion)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            emotions.includes(emotion)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {emotion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add a tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>{dream ? 'Update' : 'Save'} Dream</>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DreamForm;