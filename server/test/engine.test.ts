import { PriorityEngine } from '../src/engines/priorityEngine.js';
import { WaitTimeEngine } from '../src/engines/waitTimeEngine.js';
import { FairnessEngine } from '../src/engines/fairnessEngine.js';
import { SimulatorEngine } from '../src/engines/simulatorEngine.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 RUNNING CORE ENGINE AUTOMATED TESTS');
  console.log('=======================================================');

  // 1. Priority Engine Tests
  console.log('\n--- Testing Priority Engine ---');
  const pastTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
  const standardPriority = PriorityEngine.calculate({
    joinTime: pastTime,
    serviceBasePriority: 10,
    hasAppointment: false,
    isUrgent: false,
  });

  assert(standardPriority.score >= 40, 'Accrues starvation-prevention aging points over 20 min wait');
  assert(standardPriority.breakdown.minutesWaited === 20, 'Accurately computes minutes waited');
  assert(standardPriority.reason.includes('waiting time'), 'Generates human-readable explainable reason');

  const urgentPriority = PriorityEngine.calculate({
    joinTime: new Date(),
    serviceBasePriority: 10,
    isUrgent: true,
  });
  assert(urgentPriority.score >= 50, 'Applies configured urgency tier boost');
  assert(urgentPriority.breakdown.urgencyBonus === 40, 'Includes urgency bonus in breakdown');

  // 2. Wait Time Engine Tests
  console.log('\n--- Testing Estimated Wait Time Engine ---');
  const waitEstimate = WaitTimeEngine.calculate({
    positionAhead: 6,
    activeCountersCount: 2,
    avgServiceDurationMinutes: 10,
  });
  // 6 ahead / 2 counters = 3 rounds * 10 mins = 30 mins
  assert(waitEstimate.estimatedMinutes === 30, 'Calculates multi-counter parallel throughput correctly');
  assert(waitEstimate.confidence === 'HIGH', 'Labels confidence as HIGH with 2+ active counters');
  assert(waitEstimate.disclaimer.length > 0, 'Displays mandatory operational disclaimer');

  const pausedEstimate = WaitTimeEngine.calculate({
    positionAhead: 2,
    activeCountersCount: 2,
    avgServiceDurationMinutes: 10,
    isQueuePaused: true,
  });
  assert(pausedEstimate.estimatedMinutes === 999, 'Recognizes queue pause state in wait calculation');

  // 3. Fairness Engine Tests
  console.log('\n--- Testing Fairness Engine ---');
  const healthyQueue = [
    { id: '1', ticketNumber: 'A-1', position: 1, minutesWaited: 5, isUrgent: false, hasAppointment: false },
    { id: '2', ticketNumber: 'A-2', position: 2, minutesWaited: 8, isUrgent: false, hasAppointment: false },
    { id: '3', ticketNumber: 'A-3', position: 3, minutesWaited: 12, isUrgent: false, hasAppointment: true },
  ];
  const healthyReport = FairnessEngine.evaluate(healthyQueue);
  assert(healthyReport.fairnessScore >= 95, 'Healthy balanced queue receives high fairness score');
  assert(healthyReport.alerts.length === 0, 'Healthy queue has no fairness warning alerts');

  const imbalancedQueue = [
    { id: '1', ticketNumber: 'A-1', position: 1, minutesWaited: 75, isUrgent: false, hasAppointment: false, backwardShiftCount: 3 },
    { id: '2', ticketNumber: 'A-2', position: 2, minutesWaited: 10, isUrgent: true, hasAppointment: false },
  ];
  const imbalancedReport = FairnessEngine.evaluate(imbalancedQueue);
  assert(imbalancedReport.fairnessScore < 80, 'Deducts score when users wait excessively (>45m) or shift back');
  assert(imbalancedReport.alerts.some(a => a.type === 'LONG_WAIT_RISK'), 'Detects long wait risk alert');
  assert(imbalancedReport.alerts.some(a => a.type === 'REPEATED_DISPLACEMENT'), 'Detects repeated displacement alert');

  // 4. Simulator Engine Tests
  console.log('\n--- Testing What-If Simulator Engine ---');
  const simulation = SimulatorEngine.runScenario({
    currentQueueLength: 6,
    currentAvgWaitMinutes: 15,
    currentActiveCounters: 2,
    currentAvgServiceMinutes: 10,
    additionalUsers: 10,
    counterChange: -1, // 1 counter closes
  });

  assert(simulation.projected.queueLength === 16, 'Projected queue size incorporates arrival surge');
  assert(simulation.projected.activeCounters === 1, 'Projected active counters models closure');
  assert(simulation.impact.waitDeltaMinutes > 0, 'Correctly computes wait delta');
  assert(simulation.impact.bottleneckLevel === 'SEVERE', 'Flags severe bottleneck when counters drop to 1 under surge');

  console.log('\n=======================================================');
  console.log('🎉 ALL ENGINE AUTOMATED TESTS PASSED SUCCESSFULLY!');
  console.log('=======================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
