/* ── Typing Animation (phrases from phrases.md) ── */
function startTyping(phrases) {
    const el = document.getElementById('typed');
    let phraseIdx = 0, charIdx = 0, deleting = false;
    function tick() {
        const current = phrases[phraseIdx];
        if (deleting) {
            el.textContent = current.substring(0, charIdx--);
            if (charIdx < 0) {
                deleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
                setTimeout(tick, 400);
                return;
            }
            setTimeout(tick, 35);
        } else {
            el.textContent = current.substring(0, ++charIdx);
            if (charIdx === current.length) {
                deleting = true;
                setTimeout(tick, 2000);
                return;
            }
            setTimeout(tick, 70);
        }
    }
    setTimeout(tick, 600);
}

/* ── Scroll: fade-in sections ── */
const sections = document.querySelectorAll('.section');
const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
sections.forEach(s => sectionObs.observe(s));

/* ── Scroll: nav background ── */
const nav = document.getElementById('nav');
const hero = document.getElementById('hero');
const navObs = new IntersectionObserver(([entry]) => {
    nav.classList.toggle('scrolled', !entry.isIntersecting);
}, { threshold: 0.1 });
navObs.observe(hero);

/* ── Hero visibility (for pixel-hero.js pause/resume) ── */
window.__heroInView = true;
const heroVisObs = new IntersectionObserver(([entry]) => {
    window.__heroInView = entry.isIntersecting;
    document.dispatchEvent(new CustomEvent('hero-visibility', {
        detail: { visible: entry.isIntersecting }
    }));
}, { threshold: 0.01 });
heroVisObs.observe(hero);

/* ── Scroll Indicators (Next & Previous) ── */
const scrollIndicators = document.querySelectorAll('.scroll-indicator');
scrollIndicators.forEach(indicator => {
    indicator.style.cursor = 'pointer';
    indicator.addEventListener('click', () => {
        const nextId = indicator.getAttribute('data-next');
        const nextSection = document.getElementById(nextId);
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

const scrollUpIndicators = document.querySelectorAll('.scroll-up-indicator');
scrollUpIndicators.forEach(indicator => {
    indicator.style.cursor = 'pointer';
    indicator.addEventListener('click', () => {
        const prevId = indicator.getAttribute('data-prev');
        const prevSection = document.getElementById(prevId);
        if (prevSection) {
            prevSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Track scroll and show/hide indicators based on current section
const updateIndicators = () => {
    const sections = ['hero', 'about', 'projects', 'footer'];
    const scrollPos = window.scrollY + window.innerHeight / 2;

    sections.forEach(sectionId => {
        const el = document.getElementById(sectionId);
        if (el) {
            const rect = el.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;

            // Update down indicator
            const downInd = el.querySelector('.scroll-indicator');
            if (downInd) {
                downInd.style.opacity = isInView ? '1' : '0';
                downInd.style.pointerEvents = isInView ? 'auto' : 'none';
            }

            // Update up indicator
            const upInd = el.querySelector('.scroll-up-indicator');
            if (upInd) {
                upInd.style.opacity = isInView ? '1' : '0';
                upInd.style.pointerEvents = isInView ? 'auto' : 'none';
            }
        }
    });
};

window.addEventListener('scroll', updateIndicators);
updateIndicators();

/* ── Theme Toggle ── */
const THEME_KEY = 'hellosaumil-portfolio-theme';
const toggle = document.getElementById('themeToggle');
const saved = localStorage.getItem(THEME_KEY) || 'dark';
document.documentElement.setAttribute('data-theme', saved);

toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
});

/* ── Markdown Loader (mirrors WebResume pattern) ── */
(async function loadMarkdown() {

    async function fetchMd(file) {
        const r = await fetch(`data/${file}?v=${Date.now()}`);
        if (!r.ok) throw new Error(`Cannot load ${file}`);
        return r.text();
    }

    // Resolve brand-specific CSS class from URL or label
    function brandClass(url, label) {
        const u = url.toLowerCase(), l = (label || '').toLowerCase();
        if (u.includes('adreno') || u.includes('snapdragon') || l === 'adreno' || l === 'snapdragon')
            return 'link-snapdragon';
        if (u.includes('qualcomm.com'))
            return 'link-qualcomm';
        if (u.includes('kore') || u.includes('securitypro') || l.includes('kore wireless') || l === 'kore' || l === 'securitypro')
            return 'link-kore';
        return '';
    }

    // Parse inline markdown: [text](url), **bold**, __underline__, *italic*, `code`
    function parseMdInline(text) {
        return text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
                const cls = brandClass(url, label);
                return `<a href="${url}" target="_blank" rel="noopener"${cls ? ` class="${cls}"` : ''}>${label}</a>`;
            })
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')  // ***bold italic***
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')                // **bold**
            .replace(/__(.*?)__/g, '<u>$1</u>')                              // __underline__
            .replace(/[*_](.*?)[*_]/g, '<em>$1</em>')                        // *italic* or _italic_
            .replace(/`([^`]+)`/g, '<code>$1</code>');                        // `code`
    }

    // Strip markdown to plain text
    function stripMd(text) {
        return text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1');
    }

    // Render markdown inline: [text](url) → branded links, backticks → <mark>, bold, italic
    function renderMd(text) {
        return text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
                const cls = brandClass(url, label);
                return `<a href="${url}" target="_blank" rel="noopener"${cls ? ` class="${cls}"` : ''}>${label}</a>`;
            })
            .replace(/`([^`]+)`/g, '<mark>$1</mark>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    // Extract tags from ##### Skill1, Skill2, Skill3
    function parseTags(tagLine) {
        const text = tagLine.replace(/^#+\s*/, '').replace(/^\*|\*$/g, '').trim();
        return text.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
    }

    // ── Load phrases.md → typing animation ──
    try {
        const md = await fetchMd('phrases.md');
        const phrases = md.split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('- '))
            .map(l => l.slice(2).trim())
            .filter(Boolean);

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            // No animation — start typing immediately
            if (phrases.length) startTyping(phrases);
        } else {
            // Defer typing until hero animation completes
            document.addEventListener('hero-animation-done', function () {
                if (phrases.length) startTyping(phrases);
            }, { once: true });
        }
    } catch (e) {
        console.warn('phrases.md:', e);
        startTyping(['AI / Deep Learning', 'GPU Infrastructure', 'Distributed Systems']);
    }

    // ── Load summary.md → bio ──
    try {
        const md = await fetchMd('summary.md');
        const bioEl = document.getElementById('bio-text');
        if (bioEl) bioEl.innerHTML = parseMdInline(md.trim());
    } catch (e) { console.warn('summary.md:', e); }

    // ── Load projects.md → Editorial Grid ──
    try {
        const md = await fetchMd('projects.md');
        const content = md.split(/\n---\n/).map(s => s.trim()).filter(Boolean);

        const projectGroups = [];
        let currentGroup = null;

        content.forEach(block => {
            const lines = block.split('\n').map(l => l.trim());
            const headerLine = lines.find(l => l.startsWith('## '));

            if (headerLine) {
                if (currentGroup) projectGroups.push(currentGroup);
                currentGroup = {
                    title: headerLine.replace(/^##\s*/, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim(),
                    projects: []
                };
            } else if (currentGroup) {
                const titleLine = lines.find(l => l.startsWith('###'));
                if (titleLine) {
                    const titleMatch = titleLine.match(/###\s*\[([^\]]+)\]\(([^)]+)\)/);
                    const name = titleMatch ? titleMatch[1] : titleLine.replace(/^###\s*/, '');
                    const url = titleMatch ? titleMatch[2] : '#';

                    const tagLine = lines.find(l => l.startsWith('#####'));
                    const tagRaw = tagLine ? tagLine.replace(/^#####\s*/, '') : '';
                    const [tagsPart, yearPart] = tagRaw.split('|').map(s => s.trim());
                    const tags = tagsPart ? tagsPart.split(',').map(t => t.trim()).filter(Boolean) : [];
                    const year = yearPart ?? '';

                    const descriptionLines = lines.filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
                    const desc = descriptionLines.length > 0 ? renderMd(descriptionLines[0]) : '';
                    const techSnippet = descriptionLines.slice(1).join(' // ').replace(/`/g, '');

                    currentGroup.projects.push({ name, url, tags, year, desc, techSnippet });
                }
            }
        });
        if (currentGroup) projectGroups.push(currentGroup);

        const githubIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;
        const externalIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 01 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

        const htmlSections = projectGroups.map((group, groupIdx) => {
            const rowClass = group.projects.length <= 2 ? `ed-row--${group.projects.length}` : '';
            const cards = group.projects.map((p, idx) => {
                const icon = p.url.includes('github.com') ? githubIcon : externalIcon;
                return `
                <div class="ed-card">
                    <div class="ed-card__top">
                        <a href="${p.url}" class="ed-card__link" target="_blank" rel="noopener" title="Open Project">
                            ${icon}
                        </a>
                        <div class="ed-card__name">${p.name}</div>
                        <div class="ed-card__desc">${p.desc}</div>
                    </div>
                    <div class="ed-card__bottom">
                        ${p.techSnippet ? `<div class="ed-bottom__tech">${p.techSnippet}</div>` : ''}
                        <div class="ed-bottom__footer">
                            <div class="ed-bottom__tags">
                                ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                            </div>
                            <div class="ed-bottom__year">${p.year}</div>
                        </div>
                    </div>
                </div>`;
            }).join('');

            return `
            <div class="ed-section">
                <div class="ed-section__header">
                    <div class="ed-section__title">${group.title}</div>
                    <div class="ed-section__count">${group.projects.length} project${group.projects.length === 1 ? '' : 's'}</div>
                </div>
                <div class="ed-row ${rowClass}">
                    ${cards}
                </div>
            </div>`;
        });

        const grid = document.getElementById('projects-grid');
        if (grid) grid.innerHTML = htmlSections.join('');
    } catch (e) { console.warn('projects.md:', e); }

})();

/* ── Profile photo border: cursor-tracking parallax ── */
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const wrapper = document.getElementById('photoWrapper');
    const border = document.getElementById('photoBorder');
    if (!wrapper || !border) return;

    const MAX_SHIFT = 8; // px max offset in each axis
    let rafId = null;
    let locked = false; // tap/click to toggle

    const aboutSection = document.getElementById('about');

    function applyShift(x, y) {
        border.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    }

    function resetBorder() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        applyShift(0, 0);
    }

    aboutSection.addEventListener('mousemove', function (e) {
        if (locked || rafId) return;

        rafId = requestAnimationFrame(function () {
            rafId = null;

            const rect = wrapper.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            // Normalized -1 → +1 relative to photo center
            const normX = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width * 1.5)));
            const normY = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height * 1.5)));

            applyShift(normX * MAX_SHIFT, normY * MAX_SHIFT);
        });
    });

    aboutSection.addEventListener('mouseleave', function () {
        if (!locked) resetBorder();
    });

    // Tap/click anywhere on about section toggles lock
    aboutSection.addEventListener('click', function () {
        locked = !locked;
        wrapper.style.cursor = locked ? 'default' : 'pointer';

        if (locked) resetBorder();
        // Unlocked: tracking resumes on next mousemove
    });

    // Hint that the photo area is tappable
    wrapper.style.cursor = 'pointer';
})();

