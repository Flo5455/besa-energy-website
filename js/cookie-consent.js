/* ============================================================
   BESA energy — Cookie Consent System
   Eigenbau, DSGVO-konform.
   Kategorien: necessary, functional, statistics, marketing
   ============================================================ */

(function () {
    'use strict';

    // ==========================================================
    // KONFIG: Tracking-Tools (Hotjar, GA4, GTM ...)
    // ----------------------------------------------------------
    // So aktivierst du später ein Tool:
    //   1. ID eintragen (z.B. siteId, measurementId, containerId)
    //   2. enabled: true setzen
    // Kein Re-Deploy nötig — Banner zeigt Kategorie automatisch,
    // sobald mindestens ein Tool in der Kategorie enabled ist.
    // ==========================================================
    const TRACKING_CONFIG = {
        statistics: {
            // Hotjar — https://www.hotjar.com
            hotjar: {
                enabled: false,
                siteId: '',     // z.B. '1234567'
                version: 6
            },
            // Google Analytics 4 — https://analytics.google.com
            ga4: {
                enabled: false,
                measurementId: '' // z.B. 'G-XXXXXXXXXX'
            }
        },
        marketing: {
            // Google Tag Manager — https://tagmanager.google.com
            gtm: {
                enabled: false,
                containerId: '' // z.B. 'GTM-XXXXXXX'
            }
            // Meta-Pixel, LinkedIn-Insight etc. lassen sich
            // hier nach gleichem Schema ergänzen.
        }
    };

    // ==========================================================
    // Storage-Konfig
    // Bei Schema-Änderungen Version hochzählen → User wird
    // erneut um Consent gebeten.
    // ==========================================================
    const STORAGE_KEY = 'besa_consent_v1';
    const CONSENT_VALIDITY_DAYS = 365;
    const CATEGORIES = ['necessary', 'functional', 'statistics', 'marketing'];

    // Welche Kategorien stehen dem Nutzer zur Auswahl?
    // Statistics/Marketing nur, wenn mindestens ein Tool aktiv konfiguriert ist
    // ODER explizit als Platzhalter angezeigt werden soll.
    const SHOW_PLACEHOLDER_CATEGORIES = true; // false = nur zeigen, wenn Tools enabled

    // ==========================================================
    // State
    // ==========================================================
    let state = {
        necessary: true,
        functional: false,
        statistics: false,
        marketing: false,
        ts: null
    };

    let loaded = {
        statistics: false,
        marketing: false
    };

    // ==========================================================
    // Storage-Helpers
    // ==========================================================
    function loadConsent() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            // Ablauf prüfen
            if (parsed.ts) {
                const ageMs = Date.now() - new Date(parsed.ts).getTime();
                const maxMs = CONSENT_VALIDITY_DAYS * 24 * 60 * 60 * 1000;
                if (ageMs > maxMs) return null;
            }
            return parsed;
        } catch (e) {
            return null;
        }
    }

    function saveConsent() {
        state.ts = new Date().toISOString();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('[BesaConsent] localStorage nicht verfügbar:', e);
        }
        applyConsent();
        notifyChange();
    }

    function notifyChange() {
        document.dispatchEvent(new CustomEvent('besa:consent-changed', {
            detail: { ...state }
        }));
    }

    // ==========================================================
    // Tracking-Loader
    // ==========================================================
    function loadHotjar(cfg) {
        if (!cfg.enabled || !cfg.siteId) return;
        // Offizielles Hotjar-Snippet
        (function (h, o, t, j, a, r) {
            h.hj = h.hj || function () { (h.hj.q = h.hj.q || []).push(arguments); };
            h._hjSettings = { hjid: cfg.siteId, hjsv: cfg.version };
            a = o.getElementsByTagName('head')[0];
            r = o.createElement('script');
            r.async = 1;
            r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
            a.appendChild(r);
        })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    }

    function loadGA4(cfg) {
        if (!cfg.enabled || !cfg.measurementId) return;
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + cfg.measurementId;
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', cfg.measurementId, { anonymize_ip: true });
    }

    function loadGTM(cfg) {
        if (!cfg.enabled || !cfg.containerId) return;
        // Offizielles GTM-Snippet
        (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            const f = d.getElementsByTagName(s)[0];
            const j = d.createElement(s);
            const dl = l !== 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', cfg.containerId);
    }

    function applyConsent() {
        // Statistics
        if (state.statistics && !loaded.statistics) {
            loadHotjar(TRACKING_CONFIG.statistics.hotjar);
            loadGA4(TRACKING_CONFIG.statistics.ga4);
            loaded.statistics = true;
        }
        // Marketing
        if (state.marketing && !loaded.marketing) {
            loadGTM(TRACKING_CONFIG.marketing.gtm);
            loaded.marketing = true;
        }
        // Hinweis: Bereits geladene Tracker können wir clientseitig
        // nicht mehr zuverlässig "deaktivieren". Wenn der User
        // Consent zurückzieht, würde ein Reload empfohlen — das
        // ist Standard-Verhalten der meisten Consent-Tools.
    }

    // ==========================================================
    // UI-Erstellung
    // ==========================================================
    function buildBanner() {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'cookie-banner-title');
        banner.setAttribute('aria-describedby', 'cookie-banner-desc');
        banner.innerHTML = `
            <div class="cookie-banner-inner">
                <div class="cookie-banner-text">
                    <h2 id="cookie-banner-title">Wir respektieren Ihre Privatsphäre</h2>
                    <p id="cookie-banner-desc">
                        Wir verwenden Cookies und ähnliche Technologien, um die Website bereitzustellen,
                        ihre Nutzung zu analysieren und unsere Services zu verbessern. Sie können
                        Ihre Auswahl jederzeit über den Link „Cookie-Einstellungen" im Footer ändern.
                        Mehr Infos in der <a href="datenschutz.html" id="cookie-link-privacy">Datenschutzerklärung</a>.
                    </p>
                </div>
                <div class="cookie-banner-actions">
                    <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-accept-all">Alle akzeptieren</button>
                    <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-reject-all">Nur notwendige</button>
                    <button type="button" class="cookie-btn cookie-btn-ghost" id="cookie-open-settings">Einstellungen</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);
        return banner;
    }

    function buildModal() {
        const modal = document.createElement('div');
        modal.className = 'cookie-modal';
        modal.id = 'cookie-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'cookie-modal-title');

        const showStats = SHOW_PLACEHOLDER_CATEGORIES || hasEnabledTool('statistics');
        const showMarketing = SHOW_PLACEHOLDER_CATEGORIES || hasEnabledTool('marketing');

        modal.innerHTML = `
            <div class="cookie-modal-dialog">
                <div class="cookie-modal-header">
                    <h2 id="cookie-modal-title">Cookie-Einstellungen</h2>
                    <p>Wählen Sie selbst, welche Kategorien Sie erlauben möchten. Notwendige Cookies sind für den Betrieb der Seite zwingend erforderlich.</p>
                </div>
                <div class="cookie-modal-body">

                    <div class="cookie-category">
                        <div class="cookie-category-head">
                            <h3>Notwendig</h3>
                            <span class="cookie-switch-label-locked">Immer aktiv</span>
                        </div>
                        <p class="cookie-category-desc">Speicherung Ihrer Cookie-Auswahl, Funktion des Kontaktformulars. Ohne diese Cookies funktioniert die Seite nicht.</p>
                    </div>

                    <div class="cookie-category">
                        <div class="cookie-category-head">
                            <h3>Funktional</h3>
                            <label class="cookie-switch">
                                <input type="checkbox" id="cookie-toggle-functional" ${state.functional ? 'checked' : ''}>
                                <span class="cookie-switch-slider"></span>
                            </label>
                        </div>
                        <p class="cookie-category-desc">Aktiviert komfortable Zusatzfunktionen — z.B. die interaktive Region-Karte (OpenStreetMap, Leaflet).</p>
                        <p class="cookie-category-services">Dienste: Leaflet (unpkg.com), OpenStreetMap (tile.openstreetmap.org)</p>
                    </div>

                    ${showStats ? `
                    <div class="cookie-category">
                        <div class="cookie-category-head">
                            <h3>Statistik</h3>
                            <label class="cookie-switch">
                                <input type="checkbox" id="cookie-toggle-statistics" ${state.statistics ? 'checked' : ''}>
                                <span class="cookie-switch-slider"></span>
                            </label>
                        </div>
                        <p class="cookie-category-desc">Anonymisierte Auswertung der Seitennutzung, damit wir Inhalte verbessern können.</p>
                        ${listConfiguredServices('statistics')}
                    </div>
                    ` : ''}

                    ${showMarketing ? `
                    <div class="cookie-category">
                        <div class="cookie-category-head">
                            <h3>Marketing</h3>
                            <label class="cookie-switch">
                                <input type="checkbox" id="cookie-toggle-marketing" ${state.marketing ? 'checked' : ''}>
                                <span class="cookie-switch-slider"></span>
                            </label>
                        </div>
                        <p class="cookie-category-desc">Damit wir Ihnen relevante Inhalte und Werbung in sozialen Netzwerken zeigen können.</p>
                        ${listConfiguredServices('marketing')}
                    </div>
                    ` : ''}

                </div>
                <div class="cookie-modal-footer">
                    <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-modal-reject">Nur notwendige</button>
                    <button type="button" class="cookie-btn cookie-btn-secondary" id="cookie-modal-save">Auswahl speichern</button>
                    <button type="button" class="cookie-btn cookie-btn-primary" id="cookie-modal-accept-all">Alle akzeptieren</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    function hasEnabledTool(category) {
        const tools = TRACKING_CONFIG[category] || {};
        return Object.values(tools).some(t => t && t.enabled);
    }

    function listConfiguredServices(category) {
        const tools = TRACKING_CONFIG[category] || {};
        const labels = {
            hotjar: 'Hotjar',
            ga4: 'Google Analytics',
            gtm: 'Google Tag Manager'
        };
        const enabled = Object.entries(tools)
            .filter(([, cfg]) => cfg && cfg.enabled)
            .map(([key]) => labels[key] || key);
        if (enabled.length === 0) {
            return '<p class="cookie-category-services">Aktuell keine Dienste in dieser Kategorie aktiv.</p>';
        }
        return `<p class="cookie-category-services">Dienste: ${enabled.join(', ')}</p>`;
    }

    // ==========================================================
    // Banner / Modal Verhalten
    // ==========================================================
    let bannerEl = null;
    let modalEl = null;

    function showBanner() {
        if (!bannerEl) bannerEl = buildBanner();
        // Buttons binden
        bannerEl.querySelector('#cookie-accept-all').addEventListener('click', acceptAll);
        bannerEl.querySelector('#cookie-reject-all').addEventListener('click', rejectAll);
        bannerEl.querySelector('#cookie-open-settings').addEventListener('click', openSettings);
        // Animation triggern
        requestAnimationFrame(() => bannerEl.classList.add('is-visible'));
    }

    function hideBanner() {
        if (!bannerEl) return;
        bannerEl.classList.remove('is-visible');
    }

    function openSettings() {
        if (!modalEl) modalEl = buildModal();
        // Toggles auf aktuellen State setzen
        const tF = modalEl.querySelector('#cookie-toggle-functional');
        const tS = modalEl.querySelector('#cookie-toggle-statistics');
        const tM = modalEl.querySelector('#cookie-toggle-marketing');
        if (tF) tF.checked = state.functional;
        if (tS) tS.checked = state.statistics;
        if (tM) tM.checked = state.marketing;

        // Buttons binden (idempotent: Modal wird einmal gebaut und wiederverwendet)
        if (!modalEl.dataset.bound) {
            modalEl.querySelector('#cookie-modal-save').addEventListener('click', () => {
                state.functional = !!(tF && tF.checked);
                state.statistics = !!(tS && tS.checked);
                state.marketing = !!(tM && tM.checked);
                saveConsent();
                closeModal();
                hideBanner();
            });
            modalEl.querySelector('#cookie-modal-accept-all').addEventListener('click', () => {
                acceptAll();
                closeModal();
            });
            modalEl.querySelector('#cookie-modal-reject').addEventListener('click', () => {
                rejectAll();
                closeModal();
            });
            // Klick auf Backdrop schließt nur, wenn schon Consent existiert
            modalEl.addEventListener('click', (e) => {
                if (e.target === modalEl && state.ts) closeModal();
            });
            modalEl.dataset.bound = '1';
        }

        modalEl.classList.add('is-visible');
    }

    function closeModal() {
        if (modalEl) modalEl.classList.remove('is-visible');
    }

    function acceptAll() {
        state.functional = true;
        state.statistics = true;
        state.marketing = true;
        saveConsent();
        hideBanner();
    }

    function rejectAll() {
        state.functional = false;
        state.statistics = false;
        state.marketing = false;
        saveConsent();
        hideBanner();
    }

    // ==========================================================
    // Public API
    // ==========================================================
    window.BesaConsent = {
        openSettings: openSettings,
        has: function (category) {
            if (category === 'necessary') return true;
            return !!state[category];
        },
        get: function () { return { ...state }; },
        reset: function () {
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
            location.reload();
        },
        // Praktisch für Map / Lazy-Komponenten:
        // BesaConsent.onConsent('functional', () => initMap());
        onConsent: function (category, callback) {
            if (this.has(category)) {
                callback();
                return;
            }
            const handler = (e) => {
                if (e.detail[category]) {
                    document.removeEventListener('besa:consent-changed', handler);
                    callback();
                }
            };
            document.addEventListener('besa:consent-changed', handler);
        }
    };

    // ==========================================================
    // Init
    // ==========================================================
    function init() {
        const stored = loadConsent();
        if (stored) {
            state = { ...state, ...stored };
            applyConsent();
        } else {
            // Erster Besuch: Banner zeigen
            showBanner();
        }

        // Footer-Link „Cookie-Einstellungen" verdrahten
        document.querySelectorAll('[data-cookie-settings]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                openSettings();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
