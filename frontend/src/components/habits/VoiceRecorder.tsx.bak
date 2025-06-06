import React, { useState, useRef, useEffect } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  onTranscriptionComplete?: (transcript: string) => void;
  maxDuration?: number; // in seconds
  className?: string;
  autoTranscribe?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onTranscriptionComplete,
  maxDuration = 300, // 5 minutes default
  className = '',
  autoTranscribe = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Setup audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        onRecordingComplete?.(blob, recordingTime);
        
        if (autoTranscribe) {
          transcribeAudio(blob);
        }

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100); // Record in 100ms chunks
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            toast(`⚠️ Recording stopped - maximum duration (${maxDuration}s) reached`);
          }
          return newTime;
        });
      }, 1000);

      // Start waveform visualization
      visualizeAudio();

      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      toast.success('Recording stopped');
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current || !isRecording) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Create simplified waveform data (take every nth sample)
      const step = Math.floor(bufferLength / 20);
      const newWaveformData = [];
      for (let i = 0; i < bufferLength; i += step) {
        newWaveformData.push(dataArray[i] / 255);
      }
      
      setWaveformData(newWaveformData);
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const playRecording = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
        }
      };
    }

    if (isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    setIsPlaying(true);

    // Start playback timer
    playbackTimerRef.current = setInterval(() => {
      if (audioRef.current) {
        setPlaybackTime(Math.floor(audioRef.current.currentTime));
      }
    }, 1000);
  };

  const pauseRecording = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
      
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setIsPaused(false);
    setPlaybackTime(0);
    setTranscript('');
    setWaveformData([]);
    
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }
    
    toast.success('Recording deleted');
  };

  const downloadRecording = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-note-${new Date().toISOString().slice(0, 19)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Recording downloaded');
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Mock transcription for now - in real implementation, you'd use a service like:
      // - Web Speech API (for real-time)
      // - OpenAI Whisper API
      // - Google Cloud Speech-to-Text
      // - Azure Speech Services
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTranscript = "This is a mock transcription. In a real implementation, this would be the actual transcribed text from the audio recording.";
      
      setTranscript(mockTranscript);
      onTranscriptionComplete?.(mockTranscript);
      
      toast.success('Audio transcribed successfully');
    } catch (error) {
      console.error('Transcription failed:', error);
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const manualTranscribe = () => {
    if (audioBlob) {
      transcribeAudio(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isRecording}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <MicrophoneIcon className="w-5 h-5 mr-2" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 animate-pulse"
              >
                <StopIcon className="w-5 h-5 mr-2" />
                Stop Recording
              </button>
            )}

            {isRecording && (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  / {formatTime(maxDuration)}
                </span>
              </div>
            )}
          </div>

          {audioBlob && (
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadRecording}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Download recording"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
              <button
                onClick={deleteRecording}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Delete recording"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Waveform Visualization */}
        {(isRecording || waveformData.length > 0) && (
          <div className="h-16 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex items-center justify-center">
            <div className="flex items-end space-x-1 h-full">
              {isRecording ? (
                waveformData.map((amplitude, index) => (
                  <div
                    key={index}
                    className="bg-red-500 w-1 transition-all duration-100"
                    style={{ height: `${Math.max(4, amplitude * 100)}%` }}
                  />
                ))
              ) : (
                Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-gray-300 dark:bg-gray-500 w-1"
                    style={{ height: '20%' }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Playback Controls */}
        {audioUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {!isPlaying ? (
                  <button
                    onClick={playRecording}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Play
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <PauseIcon className="w-4 h-4 mr-2" />
                    Pause
                  </button>
                )}

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <SpeakerWaveIcon className="w-4 h-4 mr-1" />
                  {isPlaying ? formatTime(playbackTime) : formatTime(recordingTime)}
                </div>
              </div>

              <button
                onClick={manualTranscribe}
                disabled={isTranscribing}
                className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isTranscribing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Transcribing...
                  </>
                ) : (
                  'Transcribe'
                )}
              </button>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center mb-2">
                  <SpeakerWaveIcon className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Transcript
                  </span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">{transcript}</p>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {isRecording && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Recording in progress... Speak clearly into your microphone.
          </div>
        )}

        {!audioBlob && !isRecording && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Click "Start Recording" to record a voice note.
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;