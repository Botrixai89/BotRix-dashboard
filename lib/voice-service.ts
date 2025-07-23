export interface VoiceSettings {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed: number;
  pitch: number;
  language: string;
}

export class VoiceService {
  private synthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      this.isSupported = 'speechSynthesis' in window;
    }
  }

  /**
   * Check if speech synthesis is supported
   */
  isSpeechSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Convert text to speech
   */
  speak(text: string, settings: VoiceSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      // Create new utterance
      this.utterance = new SpeechSynthesisUtterance(text);
      
      // Apply settings
      this.utterance.rate = settings.speed;
      this.utterance.pitch = settings.pitch;
      this.utterance.lang = settings.language;

      // Map our voice types to available voices
      this.utterance.voice = this.getVoiceByType(settings.voice);

      // Set up event handlers
      this.utterance.onend = () => {
        this.utterance = null;
        resolve();
      };

      this.utterance.onerror = (event) => {
        this.utterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Start speaking
      this.synthesis.speak(this.utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.utterance = null;
  }

  /**
   * Pause speech
   */
  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speech
   */
  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  /**
   * Map voice types to available voices
   */
  private getVoiceByType(voiceType: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    
    // Voice type mapping
    const voiceMap: Record<string, string[]> = {
      'alloy': ['en-US', 'en-GB'],
      'echo': ['en-US'],
      'fable': ['en-US', 'en-GB'],
      'onyx': ['en-US'],
      'nova': ['en-US'],
      'shimmer': ['en-US', 'en-GB']
    };

    const preferredLanguages = voiceMap[voiceType] || ['en-US'];
    
    // Try to find a voice that matches the preferred language
    for (const lang of preferredLanguages) {
      const voice = voices.find(v => v.lang.startsWith(lang));
      if (voice) return voice;
    }

    // Fallback to any English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Fallback to first available voice
    return voices[0] || null;
  }

  /**
   * Get voice preview URL (for demo purposes)
   */
  getVoicePreviewUrl(voiceType: string): string {
    // This would typically point to a sample audio file
    // For now, we'll return a placeholder
    return `/api/voice/preview/${voiceType}`;
  }
}

// Create a singleton instance
let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService();
  }
  return voiceServiceInstance;
}

import { useState, useEffect, useCallback } from 'react';

// React hook for voice functionality
export function useVoice() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    const voiceService = getVoiceService();
    setIsSupported(voiceService.isSpeechSupported());
  }, []);

  const speak = useCallback(async (text: string, settings: VoiceSettings) => {
    const voiceService = getVoiceService();
    if (!voiceService.isSpeechSupported()) {
      throw new Error('Speech synthesis not supported');
    }

    setCurrentText(text);
    setIsSpeaking(true);

    try {
      await voiceService.speak(text, settings);
    } finally {
      setIsSpeaking(false);
      setCurrentText('');
    }
  }, []);

  const stop = useCallback(() => {
    const voiceService = getVoiceService();
    voiceService.stop();
    setIsSpeaking(false);
    setCurrentText('');
  }, []);

  const pause = useCallback(() => {
    const voiceService = getVoiceService();
    voiceService.pause();
  }, []);

  const resume = useCallback(() => {
    const voiceService = getVoiceService();
    voiceService.resume();
  }, []);

  return {
    isSupported,
    isSpeaking,
    currentText,
    speak,
    stop,
    pause,
    resume,
    getAvailableVoices: () => getVoiceService().getAvailableVoices(),
  };
} 