// OSINT Tools Hub - renders tool cards from config/tools.json.
// Tools are deployed and always on; status is a manual field in that file
// (one of 'operational', 'maintenance', 'down'), not something this page checks.

const STATUS_META = {
    operational: { label: 'Operational', className: 'operational' },
    maintenance: { label: 'Maintenance', className: 'maintenance' },
    down: { label: 'Out of Service', className: 'down' }
};

const ICONS = {
    bbox: `<path d="M3 7V3h4"/><path d="M11 7v4h-4"/><path d="M9 13V9h4"/><path d="M17 13v4h-4"/>`,
    keyword: `<circle cx="8.5" cy="8.5" r="5.5"/><path d="M13 13l4 4"/>`,
    tool: `<rect x="3" y="3" width="14" height="14" rx="3"/><path d="M7 10h6M10 7v6"/>`
};

// Stat-card badge icons - separate from ICONS (per-tool chip icons) since
// these represent status concepts, not tools.
const STAT_ICONS = {
    operational: `<path d="M4 10.5l4 4 8-9"/>`,
    maintenance: `<path d="M14.7 6.3a3 3 0 0 1-3.8 3.8l-4.4 4.4a1.4 1.4 0 0 1-2-2l4.4-4.4a3 3 0 0 1 3.8-3.8l-2.3 2.3 1.4 1.4 2.3-2.3z"/>`,
    down: `<path d="M6 6l8 8M14 6l-8 8"/>`,
    total: `<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/>`
};

function iconChipClass(color) {
    if (color === 'blue') return 'icon-blue';
    if (color === 'purple') return 'icon-purple';
    if (color === 'green') return 'icon-green';
    if (color === 'cyan') return 'icon-cyan';
    if (color === 'amber') return 'icon-amber';
    return 'icon-muted';
}

function statCard(key, label, value) {
    return `
        <div class="stat-card">
            <span class="stat-icon stat-icon-${key}">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${STAT_ICONS[key]}</svg>
            </span>
            <span class="stat-text">
                <span class="stat-value stat-${key}">${value}</span>
                <span class="stat-label">${label}</span>
            </span>
        </div>
    `;
}

function renderStats(tools) {
    const counts = { operational: 0, maintenance: 0, down: 0 };
    tools.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

    const row = document.getElementById('stats-row');
    row.innerHTML =
        statCard('operational', 'Operational', counts.operational) +
        statCard('maintenance', 'Maintenance', counts.maintenance) +
        statCard('down', 'Out of Service', counts.down) +
        statCard('total', 'Total Tools', tools.length);
}

function renderTools(tools) {
    const grid = document.getElementById('tools-grid');
    const meta = status => STATUS_META[status] || STATUS_META.down;

    const cards = tools.map(tool => {
        const { label, className } = meta(tool.status);
        const openDisabled = tool.status === 'down';
        const icon = ICONS[tool.icon] || ICONS.tool;

        return `
            <div class="tool-card" data-tool="${tool.id}">
                <div class="card-top-row">
                    <span class="category-label">${tool.category}</span>
                    <span class="status-badge ${className}">
                        <span class="status-badge-dot"></span>
                        <span class="status-badge-text">${label.toUpperCase()}</span>
                    </span>
                </div>
                <div class="tool-icon-chip ${iconChipClass(tool.color)}">
                    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
                </div>
                <h2 class="tool-name">${tool.name}</h2>
                <p class="tool-description">${tool.description}</p>
                <a target="_blank" rel="noopener" class="tool-button${openDisabled ? ' disabled' : ''}"
                   ${openDisabled ? 'aria-disabled="true" tabindex="-1"' : `href="${tool.url}"`}>
                    Open Tool
                </a>
            </div>
        `;
    }).join('');

    const addTool = `
        <div class="tool-card add-tool">
            <div class="tool-icon-chip icon-muted">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="14" height="14" rx="3" stroke-dasharray="3 3"/>
                    <line x1="10" y1="7" x2="10" y2="13"/>
                    <line x1="7" y1="10" x2="13" y2="10"/>
                </svg>
            </div>
            <h2 class="tool-name muted">COMING SOON</h2>
            <p class="tool-description">Additional research modules</p>
        </div>
    `;

    grid.innerHTML = cards + addTool;
}

async function loadTools() {
    try {
        const res = await fetch('config/tools.json');
        const data = await res.json();
        renderStats(data.tools);
        renderTools(data.tools);
    } catch (e) {
        document.getElementById('tools-grid').innerHTML =
            `<p class="load-error">Couldn't load config/tools.json (${e.message})</p>`;
    }
}

function initThemeToggle() {
    const root = document.documentElement;
    const toggle = document.getElementById('theme-toggle');

    function currentTheme() {
        const explicit = root.getAttribute('data-theme');
        if (explicit) return explicit;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    toggle.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('osint_theme', next);
    });
}

loadTools();
initThemeToggle();
