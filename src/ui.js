import { stateManager } from './state';
import { calculateSimulation, calculateActualAndProjection, calculateAnalytics } from './calculator';
import { createUnifiedChart, updateUnifiedChart } from './charts';

class UIManager {
    constructor() {
        this.app = document.querySelector('#app');
        this.mainChart = null;
        this.isInitialized = false;

        stateManager.subscribe(() => this.update());
    }

    init() {
        this.renderSkeleton();
        this.isInitialized = true;
        this.update();
        this.addGlobalListeners();
    }

    renderSkeleton() {
        this.app.innerHTML = `
            <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-fade-in pb-24">
                <!-- Top Status Bar (Insights) -->
                <div id="insight-banner" class="bg-indigo-600/10 border border-indigo-500/20 px-6 py-4 rounded-full flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
                    <div class="flex items-center gap-4">
                        <span class="flex h-3 w-3 relative">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        <p id="insight-text" class="text-[10px] md:text-xs font-black text-indigo-300 uppercase tracking-widest">
                            Analyzing your financial momentum...
                        </p>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Current Streak</span>
                            <span id="streak-val" class="text-xl font-black text-white tabular-nums">0</span>
                            <span class="text-base">🔥</span>
                        </div>
                        <div class="w-px h-6 bg-white/10 hidden md:block"></div>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Record</span>
                            <span id="max-streak-val" class="text-xl font-black text-indigo-400 tabular-nums">0</span>
                        </div>
                    </div>
                </div>

                <!-- Unified Command Center -->
                <header class="space-y-8">
                    <div class="bg-gray-900/80 backdrop-blur-3xl p-8 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-emerald-500/5 opacity-50"></div>
                        <div class="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                            <div class="flex items-center gap-6">
                                <div class="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/20">
                                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div>
                                    <h1 class="text-4xl font-black tracking-tighter text-white">GOAL OPTIMIZER</h1>
                                    <p class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] ml-1">Universal Analytics v3</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
                                <div class="bg-black/60 p-6 rounded-[2rem] border border-white/10 shadow-inner group transition-all hover:bg-black/40">
                                    <span class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Simulated Milestone</span>
                                    <div class="flex items-baseline gap-4">
                                        <span id="sim-completion" class="text-3xl font-black text-white tabular-nums">Day 0</span>
                                        <span id="sim-status" class="text-[10px] font-black text-blue-400 shadow-blue-500/20">PLANNING</span>
                                    </div>
                                </div>
                                <div class="bg-black/60 p-6 rounded-[2rem] border border-white/10 shadow-inner group transition-all hover:bg-black/40">
                                    <span class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2 block">Real-World Forecast</span>
                                    <div class="flex items-baseline gap-4">
                                        <span id="act-completion" class="text-3xl font-black text-emerald-500 tabular-nums">Day 0</span>
                                        <span id="act-status" class="text-[10px] font-black text-emerald-400 shadow-emerald-500/20">TRACKING</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <section class="bg-gray-900/40 p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div class="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-4">
                            <div class="flex items-center gap-4">
                                <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                    <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Multi-Channel Projection
                                </h3>
                                <button onclick="window.toggleChartZoom()" class="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group/zoom" title="Toggle Full View">
                                    <svg class="w-4 h-4 text-gray-500 group-hover/zoom:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="flex gap-6">
                                <span class="flex items-center gap-2 text-[10px] font-bold text-blue-400/50 uppercase">
                                    <span class="w-3 h-1 bg-blue-500 rounded"></span> Theory
                                </span>
                                <span class="flex items-center gap-2 text-[10px] font-bold text-violet-400/50 uppercase">
                                    <span class="w-3 h-1 border-t border-dashed border-violet-500 rounded"></span> Strive
                                </span>
                                <span class="flex items-center gap-2 text-[10px] font-bold text-rose-400/50 uppercase">
                                    <span class="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span> Gap
                                </span>
                                <span class="flex items-center gap-2 text-[10px] font-bold text-emerald-400/50 uppercase">
                                    <span class="w-3 h-1 bg-emerald-500 rounded"></span> History
                                </span>
                            </div>
                        </div>
                        <div id="chart-wrapper" class="h-[400px] relative transition-all duration-500 ease-in-out origin-top">
                            <canvas id="unified-chart"></canvas>
                        </div>
                    </section>

                    <!-- Consistency Heatmap (GitHub Style) -->
                    <section class="bg-black/40 p-8 rounded-[3rem] border border-white/5 shadow-inner">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Consistency Heatmap
                            </h3>
                            <div class="flex gap-2">
                                <span class="w-2 h-2 rounded-sm bg-gray-800"></span>
                                <span class="w-2 h-2 rounded-sm bg-emerald-900/40"></span>
                                <span class="w-2 h-2 rounded-sm bg-emerald-700/60"></span>
                                <span class="w-2 h-2 rounded-sm bg-emerald-500/80"></span>
                                <span class="w-2 h-2 rounded-sm bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                            </div>
                        </div>
                        <div id="heatmap-grid" class="flex flex-wrap gap-2 min-h-[40px]">
                            <!-- Generated heatmap -->
                        </div>
                    </section>
                </header>

                <div class="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <!-- LEFT: SIMULATION LAB -->
                    <div class="space-y-8 bg-blue-500/[0.02] p-2 rounded-[3.5rem] border border-blue-500/5">
                        <div class="p-8 md:p-12 space-y-12">
                            <h2 class="text-xl font-black text-white tracking-tight flex items-center gap-4">
                                <span class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm shadow-xl shadow-blue-500/20">01</span>
                                SIMULATION LAB
                            </h2>

                            <section class="bg-gray-900/40 p-10 rounded-[2.5rem] border border-white/5 shadow-xl space-y-12">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div class="space-y-4">
                                        <div class="flex justify-between items-start">
                                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block pt-1">Setup Target (₫)</label>
                                            <div class="flex flex-col items-end">
                                               <span id="sim-target-formatted" class="text-base font-black text-blue-400/90 tabular-nums mb-1">0 ₫</span>
                                               <input type="number" id="sim-target-amount-num" step="2000" min="2000" 
                                                    class="bg-transparent border-none text-right text-gray-700 font-bold text-[9px] outline-none w-32 tabular-nums focus:text-blue-500/50">
                                            </div>
                                        </div>
                                        <input type="range" id="sim-target-amount" step="2000" min="2000" max="10000000"
                                            class="w-full h-2.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-600">
                                        <div class="flex justify-between text-[8px] font-bold text-gray-700 uppercase tracking-tighter">
                                            <span>2k</span>
                                            <span>5M</span>
                                            <span>10M</span>
                                        </div>
                                    </div>
                                    <div class="space-y-6">
                                        <div class="flex justify-between items-center">
                                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Setup Days</label>
                                            <span id="sim-label-days" class="text-xs font-black text-blue-400 px-3 py-1 bg-blue-500/10 rounded-lg">30 Days</span>
                                        </div>
                                        <input type="range" id="sim-target-days" min="1" max="365" 
                                            class="w-full h-2.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-600">
                                    </div>
                                </div>
                            </section>

                            <section class="space-y-6">
                                <label class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] block ml-4">Hypothetical Velocity Blocks</label>
                                <div id="weekly-container" class="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                                    <!-- Sim blocks -->
                                </div>
                            </section>
                        </div>
                    </div>

                    <!-- RIGHT: TRACKING MATRIX -->
                    <div class="space-y-8 bg-emerald-500/[0.02] p-2 rounded-[3.5rem] border border-emerald-500/5">
                        <div class="p-8 md:p-12 space-y-12">
                            <h2 class="text-xl font-black text-white tracking-tight flex items-center gap-4">
                                <span class="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm shadow-xl shadow-emerald-500/20">02</span>
                                TRACKING MATRIX
                            </h2>

                            <section class="bg-gray-900/40 p-10 rounded-[2.5rem] border border-white/5 shadow-xl space-y-12">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div class="space-y-4">
                                        <div class="flex justify-between items-start">
                                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block pt-1">Real Goal (₫)</label>
                                            <div class="flex flex-col items-end">
                                                <span id="act-target-formatted" class="text-lg font-black text-emerald-400 tabular-nums mb-1">0 ₫</span>
                                                <input type="number" id="act-target-amount-num" step="2000" min="2000" 
                                                    class="bg-transparent border-none text-right text-gray-700 font-bold text-[9px] outline-none w-32 tabular-nums focus:text-emerald-500/50">
                                            </div>
                                        </div>
                                        <input type="range" id="act-target-amount" step="2000" min="2000" max="10000000"
                                            class="w-full h-2.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-emerald-600">
                                        <div class="flex justify-between text-[8px] font-bold text-gray-700 uppercase tracking-tighter">
                                            <span>2k</span>
                                            <span>5M</span>
                                            <span>10M</span>
                                        </div>
                                    </div>
                                    <div class="space-y-6">
                                        <div class="flex justify-between items-center">
                                            <label class="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Real Days</label>
                                            <span id="act-label-days" class="text-xs font-black text-emerald-400 px-3 py-1 bg-emerald-500/10 rounded-lg">30 Days</span>
                                        </div>
                                        <input type="range" id="act-target-days" min="1" max="365" 
                                            class="w-full h-2.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-emerald-600">
                                    </div>
                                </div>
                            </section>

                            <section class="space-y-8">
                                <div class="flex items-center justify-between ml-4">
                                    <label class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] block">Momentum Capture Grid</label>
                                    <div class="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                                        <span class="text-[9px] font-black text-emerald-500/60 tracking-widest uppercase">Unit: ₫ x1000 (K)</span>
                                    </div>
                                </div>
                                <div id="calendar-container" class="space-y-14 max-h-[1200px] overflow-y-auto pr-4 custom-scrollbar">
                                    <!-- Blocks with Targets and Daily Logs -->
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <footer class="flex flex-col sm:flex-row justify-center items-center pt-12 gap-4">
                     <button onclick="window.resetState()" class="w-full sm:w-auto px-10 py-5 bg-gray-950/80 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/40 text-gray-700 hover:text-rose-500 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl">
                        Terminate & Reset
                    </button>
                    <div class="flex gap-4 w-full sm:w-auto">
                        <button onclick="window.exportData()" class="flex-1 sm:flex-none px-8 py-5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all">
                            Export JSON
                        </button>
                        <button onclick="document.getElementById('import-file').click()" class="flex-1 sm:flex-none px-8 py-5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] transition-all">
                            Import Map
                        </button>
                        <input type="file" id="import-file" class="hidden" accept=".json" onchange="window.importData(event)">
                    </div>
                </footer>
            </div>
        `;
    }

    update() {
        if (!this.isInitialized) return;
        const state = stateManager.state;
        const sim = calculateSimulation(state);
        const act = calculateActualAndProjection(state);
        const analytics = calculateAnalytics(state);

        // Header Analytics
        document.getElementById('insight-text').textContent = analytics.insight;
        document.getElementById('streak-val').textContent = analytics.streak;
        document.getElementById('max-streak-val').textContent = analytics.maxStreak;

        // Stats
        document.getElementById('sim-completion').textContent = `Day ${sim.completionDay}`;
        document.getElementById('act-completion').textContent = `Day ${act.completionDay}`;
        document.getElementById('sim-status').textContent = sim.status.toUpperCase();
        document.getElementById('act-status').textContent = act.status.toUpperCase();

        // Labels
        document.getElementById('sim-label-days').textContent = `${state.simTargetDays} Days`;
        document.getElementById('act-label-days').textContent = `${state.actTargetDays} Days`;

        // Formatted Amount Display
        document.getElementById('sim-target-formatted').textContent = `${state.simTargetAmount.toLocaleString()} ₫`;
        document.getElementById('act-target-formatted').textContent = `${state.actTargetAmount.toLocaleString()} ₫`;

        // Target Sync
        const targets = [
            ['sim-target-amount', state.simTargetAmount],
            ['sim-target-amount-num', state.simTargetAmount],
            ['act-target-amount', state.actTargetAmount],
            ['act-target-amount-num', state.actTargetAmount],
            ['sim-target-days', state.simTargetDays],
            ['act-target-days', state.actTargetDays]
        ];
        targets.forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el && document.activeElement !== el) el.value = val;
        });

        this.updateSimBlockList(state);
        this.updateActBlockList(state);

        // Heatmap Rendering
        const heatmapContainer = document.getElementById('heatmap-grid');
        if (heatmapContainer) {
            heatmapContainer.innerHTML = analytics.heatmap.map(d => {
                const colors = ['bg-gray-800', 'bg-emerald-900/40', 'bg-emerald-700/60', 'bg-emerald-500/80', 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'];
                return `<div class="w-2.5 h-2.5 rounded-sm ${colors[d.intensity]} transition-all hover:scale-150 cursor-pointer" title="Day ${d.day + 1}: ${d.val.toFixed(1)}K"></div>`;
            }).join('');
        }

        // Chart
        requestAnimationFrame(() => {
            // Recalculate Dynamic Min for Gap Detection
            let totalLogged = 0;
            let loggedCount = 0;
            Object.entries(state.dailyLogs).forEach(([day, val]) => {
                const dayIdx = parseInt(day);
                if (val !== undefined && val !== null && dayIdx < state.actTargetDays) {
                    totalLogged += val;
                    loggedCount++;
                }
            });
            const remAmt = Math.max(0, state.actTargetAmount - totalLogged);
            const remDays = Math.max(0, state.actTargetDays - loggedCount);
            const currentMinK = remDays > 0
                ? Math.round((remAmt / remDays) / 1000 * 10) / 10
                : Math.round(state.actTargetAmount / state.actTargetDays / 1000 * 10) / 10;

            const gapIndices = [];
            Object.entries(state.dailyLogs).forEach(([day, val]) => {
                if (val !== null && (val / 1000) < currentMinK) {
                    gapIndices.push(parseInt(day));
                }
            });

            const chartData = {
                simPath: sim.path,
                actPath: act.actualPath,
                projPath: act.projectionPath,
                strivePath: act.strivePath,
                actGapIndices: gapIndices,
                simTarget: state.simTargetAmount,
                actTarget: state.actTargetAmount,
                simDays: state.simTargetDays,
                actDays: state.actTargetDays
            };
            const ctx = document.getElementById('unified-chart')?.getContext('2d');
            if (ctx) {
                if (!this.mainChart) this.mainChart = createUnifiedChart(ctx, chartData);
                else updateUnifiedChart(this.mainChart, chartData);
            }
        });
    }

    updateSimBlockList(state) {
        const container = document.getElementById('weekly-container');
        const count = state.simWeeksConfig.length;
        if (container.children.length !== count) {
            container.innerHTML = state.simWeeksConfig.map((week, idx) => {
                const days = (idx === count - 1 && state.simTargetDays % 7 !== 0) ? state.simTargetDays % 7 : 7;
                return `
                    <div class="p-8 bg-gray-900/60 rounded-[2.5rem] border border-white/5 hover:border-blue-500/20 transition-all group overflow-hidden">
                        <div class="flex justify-between items-center mb-6">
                            <span class="text-[9px] font-black text-gray-500 group-hover:text-blue-400 transition-colors uppercase tracking-[0.2em]">Block ${idx + 1}</span>
                            <span class="text-[10px] font-mono font-bold text-blue-400/60 bg-blue-500/5 px-2 py-1 rounded-lg sim-indicator tabular-nums">0 ₫/d</span>
                        </div>
                        <div class="space-y-4">
                            <input type="range" min="${days * 2000}" max="${Math.max(week.totalAmount * 3, 200000)}" step="1000" value="${week.totalAmount}"
                                oninput="window.updateBlock('sim', ${week.id}, this.value)"
                                class="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-600">
                            <div class="flex justify-between items-center gap-4">
                                <span class="text-sm font-black text-blue-500/80 tabular-nums sim-block-formatted">${week.totalAmount.toLocaleString()}</span>
                                <input type="number" step="1000" min="${days * 2000}" value="${week.totalAmount}" 
                                    oninput="window.updateBlock('sim', ${week.id}, this.value)"
                                    class="w-16 bg-transparent border-none text-right text-gray-700 font-bold text-[9px] outline-none tabular-nums p-0 focus:text-blue-500/50">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        state.simWeeksConfig.forEach((week, idx) => {
            const el = container.children[idx];
            const days = (idx === count - 1 && state.simTargetDays % 7 !== 0) ? state.simTargetDays % 7 : 7;
            const slider = el.querySelector('input[type="range"]');
            const num = el.querySelector('input[type="number"]');
            const formatted = el.querySelector('.sim-block-formatted');
            if (document.activeElement !== slider) slider.value = week.totalAmount;
            if (document.activeElement !== num) num.value = week.totalAmount;
            formatted.textContent = week.totalAmount.toLocaleString();
            el.querySelector('.sim-indicator').textContent = `${Math.round(week.totalAmount / days).toLocaleString()} ₫/day`;
        });
    }

    updateActBlockList(state) {
        const container = document.getElementById('calendar-container');
        const count = state.actWeeksConfig.length;

        // Calculate Global Remaining Stats for DYNAMIC MIN
        let totalLoggedAmount = 0;
        let loggedDaysCount = 0;
        const loggedDayIndices = new Set();

        Object.entries(state.dailyLogs).forEach(([day, val]) => {
            const dayIdx = parseInt(day);
            if (val !== undefined && val !== null && dayIdx < state.actTargetDays) {
                totalLoggedAmount += val;
                loggedDaysCount++;
                loggedDayIndices.add(dayIdx);
            }
        });

        const remainingGlobalAmount = Math.max(0, state.actTargetAmount - totalLoggedAmount);
        const remainingGlobalDays = Math.max(0, state.actTargetDays - loggedDaysCount);

        // This is the baseline "speed" needed to finish ON TIME for the GLOBAL goal
        const dynamicGlobalMinK = remainingGlobalDays > 0
            ? Math.round((remainingGlobalAmount / remainingGlobalDays) / 1000 * 10) / 10
            : Math.round(state.actTargetAmount / state.actTargetDays / 1000 * 10) / 10;

        if (container.children.length !== count) {
            container.innerHTML = state.actWeeksConfig.map((week, idx) => {
                const startDay = idx * 7;
                const daysInBlock = (idx === count - 1 && state.actTargetDays % 7 !== 0) ? state.actTargetDays % 7 : 7;
                const blockMinK = Math.round((dynamicGlobalMinK * daysInBlock));

                return `
                    <div class="relative pl-14 border-l-2 border-white/5 py-4 group">
                        <div class="absolute -left-[6px] top-12 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                            <div>
                                <h4 class="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] mb-1">DATA BLOCK ${idx + 1}</h4>
                                <div class="global-progress-label text-[11px] font-black text-white/90 mb-2 tabular-nums">
                                    <span class="curr-total">0</span> / <span class="goal-total">${state.actTargetAmount.toLocaleString()}</span>
                                </div>
                                <span class="block-min-label text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-white/50 shadow-2xl transition-all inline-block">MIN: ${blockMinK}K / BLOCK</span>
                            </div>
                            <div class="flex items-center gap-3 bg-black/40 p-4 rounded-[2rem] border border-white/5 shadow-inner">
                                <span class="text-[8px] font-black text-emerald-500/50 uppercase tracking-tighter">Strive Target</span>
                                <div class="flex flex-col items-end">
                                    <span class="text-sm font-black text-emerald-400 tabular-nums strive-formatted">${week.totalAmount.toLocaleString()}</span>
                                    <input type="number" step="1000" min="${daysInBlock * 2000}" value="${week.totalAmount}" 
                                        oninput="window.updateBlock('act', ${week.id}, this.value)"
                                        class="w-20 bg-transparent border-none text-right text-gray-700 font-bold text-[9px] outline-none tabular-nums p-0 focus:text-emerald-500/50">
                                </div>
                                <span class="text-[8px] font-bold text-gray-700">₫</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-4 sm:grid-cols-7 gap-6">
                            ${Array.from({ length: daysInBlock }).map((_, dIdx) => {
                    const day = startDay + dIdx;
                    return `
                                    <div class="group/input flex flex-col items-center">
                                        <div class="min-hint text-[7px] font-black text-white/60 uppercase tracking-tighter mb-2 opacity-100 transition-all bg-black/60 px-2 py-0.5 rounded shadow-sm border border-white/10 flex items-center gap-1">
                                            <span class="min-val">DAILY MIN: ${dynamicGlobalMinK}K</span>
                                            <span class="min-check opacity-0 text-[8px]">✅</span>
                                        </div>
                                        <span class="text-[8px] font-black text-gray-800 block mb-2 uppercase tracking-widest group-hover/input:text-emerald-500/30 transition-colors">D${day + 1}</span>
                                        <div class="relative w-full">
                                            <input type="number" min="0" oninput="window.updateDay(${day}, this.value)" 
                                                placeholder="0"
                                                class="w-full bg-black/20 border border-white/5 rounded-[1.25rem] py-5 text-center text-sm font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-900 tabular-nums shadow-inner group-hover/input:bg-black/40">
                                            <div class="act-hint absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-black text-emerald-500/50 uppercase whitespace-nowrap opacity-100 pointer-events-none transition-all transform scale-90 group-hover/input:scale-100 flex items-center gap-1">
                                                <span class="hint-text">STRIVE MIN: 0K</span>
                                                <span class="strive-check opacity-0 text-[8px]">✅</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                }).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        }

        state.actWeeksConfig.forEach((week, idx) => {
            const block = container.children[idx];
            const startDay = idx * 7;
            const daysInBlock = (idx === count - 1 && state.actTargetDays % 7 !== 0) ? state.actTargetDays % 7 : 7;

            let sumInBlock = 0;
            let loggedDaysCountInBlock = 0;
            for (let i = 0; i < daysInBlock; i++) {
                const val = state.dailyLogs[startDay + i];
                if (val !== undefined && val !== null) {
                    sumInBlock += val;
                    loggedDaysCountInBlock++;
                }
            }

            // Update Block-level MIN label
            const blockMinLabel = block.querySelector('.block-min-label');
            if (blockMinLabel) {
                const blockMinK = Math.round(dynamicGlobalMinK * daysInBlock);
                const blockSumK = sumInBlock / 1000;
                const blockLeftK = Math.max(0, blockMinK - blockSumK);

                const formattedLeft = blockLeftK % 1 === 0 ? blockLeftK.toFixed(0) : blockLeftK.toFixed(1);
                blockMinLabel.textContent = `MIN: ${formattedLeft}K / BLOCK`;

                if (blockLeftK <= 0 && loggedDaysCountInBlock > 0) {
                    blockMinLabel.className = "block-min-label text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all inline-block";
                } else {
                    blockMinLabel.className = "block-min-label text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/10 bg-white/5 text-white/50 shadow-2xl transition-all inline-block";
                }

                // Update Global Progress within Block
                const globalProgressLabel = block.querySelector('.global-progress-label');
                if (globalProgressLabel) {
                    const currSpan = globalProgressLabel.querySelector('.curr-total');
                    const goalSpan = globalProgressLabel.querySelector('.goal-total');
                    if (currSpan) currSpan.textContent = totalLoggedAmount.toLocaleString();
                    if (goalSpan) goalSpan.textContent = state.actTargetAmount.toLocaleString();
                }
            }

            const targetInput = block.querySelector('input[oninput*="updateBlock"]');
            const striveFormatted = block.querySelector('.strive-formatted');
            if (document.activeElement !== targetInput) targetInput.value = week.totalAmount;
            striveFormatted.textContent = week.totalAmount.toLocaleString();

            block.querySelectorAll('.group\\/input').forEach((inputGroup, dIdx) => {
                const input = inputGroup.querySelector('input[oninput*="updateDay"]');
                const minHintEl = inputGroup.querySelector('.min-hint');
                const minValSpan = minHintEl.querySelector('.min-val');
                const actHintEl = inputGroup.querySelector('.act-hint');
                const minCheck = minHintEl.querySelector('.min-check');
                const striveCheck = actHintEl.querySelector('.strive-check');
                const hintText = actHintEl.querySelector('.hint-text');

                const day = startDay + dIdx;
                const dailyValK = state.dailyLogs[day] !== undefined && state.dailyLogs[day] !== null ? state.dailyLogs[day] / 1000 : null;
                const isLogged = dailyValK !== null;

                const remainingDaysInBlock = daysInBlock - loggedDaysCountInBlock;
                let striveHintK = 0;

                if (isLogged) {
                    striveHintK = Math.round((week.totalAmount / daysInBlock) / 1000);
                } else {
                    const remainingAmount = Math.max(0, week.totalAmount - sumInBlock);
                    striveHintK = remainingDaysInBlock > 0
                        ? Math.round((remainingAmount / remainingDaysInBlock) / 1000)
                        : Math.round((week.totalAmount / daysInBlock) / 1000);
                }

                if (document.activeElement !== input) {
                    input.value = isLogged ? dailyValK : '';
                }

                // Update dynamic values in the UI elements
                if (minValSpan) minValSpan.textContent = `DAILY MIN: ${dynamicGlobalMinK}K`;

                if (isLogged) {
                    const isGreaterOrEqualStrive = dailyValK >= striveHintK;
                    const isGreaterStrive = dailyValK > striveHintK;
                    const isLesserStrive = dailyValK < striveHintK;
                    const isLesserMin = dailyValK < dynamicGlobalMinK;

                    // Update Text for Logged Days
                    const blockMinK = Math.round(dynamicGlobalMinK * daysInBlock);
                    const blockSumK = sumInBlock / 1000;
                    const blockLeftK = Math.max(0, blockMinK - blockSumK);

                    const minSpan = minHintEl.querySelector('.min-val');
                    if (minSpan) {
                        if (!isLesserMin) {
                            minSpan.textContent = `DAILY MIN MET (${blockLeftK.toFixed(1)}K LEFT)`;
                        } else {
                            const dailyGapK = (dynamicGlobalMinK - dailyValK).toFixed(1);
                            minSpan.textContent = `DAILY MIN GAP: ${dailyGapK}K (${blockLeftK.toFixed(1)}K LEFT)`;
                        }
                    }

                    const blockStriveTargetK = week.totalAmount / 1000;
                    const blockStriveLeftK = Math.max(0, blockStriveTargetK - blockSumK);
                    const striveStatusText = isGreaterOrEqualStrive ? "STRIVE MET" : `STRIVE GAP: ${(striveHintK - dailyValK).toFixed(1)}K`;
                    hintText.textContent = `${striveStatusText} (${blockStriveLeftK.toFixed(1)}K LEFT)`;

                    // Cases
                    if (!isLesserMin) {
                        // MIN IS MET (Emerald)
                        minHintEl.className = "min-hint text-[7px] font-black text-emerald-400 uppercase tracking-tighter mb-2 bg-emerald-500/10 px-2 py-0.5 rounded shadow-sm border border-emerald-500/20 flex items-center gap-1";
                        minCheck.style.opacity = "1";
                    } else {
                        // MIN IS NOT MET (Rose)
                        minHintEl.className = "min-hint text-[7px] font-black text-rose-500 uppercase tracking-tighter mb-2 bg-rose-500/10 px-2 py-0.5 rounded shadow-sm border border-rose-500/20 flex items-center gap-1";
                        minCheck.style.opacity = "0";
                    }

                    if (isGreaterOrEqualStrive) {
                        // STRIVE IS MET (Emerald)
                        actHintEl.className = "act-hint absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-black text-emerald-400 uppercase whitespace-nowrap opacity-100 pointer-events-none transition-all transform scale-100 flex items-center gap-1";
                        striveCheck.style.opacity = "1";
                    } else {
                        // STRIVE IS NOT MET (Rose)
                        actHintEl.className = "act-hint absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-black text-rose-500 uppercase whitespace-nowrap opacity-100 pointer-events-none transition-all transform scale-100 flex items-center gap-1";
                        striveCheck.style.opacity = "0";
                    }
                } else {
                    // Reset to idle (unlogged)
                    hintText.textContent = `STRIVE MIN: ${striveHintK}K${striveHintK < 2 ? ' (<2K)' : ''}`;
                    minHintEl.className = "min-hint text-[7px] font-black text-white/60 uppercase tracking-tighter mb-2 bg-black/60 px-2 py-0.5 rounded shadow-sm border border-white/10 flex items-center gap-1";
                    actHintEl.className = "act-hint absolute -bottom-5 left-1/2 -translate-x-1/2 text-[7px] font-black text-emerald-500/50 uppercase whitespace-nowrap opacity-100 pointer-events-none transition-all transform scale-90 flex items-center gap-1";
                    minCheck.style.opacity = "0";
                    striveCheck.style.opacity = "0";
                }
            });
        });
    }

    addGlobalListeners() {
        const updateSim = val => stateManager.updateSimGoal(Number(val), stateManager.state.simTargetDays);
        const updateAct = val => stateManager.updateActGoal(Number(val), stateManager.state.actTargetDays);

        document.getElementById('sim-target-amount')?.addEventListener('input', e => updateSim(e.target.value));
        document.getElementById('sim-target-amount-num')?.addEventListener('input', e => updateSim(e.target.value));
        document.getElementById('sim-target-days')?.addEventListener('input', e => stateManager.updateSimGoal(stateManager.state.simTargetAmount, Number(e.target.value)));

        document.getElementById('act-target-amount')?.addEventListener('input', e => updateAct(e.target.value));
        document.getElementById('act-target-amount-num')?.addEventListener('input', e => updateAct(e.target.value));
        document.getElementById('act-target-days')?.addEventListener('input', e => stateManager.updateActGoal(stateManager.state.actTargetAmount, Number(e.target.value)));

        window.updateBlock = (mode, id, val) => stateManager.updateWeeklyAmount(mode, id, Number(val));
        window.updateDay = (day, val) => {
            const numVal = val === '' ? null : Number(val);
            stateManager.updateDailyLog(day, numVal === null ? null : numVal * 1000);
        };
        window.resetState = () => { if (confirm('Purge all data streams?')) { stateManager.reset(); window.location.reload(); } };

        window.toggleChartZoom = () => {
            const wrapper = document.getElementById('chart-wrapper');
            if (!wrapper) return;
            const isZoomed = wrapper.classList.toggle('h-[800px]');
            wrapper.classList.toggle('h-[400px]');
            if (this.mainChart) {
                setTimeout(() => this.mainChart.resize(), 500);
            }
        };

        window.exportData = () => {
            const data = JSON.stringify(stateManager.state, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `goal_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        };

        window.importData = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (confirm('Importing will overwrite current state. Proceed?')) {
                        stateManager.importBulkState(data);
                    }
                } catch (err) {
                    alert('Invalid JSON file.');
                }
            };
            reader.readAsText(file);
        };
    }
}

export const uiManager = new UIManager();
