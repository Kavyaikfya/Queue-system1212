// Voice Mode & Voice Announcements Engine for FAIRQUEUE
// Uses standard Web Speech API (SpeechSynthesis & SpeechRecognition)
// Gracefully falls back when browser speech recognition is not supported

export function isVoiceAnnouncementsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem('fq_voice_announcements_enabled');
  return val === 'true'; // Default disabled to prevent loud public speech
}

export function setVoiceAnnouncementsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fq_voice_announcements_enabled', String(enabled));
}

export function getVoiceVolume(): number {
  if (typeof window === 'undefined') return 0.8;
  const val = localStorage.getItem('fq_voice_volume');
  return val ? parseFloat(val) : 0.8;
}

export function setVoiceVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fq_voice_volume', String(Math.max(0, Math.min(1, volume))));
}

export function isVoiceRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Speaks a natural, friendly queue notification using SpeechSynthesis
 */
export function speakAnnouncement(text: string): void {
  if (!isVoiceAnnouncementsEnabled()) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = getVoiceVolume();
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick pleasant English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')) && v.lang.startsWith('en')
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[VoiceEngine] Speech synthesis error:', err);
  }
}

/**
 * Initializes a SpeechRecognition listener for voice commands
 */
export function startVoiceRecognition(
  onResult: (command: string) => void,
  onError: (errorMsg: string) => void
): { stop: () => void } | null {
  if (!isVoiceRecognitionSupported()) {
    onError("Voice input isn't supported on this browser.");
    return null;
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (transcript) {
      onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('[VoiceEngine] Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      onError('Microphone permission was denied.');
    } else if (event.error === 'no-speech') {
      onError('No speech was detected. Please try again.');
    } else {
      onError(`Speech recognition error: ${event.error}`);
    }
  };

  try {
    recognition.start();
    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
      },
    };
  } catch (err: any) {
    onError('Unable to access microphone.');
    return null;
  }
}
