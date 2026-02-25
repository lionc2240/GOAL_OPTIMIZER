import Chart from 'chart.js/auto';

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 6 }
        },
        tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#94a3b8',
            bodyColor: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            bodyFont: { size: 12 }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.03)' },
            border: { display: false },
            ticks: {
                color: '#475569',
                font: { size: 9 },
                callback: (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
            }
        },
        x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#475569', font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
        }
    }
};

const roadmapPlugin = {
    id: 'roadmap',
    afterDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        const milestones = chart.options.plugins.roadmap || {};

        // 1. Draw Vertical Deadlines
        (milestones.deadlines || []).forEach(target => {
            const xPos = xAxis.getPixelForValue(`D${target.day}`);
            if (isNaN(xPos)) return;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 2;
            ctx.strokeStyle = target.color;
            ctx.moveTo(xPos, yAxis.top);
            ctx.lineTo(xPos, yAxis.bottom);
            ctx.stroke();

            ctx.fillStyle = target.color;
            ctx.font = 'black 9px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(target.label, xPos + 5, yAxis.top + 20);
            ctx.restore();
        });

        // 2. Draw Horizontal Goals
        (milestones.goals || []).forEach(target => {
            const yPos = yAxis.getPixelForValue(target.amount);
            if (isNaN(yPos)) return;

            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = target.color;
            ctx.moveTo(xAxis.left, yPos);
            ctx.lineTo(xAxis.right, yPos);
            ctx.stroke();

            ctx.fillStyle = target.color;
            ctx.font = 'black 9px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(target.label, xAxis.right - 5, yPos - 5);
            ctx.restore();
        });
    }
};

export function createUnifiedChart(ctx, data) {
    const { simPath, actPath, projPath, simTarget, actTarget, simDays, actDays } = data;

    // DYNAMIC ZOOM with Padding
    const rawMax = Math.max(simPath.length, projPath.length, simDays + 1, actDays + 1, data.momentumDay || 0);
    const padding = Math.max(2, Math.ceil(rawMax * 0.1));
    const maxLength = rawMax + padding;

    const labels = Array.from({ length: maxLength }, (_, i) => `D${i}`);

    return new Chart(ctx, {
        type: 'line',
        plugins: [roadmapPlugin],
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Strive Goal',
                    data: [], // Filled by update
                    borderColor: 'rgba(167, 139, 250, 0.6)', // Bright Violet
                    borderDash: [4, 4],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                },
                {
                    label: 'Simulated Path',
                    data: simPath,
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                },
                {
                    label: 'Actual Momentum',
                    data: actPath,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    segment: {
                        borderColor: ctx => {
                            const data = ctx.chart.trackerData;
                            if (!data) return 'rgb(16, 185, 129)';
                            const idx = ctx.p1DataIndex;
                            const dayIdx = idx - 1;
                            return (data.actGapIndices && data.actGapIndices.includes(dayIdx)) ? '#f43f5e' : 'rgb(16, 185, 129)';
                        }
                    },
                    pointRadius: (ctx) => {
                        const data = ctx.chart.trackerData;
                        const idx = ctx.dataIndex;
                        if (idx === 0) return 0; // Day 0 baseline
                        return 5;
                    },
                    pointBackgroundColor: (ctx) => {
                        const data = ctx.chart.trackerData;
                        if (!data) return '#10b981';
                        const idx = ctx.dataIndex;
                        const dayIdx = idx - 1;
                        return (data.actGapIndices && data.actGapIndices.includes(dayIdx)) ? '#f43f5e' : '#10b981';
                    },
                    pointBorderColor: (ctx) => {
                        const data = ctx.chart.trackerData;
                        if (!data) return 'rgba(16, 185, 129, 0.4)';
                        const idx = ctx.dataIndex;
                        const dayIdx = idx - 1;
                        return (data.actGapIndices && data.actGapIndices.includes(dayIdx)) ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)';
                    },
                    pointBorderWidth: 8,
                    pointHoverRadius: 8,
                    pointHoverBorderWidth: 12,
                    pointHitRadius: 10
                },
                {
                    label: 'Real Projection',
                    data: projPath,
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                }
            ]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                roadmap: {
                    deadlines: [
                        { day: simDays, color: 'rgba(59, 130, 246, 0.6)', label: 'Sim Deadline' },
                        { day: actDays, color: 'rgba(255, 255, 255, 0.2)', label: 'Target Deadline' },
                        { day: data.momentumDay, color: '#10b981', label: 'Momentum Finish' }
                    ],
                    goals: [
                        { amount: simTarget, color: 'rgba(59, 130, 246, 0.6)', label: 'Theory Target' },
                        { amount: actTarget, color: 'rgba(16, 185, 129, 0.6)', label: 'Real Target' }
                    ]
                }
            }
        }
    });
    chart.trackerData = data;
    return chart;
}

export function updateUnifiedChart(chart, data) {
    if (!chart) return;
    chart.trackerData = data;
    const { simPath, actPath, projPath, strivePath, actGapIndices, simTarget, actTarget, simDays, actDays } = data;

    // DYNAMIC ZOOM with Padding
    const rawMax = Math.max(simPath.length, projPath.length, simDays + 1, actDays + 1);
    const padding = Math.max(2, Math.ceil(rawMax * 0.1));
    const maxLength = rawMax + padding;

    const labels = Array.from({ length: maxLength }, (_, i) => `D${i}`);

    chart.data.labels = labels;
    chart.data.datasets[0].data = strivePath;
    chart.data.datasets[1].data = simPath;
    chart.data.datasets[2].data = actPath;
    chart.data.datasets[3].data = projPath;

    chart.options.plugins.roadmap = {
        deadlines: [
            { day: simDays, color: 'rgba(59, 130, 246, 0.6)', label: 'Sim Deadline' },
            { day: actDays, color: 'rgba(255, 255, 255, 0.2)', label: 'Target Deadline' },
            { day: data.momentumDay, color: '#10b981', label: 'Momentum Finish' }
        ],
        goals: [
            { amount: simTarget, color: 'rgba(59, 130, 246, 0.6)', label: 'Theory Target' },
            { amount: actTarget, color: 'rgba(16, 185, 129, 0.6)', label: 'Real Target' }
        ]
    };

    chart.update();
}

export function createGoalChart() { return null; }
export function createComparisonChart() { return null; }
export function updateChart() { return null; }
