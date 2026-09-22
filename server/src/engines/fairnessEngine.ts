// Fairness Monitor & Alert Engine
// Continuously evaluates queue health, wait-time distribution, backward position shifts, and starvation risks.

export interface QueueEntrySnapshot {
  id: string;
  ticketNumber: string;
  position: number;
  minutesWaited: number;
  isUrgent: boolean;
  hasAppointment: boolean;
  backwardShiftCount?: number;
}

export interface FairnessReport {
  fairnessScore: number; // 0 - 100
  label: string;
  metrics: {
    avgWaitMinutes: number;
    maxWaitMinutes: number;
    waitVariance: number;
    urgentRatio: number;
    totalWaiting: number;
    maxBackwardShifts: number;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    recommendation: string;
  }>;
}

export class FairnessEngine {
  public static readonly DISCLAIMER =
    'System-generated fairness indicator based on configured queue rules.';

  public static evaluate(entries: QueueEntrySnapshot[]): FairnessReport {
    if (!entries || entries.length === 0) {
      return {
        fairnessScore: 100,
        label: this.DISCLAIMER,
        metrics: {
          avgWaitMinutes: 0,
          maxWaitMinutes: 0,
          waitVariance: 0,
          urgentRatio: 0,
          totalWaiting: 0,
          maxBackwardShifts: 0,
        },
        alerts: [],
      };
    }

    const totalWaiting = entries.length;
    const waitTimes = entries.map((e) => e.minutesWaited);
    const sumWait = waitTimes.reduce((acc, v) => acc + v, 0);
    const avgWaitMinutes = Math.round((sumWait / totalWaiting) * 10) / 10;
    const maxWaitMinutes = Math.max(...waitTimes);

    // Calculate variance of waiting times
    const variance =
      waitTimes.reduce((acc, v) => acc + Math.pow(v - avgWaitMinutes, 2), 0) /
      totalWaiting;
    const stdDev = Math.sqrt(variance);

    // Ratio of urgent to normal
    const urgentCount = entries.filter((e) => e.isUrgent).length;
    const urgentRatio = Math.round((urgentCount / totalWaiting) * 100) / 100;

    const maxBackwardShifts = Math.max(
      0,
      ...entries.map((e) => e.backwardShiftCount || 0)
    );

    // Scoring deductions from baseline 100:
    let score = 100;
    const alerts: FairnessReport['alerts'] = [];

    // 1. Excessive wait time penalty (if max wait > 45 minutes)
    if (maxWaitMinutes > 45) {
      score -= Math.min(25, (maxWaitMinutes - 45) * 0.8);
      alerts.push({
        id: 'excessive-wait',
        type: 'LONG_WAIT_RISK',
        severity: maxWaitMinutes > 60 ? 'CRITICAL' : 'WARNING',
        message: `Longest wait has reached ${maxWaitMinutes} minutes. Several users have experienced unusually long waits.`,
        recommendation:
          'Consider assigning an additional counter or expediting standard tickets.',
      });
    }

    // 2. Imbalance / high dispersion penalty
    if (stdDev > 20 && totalWaiting >= 4) {
      score -= 15;
      alerts.push({
        id: 'wait-imbalance',
        type: 'WAIT_TIME_IMBALANCE',
        severity: 'WARNING',
        message:
          'Waiting-time imbalance detected. High variance between fastest and slowest advancing entries.',
        recommendation:
          'Check priority rule weights to ensure aging factors prevent newer urgent tickets from stalling earlier arrivals.',
      });
    }

    // 3. Repeated backward shifts penalty
    if (maxBackwardShifts >= 2) {
      score -= Math.min(20, maxBackwardShifts * 6);
      alerts.push({
        id: 'frequent-shifts',
        type: 'REPEATED_DISPLACEMENT',
        severity: 'WARNING',
        message: `One or more users have experienced ${maxBackwardShifts} backward position changes due to incoming priority requests.`,
        recommendation:
          'Queue priority configuration may require review. Activate starvation threshold limits.',
      });
    }

    // 4. Urgent saturation
    if (urgentRatio > 0.4 && totalWaiting >= 5) {
      score -= 10;
      alerts.push({
        id: 'urgent-saturation',
        type: 'HIGH_PRIORITY_DENSITY',
        severity: 'INFO',
        message: `${Math.round(urgentRatio * 100)}% of queue is marked as high-priority/urgent. Standard requests are pacing slower than usual.`,
        recommendation:
          'Dedicate a separate emergency express desk to isolate urgent workflows.',
      });
    }

    const finalScore = Math.max(20, Math.min(100, Math.round(score)));

    return {
      fairnessScore: finalScore,
      label: this.DISCLAIMER,
      metrics: {
        avgWaitMinutes,
        maxWaitMinutes,
        waitVariance: Math.round(variance * 10) / 10,
        urgentRatio,
        totalWaiting,
        maxBackwardShifts,
      },
      alerts,
    };
  }
}
