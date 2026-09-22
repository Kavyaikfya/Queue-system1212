// SAFE RETURN WINDOW ALGORITHMIC CALCULATION ENGINE
// Predicts whether a user waiting in queue can safely step away

export interface SafeReturnWindowResult {
  safeToLeave: boolean;
  statusLabel: string;
  leaveAfterFormatted: string;
  returnByFormatted: string;
  turnEstimateFormatted: string;
  estimatedMinutesToTurn: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  peopleAhead: number;
  activeCounters: number;
  reason: string;
  detailedCalculation: {
    serviceDurationMinutes: number;
    throughputPerMinute: number;
    safetyBufferMinutes: number;
    volatilityIndex: number;
    recommendedReturnEpoch: number;
  };
}

export interface QueueContextParams {
  position: number;
  peopleAhead?: number;
  estimatedWaitMinutes?: number;
  activeCounters?: number;
  averageServiceMinutes?: number;
  isPaused?: boolean;
}

export function calculateSafeReturnWindow(params: QueueContextParams): SafeReturnWindowResult {
  const now = new Date();
  const position = Math.max(1, params.position || 1);
  const peopleAhead = params.peopleAhead !== undefined ? params.peopleAhead : Math.max(0, position - 1);
  const activeCounters = Math.max(1, params.activeCounters || 2);
  const avgServiceDuration = Math.max(3, params.averageServiceMinutes || 8);

  // Compute throughput rate (people served per minute)
  const throughputPerMinute = activeCounters / avgServiceDuration;

  // Compute estimated wait minutes
  const calculatedWaitMinutes =
    params.estimatedWaitMinutes !== undefined && params.estimatedWaitMinutes > 0
      ? params.estimatedWaitMinutes
      : Math.max(2, Math.round(peopleAhead / throughputPerMinute));

  // Turn estimate timestamp
  const turnEstimateDate = new Date(now.getTime() + calculatedWaitMinutes * 60 * 1000);

  // Safety buffer: at least 4 minutes, or 25% of total wait, whichever is larger
  const safetyBufferMinutes = Math.max(4, Math.round(calculatedWaitMinutes * 0.25));

  // Determine if it is safe to step away
  // Threshold: Needs at least 3 people ahead, estimated wait >= 12 minutes, and not paused
  const isSafe = !params.isPaused && peopleAhead >= 3 && calculatedWaitMinutes >= 12;

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (activeCounters >= 3 && peopleAhead >= 5) {
    confidence = 'HIGH';
  } else if (activeCounters === 1 || calculatedWaitMinutes <= 14) {
    confidence = 'LOW';
  }

  // Calculate return by date
  const availableAwayMinutes = Math.max(0, calculatedWaitMinutes - safetyBufferMinutes);
  const returnByDate = new Date(now.getTime() + availableAwayMinutes * 60 * 1000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let reason = '';
  if (params.isPaused) {
    reason = 'The queue is currently paused by facility staff. Please stay nearby for immediate resumption.';
  } else if (!isSafe) {
    reason =
      peopleAhead <= 2
        ? 'Your turn is approaching rapidly. Only ' + peopleAhead + ' person ahead.'
        : 'Estimated wait is under 12 minutes. Conditions are advancing too quickly to recommend stepping away.';
  } else {
    reason = `Based on current throughput (${activeCounters} counters processing ~${throughputPerMinute.toFixed(1)} visitors/min), you have a predicted ${calculatedWaitMinutes}-minute wait with a ${safetyBufferMinutes}-minute buffer.`;
  }

  return {
    safeToLeave: isSafe,
    statusLabel: isSafe ? 'SAFE TO STEP AWAY' : 'STAY NEARBY',
    leaveAfterFormatted: formatTime(now),
    returnByFormatted: formatTime(returnByDate),
    turnEstimateFormatted: formatTime(turnEstimateDate),
    estimatedMinutesToTurn: calculatedWaitMinutes,
    confidence,
    peopleAhead,
    activeCounters,
    reason,
    detailedCalculation: {
      serviceDurationMinutes: avgServiceDuration,
      throughputPerMinute,
      safetyBufferMinutes,
      volatilityIndex: activeCounters >= 3 ? 0.12 : 0.28,
      recommendedReturnEpoch: returnByDate.getTime(),
    },
  };
}
