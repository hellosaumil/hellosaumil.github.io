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
        if (phrases.length) startTyping(phrases);
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

    // ── Load projects.md → project cards ──
    try {
        const md = await fetchMd('projects.md');
        const sections = md.split(/\n---\n/).map(s => s.trim()).filter(Boolean);

        const cards = sections.map(section => {
            const lines = section.split('\n').map(l => l.trim());

            // ### [Name — Subtitle](url)
            const titleLine = lines.find(l => l.startsWith('###'));
            const titleMatch = titleLine?.match(/###\s*\[([^\]]+)\]\(([^)]+)\)/);
            const name = titleMatch
                ? titleMatch[1].split(/\s*[—–]\s*/)[0].trim()
                : (titleLine?.replace(/^#+\s*/, '') ?? '');
            const url = titleMatch?.[2] ?? '#';

            // ##### *tags* | year
            const tagLine = lines.find(l => l.startsWith('#####'));
            const tagRaw = tagLine ? tagLine.replace(/^#+\s*/, '') : '';
            const [tagsPart, yearPart] = tagRaw.split('|').map(s => s.trim());
            const tags = tagsPart ? tagsPart.split(',').map(t => t.trim()).filter(Boolean) : [];
            const year = yearPart ?? '';

            // First bullet + continuation line → plain-text description
            const bulletIdx = lines.findIndex(l => l.startsWith('- '));
            let desc = '';
            if (bulletIdx !== -1) {
                desc = renderMd(lines[bulletIdx].slice(2).trim());
                const next = lines[bulletIdx + 1];
                if (next && !next.startsWith('-') && !next.startsWith('#') && next.trim()) {
                    desc += ' ' + renderMd(next.trim());
                }
            }

            return `<div class="project-card">
                        <div class="project-card__name"><a href="${url}" target="_blank" rel="noopener">${name}</a></div>
                        <div class="project-card__desc">${desc}</div>
                        <div class="project-card__footer">
                            <div class="project-card__tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
                            ${year ? `<span class="project-card__year">${year}</span>` : ''}
                        </div>
                    </div>`;
        });

        const grid = document.getElementById('projects-grid');
        if (grid) grid.innerHTML = cards.join('');
    } catch (e) { console.warn('projects.md:', e); }

})();
