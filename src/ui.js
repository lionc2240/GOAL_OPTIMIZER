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
                        <div class="flex flex-col items-end">
                            <span class="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">Daily Min</span>
                            <div class="flex items-baseline gap-1">
                                <span id="global-min-val" class="text-lg font-black text-white">0</span>
                                <span class="text-[10px] font-bold text-white/40">K</span>
                            </div>
                        </div>
                        <div class="w-px h-6 bg-white/10"></div>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Streak</span>
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
                                    <p id="version-label" class="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-1">Universal Analytics v3</p>
                                </div>
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

                <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <!-- MAIN: TRACKING MATRIX (Priority Focus) -->
                    <div class="order-1 lg:w-2/3 space-y-8 bg-emerald-500/[0.02] p-1 md:p-2 rounded-[3.5rem] border border-emerald-500/5">
                        <div class="p-6 md:p-10 space-y-10">
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h2 class="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                                    <span class="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-base shadow-xl shadow-emerald-500/20 rotate-3">01</span>
                                    TRACKING MATRIX
                                </h2>
                                <div class="bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
                                    <span class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Streak</span>
                                    <span id="local-streak-val" class="text-2xl font-black text-white tabular-nums">0</span>
                                    <span class="text-xl animate-bounce">🔥</span>
                                </div>
                            </div>

                            <section class="bg-gray-900/40 p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-8">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
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
                                <div class="mt-8 flex justify-center">
                                    <button id="lock-btn" onclick="window.toggleLock()" class="group/lock flex items-center gap-3 px-8 py-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600/20 transition-all shadow-xl">
                                        <span id="lock-icon" class="text-base">🔓</span>
                                        <span id="lock-text" class="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Commit Goal</span>
                                    </button>
                                </div>
                            </section>

                            <section class="space-y-8">
                                <div class="flex items-center justify-between ml-2">
                                    <label class="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] block">Tracking Grid</label>
                                    <div class="text-[9px] font-black text-emerald-500/40 tracking-widest uppercase bg-black/20 px-3 py-1 rounded-lg">₫ x1000</div>
                                </div>
                                <div id="calendar-container" class="space-y-12">
                                    <!-- Blocks with Targets and Daily Logs -->
                                </div>
                            </section>
                        </div>
                    </div>

                    <!-- SECONDARY: SIMULATION LAB -->
                    <div class="order-2 lg:w-1/3 space-y-8 bg-blue-500/[0.01] p-1 rounded-[3.5rem] border border-blue-500/5">
                        <div class="p-6 md:p-8 space-y-8">
                            <h2 class="text-lg font-black text-gray-500 tracking-tight flex items-center gap-4">
                                <span class="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-[10px] shadow-lg text-gray-400">02</span>
                                SIMULATION LAB
                            </h2>

                            <section class="bg-gray-900/20 p-6 rounded-[2rem] border border-white/5 space-y-8">
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center">
                                        <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Plan Target</label>
                                        <span id="sim-target-formatted" class="text-sm font-black text-blue-400/70 tabular-nums">0 ₫</span>
                                    </div>
                                    <input type="range" id="sim-target-amount" step="2000" min="2000" max="10000000"
                                        class="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-900">
                                    <input type="number" id="sim-target-amount-num" step="2000" min="2000" 
                                        class="bg-transparent border-none text-left text-gray-800 font-bold text-[8px] outline-none w-full tabular-nums focus:text-blue-500/50">
                                </div>
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center">
                                        <label class="text-[9px] font-black text-gray-600 uppercase tracking-widest">Timeline</label>
                                        <span id="sim-label-days" class="text-[10px] font-black text-blue-500/70">30 Days</span>
                                    </div>
                                    <input type="range" id="sim-target-days" min="1" max="365" 
                                        class="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-blue-900">
                                </div>
                            </section>

                            <section class="space-y-4">
                                <label class="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] block ml-2">Velocity Presets</label>
                                <div id="weekly-container" class="grid grid-cols-1 gap-4">
                                    <!-- Sim blocks -->
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

        // Update Lock UI
        const lockBtn = document.getElementById('lock-btn');
        const lockIcon = document.getElementById('lock-icon');
        const lockText = document.getElementById('lock-text');

        if (lockBtn) {
            if (state.isLocked) {
                lockBtn.className = "group/lock flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)] transition-all";
                if (lockIcon) lockIcon.textContent = "🔒";
                if (lockText) {
                    lockText.textContent = "Goal Locked";
                    lockText.className = "text-[8px] font-black text-rose-300 uppercase tracking-widest";
                }
            } else {
                lockBtn.className = "group/lock flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all";
                if (lockIcon) lockIcon.textContent = "🔓";
                if (lockText) {
                    lockText.textContent = "Commit Goal";
                    lockText.className = "text-[8px] font-black text-indigo-300 uppercase tracking-widest";
                }
            }
        }

        // Disable inputs if locked
        const targetInputs = ['sim-target-amount', 'sim-target-amount-num', 'sim-target-days', 'act-target-amount', 'act-target-amount-num', 'act-target-days'];
        targetInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = state.isLocked;
        });

        // Header Analytics
        document.getElementById('insight-text').textContent = analytics.insight;
        document.getElementById('streak-val').textContent = analytics.streak;
        document.getElementById('local-streak-val').textContent = analytics.streak;
        document.getElementById('max-streak-val').textContent = analytics.maxStreak;

        // Stats
        document.getElementById('sim-completion').textContent = `Day ${sim.completionDay}`;

        // Smart act-completion: show calendar date if startDate known
        const actCompletionEl = document.getElementById('act-completion');
        if (actCompletionEl) {
            if (state.actStartDate && act.completionDay) {
                const finishTs = state.actStartDate + act.completionDay * 24 * 60 * 60 * 1000;
                const finishDate = new Date(finishTs);
                const dd = finishDate.getDate();
                const mm = finishDate.getMonth() + 1;
                actCompletionEl.textContent = `D${act.completionDay} · ${dd}/${mm}`;
            } else {
                actCompletionEl.textContent = `Day ${act.completionDay}`;
            }
        }

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
                actDays: state.actTargetDays,
                momentumDay: act.completionDay
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
        if (container.children.length !== count || !container.dataset.version || container.dataset.version !== "3") {
            container.dataset.version = "3";
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
        const dayIndices = Object.keys(state.dailyLogs).map(Number);
        const lastDayLogged = dayIndices.length > 0 ? Math.max(...dayIndices) : -1;
        const totalLoggedAmount = Object.values(state.dailyLogs).reduce((a, b) => {
            const val = (typeof b === 'object' && b !== null) ? b.val : b;
            return a + (val || 0);
        }, 0);

        const remainingGlobalAmount = Math.max(0, state.actTargetAmount - totalLoggedAmount);
        const remainingGlobalDays = Math.max(1, state.actTargetDays - (lastDayLogged + 1));

        const dynamicGlobalMinK = Math.max(2, Math.round((remainingGlobalAmount / remainingGlobalDays) / 1000 * 10) / 10);

        // Identify Today's Index
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);
        const todayIdx = state.actStartDate ? Math.floor((todayAtMidnight.getTime() - state.actStartDate) / (24 * 60 * 60 * 1000)) : -1;

        // Pre-compute active week index (the week containing today, or first unlogged)
        const firstUnloggedDay = Array.from({ length: state.actTargetDays }).findIndex((_, i) => state.dailyLogs[i] === undefined || state.dailyLogs[i] === null);
        const activeWeekIdx = todayIdx >= 0 && todayIdx < state.actTargetDays
            ? Math.floor(todayIdx / 7)
            : (firstUnloggedDay === -1 ? count - 1 : Math.floor(firstUnloggedDay / 7));

        // Pre-compute analytics once
        const analytics = calculateAnalytics(state);

        // Update Global Min in UI
        const globalMinEl = document.getElementById('global-min-val');
        if (globalMinEl) globalMinEl.textContent = dynamicGlobalMinK;

        if (container.children.length !== count || !container.dataset.version || container.dataset.version !== "3") {
            container.dataset.version = "3";
            container.innerHTML = state.actWeeksConfig.map((week, idx) => {
                const startDay = idx * 7;
                const daysInBlock = (idx === count - 1 && state.actTargetDays % 7 !== 0) ? state.actTargetDays % 7 : 7;
                const blockMinK = Math.round((dynamicGlobalMinK * daysInBlock));

                // Streak Fire Spots for this block
                const fireSpots = Array.from({ length: 7 }).map((_, dIdx) => {
                    const day = startDay + dIdx;
                    if (dIdx >= daysInBlock) return '';
                    const log = state.dailyLogs[day];
                    const valK = (typeof log === 'object' ? log?.val : log) / 1000;
                    const logMinK = (typeof log === 'object' && log?.minK !== undefined) ? log.minK : dynamicGlobalMinK;
                    const isMet = log !== undefined && log !== null && valK >= logMinK;
                    return `<span class="text-[10px] ${isMet ? 'text-orange-500 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'text-gray-800'} transition-all">${isMet ? '🔥' : '·'}</span>`;
                }).join('');

                return `
                    <div class="relative pl-0 sm:pl-14 border-l-0 sm:border-l-2 border-white/5 py-4 group">
                        <div class="hidden sm:block absolute ${idx === activeWeekIdx ? 'animate-pulse' : ''} -left-[6px] top-12 w-2.5 h-2.5 rounded-full ${idx === activeWeekIdx ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10'}"></div>
                        
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 px-2">
                            <div class="space-y-4">
                                <div class="flex items-center gap-4">
                                    <h4 class="text-[9px] font-black ${idx === activeWeekIdx ? 'text-indigo-400' : 'text-gray-700'} uppercase tracking-[0.4em]">WEEK ${idx + 1}</h4>
                                    <div class="week-streak-container flex gap-1 bg-black/40 px-2 py-1.5 rounded-xl border border-white/5">
                                        <!-- Fire spots dynamic -->
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center gap-3">
                                    <div class="global-progress-label transition-all inline-block relative overflow-hidden px-3 py-1 rounded-full border border-white/5 bg-white/5 shadow-xl min-w-[120px]">
                                        <div class="progress-fill absolute inset-y-0 left-0 bg-emerald-500/20 transition-all duration-500" style="width: 0%"></div>
                                        <span class="progress-text relative z-10 text-[8px] font-black uppercase tracking-[0.2em] text-white/40">CALCULATING...</span>
                                    </div>
                                    <span class="block-min-label text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-white/5 bg-white/5 text-white/30 transition-all inline-block">0K / ${blockMinK}K</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/5 transition-all hover:bg-black/40">
                                <span class="text-[7px] font-black text-gray-600 uppercase tracking-widest">Strive Target</span>
                                <input type="number" step="1000" min="${daysInBlock * 2000}" value="${week.totalAmount}" 
                                    oninput="window.updateBlock('act', ${week.id}, this.value)"
                                    class="w-12 bg-transparent border-none text-right text-emerald-400 font-black text-[9px] outline-none tabular-nums p-0 focus:ring-1 focus:ring-emerald-500/20">
                            </div>
                        </div>

                        <div class="grid grid-cols-7 gap-1 sm:gap-3 bg-black/10 p-2 sm:p-4 rounded-[2rem] border border-white/5">
                            ${Array.from({ length: daysInBlock }).map((_, dIdx) => {
                    const day = startDay + dIdx;
                    const dateObj = state.actStartDate ? new Date(state.actStartDate + day * 24 * 60 * 60 * 1000) : null;
                    const dateStr = dateObj ? `${dateObj.getDate()}/${dateObj.getMonth() + 1}` : '';
                    const isToday = day === todayIdx;

                    return `
                                    <div class="group/day flex flex-col items-center gap-1.5 relative">
                                        ${isToday ? '<span class="absolute -top-6 text-[7px] font-black text-indigo-400 animate-bounce tracking-widest">TODAY</span>' : ''}
                                        <div class="flex flex-col items-center opacity-40 group-hover/day:opacity-100 transition-opacity">
                                            <span class="text-[7px] font-black ${isToday ? 'text-indigo-400' : 'text-gray-800'} uppercase tracking-tighter">D${day + 1}</span>
                                            <span class="text-[6px] font-bold ${isToday ? 'text-indigo-400/60' : 'text-gray-900'}">${dateStr}</span>
                                        </div>
                                        
                                        <!-- Checkmark: Daily Min -->
                                        <button onclick="window.quickCheck(${day}, ${dynamicGlobalMinK})" 
                                            class="check-min h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-white/5 bg-black/40 transition-all hover:scale-105 active:scale-95" 
                                            title="Check Daily Min: ${dynamicGlobalMinK}K">
                                            <span class="text-[10px] font-black text-white/10 check-icon">✓</span>
                                        </button>

                                        <!-- Checkmark: Strive Min (Dynamic) -->
                                        <button onclick="window.quickStrive(${day}, ${idx})" 
                                            class="check-strive h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-white/5 bg-black/40 transition-all hover:scale-105 active:scale-95"
                                            title="Check Strive Goal">
                                            <span class="text-[10px] font-black text-white/10 check-icon">★</span>
                                        </button>

                                        <div class="relative w-full">
                                            <input type="number" min="0" 
                                                oninput="window.updateDay(${day}, this.value, ${dynamicGlobalMinK})" 
                                                onchange="if(this.value > 0 && this.value < 2) { this.value = 0; window.updateDay(${day}, this.value, ${dynamicGlobalMinK}); }"
                                                placeholder="0"
                                                class="w-full bg-white/5 border border-white/5 rounded-lg py-2 text-center text-[9px] font-black focus:border-emerald-500/50 outline-none transition-all placeholder-gray-900 tabular-nums">
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
                const log = state.dailyLogs[startDay + i];
                if (log !== undefined && log !== null) {
                    const val = typeof log === 'object' ? log.val : log;
                    sumInBlock += (val || 0);
                    loggedDaysCountInBlock++;
                }
            }

            // Update Block-level MIN label
            const blockMinLabel = block.querySelector('.block-min-label');
            if (blockMinLabel) {
                const blockMinK = Math.round(dynamicGlobalMinK * daysInBlock);
                const blockSumK = sumInBlock / 1000;
                const blockLeftK = Math.max(0, blockMinK - blockSumK);

                const formattedSum = blockSumK % 1 === 0 ? blockSumK.toFixed(0) : blockSumK.toFixed(1);
                blockMinLabel.textContent = `${formattedSum}K / ${blockMinK}K`;

                if (blockLeftK <= 0 && loggedDaysCountInBlock > 0) {
                    blockMinLabel.className = "block-min-label text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all inline-block";
                } else {
                    blockMinLabel.className = "block-min-label text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-white/5 bg-white/5 text-white/30 transition-all inline-block";
                }

                // Update Week-level Streak (Fire Spots)
                const streakWrapper = block.querySelector('.week-streak-container')?.parentElement;
                const streakContainer = block.querySelector('.week-streak-container');

                if (!streakWrapper || !streakContainer) return;

                // Only show fire streak for the CURRENT active week
                if (idx === activeWeekIdx) {
                    streakWrapper.style.display = 'flex';
                    streakContainer.innerHTML = Array.from({ length: 7 }).map((_, dIdx) => {
                        const day = startDay + dIdx;
                        if (day >= state.actTargetDays) return '<span class="text-[10px] opacity-5">🔥</span>';

                        const log = state.dailyLogs[day];
                        const val = typeof log === 'object' ? log?.val : log;
                        const logMinK = (typeof log === 'object' && log?.minK !== undefined) ? log.minK : dynamicGlobalMinK;
                        const valK = (val || 0) / 1000;
                        const isLogged = log !== undefined && log !== null;
                        const isMetDaily = isLogged && valK >= logMinK;

                        // Strive hint logic (Always shows current target based on goal)
                        const remainingDays = Math.max(1, daysInBlock - (isLogged ? loggedDaysCountInBlock - 1 : loggedDaysCountInBlock));
                        const remainingAmt = Math.max(0, week.totalAmount - (isLogged ? sumInBlock - (val || 0) : sumInBlock));
                        const striveK = Math.max(2, Math.round((remainingAmt / remainingDays) / 1000));
                        const isMetStrive = isLogged && valK >= striveK;

                        if (isMetStrive) return `<span class="text-[11px] text-orange-400 filter drop-shadow-[0_0_8px_rgba(251,146,60,0.8)] opacity-100 transition-all scale-110">🔥</span>`;
                        if (isMetDaily) return `<span class="text-[10px] text-orange-600/80 opacity-90 transition-all">🔥</span>`;
                        if (isLogged && (val || 0) >= 2000) return `<span class="text-[10px] text-blue-400 filter drop-shadow-[0_0_5px_rgba(96,165,250,0.4)] opacity-60 transition-all" title="Streak Frozen">❄️</span>`;
                        if (isLogged) return `<span class="text-[10px] text-gray-600 opacity-40 transition-all">🔥</span>`;
                        return `<span class="text-[10px] text-gray-800 opacity-20 filter grayscale transition-all">🔥</span>`;
                    }).join('');
                } else {
                    streakWrapper.style.display = 'none';
                }

                // Update Global Streak Banner Color if Broken
                const streakBanner = document.querySelector('#local-streak-val')?.parentElement;
                if (streakBanner) {
                    if (analytics.streak === 0 && (analytics.lastDayLogged !== -1)) {
                        streakBanner.className = "bg-rose-600/10 border border-rose-500/40 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl animate-pulse";
                    } else {
                        streakBanner.className = "bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl";
                    }
                }

                // Update Global Progress within Block
                const globalProgressLabel = block.querySelector('.global-progress-label');
                if (globalProgressLabel) {
                    const percentage = Math.min(100, Math.floor((totalLoggedAmount / state.actTargetAmount) * 100));
                    const fill = globalProgressLabel.querySelector('.progress-fill');
                    const text = globalProgressLabel.querySelector('.progress-text');

                    if (fill) fill.style.width = `${percentage}%`;

                    let msg = "BẮT ĐẦU THÔI!";
                    if (percentage >= 100) msg = "MỤC TIÊU ĐÃ ĐẠT! 🎉";
                    else if (percentage >= 90) msg = "SẮP ĐẦY RỒI! CỐ LÊN 🔥";
                    else if (percentage >= 75) msg = "TIẾN RẤT GẦN RỒI! 🚀";
                    else if (percentage >= 50) msg = "VẪN ĐANG CỐ GẮNG! 💪";
                    else if (percentage >= 25) msg = "ĐANG TẠO ĐÀ... ⚡";
                    else if (percentage > 0) msg = "ĐÃ CÓ TIẾN TRIỂN";

                    if (text) {
                        text.textContent = `${percentage}% - ${msg}`;
                        if (percentage >= 50) {
                            text.className = "progress-text relative z-10 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-400";
                            fill.className = "progress-fill absolute inset-y-0 left-0 bg-emerald-500/30 transition-all duration-700";
                        } else {
                            text.className = "progress-text relative z-10 text-[9px] font-black uppercase tracking-[0.1em] text-white/50";
                            fill.className = "progress-fill absolute inset-y-0 left-0 bg-white/10 transition-all duration-700";
                        }
                    }

                    if (percentage >= 100) {
                        globalProgressLabel.className = "global-progress-label transition-all inline-block relative overflow-hidden px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] min-w-[120px]";
                        if (fill) fill.className = "progress-fill absolute inset-y-0 left-0 bg-indigo-500/40 transition-all duration-700";
                    } else {
                        globalProgressLabel.className = "global-progress-label transition-all inline-block relative overflow-hidden px-3 py-1 rounded-full border border-white/5 bg-white/5 shadow-xl min-w-[120px]";
                    }
                }
            }

            const targetInput = block.querySelector('input[oninput*="updateBlock"]');
            if (targetInput) {
                if (document.activeElement !== targetInput) targetInput.value = week.totalAmount;
                targetInput.disabled = state.isLocked;
            }

            block.querySelectorAll('.group\\/day').forEach((dayCell, dIdx) => {
                const input = dayCell.querySelector('input');
                const checkMin = dayCell.querySelector('.check-min');
                const checkStrive = dayCell.querySelector('.check-strive');
                const checkMinIcon = checkMin.querySelector('.check-icon');
                const checkStriveIcon = checkStrive.querySelector('.check-icon');

                const day = startDay + dIdx;
                const isToday = day === todayIdx;

                // Highlight today's container
                if (isToday) {
                    dayCell.classList.add('bg-indigo-500/5', 'rounded-xl', 'ring-1', 'ring-indigo-500/20');
                } else {
                    dayCell.classList.remove('bg-indigo-500/5', 'rounded-xl', 'ring-1', 'ring-indigo-500/20');
                }

                const log = state.dailyLogs[day];
                const dailyVal = typeof log === 'object' ? log?.val : log;
                const logMinK = (typeof log === 'object' && log?.minK !== undefined) ? log.minK : dynamicGlobalMinK;
                const dailyValK = (dailyVal !== undefined && dailyVal !== null) ? dailyVal / 1000 : null;
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

                // UI feedback for buttons
                if (isLogged) {
                    const isMetDaily = dailyValK >= logMinK;
                    const isMetStrive = dailyValK >= striveHintK;

                    if (isMetDaily) {
                        checkMin.className = "check-min h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-emerald-500/30 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
                        checkMinIcon.className = "text-[10px] font-black text-emerald-400 check-icon";
                    } else {
                        checkMin.className = "check-min h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-rose-500/20 bg-rose-500/10";
                        checkMinIcon.className = "text-[10px] font-black text-rose-500/50 check-icon";
                    }

                    if (isMetStrive) {
                        checkStrive.className = "check-strive h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-orange-500/30 bg-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
                        checkStriveIcon.className = "text-[10px] font-black text-orange-400 check-icon";
                    } else {
                        checkStrive.className = "check-strive h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-white/5 bg-black/40";
                        checkStriveIcon.className = "text-[10px] font-black text-white/10 check-icon";
                    }
                } else {
                    checkMin.className = "check-min h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-white/5 bg-black/40 hover:bg-white/5";
                    checkMinIcon.className = "text-[10px] font-black text-white/5 check-icon";
                    checkStrive.className = "check-strive h-8 w-full sm:w-10 rounded-lg flex items-center justify-center border border-white/5 bg-black/40 hover:bg-white/5";
                    checkStriveIcon.className = "text-[10px] font-black text-white/5 check-icon";
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

        window.toggleLock = () => {
            const isCurrentlyLocked = stateManager.state.isLocked;
            if (!isCurrentlyLocked) {
                if (confirm("COMMIT GOAL?\n\nOnce committed, your main parameters will be locked to preserve historical integrity. You cannot easily change them until you manually unlock.")) {
                    stateManager.toggleLock();
                }
            } else {
                if (confirm("UNLOCK GOAL?\n\nChanging targets mid-streak may affect how past achievements are viewed. Proceed?")) {
                    stateManager.toggleLock();
                }
            }
        };

        window.updateDay = (day, val, thresholdK = null) => {
            const numVal = val === '' ? null : Number(val);
            stateManager.updateDailyLog(day, numVal === null ? null : numVal * 1000, thresholdK);
        };
        window.quickCheck = (day, minK) => {
            const current = stateManager.state.dailyLogs[day];
            if (current && current / 1000 >= minK) {
                window.updateDay(day, '');
            } else {
                window.updateDay(day, minK, minK);
            }
        };
        window.quickStrive = (day, weekIdx) => {
            const state = stateManager.state;
            const week = state.actWeeksConfig[weekIdx];
            const daysInBlock = (weekIdx === state.actWeeksConfig.length - 1 && state.actTargetDays % 7 !== 0) ? state.actTargetDays % 7 : 7;

            // Derive sum in block for dynamic strive hint
            const startDay = weekIdx * 7;
            let sumInBlock = 0;
            let loggedDaysCountInBlock = 0;
            for (let i = 0; i < daysInBlock; i++) {
                const val = state.dailyLogs[startDay + i];
                if (val !== undefined && val !== null) {
                    sumInBlock += val;
                    loggedDaysCountInBlock++;
                }
            }

            const isLogged = state.dailyLogs[day] !== undefined && state.dailyLogs[day] !== null;
            const remainingDaysInBlock = daysInBlock - (isLogged ? loggedDaysCountInBlock - 1 : loggedDaysCountInBlock);

            let striveHintK = 0;
            const remainingAmount = Math.max(0, week.totalAmount - (isLogged ? sumInBlock - state.dailyLogs[day] : sumInBlock));
            striveHintK = remainingDaysInBlock > 0
                ? Math.round((remainingAmount / remainingDaysInBlock) / 1000)
                : Math.round((week.totalAmount / daysInBlock) / 1000);

            const current = state.dailyLogs[day];
            const currentK = current ? current / 1000 : 0;

            // Re-calculate dynamicGlobalMinK locally for reversion
            const dayIndices = Object.keys(state.dailyLogs).map(Number);
            const lastDayLogged = dayIndices.length > 0 ? Math.max(...dayIndices) : -1;
            const totalLoggedAmount = Object.values(state.dailyLogs).reduce((a, b) => a + (b || 0), 0);
            const remAmtK = (state.actTargetAmount - totalLoggedAmount) / 1000;
            const remDays = Math.max(1, state.actTargetDays - (lastDayLogged + 1));
            const dynamicGlobalMinK = Math.max(2, Math.round((remAmtK / remDays) * 10) / 10);

            if (currentK >= striveHintK) {
                // Toggle back to Daily Min instead of clearing
                window.updateDay(day, dynamicGlobalMinK, dynamicGlobalMinK);
            } else {
                window.updateDay(day, Math.max(2, striveHintK), dynamicGlobalMinK);
            }
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
