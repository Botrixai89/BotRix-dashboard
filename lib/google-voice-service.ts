// Google Cloud Voice Service for Text-to-Speech and Speech-to-Text
// This service provides high-quality voice synthesis and recognition

export interface GoogleVoiceSettings {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number; // 0.25 to 4.0
  pitch: number; // -20.0 to 20.0
  language: string;
  model?: 'latest' | 'neural2' | 'studio';
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class GoogleVoiceService {
  private apiKey: string | null = null;
  private isSupported: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private recognition: any = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY || null;
    this.isSupported = this.checkSupport();
    this.initAudioContext();
  }

  /**
   * Check if Google Cloud Voice APIs are supported
   */
  private checkSupport(): boolean {
    return typeof window !== 'undefined' && 
           'AudioContext' in window && 
           'MediaRecorder' in window &&
           'webkitSpeechRecognition' in window;
  }

  /**
   * Initialize audio context for recording
   */
  private initAudioContext(): void {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Set Google Cloud API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Check if service is supported
   */
  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Convert text to speech using Google Cloud Text-to-Speech
   */
  async textToSpeech(text: string, settings: GoogleVoiceSettings): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('Google Cloud API key is required for Text-to-Speech');
    }

    try {
      const response = await fetch('/api/voice/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          settings,
          apiKey: this.apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Text-to-Speech failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      throw error;
    }
  }

  /**
   * Play audio blob
   */
  async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  }

  /**
   * Speak text using Google Cloud TTS
   */
  async speak(text: string, settings: GoogleVoiceSettings): Promise<void> {
    try {
      const audioBlob = await this.textToSpeech(text, settings);
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      throw error;
    }
  }

  /**
   * Start speech recognition using Google Cloud Speech-to-Text
   */
  async startSpeechRecognition(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Google Cloud API key is required for Speech-to-Text');
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(this.mediaStream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const result = await this.speechToText(audioBlob);
          onResult(result);
        } catch (error) {
          onError(error instanceof Error ? error.message : 'Speech recognition failed');
        } finally {
          onEnd();
        }
      };

      // Start recording
      mediaRecorder.start();
      
      // Stop recording after 10 seconds or when manually stopped
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 10000);

    } catch (error) {
      console.error('Speech recognition error:', error);
      throw error;
    }
  }

  /**
   * Stop speech recognition
   */
  stopSpeechRecognition(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Convert speech to text using Google Cloud Speech-to-Text
   */
  private async speechToText(audioBlob: Blob): Promise<SpeechRecognitionResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('apiKey', this.apiKey!);

      const response = await fetch('/api/voice/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Speech-to-Text failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        transcript: result.transcript,
        confidence: result.confidence,
        isFinal: true,
      };
    } catch (error) {
      console.error('Speech-to-Text error:', error);
      throw error;
    }
  }

  /**
   * Get available Google Cloud voices
   */
  async getAvailableVoices(): Promise<any[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await fetch('/api/voice/voices', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  /**
   * Get voice preview URL
   */
  getVoicePreviewUrl(voiceType: string): string {
    return `/api/voice/preview/${voiceType}`;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopSpeechRecognition();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// React hook for Google Voice functionality
export function useGoogleVoice(apiKey?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const voiceService = new GoogleVoiceService(apiKey);
    setIsSupported(voiceService.isVoiceSupported());
    
    return () => {
      voiceService.destroy();
    };
  }, [apiKey]);

  const speak = useCallback(async (text: string, settings: GoogleVoiceSettings) => {
    const voiceService = new GoogleVoiceService(apiKey);
    if (!voiceService.isVoiceSupported()) {
      throw new Error('Google Voice service not supported');
    }

    setCurrentText(text);
    setIsSpeaking(true);

    try {
      await voiceService.speak(text, settings);
    } finally {
      setIsSpeaking(false);
      setCurrentText('');
    }
  }, [apiKey]);

  const startListening = useCallback(async (
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void
  ) => {
    const voiceService = new GoogleVoiceService(apiKey);
    setIsListening(true);

    try {
      await voiceService.startSpeechRecognition(
        (result) => {
          setTranscript(result.transcript);
          onResult(result);
        },
        onError,
        () => setIsListening(false)
      );
    } catch (error) {
      setIsListening(false);
      onError(error instanceof Error ? error.message : 'Failed to start listening');
    }
  }, [apiKey]);

  const stopListening = useCallback(() => {
    const voiceService = new GoogleVoiceService(apiKey);
    voiceService.stopSpeechRecognition();
    setIsListening(false);
  }, [apiKey]);

  return {
    isSupported,
    isSpeaking,
    isListening,
    currentText,
    transcript,
    speak,
    startListening,
    stopListening,
  };
}

import { useState, useEffect, useCallback } from 'react'; 