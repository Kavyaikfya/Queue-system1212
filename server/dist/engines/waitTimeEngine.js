// Estimated Waiting Time Engine
// Non-linear multi-server wait estimation based on active counters, historical throughput, and rolling service duration.
export class WaitTimeEngine {
    static calculate(input) {
        const disclaimer = 'Estimated time may change as queue conditions change.';
        if (input.isQueuePaused) {
            return {
                estimatedMinutes: 999,
                confidence: 'LOW',
                confidenceReason: 'Queue is currently paused by administrator.',
                disclaimer,
            };
        }
        if (input.positionAhead <= 0) {
            return {
                estimatedMinutes: 0,
                confidence: 'HIGH',
                confidenceReason: 'You are next in line for the next available counter.',
                disclaimer,
            };
        }
        // Active counters factor (must have at least 1 active counter serving)
        const effectiveCounters = Math.max(1, input.activeCountersCount);
        const speedFactor = input.recentServiceSpeedFactor ?? 1.0;
        const avgDuration = Math.max(2, input.avgServiceDurationMinutes);
        // Dynamic wait estimate:
        // With 'c' counters operating in parallel, each round of 'c' people takes avgDuration * speedFactor.
        const rounds = Math.ceil(input.positionAhead / effectiveCounters);
        const estimatedMinutes = Math.round(rounds * avgDuration * speedFactor);
        // Determine prediction confidence
        let confidence = 'MEDIUM';
        let confidenceReason = '';
        if (effectiveCounters >= 2 && speedFactor >= 0.85 && speedFactor <= 1.15) {
            confidence = 'HIGH';
            confidenceReason = `Calculated with ${effectiveCounters} active counters operating at optimal service velocity.`;
        }
        else if (effectiveCounters === 1) {
            confidence = 'MEDIUM';
            confidenceReason = 'Single counter operating; wait times may fluctuate with individual case complexity.';
        }
        else {
            confidence = 'LOW';
            confidenceReason = 'High variation detected in recent service processing speeds.';
        }
        return {
            estimatedMinutes: Math.max(1, estimatedMinutes),
            confidence,
            confidenceReason,
            disclaimer,
        };
    }
}
