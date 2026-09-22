// Dynamic Priority Engine
// Computes transparent, explainable priority scores based solely on legitimate service metrics.
// Strictly prevents starvation through continuous wait-time aging.
export class PriorityEngine {
    /**
     * Calculates the real-time dynamic priority of a queue entry.
     * Starvation Prevention: Every minute spent waiting accrues priority points,
     * guaranteeing long-waiting individuals advance ahead of newer arrivals.
     */
    static calculate(input) {
        const joinDate = new Date(input.joinTime);
        const now = new Date();
        const minutesWaited = Math.max(0, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60)));
        const agingWeight = input.queueRules?.wait_time_aging_weight ?? 1.5;
        const urgencyWeight = input.queueRules?.urgency_boost_weight ?? 40.0;
        const appointmentWeight = input.queueRules?.appointment_boost_weight ?? 15.0;
        const baseServiceScore = input.serviceBasePriority ?? 10;
        // Waiting time bonus: 1.5 points per minute waited
        const waitTimeBonus = Math.round(minutesWaited * agingWeight * 10) / 10;
        // Legitimate operational factors:
        const urgencyBonus = input.isUrgent ? urgencyWeight : 0;
        const appointmentBonus = input.hasAppointment ? appointmentWeight : 0;
        const totalScore = Math.round((baseServiceScore + waitTimeBonus + appointmentBonus + urgencyBonus) * 10) / 10;
        // Construct transparent, human-readable reason
        const reasons = [];
        if (minutesWaited > 0) {
            reasons.push(`+${waitTimeBonus} pts for ${minutesWaited} min waiting time`);
        }
        if (urgencyBonus > 0) {
            reasons.push(`+${urgencyBonus} pts for verified urgent triage`);
        }
        if (appointmentBonus > 0) {
            reasons.push(`+${appointmentBonus} pts for scheduled appointment`);
        }
        if (reasons.length === 0) {
            reasons.push(`Base entry priority (${baseServiceScore} pts)`);
        }
        return {
            score: totalScore,
            breakdown: {
                baseServiceScore,
                waitTimeBonus,
                appointmentBonus,
                urgencyBonus,
                minutesWaited,
            },
            reason: reasons.join(', '),
        };
    }
}
