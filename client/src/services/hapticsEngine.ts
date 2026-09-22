// Haptic Feedback Engine for FAIRQUEUE
// Uses navigator.vibrate() for tactical mobile sensory feedback

type HapticEvent = 'joined' | 'position_changed' | 'turn_approaching' | 'your_turn' | 'tap';

export function isVibrationEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('fq_vibration_enabled');
  return val === null ? true : val === 'true';
}

export function setVibrationEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fq_vibration_enabled', String(enabled));
}

export function triggerHaptic(event: HapticEvent): void {
  if (!isVibrationEnabled()) return;
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (event) {
      case 'tap':
        navigator.vibrate(20);
        break;
      case 'joined':
        navigator.vibrate(60);
        break;
      case 'position_changed':
        // Short crisp vibration
        navigator.vibrate(80);
        break;
      case 'turn_approaching':
        // Double vibration
        navigator.vibrate([120, 60, 120]);
        break;
      case 'your_turn':
        // Distinct triumphant pattern
        navigator.vibrate([200, 80, 200, 80, 450]);
        break;
    }
  } catch (err) {
    // Vibration failure ignored on unsupported environments
  }
}
