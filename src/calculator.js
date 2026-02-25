export function calculateSimulation(state) {
    const { simTargetAmount, simTargetDays, simWeeksConfig } = state;
    const path = [0];
    let currentTotal = 0;
    let day = 0;

    simWeeksConfig.forEach((week, wIdx) => {
        const daysInThisWeek = (wIdx === simWeeksConfig.length - 1 && simTargetDays % 7 !== 0) ? (simTargetDays % 7) : 7;
        const dailyRate = week.totalAmount / daysInThisWeek;

        for (let d = 0; d < daysInThisWeek; d++) {
            if (currentTotal < simTargetAmount) {
                currentTotal += dailyRate;
                path.push(Math.round(currentTotal));
                day++;
            }
        }
    });

    const lastWeek = simWeeksConfig[simWeeksConfig.length - 1];
    const lastDays = (simTargetDays % 7 !== 0) ? (simTargetDays % 7) : 7;
    const lastSpeed = lastWeek ? Math.max(2000, lastWeek.totalAmount / lastDays) : 2000;

    while (currentTotal < simTargetAmount && day < 1000) {
        currentTotal += lastSpeed;
        path.push(Math.round(currentTotal));
        day++;
    }

    return {
        path,
        completionDay: day,
        status: day < simTargetDays ? 'early' : (day === simTargetDays ? 'on-time' : 'late')
    };
}

export function calculateActualAndProjection(state) {
    const { actTargetAmount, actTargetDays, actWeeksConfig, dailyLogs } = state;
    const actualPath = [0];
    let currentTotal = 0;

    const dayIndices = Object.keys(dailyLogs).map(Number);
    const lastLoggedDay = dayIndices.length > 0 ? Math.max(...dayIndices) : -1;

    for (let i = 0; i <= lastLoggedDay; i++) {
        currentTotal += dailyLogs[i] || 0;
        actualPath.push(currentTotal);
    }

    const projectionPath = [...actualPath];
    if (currentTotal >= actTargetAmount) {
        return { actualPath, projectionPath, status: 'completed', completionDay: lastLoggedDay + 1 };
    }

    let day = lastLoggedDay + 1;

    // Use actWeeksConfig for future days projection
    actWeeksConfig.forEach((week, wIdx) => {
        const startDay = wIdx * 7;
        const daysInBlock = (wIdx === actWeeksConfig.length - 1 && actTargetDays % 7 !== 0) ? (actTargetDays % 7) : 7;
        const endDay = startDay + daysInBlock;

        if (endDay <= day) return; // Week already passed

        const dailyRate = week.totalAmount / daysInBlock;
        const daysToProject = endDay - Math.max(startDay, day);

        for (let d = 0; d < daysToProject; d++) {
            if (currentTotal < actTargetAmount) {
                currentTotal += dailyRate;
                projectionPath.push(Math.round(currentTotal));
                day++;
            }
        }
    });

    // If still not reached target, use last week's speed
    const lastWeek = actWeeksConfig[actWeeksConfig.length - 1];
    const lastDays = (actTargetDays % 7 !== 0) ? (actTargetDays % 7) : 7;
    const fallbackSpeed = lastWeek ? Math.max(2000, lastWeek.totalAmount / lastDays) : 2000;

    while (currentTotal < actTargetAmount && day < 1000) {
        currentTotal += fallbackSpeed;
        projectionPath.push(Math.round(currentTotal));
        day++;
    }

    // Calculate the Ideal Strive Path (from Day 0)
    const strivePath = [0];
    let striveTotal = 0;
    actWeeksConfig.forEach((week, wIdx) => {
        const daysInBlock = (wIdx === actWeeksConfig.length - 1 && actTargetDays % 7 !== 0) ? (actTargetDays % 7) : 7;
        const dailyRate = week.totalAmount / daysInBlock;
        for (let d = 0; d < daysInBlock; d++) {
            if (striveTotal < actTargetAmount) {
                striveTotal += dailyRate;
                strivePath.push(Math.round(striveTotal));
            }
        }
    });

    return {
        actualPath,
        projectionPath,
        strivePath,
        status: day <= actTargetDays ? 'on-track' : 'behind',
        completionDay: day
    };
}

export function calculateAnalytics(state) {
    const { dailyLogs, actTargetAmount, actTargetDays } = state;
    const days = Object.keys(dailyLogs).map(Number).sort((a, b) => a - b);
    if (days.length === 0) return { streak: 0, heatmap: [], insight: "Ready to start your journey? Log your first day!" };

    // Calculate Dynamic Min (same logic as UI)
    const totalLogged = Object.values(dailyLogs).reduce((a, b) => a + (b || 0), 0);
    const lastDayRecorded = days.length > 0 ? Math.max(...days) : -1;

    const remAmt = Math.max(0, actTargetAmount - totalLogged);
    const remDays = Math.max(1, actTargetDays - (lastDayRecorded + 1));
    const currentMinK = Math.round((remAmt / remDays) / 1000 * 10) / 10;

    // Heatmap & Streak
    let streak = 0;
    let maxStreak = 0;
    let consecutiveFreezeDays = 0;
    const heatmap = [];
    const lastDay = Math.max(...days);

    for (let i = 0; i <= lastDay; i++) {
        const val = dailyLogs[i];
        const isLogged = val !== undefined && val !== null;

        // Use frozen threshold if exists, otherwise current
        const thresholdK = (state.logThresholds && state.logThresholds[i]) ? state.logThresholds[i] : currentMinK;

        if (isLogged) {
            const isMet = (val / 1000) >= thresholdK;
            if (isMet) {
                streak++; // Tăng chuỗi nếu đạt chỉ tiêu
                consecutiveFreezeDays = 0;
            } else if (val >= 2000) {
                // "STREAK FREEZE": Không tăng nhưng cũng không reset nếu có nỗ lực tối thiểu (2K)
                // GIỚI HẠN: Chỉ được băng tối đa 2 ngày liên tiếp
                consecutiveFreezeDays++;
                if (consecutiveFreezeDays > 2) {
                    streak = 0;
                    consecutiveFreezeDays = 0;
                } else {
                    streak = streak;
                }
            } else {
                streak = 0; // Reset nếu nhập 0 hoặc quá ít
                consecutiveFreezeDays = 0;
            }
            maxStreak = Math.max(maxStreak, streak);

            // Intensity: 0 to 4
            const ratio = (val / 1000) / thresholdK;
            let intensity = 0;
            if (ratio > 0) intensity = 1;
            if (ratio >= 1) intensity = 2;
            if (ratio >= 1.5) intensity = 3;
            if (ratio >= 2) intensity = 4;

            heatmap.push({ day: i, intensity, val: val / 1000 });
        } else {
            // Dứt chuỗi hoàn toàn nếu không đăng nhập/nhập gì
            streak = 0;
            heatmap.push({ day: i, intensity: 0, val: 0 });
        }
    }

    // Insight
    let insight = "Keep going! Consistency is the key to financial freedom.";
    if (streak >= 3) insight = `Impressive! You are on a ${streak}-day winning streak! 🔥`;
    if (totalLogged >= actTargetAmount * 0.5) insight = "Halfway there! You've secured 50% of your real goal. Finish strong!";
    if (currentMinK > 5000) insight = "The daily requirement is getting high. Try to log a big save soon to stabilize it.";

    return { streak, maxStreak, heatmap, insight, currentMinK, lastDayLogged: lastDay, totalLogged };
}
