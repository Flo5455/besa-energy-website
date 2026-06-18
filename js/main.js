// ===================================
// BESA energy - Hauptwebsite JavaScript
// Solar Calculator, Forms, Animations
// ===================================

// Page-Load-Zeitpunkt für den Anti-Bot-Timing-Check der Lead-Form
// (siehe Submit-Handler unten). Wird beim Script-Parse gesetzt,
// damit auch das frühest mögliche menschliche Submit > 2,5s liegt.
const __pageLoadedAt = Date.now();

// EmailJS-Konfiguration - vollständig eingerichtet 10.05.2026.
// Demo-Modus greift nur noch, wenn eine der drei IDs zurück auf
// 'YOUR_…' gesetzt wird; im Normalbetrieb wird beim ersten Submit
// das EmailJS-SDK nachgeladen und die Anfrage an mail@besa.energy
// versendet.
const EMAILJS_PUBLIC_KEY = 'lO78ns2M_0FrnNEnL';
const EMAILJS_SERVICE_ID = 'service_jacq3mc';
// Lead-Formular (Kontakt / Solarrechner)
const EMAILJS_TEMPLATE_ID = 'template_cmddreo';
// Karriere / Bewerbung — eigene Template mit eigener Variablenstruktur
// (siehe EMAILJS-TEMPLATE-KARRIERE.md im Projekt-Root)
const EMAILJS_BEWERBUNG_TEMPLATE_ID = 'template_cwrb2mt';

// EmailJS-SDK wird erst beim ersten Submit nachgeladen (DSGVO: vom Nutzer
// aktiv angefragter Dienst) - kein Cookie-Banner-Eintrag nötig.
let emailjsReady = null;
function loadEmailJS() {
    if (emailjsReady) return emailjsReady;
    emailjsReady = new Promise((resolve, reject) => {
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            return resolve();
        }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        s.async = true;
        s.onload = () => {
            try { emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) {}
            resolve();
        };
        s.onerror = () => reject(new Error('EmailJS-SDK konnte nicht geladen werden.'));
        document.head.appendChild(s);
    });
    return emailjsReady;
}

// Region-Karte (Leaflet + OSM) wird erst nach Consent „Funktional" geladen.
let leafletReady = null;
function loadLeaflet() {
    if (leafletReady) return leafletReady;
    leafletReady = new Promise((resolve, reject) => {
        if (typeof L !== 'undefined') return resolve();
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        css.crossOrigin = '';
        document.head.appendChild(css);
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        s.crossOrigin = '';
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Leaflet konnte nicht geladen werden.'));
        document.head.appendChild(s);
    });
    return leafletReady;
}

function initRegionMap() {
    const mapEl = document.getElementById('region-map');
    const blockedEl = document.getElementById('region-map-blocked');
    if (!mapEl || mapEl.dataset.initialized) return;

    loadLeaflet().then(() => {
        if (blockedEl) blockedEl.style.display = 'none';
        mapEl.hidden = false;
        mapEl.dataset.initialized = '1';

        const HOME = [51.6306, 12.385]; // Muldestausee

        // Attribution-Control: default deaktivieren, dann manuell mit
        // neutralem Prefix wieder hinzufügen - sonst rendert Leaflet
        // automatisch eine Ukraine-Flagge im Branding-Link, die wir
        // bewusst nicht zeigen wollen (politisch neutral bleiben).
        const map = L.map('region-map', {
            center: HOME,
            zoom: 7,
            scrollWheelZoom: false,
            zoomControl: true,
            attributionControl: false
        });

        L.control.attribution({
            prefix: '<a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>'
        }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
            maxZoom: 18
        }).addTo(map);

        // Service-Radius: 50 km um Muldestausee (Felix-Vorgabe 05.05.).
        // Vorher 100 km - zog Chemnitz/Dresden-Rand/Potsdam ein, soll nicht.
        L.circle(HOME, {
            color: '#059669',
            weight: 3,
            fillColor: '#10B981',
            fillOpacity: 0.22,
            radius: 50000,
            dashArray: '6 6'
        }).addTo(map);

        const homeIcon = L.divIcon({
            className: 'besa-pin besa-pin-home',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
        L.marker(HOME, { icon: homeIcon }).addTo(map).bindPopup(
            '<strong>BESA energy</strong><br>Unser Standort &amp; Lager<br>Muldestausee'
        );
    }).catch(err => {
        console.warn('[Region-Map]', err);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Karte: nach Consent „Funktional" automatisch initialisieren.
    if (window.BesaConsent) {
        window.BesaConsent.onConsent('functional', initRegionMap);
    }
    // Karten-Aktivieren-Button (Platzhalter, falls Funktional abgelehnt wurde)
    const mapBtn = document.getElementById('region-map-activate');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            if (window.BesaConsent && window.BesaConsent.has('functional')) {
                initRegionMap();
            } else if (window.BesaConsent) {
                window.BesaConsent.openSettings();
            }
        });
    }

    // === Mobile Menu ===
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // === Header Scroll Effect ===
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.style.boxShadow = window.pageYOffset > 100 ? '0 4px 20px rgba(0,0,0,0.1)' : 'none';
    });

    // === Smooth Scroll ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = header.offsetHeight + 20;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                if (nav) nav.classList.remove('active');
                if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
            }
        });
    });

    // === FAQ Accordion ===
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            const isOpen = item.classList.contains('faq-open');
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('faq-open');
                i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                item.classList.add('faq-open');
                item.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
            }
        });
    });


    // === Reveal Animations ===
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal', 'active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll(
        '.benefit-image-card, .process-simple-item, .faq-item, .target-card, .content-card, .stat-card, .blackout-col, .blackout-step, .blackout-insel-card, .feature-card, .split-image, .split-content, .image-banner'
    ).forEach(el => { el.classList.add('reveal'); revealObserver.observe(el); });

    // Section-Headers separat (eigene Klasse für slightly different timing)
    const headerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                headerObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -80px 0px' });

    document.querySelectorAll('section .section-header').forEach(el => {
        el.classList.add('reveal-header');
        headerObserver.observe(el);
    });

    // Stagger grid animations
    ['.why-benefits-col', '.target-groups-grid', '.content-grid'].forEach(sel => {
        document.querySelectorAll(sel).forEach(grid => {
            Array.from(grid.children).forEach((item, i) => { item.style.transitionDelay = `${i * 0.1}s`; });
        });
    });

    // === Trust Counter Animation ===
    const trustObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent;
                // Dezimalzahlen (z.B. "4,7") werden nicht animiert - Counter unterstützt nur Ganzzahlen
                if (text.includes(',') || text.includes('.')) {
                    trustObserver.unobserve(el);
                    return;
                }
                const number = parseInt(text);
                if (!isNaN(number)) {
                    const suffix = text.replace(/\d/g, '');
                    let start = 0;
                    const increment = number / 125;
                    const update = () => {
                        start += increment;
                        if (start < number) { el.textContent = Math.floor(start) + suffix; requestAnimationFrame(update); }
                        else el.textContent = number + suffix;
                    };
                    update();
                }
                trustObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.trust-number').forEach(el => trustObserver.observe(el));

    // === Hero Animation ===
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(20px)';
        setTimeout(() => {
            heroTitle.style.transition = 'all 0.8s ease';
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 300);
    }

    // === Sticky CTA ===
    const stickyCta = document.getElementById('sticky-cta');
    const formSection = document.getElementById('formular');
    if (stickyCta && formSection) {
        stickyCta.style.transition = 'transform 0.3s ease';
        stickyCta.style.transform = 'translateY(100%)';
        const handleSticky = () => {
            const scrolled = window.pageYOffset;
            const heroH = hero ? hero.offsetHeight : 600;
            const formTop = formSection.getBoundingClientRect().top + window.pageYOffset;
            stickyCta.style.transform = (scrolled > heroH && scrolled + window.innerHeight < formTop + 200) ? 'translateY(0)' : 'translateY(100%)';
        };
        window.addEventListener('scroll', handleSticky);
        handleSticky();
    }

    // === Video Showcase Click-to-Play ===
    const playBtn = document.getElementById('play-showcase');
    const videoPoster = document.getElementById('video-poster');
    const showcaseVideo = document.getElementById('showcase-video');
    if (playBtn && videoPoster && showcaseVideo) {
        playBtn.addEventListener('click', () => {
            videoPoster.classList.add('hidden');
            showcaseVideo.play();
        });
    }

    // ===================================
    // SOLAR CALCULATOR
    // ===================================
    const calcData = {};
    let currentStep = 1;
    const totalSteps = 6;

    // === Solar Calc Tooltips ===
    // Info-Buttons in den Tiles fuellen einen gemeinsamen Tooltip-Container
    // unter der Tile-Grid. Klick auf gleiche Info-Taste schliesst wieder.
    document.querySelectorAll('.tile-info').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const container = btn.closest('.calc-step').querySelector('.tile-grid-tooltip');
            if (!container) return;
            const titleEl = container.querySelector('.tile-grid-tooltip-title');
            const textEl = container.querySelector('.tile-grid-tooltip-text');
            const title = btn.dataset.tooltipTitle || '';
            const text = btn.dataset.tooltipText || '';
            const sameContent = !container.hidden && titleEl.textContent === title;
            if (sameContent) {
                container.hidden = true;
            } else {
                titleEl.textContent = title;
                textEl.textContent = text;
                container.hidden = false;
            }
        });
    });

    // Close-Button im Tooltip
    document.querySelectorAll('.tile-grid-tooltip-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            btn.closest('.tile-grid-tooltip').hidden = true;
        });
    });

    // Klick im Tooltip selbst soll nicht schliessen (nur Close-Button und ausserhalb)
    document.querySelectorAll('.tile-grid-tooltip').forEach(t => {
        t.addEventListener('click', (e) => e.stopPropagation());
    });

    // Klick ausserhalb schliesst alle offenen Tooltips
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tile-info') && !e.target.closest('.tile-grid-tooltip')) {
            document.querySelectorAll('.tile-grid-tooltip').forEach(t => t.hidden = true);
        }
    });

    // Tile selection (mit Auto-Advance für Steps 1–5)
    document.querySelectorAll('.tile-grid').forEach(grid => {
        grid.querySelectorAll('.tile').forEach(tile => {
            tile.addEventListener('click', () => {
                grid.querySelectorAll('.tile').forEach(t => t.classList.remove('selected'));
                tile.classList.add('selected');
                const field = grid.dataset.field;
                calcData[field] = tile.dataset.value;
                const step = tile.closest('.calc-step');
                const nextBtn = step.querySelector('.calc-next');
                if (nextBtn) nextBtn.disabled = false;

                // Auto-Advance: Steps 1–5 springen nach kurzer Pause automatisch weiter.
                // Step 6 (Ergebnis) wird bewusst manuell durch den CTA-Klick erreicht.
                const stepNum = parseInt(step.dataset.step);
                if (stepNum >= 1 && stepNum <= 5) {
                    setTimeout(() => {
                        if (stepNum === 5) calculateResult();
                        goToStep(stepNum + 1);
                    }, 350);
                }
            });
        });
    });

    // Navigation buttons
    document.querySelectorAll('.calc-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                if (currentStep === 5) calculateResult();
                goToStep(currentStep + 1);
            }
        });
    });

    document.querySelectorAll('.calc-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) goToStep(currentStep - 1);
        });
    });

    function goToStep(step) {
        document.querySelectorAll('.calc-step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.progress-step').forEach(s => {
            const sn = parseInt(s.dataset.step);
            s.classList.remove('active', 'completed');
            if (sn === step) s.classList.add('active');
            else if (sn < step) s.classList.add('completed');
        });
        const targetStep = document.querySelector(`.calc-step[data-step="${step}"]`);
        if (targetStep) targetStep.classList.add('active');
        currentStep = step;
    }

    function calculateResult() {
        // Estimate system size based on inputs
        let baseKwp = 6;
        if (calcData.personen === '3-4') baseKwp = 8;
        else if (calcData.personen === '5+') baseKwp = 12;

        if (calcData.verbrauch === '3000-5000') baseKwp = Math.max(baseKwp, 8);
        else if (calcData.verbrauch === '>5000') baseKwp = Math.max(baseKwp, 12);

        // Orientation factor
        let orientFactor = 1.0;
        if (calcData.ausrichtung === 'Ost-West') orientFactor = 0.9;
        else if (calcData.ausrichtung === 'Ost' || calcData.ausrichtung === 'West') orientFactor = 0.8;
        else if (calcData.ausrichtung === 'Nord') orientFactor = 0.55;

        const kwp = baseKwp;
        const ertrag = Math.round(kwp * 880 * orientFactor); // kWh/year – regional avg for Sachsen-Anhalt
        const co2 = Math.round(ertrag * 0.4); // kg CO2
        const savings = Math.round(ertrag * 0.38); // EUR savings (aktuelle Ø 0,38 €/kWh)

        document.getElementById('result-kwp').innerHTML = `${kwp} <span class="unit">kWp</span>`;
        document.getElementById('result-ertrag').innerHTML = `${ertrag.toLocaleString('de-DE')} <span class="unit">kWh</span>`;
        document.getElementById('result-co2').innerHTML = `${co2.toLocaleString('de-DE')} <span class="unit">kg</span>`;
        document.getElementById('result-savings-text').textContent = `Geschätzte Ersparnis: bis zu ${savings.toLocaleString('de-DE')} €/Jahr`;

        // Show Nord warning if applicable
        const existingWarning = document.querySelector('.nord-warning');
        if (existingWarning) existingWarning.remove();
        if (calcData.ausrichtung === 'Nord') {
            const warning = document.createElement('div');
            warning.className = 'nord-warning';
            warning.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> <strong>Hinweis:</strong> Eine reine Nord-Ausrichtung ist in der Regel nicht wirtschaftlich. Wir empfehlen eine kostenlose Vor-Ort-Beratung, um die beste Lösung für Ihr Dach zu finden.';
            const resultCard = document.querySelector('.result-card');
            if (resultCard) resultCard.parentNode.insertBefore(warning, resultCard.nextSibling);
        }
    }

    // Result CTA → Scroll to main contact form and pre-fill
    const resultToForm = document.getElementById('result-to-form');
    if (resultToForm) {
        resultToForm.addEventListener('click', () => {
            const nachrichtField = document.getElementById('nachricht');
            if (nachrichtField) {
                const kwp = document.getElementById('result-kwp')?.textContent || '';
                const ertrag = document.getElementById('result-ertrag')?.textContent || '';
                nachrichtField.value = `Solarrechner-Ergebnis:\n- Empfohlene Größe: ${kwp}\n- Geschätzter Ertrag: ${ertrag}/Jahr\n- Dachtyp: ${calcData.dachtyp || '–'}\n- Ausrichtung: ${calcData.ausrichtung || '–'}\n- Personen: ${calcData.personen || '–'}\n- Speicher: ${calcData.speicher || '–'}`;
            }
            if (formSection) {
                const header = document.getElementById('header');
                const headerOffset = header ? header.offsetHeight : 80;
                const elementPosition = formSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    // ===================================
    // LEAD FORM (EmailJS)
    // ===================================
    const leadForm = document.getElementById('lead-form');
    const formSuccess = document.getElementById('form-success');
    const submitBtn = document.getElementById('submit-btn');

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"></path></svg> Wird gesendet...';

            const fd = new FormData(leadForm);

            // === Anti-Bot-Stufe 1: Honeypot + Timing-Check ===
            // Honeypot: das versteckte Feld `website` ist für Menschen
            // unsichtbar. Wenn es gefüllt ist, ist es zu 99% ein Bot.
            // Timing-Check: weniger als 2,5 Sekunden zwischen Page-Load
            // und Submit ist für einen Menschen praktisch unmöglich
            // (Felder ausfüllen + DSGVO-Checkbox lesen dauert länger).
            // In beiden Fällen täuschen wir Erfolg vor - der Bot soll
            // nicht mitbekommen, dass er entlarvt wurde, sonst optimiert
            // der Spammer seinen Bot dagegen.
            const honeypotFilled = !!(fd.get('website') || '').trim();
            const elapsedSinceLoad = Date.now() - __pageLoadedAt;
            if (honeypotFilled || elapsedSinceLoad < 2500) {
                console.warn('[Anti-Bot] Anfrage stillschweigend verworfen.',
                    { honeypotFilled, elapsedSinceLoad });
                showFormSuccess();
                return;
            }

            const templateParams = {
                to_email: 'mail@besa.energy',
                subject: `Neue Anfrage: ${fd.get('vorname')} ${fd.get('nachname')} aus ${fd.get('plz')} ${fd.get('ort')}`,
                vorname: fd.get('vorname'), nachname: fd.get('nachname'),
                email: fd.get('email'), telefon: fd.get('telefon'),
                plz: fd.get('plz'), ort: fd.get('ort'),
                nachricht: fd.get('nachricht') || 'Keine Nachricht',
                datum: new Date().toLocaleString('de-DE')
            };

            try {
                const demoMode = EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY'
                    || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID'
                    || EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID';
                if (demoMode) {
                    console.log('[EmailJS] Demo-Modus aktiv (eine ID fehlt noch). Anfrage:', templateParams);
                    showFormSuccess();
                    return;
                }
                await loadEmailJS();
                await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
                showFormSuccess();
            } catch (err) {
                console.error('Fehler:', err);
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Kostenloses Angebot anfragen';
                alert('Fehler beim Senden. Bitte rufen Sie uns an: +49 3493 / 510173');
            }
        });
    }

    function showFormSuccess() {
        if (leadForm) leadForm.style.display = 'none';
        if (formSuccess) {
            formSuccess.style.display = 'block';
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // === Karriere-Seite: Stellen-Apply-Buttons + Bewerbungs-Formular ===
    const bewerbungForm = document.getElementById('bewerbung-form');
    const positionSelect = document.getElementById('bw-position');
    const bewerbungSuccess = document.getElementById('bewerbung-success');
    const bewerbungSubmitBtn = document.getElementById('bewerbung-submit-btn');
    const dateiInput = document.getElementById('bw-datei');
    const MAX_FILE_BYTES = 1024 * 1024; // 1 MB

    // Stellen-Apply-Buttons: scrollen zum Formular + Position vorausfuellen
    document.querySelectorAll('.stellen-apply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const position = btn.dataset.position || '';
            if (positionSelect && position) {
                // Falls die Option im Dropdown existiert, auswaehlen
                const opt = Array.from(positionSelect.options).find(o => o.value === position);
                if (opt) positionSelect.value = position;
            }
            const target = document.getElementById('bewerbung');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Live-Validation des File-Inputs (Groesse + Typ)
    let fileErrorEl = null;
    if (dateiInput) {
        dateiInput.addEventListener('change', () => {
            // alte Fehlermeldung entfernen
            if (fileErrorEl) { fileErrorEl.remove(); fileErrorEl = null; }
            const file = dateiInput.files && dateiInput.files[0];
            if (!file) return;
            if (file.size > MAX_FILE_BYTES) {
                fileErrorEl = document.createElement('div');
                fileErrorEl.className = 'form-file-error';
                fileErrorEl.textContent = `Datei zu gross (${(file.size / 1024 / 1024).toFixed(2)} MB). Max. 1 MB. Bitte separat per Mail an mail@besa.energy senden.`;
                dateiInput.parentElement.appendChild(fileErrorEl);
                dateiInput.value = '';
            }
        });
    }

    if (bewerbungForm) {
        bewerbungForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!bewerbungSubmitBtn) return;
            bewerbungSubmitBtn.disabled = true;
            bewerbungSubmitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"></path></svg> Wird gesendet...';

            const fd = new FormData(bewerbungForm);

            // Anti-Bot Honeypot + Timing
            const honeypotFilled = !!(fd.get('website') || '').toString().trim();
            const elapsedSinceLoad = Date.now() - __pageLoadedAt;
            if (honeypotFilled || elapsedSinceLoad < 2500) {
                console.warn('[Anti-Bot Bewerbung] Anfrage stillschweigend verworfen.',
                    { honeypotFilled, elapsedSinceLoad });
                showBewerbungSuccess();
                return;
            }

            // Datei-Groesse-Check (Server-Side-Reibung vermeiden)
            const file = dateiInput && dateiInput.files && dateiInput.files[0];
            if (file && file.size > MAX_FILE_BYTES) {
                alert('Datei zu groß (max. 1 MB). Bitte separat per Mail an mail@besa.energy schicken.');
                bewerbungSubmitBtn.disabled = false;
                bewerbungSubmitBtn.innerHTML = 'Bewerbung senden';
                return;
            }

            const position = fd.get('position') || 'Unbenannt';
            const vorname = fd.get('vorname') || '';
            const nachname = fd.get('nachname') || '';
            const email = fd.get('email') || '';
            const telefon = fd.get('telefon') || '';
            const nachricht = fd.get('nachricht') || 'Keine Nachricht';
            const fileInfo = file
                ? `${file.name} (${(file.size / 1024).toFixed(0)} KB) - siehe Anhang`
                : 'Keine Datei angehaengt';

            // Bewerbungs-spezifische Template (template_cwrb2mt) erwartet diese Variablen.
            // Subject + From Name werden im EmailJS-Dashboard zusammengesetzt,
            // nicht mehr hier im Code.
            const templateParams = {
                vorname,
                nachname,
                email,
                telefon: telefon || '-',
                position,
                nachricht: nachricht || '-',
                datei_info: fileInfo,
                datum: new Date().toLocaleString('de-DE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })
            };

            try {
                const demoMode = EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY'
                    || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID'
                    || EMAILJS_BEWERBUNG_TEMPLATE_ID === 'YOUR_TEMPLATE_ID';
                if (demoMode) {
                    console.log('[EmailJS Bewerbung] Demo-Modus. Daten:', templateParams);
                    showBewerbungSuccess();
                    return;
                }
                await loadEmailJS();
                // Wenn eine Datei dran ist, versuchen wir sendForm (FormData mit File).
                // Sonst geht ein normaler send() mit den Template-Params.
                //
                // ACHTUNG: Datei-Anhänge funktionieren nur im EmailJS Personal-Plan
                // aufwärts. Im Free-Plan wird die Datei silent verworfen, die Mail
                // kommt OHNE Anhang an. Siehe Aufgaben.md → Felix-Entscheidung
                // "EmailJS Free-Plan + Datei-Anhänge".
                if (file) {
                    // sendForm liest das Form-Element. vorname/nachname/email/telefon/
                    // position/nachricht/datei sind bereits als Form-Inputs vorhanden.
                    // Nur die berechneten Felder (datei_info, datum) müssen als
                    // Hidden Inputs ergänzt werden, damit das Template sie auflöst.
                    setHiddenField(bewerbungForm, 'datei_info', templateParams.datei_info);
                    setHiddenField(bewerbungForm, 'datum', templateParams.datum);
                    await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_BEWERBUNG_TEMPLATE_ID, bewerbungForm);
                } else {
                    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_BEWERBUNG_TEMPLATE_ID, templateParams);
                }
                showBewerbungSuccess();
            } catch (err) {
                console.error('Fehler Bewerbung:', err);
                bewerbungSubmitBtn.disabled = false;
                bewerbungSubmitBtn.innerHTML = 'Bewerbung senden';
                alert('Fehler beim Senden. Bitte schicken Sie Ihre Bewerbung direkt an mail@besa.energy oder rufen Sie an: +49 3493 / 510173');
            }
        });
    }

    function setHiddenField(form, name, value) {
        let el = form.querySelector(`input[type="hidden"][name="${name}"]`);
        if (!el) {
            el = document.createElement('input');
            el.type = 'hidden';
            el.name = name;
            form.appendChild(el);
        }
        el.value = value;
    }

    function showBewerbungSuccess() {
        if (bewerbungForm) bewerbungForm.style.display = 'none';
        if (bewerbungSuccess) {
            bewerbungSuccess.style.display = 'block';
            bewerbungSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Active nav on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav > a, .nav > .nav-dropdown > a');
    window.addEventListener('scroll', () => {
        const scrollPos = window.pageYOffset + header.offsetHeight + 100;
        sections.forEach(section => {
            if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${section.id}`) link.classList.add('active');
                });
            }
        });
    });

    // === FAQ "Weitere Fragen anzeigen" (nur Mobile) ===
    const faqShowMore = document.getElementById('faq-show-more');
    const faqList = document.getElementById('faq-list');
    if (faqShowMore && faqList) {
        const labelEl = faqShowMore.querySelector('.faq-show-more-label');
        faqShowMore.addEventListener('click', () => {
            const isExpanded = faqList.classList.toggle('show-all');
            faqShowMore.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            if (labelEl) {
                labelEl.textContent = isExpanded ? 'Weniger anzeigen' : 'Weitere Fragen anzeigen';
            }
        });
    }

    // === Team-Slider (Über uns) ===
    const teamSlider = document.querySelector('.team-slider');
    if (teamSlider) {
        const track = teamSlider.querySelector('.team-slider-track');
        const slides = teamSlider.querySelectorAll('.team-slide');
        const prevBtn = teamSlider.querySelector('.team-slider-prev');
        const nextBtn = teamSlider.querySelector('.team-slider-next');
        const dots = teamSlider.querySelectorAll('.team-slider-dot');
        const totalSlides = slides.length;
        let currentSlide = 0;

        function goToSlide(index) {
            currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            dots.forEach((d, i) => {
                const isActive = i === currentSlide;
                d.classList.toggle('active', isActive);
                d.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });
        }

        prevBtn?.addEventListener('click', () => goToSlide(currentSlide - 1));
        nextBtn?.addEventListener('click', () => goToSlide(currentSlide + 1));
        dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

        // Keyboard-Navigation auf dem Slider-Container
        teamSlider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft')  { e.preventDefault(); goToSlide(currentSlide - 1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); goToSlide(currentSlide + 1); }
        });

        // Touch-Swipe (Mobile)
        let touchStartX = 0;
        let touchStartY = 0;
        track.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        track.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            // Nur als horizontaler Swipe werten, wenn dx > dy (kein versehentliches Triggern beim Scrollen)
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                goToSlide(currentSlide + (dx < 0 ? 1 : -1));
            }
        });
    }

    // === Testimonials-Slider (5 Google-Bewertungen, Endlos-Schleife) ===
    // Desktop ≥901px: 3 Cards sichtbar.  Mobile ≤900px: 1 Card sichtbar.
    // Endlos-Loop mit Klon-Trick: am Anfang/Ende werden Cards geklont.
    // Erreicht der Index die Klon-Zone, wird nach der Transition unsichtbar
    // auf die echte Position teleportiert (transition: none + reflow).
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    if (testimonialsSlider) {
        const tTrack = document.getElementById('testimonials-slider-track');
        const tPrev = testimonialsSlider.querySelector('.testimonials-slider-prev');
        const tNext = testimonialsSlider.querySelector('.testimonials-slider-next');
        const tDots = document.getElementById('testimonials-slider-dots');
        // Echte Cards (Klone werden später dazugemixt)
        const tRealCards = Array.from(tTrack.querySelectorAll('.testimonial-card'));
        const tTotal = tRealCards.length;
        const CLONE_COUNT = 3;  // immer max-visible Klone, damit volle Sicht möglich ist
        let tIndex = 0;          // 0..tTotal-1 (logischer Index der „ersten sichtbaren Card")
        let tVisible = 3;
        let tIsTeleporting = false;

        function tGetVisible() {
            return window.innerWidth > 900 ? 3 : 1;
        }

        // Klone aufsetzen - letzte N Cards an Anfang, erste N an Ende
        function tSetupClones() {
            // Alte Klone entfernen
            tTrack.querySelectorAll('.testimonial-card.is-clone').forEach(c => c.remove());
            // Letzte N vorne klonen (in umgekehrter Reihenfolge, damit korrekt eingefügt wird)
            for (let i = CLONE_COUNT - 1; i >= 0; i--) {
                const src = tRealCards[(tTotal - 1 - i + tTotal) % tTotal];
                const clone = src.cloneNode(true);
                clone.classList.add('is-clone');
                clone.setAttribute('aria-hidden', 'true');
                clone.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
                tTrack.insertBefore(clone, tTrack.firstChild);
            }
            // Erste N hinten klonen
            for (let i = 0; i < CLONE_COUNT; i++) {
                const src = tRealCards[i % tTotal];
                const clone = src.cloneNode(true);
                clone.classList.add('is-clone');
                clone.setAttribute('aria-hidden', 'true');
                clone.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
                tTrack.appendChild(clone);
            }
        }

        function tBuildDots() {
            if (!tDots) return;
            tDots.innerHTML = '';
            for (let i = 0; i < tTotal; i++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'testimonials-slider-dot' + (i === tIndex ? ' active' : '');
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', `Bewertung ${i + 1} von ${tTotal}`);
                dot.setAttribute('aria-selected', i === tIndex ? 'true' : 'false');
                dot.addEventListener('click', () => tGoTo(i, true));
                tDots.appendChild(dot);
            }
        }

        function tUpdateDots() {
            if (!tDots) return;
            const realIndex = ((tIndex % tTotal) + tTotal) % tTotal;
            tDots.querySelectorAll('.testimonials-slider-dot').forEach((d, i) => {
                const active = i === realIndex;
                d.classList.toggle('active', active);
                d.setAttribute('aria-selected', active ? 'true' : 'false');
            });
        }

        // Track-Position berechnen - basiert auf (CLONE_COUNT + tIndex)
        function tApplyPosition(animated = true) {
            if (!animated) {
                tTrack.style.transition = 'none';
            } else {
                tTrack.style.transition = '';
            }
            const cards = tTrack.querySelectorAll('.testimonial-card');
            if (cards.length === 0) return;
            const cardWidth = cards[0].offsetWidth;
            const gap = parseFloat(getComputedStyle(tTrack).gap) || 0;
            const offset = (CLONE_COUNT + tIndex) * (cardWidth + gap);
            tTrack.style.transform = `translateX(-${offset}px)`;
            if (!animated) {
                // Reflow erzwingen, damit transition:none wirklich greift
                tTrack.offsetHeight;
                tTrack.style.transition = '';
            }
        }

        function tGoTo(targetIndex, jumpToReal = false) {
            // jumpToReal = true bei Dot-Click → direkt zum realen Index, ggf. via kürzestem Weg
            if (jumpToReal) {
                tIndex = ((targetIndex % tTotal) + tTotal) % tTotal;
            } else {
                tIndex = targetIndex;
            }
            tApplyPosition(true);
            tUpdateDots();
        }

        // transitionend → wenn im Klon-Bereich, unsichtbar auf reale Position teleportieren
        tTrack.addEventListener('transitionend', (e) => {
            // Nur auf transform-Transitions reagieren (nicht auf Card-Hover etc.)
            if (e.propertyName !== 'transform') return;
            if (tIndex >= tTotal) {
                tIsTeleporting = true;
                tIndex = tIndex - tTotal;
                tApplyPosition(false);
                tIsTeleporting = false;
            } else if (tIndex < 0) {
                tIsTeleporting = true;
                tIndex = tIndex + tTotal;
                tApplyPosition(false);
                tIsTeleporting = false;
            }
        });

        function tReset() {
            const newVisible = tGetVisible();
            tVisible = newVisible;
            // Klone neu aufsetzen (z.B. nach Resize, falls visible-Anzahl gewechselt)
            tSetupClones();
            // Sicherstellen, dass tIndex im realen Bereich ist
            tIndex = ((tIndex % tTotal) + tTotal) % tTotal;
            // Build Dots, falls noch nicht da
            if (!tDots.children.length) tBuildDots();
            // Position ohne Animation setzen (Initial / Resize)
            tApplyPosition(false);
            tUpdateDots();
        }

        tPrev?.addEventListener('click', () => tGoTo(tIndex - 1));
        tNext?.addEventListener('click', () => tGoTo(tIndex + 1));

        // Keyboard-Navigation
        testimonialsSlider.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft')  { e.preventDefault(); tGoTo(tIndex - 1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); tGoTo(tIndex + 1); }
        });

        // Touch-Swipe (Mobile) - mit Klick-Block bei Swipe-Geste
        let tTouchStartX = 0, tTouchStartY = 0, tTouchMoved = false;
        if (tTrack) {
            tTrack.addEventListener('touchstart', (e) => {
                tTouchStartX = e.touches[0].clientX;
                tTouchStartY = e.touches[0].clientY;
                tTouchMoved = false;
            }, { passive: true });
            tTrack.addEventListener('touchmove', (e) => {
                const dx = Math.abs(e.touches[0].clientX - tTouchStartX);
                if (dx > 10) tTouchMoved = true;
            }, { passive: true });
            tTrack.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - tTouchStartX;
                const dy = e.changedTouches[0].clientY - tTouchStartY;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                    tGoTo(tIndex + (dx < 0 ? 1 : -1));
                }
            });
            // Author- und Source-Links blockieren bei Swipe
            tTrack.addEventListener('click', (e) => {
                if (tTouchMoved) {
                    e.preventDefault();
                    e.stopPropagation();
                    tTouchMoved = false;
                }
            }, true);
        }

        // Resize: nach 150 ms Debounce neu rendern
        let tResizeTO;
        window.addEventListener('resize', () => {
            clearTimeout(tResizeTO);
            tResizeTO = setTimeout(tReset, 150);
        });

        // Initial-Setup (kurz verzögert, damit Layout/Schriften berechnet sind)
        tReset();
        // Re-apply nach Layout-Settle
        setTimeout(tReset, 100);
    }

    document.body.classList.add('loaded');
});

// Inject spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; }
    #submit-btn:disabled, #result-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    body.loaded .hero-content { animation: fadeInUp 0.8s ease forwards; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(style);

/* ============================================================
   POSSIBILITIES-SLIDER — Pfeile-Steuerung
   Eingebaut 24.05.2026 — Florian-Wunsch: Slider mit Pfeilen,
   zusätzlich frei scrollbar (native CSS-Scroll bleibt aktiv).
   ============================================================ */
(function initPossibilitiesSlider() {
    const slider = document.getElementById('possibilities-slider');
    if (!slider) return;
    const prevBtn = document.querySelector('.possibilities-arrow-prev');
    const nextBtn = document.querySelector('.possibilities-arrow-next');
    if (!prevBtn || !nextBtn) return;

    function getCardStep() {
        const card = slider.querySelector('.possibility-card');
        if (!card) return 280;
        const gap = parseInt(getComputedStyle(slider).gap, 10) || 20;
        return card.offsetWidth + gap;
    }

    function updateArrowState() {
        const max = slider.scrollWidth - slider.clientWidth;
        const epsilon = 4;
        prevBtn.disabled = slider.scrollLeft <= epsilon;
        nextBtn.disabled = slider.scrollLeft >= max - epsilon;
    }

    prevBtn.addEventListener('click', function () {
        slider.scrollBy({ left: -getCardStep(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', function () {
        slider.scrollBy({ left: getCardStep(), behavior: 'smooth' });
    });

    slider.addEventListener('scroll', updateArrowState, { passive: true });
    window.addEventListener('resize', updateArrowState);
    // Initial state
    updateArrowState();
})();
