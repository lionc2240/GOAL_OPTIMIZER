const STORAGE_KEY = 'finance_goal_tracker_state';

const defaultState = {
    // Simulation Lab State
    simTargetAmount: 500000,
    simTargetDays: 30,
    simWeeksConfig: [], // Array of { id, totalAmount }

    // Tracking Matrix State
    actTargetAmount: 500000,
    actTargetDays: 30,
    actWeeksConfig: [], // NEW: Targets per tracking block
    dailyLogs: {},   // Key: dayIndex, Value: amount
    actStartDate: null,

    // NEW: Integrity & Lock
    isLocked: false,
    logThresholds: {}, // Key: dayIndex, Value: minK at time of logging (Frozen history)
};

class StateManager {
    constructor() {
        this.state = this.loadState();
        this.subscribers = [];
        this.syncConfigs();
    }

    loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Migration
                if (data.weeksConfig !== undefined) {
                    data.simWeeksConfig = data.weeksConfig;
                    delete data.weeksConfig;
                }
                if (data.targetAmount !== undefined) {
                    data.simTargetAmount = data.targetAmount;
                    data.actTargetAmount = data.targetAmount;
                    delete data.targetAmount;
                }
                if (data.targetDays !== undefined) {
                    data.simTargetDays = data.targetDays;
                    data.actTargetDays = data.targetDays;
                    delete data.targetDays;
                }
                if (data.isLocked === undefined) data.isLocked = false;
                if (!data.logThresholds) data.logThresholds = {};
                if (!data.actStartDate) {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    data.actStartDate = now.getTime();
                }

                return data;
            } catch (e) {
                console.error('Failed to parse state', e);
            }
        }
        return JSON.parse(JSON.stringify(defaultState));
    }

    saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        this.notify();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(s => s !== callback);
        };
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.state));
    }

    toggleLock() {
        this.state.isLocked = !this.state.isLocked;
        this.saveState();
        return this.state.isLocked;
    }

    updateSimGoal(amount, days) {
        if (this.state.isLocked) return;
        this.state.simTargetAmount = Math.max(2000, amount);
        const oldDays = this.state.simTargetDays;
        this.state.simTargetDays = Math.max(1, days);
        this.recalculateWeeks('sim', oldDays !== this.state.simTargetDays);
        this.saveState();
    }

    updateActGoal(amount, days) {
        if (this.state.isLocked) return;
        this.state.actTargetAmount = Math.max(2000, amount);
        const oldDays = this.state.actTargetDays;
        const newDays = Math.max(1, days);
        this.state.actTargetDays = newDays;

        // Prune data beyond new boundary if days decreased
        if (newDays < oldDays) {
            Object.keys(this.state.dailyLogs).forEach(day => {
                if (parseInt(day) >= newDays) {
                    delete this.state.dailyLogs[day];
                    delete this.state.logThresholds[day];
                }
            });
        }

        this.recalculateWeeks('act', oldDays !== newDays);
        this.saveState();
    }

    syncConfigs() {
        // Init start date for new users immediately
        if (!this.state.actStartDate) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            this.state.actStartDate = now.getTime();
        }
        this.recalculateWeeks('sim', this.state.simWeeksConfig.length === 0);
        if (!this.state.actWeeksConfig) this.state.actWeeksConfig = [];
        this.recalculateWeeks('act', this.state.actWeeksConfig.length === 0);
    }

    recalculateWeeks(mode, rebuild = false) {
        if (this.state.isLocked && rebuild) return; // Protection
        const prefix = mode === 'sim' ? 'sim' : 'act';
        const targetAmount = this.state[`${prefix}TargetAmount`];
        const targetDays = this.state[`${prefix}TargetDays`];
        const configKey = `${prefix}WeeksConfig`;

        const numWeeks = Math.floor(targetDays / 7);
        const extraDays = targetDays % 7;
        const totalPhases = numWeeks + (extraDays > 0 ? 1 : 0);

        if (rebuild || this.state[configKey].length !== totalPhases) {
            const newConfig = [];
            for (let i = 0; i < numWeeks; i++) {
                const share = (targetAmount / targetDays) * 7;
                newConfig.push({ id: i, totalAmount: Math.max(14000, Math.round(share / 1000) * 1000) });
            }
            if (extraDays > 0) {
                const share = (targetAmount / targetDays) * extraDays;
                newConfig.push({ id: numWeeks, totalAmount: Math.max(extraDays * 2000, Math.round(share / 1000) * 1000) });
            }
            this.state[configKey] = newConfig;
        } else {
            this.state[configKey].forEach((week, i) => {
                const isLast = i === totalPhases - 1 && extraDays > 0;
                const min = (isLast ? extraDays : 7) * 2000;
                if (week.totalAmount < min) week.totalAmount = min;
            });
        }
    }

    updateWeeklyAmount(mode, weekId, amount) {
        if (this.state.isLocked) return;
        const configKey = mode === 'sim' ? 'simWeeksConfig' : 'actWeeksConfig';
        const targetDays = mode === 'sim' ? this.state.simTargetDays : this.state.actTargetDays;
        const weekIdx = this.state[configKey].findIndex(w => w.id === weekId);

        if (weekIdx !== -1) {
            const extraDays = targetDays % 7;
            const isLast = weekIdx === this.state[configKey].length - 1 && extraDays > 0;
            const min = (isLast ? extraDays : 7) * 2000;
            this.state[configKey][weekIdx].totalAmount = Math.max(min, amount);
            this.saveState();
        }
    }

    updateDailyLog(dayIndex, amount, currentThresholdK = null) {
        if (amount === null || amount === undefined || amount === '') {
            delete this.state.dailyLogs[dayIndex];
            delete this.state.logThresholds[dayIndex];
        } else {
            this.state.dailyLogs[dayIndex] = Number(amount);

            // Auto-initialize start date if first log
            if (!this.state.actStartDate) {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                this.state.actStartDate = now.getTime();
            }

            // Freeze the criteria for this day if provided
            if (currentThresholdK !== null) {
                this.state.logThresholds[dayIndex] = currentThresholdK;
            }
        }
        this.saveState();
    }

    reset() {
        this.state = JSON.parse(JSON.stringify(defaultState));
        this.syncConfigs();
        this.saveState();
    }

    importBulkState(data) {
        if (!data || typeof data !== 'object') return;
        this.state = { ...this.state, ...data };
        this.syncConfigs();
        this.saveState();
        window.location.reload();
    }
}

export const stateManager = new StateManager();
