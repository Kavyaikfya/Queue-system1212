// What-If Queue Simulator Engine
// Simulates projected queue impact under varying arrival rates, counter outages, and service spikes.

export interface SimulationScenario {
  currentQueueLength: number;
  currentAvgWaitMinutes: number;
  currentActiveCounters: number;
  currentAvgServiceMinutes: number;
  additionalUsers?: number;
  counterChange?: number; // e.g. -1 for closure, +1 for opening
  serviceDurationMultiplier?: number; // e.g. 1.3 for 30% increase
  pauseMinutes?: number; // e.g. 20 minutes pause
}

export interface SimulationResult {
  disclaimer: string;
  baseline: {
    queueLength: number;
    activeCounters: number;
    avgWaitMinutes: number;
    throughputPerHour: number;
    estimatedClearanceHours: number;
    fairnessScore: number;
  };
  projected: {
    queueLength: number;
    activeCounters: number;
    avgWaitMinutes: number;
    throughputPerHour: number;
    estimatedClearanceHours: number;
    fairnessScore: number;
  };
  impact: {
    waitDeltaMinutes: number;
    fairnessDelta: number;
    bottleneckLevel: 'LOW' | 'MODERATE' | 'SEVERE';
    explanation: string;
  };
}

export class SimulatorEngine {
  public static readonly DISCLAIMER =
    'Simulation results are model-based operational predictions and do not represent guaranteed real-world outcomes.';

  public static runScenario(scenario: SimulationScenario): SimulationResult {
    const baseLength = Math.max(1, scenario.currentQueueLength);
    const baseCounters = Math.max(1, scenario.currentActiveCounters);
    const baseServiceMin = Math.max(3, scenario.currentAvgServiceMinutes);

    // Baseline throughput: (60 / serviceMin) * counters
    const baseThroughput = Math.round(((60 / baseServiceMin) * baseCounters) * 10) / 10;
    const baseWait = Math.round(
      Math.ceil(baseLength / baseCounters) * baseServiceMin
    );
    const baseClearanceHours = Math.round((baseLength / (baseThroughput || 1)) * 10) / 10;
    const baseFairness = Math.max(50, 100 - Math.min(45, baseWait * 0.7));

    // Projected modifications
    const projLength = Math.max(1, baseLength + (scenario.additionalUsers || 0));
    const projCounters = Math.max(1, baseCounters + (scenario.counterChange || 0));
    const projServiceMin = Math.round(
      baseServiceMin * (scenario.serviceDurationMultiplier || 1.0) * 10
    ) / 10;
    const pauseDelay = scenario.pauseMinutes || 0;

    const projThroughput = Math.round(((60 / projServiceMin) * projCounters) * 10) / 10;
    const rawProjWait = Math.ceil(projLength / projCounters) * projServiceMin + pauseDelay;
    const projWait = Math.round(rawProjWait);
    const projClearanceHours = Math.round((projLength / (projThroughput || 1)) * 10) / 10;
    const projFairness = Math.max(25, 100 - Math.min(70, projWait * 0.85));

    const waitDeltaMinutes = projWait - baseWait;
    const fairnessDelta = Math.round((projFairness - baseFairness) * 10) / 10;

    let bottleneckLevel: 'LOW' | 'MODERATE' | 'SEVERE' = 'LOW';
    let explanation = 'Queue remains within manageable operational bandwidth.';

    if (waitDeltaMinutes > 30 || projCounters <= 1 && projLength > 15) {
      bottleneckLevel = 'SEVERE';
      explanation = `Projected wait time jumps by ${waitDeltaMinutes} min. Significant service backlog is expected.`;
    } else if (waitDeltaMinutes > 12 || pauseDelay > 10) {
      bottleneckLevel = 'MODERATE';
      explanation = `Wait times increase by ${waitDeltaMinutes} min. Additional counter support is recommended.`;
    }

    return {
      disclaimer: this.DISCLAIMER,
      baseline: {
        queueLength: baseLength,
        activeCounters: baseCounters,
        avgWaitMinutes: baseWait,
        throughputPerHour: baseThroughput,
        estimatedClearanceHours: baseClearanceHours,
        fairnessScore: Math.round(baseFairness),
      },
      projected: {
        queueLength: projLength,
        activeCounters: projCounters,
        avgWaitMinutes: projWait,
        throughputPerHour: projThroughput,
        estimatedClearanceHours: projClearanceHours,
        fairnessScore: Math.round(projFairness),
      },
      impact: {
        waitDeltaMinutes,
        fairnessDelta,
        bottleneckLevel,
        explanation,
      },
    };
  }
}
