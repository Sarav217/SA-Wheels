/* SA Wheels - saved display preferences (colour theme, dark mode, text size)
 * and the settings panel behind the gear button at the bottom left.
 *
 * Loaded synchronously in <head> so the saved theme is applied before the page
 * is first painted. Preferences live in localStorage under "saw-prefs"; every
 * read and write is wrapped so private windows / blocked storage still work
 * (the choice then just isn't remembered).
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'saw-prefs';

    // Each theme: primary (header, buttons) and accent (gradients, highlights).
    const THEMES = [
        { id: 'blue',   name: 'Blue',   p: '#1565C0', a: '#1E88E5' },
        { id: 'teal',   name: 'Teal',   p: '#0F766E', a: '#14B8A6' },
        { id: 'purple', name: 'Purple', p: '#6D28D9', a: '#A855F7' },
        { id: 'forest', name: 'Forest', p: '#166534', a: '#22C55E' },
        { id: 'rose',   name: 'Rose',   p: '#BE185D', a: '#F43F5E' },
        { id: 'sunset', name: 'Sunset', p: '#C2410C', a: '#F59E0B' },
        { id: 'slate',  name: 'Slate',  p: '#334155', a: '#64748B' }
    ];

    // ---------------------------------------------------------------- colour math
    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
        const n = parseInt(full, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rgbToHex(rgb) {
        return '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
    }
    function mix(a, b, t) { // t = share of b
        const x = hexToRgb(a), y = hexToRgb(b);
        return rgbToHex(x.map((v, i) => v + (y[i] - v) * t));
    }
    const darken = (c, t) => mix(c, '#000000', t);
    const lighten = (c, t) => mix(c, '#ffffff', t);
    function luminance(hex) {
        return hexToRgb(hex).map((v) => v / 255)
            .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    }
    function contrast(a, b) {
        const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
        return (x + 0.05) / (y + 0.05);
    }
    // Darken until white text on it is readable (WCAG AA, 4.5:1).
    function readable(hex) {
        let c = hex, guard = 0;
        while (contrast(c, '#ffffff') < 4.5 && guard++ < 40) c = darken(c, 0.06);
        return c;
    }
    function hexToHsl(hex) {
        const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h *= 60;
        }
        return [h, s, l];
    }
    function hslToHex(h, s, l) {
        h = ((h % 360) + 360) % 360;
        const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
        const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
        return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
    }
    const rgbVar = (hex) => hexToRgb(hex).join(',');

    // A full theme from any single colour (used by the custom picker).
    function themeFromColor(hex) {
        const [h, s, l] = hexToHsl(hex);
        return {
            id: 'custom', name: 'Custom',
            p: readable(hex),
            a: hslToHex(h, Math.min(1, s * 1.05 + 0.05), Math.min(0.62, Math.max(0.45, l + 0.15)))
        };
    }

    // Every CSS variable a theme controls, derived from its two colours.
    function themeVars(theme, dark) {
        const p = readable(theme.p), a = theme.a, pd = darken(p, 0.22);
        const vars = {
            '--p': p, '--pd': pd, '--a': a,
            '--p-rgb': rgbVar(p), '--pd-rgb': rgbVar(pd), '--a-rgb': rgbVar(a),
            '--p-text': p, '--p-text-rgb': rgbVar(p),
            '--p-soft': lighten(a, 0.88), '--p-soft2': lighten(a, 0.94),
            '--paper': lighten(p, 0.955), '--card': '#ffffff',
            '--line': lighten(p, 0.885), '--line-strong': lighten(p, 0.72),
            '--field-bg': lighten(p, 0.975)
        };
        if (!dark) return vars;

        // Dark mode: dark surfaces lightly tinted with the theme, light text, and a
        // lighter version of the theme colour for text and links so they stay readable.
        const paper = mix('#0B1016', p, 0.07);
        const card = mix('#141B23', p, 0.09);
        let text = lighten(a, 0.3), guard = 0;
        while (contrast(text, card) < 6 && guard++ < 30) text = lighten(text, 0.08);
        return Object.assign(vars, {
            '--paper': paper, '--card': card,
            '--p-text': text, '--p-text-rgb': rgbVar(text),
            '--p-soft': mix(card, a, 0.2), '--p-soft2': mix(card, a, 0.12),
            '--line': mix(card, '#ffffff', 0.1), '--line-strong': mix(card, '#ffffff', 0.22),
            '--field-bg': mix(paper, a, 0.05)
        });
    }
    const THEME_VAR_NAMES = Object.keys(themeVars(THEMES[0], true));

    // Text size: the root font size is multiplied by --fs.
    const TEXT_SIZES = [0.9, 1, 1.1, 1.2];

    // ---------------------------------------------------------------- storage
    function load() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return raw && typeof raw === 'object' ? raw : {};
        } catch (e) { return {}; }
    }
    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* not remembered */ }
    }
    const prefs = load();
    const isHex = (v) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);

    function currentTheme() {
        if (prefs.theme === 'custom' && isHex(prefs.custom)) return themeFromColor(prefs.custom);
        return THEMES.find((t) => t.id === prefs.theme) || THEMES[0];
    }

    // Until the user picks, follow the device's light/dark setting.
    const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const isDark = () => (typeof prefs.dark === 'boolean' ? prefs.dark : !!(systemDark && systemDark.matches));
    const textSize = () => (TEXT_SIZES.includes(prefs.textSize) ? prefs.textSize : 1);

    function applyTheme() {
        const root = document.documentElement;
        const theme = currentTheme();
        const dark = isDark();
        const vars = themeVars(theme, dark);
        THEME_VAR_NAMES.forEach((name) => root.style.setProperty(name, vars[name]));
        root.dataset.theme = theme.id;
        root.dataset.mode = dark ? 'dark' : 'light';
        root.dataset.bsTheme = dark ? 'dark' : 'light'; // Bootstrap's own dark mode
        root.style.setProperty('--fs', String(textSize()));
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', dark ? darken(vars['--p'], 0.35) : vars['--p']);
    }

    applyTheme(); // we're in <head>, before first paint
    if (systemDark && systemDark.addEventListener) {
        systemDark.addEventListener('change', () => { if (typeof prefs.dark !== 'boolean') { applyTheme(); refresh(); } });
    }

    // ---------------------------------------------------------------- settings UI
    const CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>';
    let refresh = () => {};

    function buildUI() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'settings-fab no-print';
        btn.setAttribute('aria-label', 'Open settings');
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'settings-panel');
        btn.innerHTML = '<i class="bi bi-gear-fill" aria-hidden="true"></i>';

        const backdrop = document.createElement('div');
        backdrop.className = 'settings-backdrop no-print';
        backdrop.hidden = true;

        const panel = document.createElement('div');
        panel.className = 'settings-panel no-print';
        panel.id = 'settings-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.setAttribute('aria-labelledby', 'settings-title');
        panel.hidden = true;
        panel.innerHTML = `
            <div class="settings-head">
                <h2 id="settings-title">Settings</h2>
                <button type="button" class="settings-close" aria-label="Close settings">&times;</button>
            </div>
            <div class="settings-section settings-row">
                <div>
                    <div class="settings-label settings-label-inline" id="settings-dark-label"><i class="bi bi-moon-stars"></i> Dark mode</div>
                    <div class="settings-hint">Easier on the eyes at night</div>
                </div>
                <button type="button" class="switch" id="settings-dark" role="switch" aria-checked="false" aria-labelledby="settings-dark-label"><span class="switch-knob"></span></button>
            </div>
            <div class="settings-section">
                <div class="settings-label" id="settings-theme-label"><i class="bi bi-palette"></i> Theme colour</div>
                <div class="swatch-grid" role="radiogroup" aria-labelledby="settings-theme-label">
                    ${THEMES.map((t) => `
                    <button type="button" class="swatch" role="radio" data-theme-id="${t.id}" aria-label="${t.name}" title="${t.name}">
                        <span class="swatch-dot" style="background:linear-gradient(135deg, ${t.p} 0%, ${t.a} 100%)">${CHECK}</span>
                        <span class="swatch-name">${t.name}</span>
                    </button>`).join('')}
                    <label class="swatch swatch-custom" data-theme-id="custom" title="Pick any colour">
                        <span class="swatch-dot swatch-dot-custom">${CHECK}<input type="color" id="settings-custom-color" aria-label="Pick any colour"></span>
                        <span class="swatch-name">Custom</span>
                    </label>
                </div>
            </div>
            <div class="settings-section settings-row">
                <div>
                    <div class="settings-label settings-label-inline" id="settings-size-label"><i class="bi bi-fonts"></i> Text size</div>
                    <div class="settings-hint">Make the text bigger or smaller</div>
                </div>
                <div class="size-stepper" role="group" aria-labelledby="settings-size-label">
                    <button type="button" class="size-btn" id="settings-size-down" aria-label="Smaller text">A−</button>
                    <span class="size-value" id="settings-size-value" aria-live="polite">100%</span>
                    <button type="button" class="size-btn size-btn-up" id="settings-size-up" aria-label="Bigger text">A+</button>
                </div>
            </div>
            <div class="settings-foot">
                <span class="settings-note">Saved on this device.</span>
                <button type="button" class="settings-reset">Reset to default</button>
            </div>`;

        document.body.append(btn, backdrop, panel);
        const colorInput = panel.querySelector('#settings-custom-color');
        colorInput.value = isHex(prefs.custom) ? prefs.custom : THEMES[0].p;

        refresh = function () {
            const theme = currentTheme();
            panel.querySelectorAll('.swatch').forEach((s) => {
                const on = s.dataset.themeId === theme.id;
                s.classList.toggle('selected', on);
                s.setAttribute('aria-checked', String(on));
            });
            panel.querySelector('#settings-dark').setAttribute('aria-checked', String(isDark()));
            const size = textSize(), idx = TEXT_SIZES.indexOf(size);
            panel.querySelector('#settings-size-value').textContent = Math.round(size * 100) + '%';
            panel.querySelector('#settings-size-down').disabled = idx <= 0;
            panel.querySelector('#settings-size-up').disabled = idx >= TEXT_SIZES.length - 1;
            panel.querySelector('.swatch-dot-custom').style.background = theme.id === 'custom'
                ? `linear-gradient(135deg, ${theme.p}, ${theme.a})` : '';
        };
        const update = () => { save(); applyTheme(); refresh(); };

        // `opened` is the source of truth; the classes only drive the animation,
        // so a fast open-then-close can never leave the panel stuck on screen.
        let lastFocus = null, opened = false, hideTimer = null;
        function open() {
            if (opened) return;
            opened = true;
            clearTimeout(hideTimer);
            lastFocus = document.activeElement;
            refresh();
            panel.hidden = false;
            backdrop.hidden = false;
            requestAnimationFrame(() => {
                if (!opened) return;
                panel.classList.add('open');
                backdrop.classList.add('open');
            });
            btn.setAttribute('aria-expanded', 'true');
            panel.querySelector('#settings-dark').focus();
        }
        function close() {
            if (!opened) return;
            opened = false;
            panel.classList.remove('open');
            backdrop.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => { if (!opened) { panel.hidden = true; backdrop.hidden = true; } }, 200);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        btn.addEventListener('click', () => (opened ? close() : open()));
        backdrop.addEventListener('click', close);
        panel.querySelector('.settings-close').addEventListener('click', close);
        document.addEventListener('keydown', (e) => {
            if (!opened) return;
            if (e.key === 'Escape') { e.preventDefault(); close(); return; }
            if (e.key === 'Tab') { // keep keyboard focus inside the panel
                const items = [...panel.querySelectorAll('button, input')].filter((el) => !el.disabled && el.offsetParent !== null);
                if (!items.length) return;
                const first = items[0], last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });

        panel.querySelector('#settings-dark').addEventListener('click', () => {
            prefs.dark = !isDark();
            update();
        });
        panel.querySelectorAll('.swatch:not(.swatch-custom)').forEach((s) => s.addEventListener('click', () => {
            prefs.theme = s.dataset.themeId;
            update();
        }));
        const onCustom = () => {
            prefs.theme = 'custom';
            prefs.custom = colorInput.value;
            update();
        };
        colorInput.addEventListener('input', onCustom);
        colorInput.addEventListener('change', onCustom);
        const stepSize = (step) => {
            const idx = TEXT_SIZES.indexOf(textSize());
            const next = TEXT_SIZES[Math.max(0, Math.min(TEXT_SIZES.length - 1, idx + step))];
            if (next === 1) delete prefs.textSize; else prefs.textSize = next;
            update();
        };
        panel.querySelector('#settings-size-down').addEventListener('click', () => stepSize(-1));
        panel.querySelector('#settings-size-up').addEventListener('click', () => stepSize(1));
        panel.querySelector('.settings-reset').addEventListener('click', () => {
            Object.keys(prefs).forEach((key) => delete prefs[key]);
            update();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
    else buildUI();
})();
