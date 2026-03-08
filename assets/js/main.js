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

/* ── Global Scroll Chevrons ── */
const scrollUpChevron = document.getElementById('scrollUp');
const scrollDownChevron = document.getElementById('scrollDown');
const sectionIds = ['hero', 'about', 'projects', 'footer'];

// Get current section index based on scroll position
const getCurrentSectionIndex = () => {
    const navH = document.getElementById('nav')?.offsetHeight || 64;
    const midY = window.scrollY + navH + 4;
    let currentIdx = 0;

    sectionIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + window.scrollY <= midY) {
            currentIdx = i;
        }
    });
    return currentIdx;
};

// Shared navigation function
const navigateToSection = (direction) => {
    const currentIdx = getCurrentSectionIndex();
    let targetIdx;

    if (direction === 'next') {
        targetIdx = Math.min(currentIdx + 1, sectionIds.length - 1);
    } else if (direction === 'prev') {
        targetIdx = Math.max(currentIdx - 1, 0);
    }

    if (targetIdx === currentIdx) return;

    const targetId = sectionIds[targetIdx];
    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
    }
};

// Update global chevron visibility based on current section
const updateScrollChevrons = () => {
    const currentIdx = getCurrentSectionIndex();
    const isAtStart = currentIdx === 0;

    // Hide down chevron as soon as footer is visible in viewport
    const footer = document.getElementById('footer');
    const footerVisible = footer && footer.getBoundingClientRect().top < window.innerHeight;

    if (scrollUpChevron) scrollUpChevron.classList.toggle('hidden', isAtStart);
    if (scrollDownChevron) scrollDownChevron.classList.toggle('hidden', footerVisible);
};

// Handle chevron clicks
if (scrollUpChevron) {
    scrollUpChevron.addEventListener('click', () => navigateToSection('prev'));
}

if (scrollDownChevron) {
    scrollDownChevron.addEventListener('click', () => navigateToSection('next'));
}

window.addEventListener('scroll', updateScrollChevrons);
updateScrollChevrons();

/* ── Scroll Snapping (Wheel Event) ── */
let lastWheelTime = 0;
window.addEventListener('wheel', (e) => {
    // Only intercept if no expanded card/modal
    if (document.querySelector('.ed-card.is-expanded')) return;
    if (typeof mediaModal !== 'undefined' && mediaModal.isOpen()) return;

    // Ignore very small trackpad movements
    if (Math.abs(e.deltaY) < 10) return;

    const currentIdx = getCurrentSectionIndex();
    const currentSection = document.getElementById(sectionIds[currentIdx]);
    if (!currentSection) return;

    const rect = currentSection.getBoundingClientRect();
    const atTop = rect.top >= -10;
    const atBottom = rect.bottom <= window.innerHeight + 10;

    const now = Date.now();
    const dir = e.deltaY > 0 ? 'next' : 'prev';

    if (dir === 'next' && atBottom) {
        if (currentIdx < sectionIds.length - 1) {
            e.preventDefault();
            if (now - lastWheelTime > 800) {
                navigateToSection('next');
                lastWheelTime = now;
            }
        }
    } else if (dir === 'prev' && atTop) {
        if (currentIdx > 0) {
            e.preventDefault();
            if (now - lastWheelTime > 800) {
                navigateToSection('prev');
                lastWheelTime = now;
            }
        }
    }
}, { passive: false });

/* ── Keyboard: section nav + expanded card controls ── */
document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    const expandedCard = document.querySelector('.ed-card.is-expanded');

    // Priority 1: Escape key
    if (e.key === 'Escape') {
        // If media modal is open, close it and STOP (don't collapse card)
        if (mediaModal && mediaModal.isOpen()) {
            e.preventDefault();
            mediaModal.close();
            return;
        }
        // Otherwise, if a card is expanded, collapse it
        if (expandedCard) {
            e.preventDefault();
            // Don't use .click() as it might trigger weird side effects, use the collapse helper directly if available
            // but for now .click() is fine if we're sure it's the card. 
            // Better: find the card and call the collapseCard function if it was accessible... 
            // but since it's inside the grid closure, we'll stick to .click() or similar.
            expandedCard.click();
            return;
        }
    }

    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();

    // If a card is expanded, cycle through its showcase thumbnails
    if (expandedCard) {
        const thumbs = [...expandedCard.querySelectorAll('.ed-expander__thumb')];
        if (thumbs.length === 0) return;

        const activeIdx = thumbs.findIndex(t => t.classList.contains('is-active'));
        const nextIdx = e.key === 'ArrowDown'
            ? (activeIdx + 1) % thumbs.length
            : (activeIdx - 1 + thumbs.length) % thumbs.length;

        thumbs[nextIdx].click();
        thumbs[nextIdx].scrollIntoView({ block: 'nearest' });
        return;
    }

    // Default: navigate between sections
    navigateToSection(e.key === 'ArrowDown' ? 'next' : 'prev');
});

/* ── Lightbox Modal ── */
const mediaModal = (() => {
    const el = document.createElement('div');
    el.className = 'media-modal';
    el.innerHTML = `
        <div class="media-modal__inner"></div>
        <button class="media-modal__close" aria-label="Close">Esc [X]</button>
    `;
    document.body.appendChild(el);

    const inner = el.querySelector('.media-modal__inner');
    const closeBtn = el.querySelector('.media-modal__close');

    const open = (src, isVideo) => {
        inner.innerHTML = isVideo
            ? `<video src="${src}" muted loop playsinline autoplay controls></video>`
            : `<img src="${src}" alt="Media preview">`;
        el.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        el.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(() => { inner.innerHTML = ''; }, 200);
    };

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        close();
    });

    el.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop propagation so it doesn't trigger the "click outside card" collapse
        if (!e.target.closest('img, video')) close();
    });

    return { open, close, isOpen: () => el.classList.contains('is-open') };
})();




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
    reorderShowcases(next);
});

// Sort media so theme-matching filenames come first (dark→Dark_Mode first, light→Light_Mode first)
function sortMediaForTheme(media, theme) {
    const key = theme === 'light' ? /Light_Mode/i : /Dark_Mode/i;
    const match = media.filter(m => key.test(m));
    const rest = media.filter(m => !key.test(m));
    return [...match, ...rest];
}

// Populate featured with actual media (img/video/iframe HTML)
function populateFeaturedMedia(featured, src, isVideo, isIframe) {
    featured.classList.add('is-loading');
    const html = isIframe
        ? decodeURIComponent(src)
        : isVideo
            ? `<video src="${src}" muted loop playsinline autoplay></video>`
            : `<img src="${src}" alt="screenshot" loading="lazy">`;
    featured.innerHTML = html;
    attachFeaturedLoadListener(featured);
}

// Remove is-loading from a featured div once its media asset has loaded
function attachFeaturedLoadListener(featured) {
    const media = featured.querySelector('img, video, iframe');
    if (!media) { featured.classList.remove('is-loading'); return; }
    const done = () => featured.classList.remove('is-loading');
    if (media.tagName === 'IMG') {
        media.complete && media.naturalWidth > 0 ? done() : media.addEventListener('load', done, { once: true });
    } else if (media.tagName === 'VIDEO') {
        media.readyState >= 2 ? done() : media.addEventListener('loadeddata', done, { once: true });
    } else {
        media.addEventListener('load', done, { once: true });
    }
}

// Re-sort all rendered showcases and swap featured to the new first thumb
function reorderShowcases(theme) {
    document.querySelectorAll('.ed-expander__showcase').forEach(showcase => {
        const thumbsEl = showcase.querySelector('.ed-expander__thumbs');
        const featured = showcase.querySelector('.ed-expander__featured');
        if (!thumbsEl || !featured) return;

        const thumbs = [...thumbsEl.querySelectorAll('.ed-expander__thumb')];
        if (thumbs.length <= 1) return;

        const key = theme === 'light' ? /Light_Mode/i : /Dark_Mode/i;
        const sorted = [
            ...thumbs.filter(t => key.test(t.dataset.src)),
            ...thumbs.filter(t => !key.test(t.dataset.src))
        ];

        sorted.forEach(t => {
            t.classList.remove('is-active');
            thumbsEl.appendChild(t);
        });
        sorted[0].classList.add('is-active');

        const src = sorted[0].dataset.src;
        const isVideo = sorted[0].dataset.isVideo === 'true';
        const isIframe = sorted[0].dataset.isIframe === 'true';
        // Don't reload iframes when theme changes (they don't depend on our theme)
        if (!isIframe) {
            populateFeaturedMedia(featured, src, isVideo, isIframe);
        }
    });
}

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

                    const assetIdx = lines.findIndex(l => l.startsWith('#### assets'));
                    const infoIdx = lines.findIndex(l => l.startsWith('#### Info'));
                    const detailsIdx = lines.findIndex(l => l.startsWith('#### Details'));

                    // Extract Info section (shown when collapsed)
                    let infoLines = [];
                    if (infoIdx >= 0) {
                        const endIdx = Math.min(
                            ...[detailsIdx, assetIdx, lines.length]
                                .filter(i => i > infoIdx && i >= 0)
                        );
                        infoLines = lines.slice(infoIdx + 1, endIdx)
                            .filter(l => l.startsWith('- '))
                            .map(l => l.slice(2).trim());
                    }

                    // Extract Details section (shown when expanded)
                    let detailsLines = [];
                    if (detailsIdx >= 0) {
                        const endIdx = Math.min(
                            ...[assetIdx, lines.length]
                                .filter(i => i > detailsIdx && i >= 0)
                        );
                        detailsLines = lines.slice(detailsIdx + 1, endIdx)
                            .filter(l => l.startsWith('- '))
                            .map(l => l.slice(2).trim());
                    }

                    // Description and tech: use Info if available, else fallback to first bullets
                    let descRaw = '';
                    let techSnippet = '';
                    if (infoLines.length > 0) {
                        descRaw = infoLines[0];
                        techSnippet = infoLines.slice(1).join(' // ').replace(/`/g, '');
                    } else {
                        // Fallback: collect bullets before #### assets (old format)
                        const descriptionLines = (assetIdx >= 0 ? lines.slice(0, assetIdx) : lines)
                            .filter(l => l.startsWith('- '))
                            .map(l => l.slice(2).trim());
                        descRaw = descriptionLines.length > 0 ? descriptionLines[0] : '';
                        techSnippet = descriptionLines.slice(1).join(' // ').replace(/`/g, '');
                    }

                    const desc = renderMd(descRaw);

                    // Extract media paths from #### assets subsection
                    const mediaRaw = assetIdx >= 0
                        ? lines.slice(assetIdx + 1)
                            .filter(l => l.startsWith('- '))
                            .map(l => l.slice(2).trim())
                        : [];

                    // Transform GitHub blob URLs to raw URLs so they render in <img> tags
                    const media = mediaRaw.map(url => {
                        if (url.includes('github.com') && url.includes('/blob/')) {
                            return url
                                .replace('github.com', 'raw.githubusercontent.com')
                                .replace('/blob/', '/');
                        }
                        return url;
                    });

                    currentGroup.projects.push({ name, url, tags, year, desc, techSnippet, media, details: detailsLines });
                }
            }
        });
        if (currentGroup) projectGroups.push(currentGroup);

        // ── Helper: Expand Project In-Place ──
        const githubIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`;
        const externalIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 01 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;

        const htmlSections = projectGroups.map((group, groupIdx) => {
            const rowClass = group.projects.length <= 2 ? `ed-row--${group.projects.length}` : '';
            const cards = group.projects.map((p, idx) => {
                const icon = p.url.includes('github.com') ? githubIcon : externalIcon;

                const hasMedia = p.media.length > 0;
                const isSingle = p.media.length === 1;
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
                const sortedMedia = sortMediaForTheme(p.media, currentTheme);

                // Build thumbnail strip HTML with lazy-loaded assets
                const showcaseHtml = hasMedia ? (() => {
                    const iframePlaceholder = `<div class="ed-thumb-iframe-placeholder"><svg viewBox="0 0 24 24" width="24" height="24"><rect x="2" y="3" width="20" height="14" fill="none" stroke="currentColor" stroke-width="1.5" rx="1"/><line x1="2" y1="17" x2="22" y2="17" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg><span>PREVIEW</span></div>`;
                    const emptyPlaceholder = `<div class="ed-asset-placeholder"></div>`;

                    // Thumbnails: always show placeholders (will be populated on expand)
                    const thumbsHtml = sortedMedia.map((m, i) => {
                        const isIframe = m.startsWith('<iframe');
                        const isVideo = !isIframe && (m.endsWith('.mp4') || m.endsWith('.webm'));
                        const thumbContent = isIframe ? iframePlaceholder : emptyPlaceholder;
                        const dataSrc = isIframe ? encodeURIComponent(m) : m;
                        return `<div class="ed-expander__thumb${i === 0 ? ' is-active' : ''}" data-src="${dataSrc}" data-is-video="${isVideo}" data-is-iframe="${isIframe}">${thumbContent}</div>`;
                    }).join('');

                    // Featured: empty initially, will be populated on expand
                    return `
                    <div class="ed-card__expander" data-media='${JSON.stringify(sortedMedia)}'>
                        <div class="ed-expander__showcase${isSingle ? ' single-asset' : ''}">
                            <div class="ed-expander__featured is-loading">${emptyPlaceholder}</div>
                            <div class="ed-expander__thumbs">${thumbsHtml}</div>
                        </div>
                    </div>`;
                })() : '';

                return `
                <div class="ed-card${hasMedia ? ' has-media' : ''}" data-project-idx="${idx}" data-group-idx="${groupIdx}">
                    <svg class="ed-card__svg" preserveAspectRatio="none">
                        <rect class="ed-card__rect" pathLength="1"></rect>
                    </svg>
                    <div class="ed-card__main">
                        <div class="ed-card__top">
                            <a href="${p.url}" class="ed-card__link" target="_blank" rel="noopener" title="Open Project" onclick="event.stopPropagation()">
                                ${icon}
                            </a>
                            <div class="ed-card__name">${p.name}</div>
                            <div class="ed-card__desc">
                                <div class="ed-card__desc__info">${p.desc}</div>
                                ${p.details && p.details.length > 0 ? `<div class="ed-card__desc__details"><ul>${p.details.map(d => `<li>${renderMd(d)}</li>`).join('')}</ul></div>` : ''}
                            </div>
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
                    </div>
                    ${showcaseHtml}
                </div>`;
            }).join('');

            const [mainTitle, subTitle] = group.title.split(' - ');
            return `
            <div class="ed-section">
                <div class="ed-section__header">
                    <div class="ed-section__title">${mainTitle.trim()}${subTitle ? `<span class="ed-section__subtitle">${subTitle.trim()}</span>` : ''}</div>
                </div>
                <div class="ed-row ${rowClass}">
                    ${cards}
                </div>
            </div>`;
        });

        const grid = document.getElementById('projects-grid');
        if (grid) {
            grid.innerHTML = htmlSections.join('');

            const collapseCard = (card) => {
                card.classList.remove('is-expanded');
                card.querySelectorAll('video').forEach(v => v.pause());

                // Scroll back to the parent section header, respecting nav offset
                const sectionHeader = card.closest('.ed-section')?.querySelector('.ed-section__header');
                if (sectionHeader) {
                    const navHeight = document.getElementById('nav')?.offsetHeight || 64;
                    const top = sectionHeader.getBoundingClientRect().top + window.scrollY - navHeight - 16;
                    setTimeout(() => window.scrollTo({ top, behavior: 'smooth' }), 50);
                }
            };

            grid.querySelectorAll('.ed-card.has-media').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('a')) return;

                    // Featured image click: open lightbox modal
                    if (e.target.closest('.ed-expander__featured')) {
                        const featured = e.target.closest('.ed-expander__featured');
                        const media = featured.querySelector('img, video');
                        if (media) {
                            const isVideo = media.tagName === 'VIDEO';
                            mediaModal.open(media.src, isVideo);
                        }
                        return;
                    }

                    // Thumbnail click: swap featured image, don't toggle card
                    const thumb = e.target.closest('.ed-expander__thumb');
                    if (thumb) {
                        const showcase = thumb.closest('.ed-expander__showcase');
                        const featured = showcase?.querySelector('.ed-expander__featured');
                        if (!featured) return;

                        const src = thumb.dataset.src;
                        const isVideo = thumb.dataset.isVideo === 'true';
                        const isIframe = thumb.dataset.isIframe === 'true';
                        populateFeaturedMedia(featured, src, isVideo, isIframe);

                        showcase.querySelectorAll('.ed-expander__thumb').forEach(t => t.classList.remove('is-active'));
                        thumb.classList.add('is-active');
                        return;
                    }

                    const isExpanded = card.classList.contains('is-expanded');

                    // Collapse any other expanded card
                    grid.querySelectorAll('.ed-card.is-expanded').forEach(other => {
                        if (other !== card) collapseCard(other);
                    });

                    if (isExpanded) {
                        collapseCard(card);
                    } else {
                        card.classList.add('is-expanded');
                        // Lazy-load featured & thumbnail media on expand
                        const expander = card.querySelector('.ed-card__expander');
                        const featured = expander?.querySelector('.ed-expander__featured');
                        if (expander && featured) {
                            const mediaStr = expander.dataset.media;
                            if (mediaStr && !featured.querySelector('img, video, iframe')) {
                                const sortedMedia = JSON.parse(mediaStr);
                                const first = sortedMedia[0];
                                const isFirstIframe = first.startsWith('<iframe');
                                const isFirstVideo = !isFirstIframe && (first.endsWith('.mp4') || first.endsWith('.webm'));
                                populateFeaturedMedia(featured, first, isFirstVideo, isFirstIframe);
                            }
                            // Also populate thumbnail images on expand
                            expander.querySelectorAll('.ed-expander__thumb').forEach((thumb, i) => {
                                const thumbImg = thumb.querySelector('img, video');
                                if (!thumbImg) {
                                    const src = thumb.dataset.src;
                                    const isVideo = thumb.dataset.isVideo === 'true';
                                    const isIframe = thumb.dataset.isIframe === 'true';
                                    const html = isIframe
                                        ? `<div class="ed-thumb-iframe-placeholder"><svg viewBox="0 0 24 24" width="24" height="24"><rect x="2" y="3" width="20" height="14" fill="none" stroke="currentColor" stroke-width="1.5" rx="1"/><line x1="2" y1="17" x2="22" y2="17" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg><span>PREVIEW</span></div>`
                                        : isVideo
                                            ? `<video src="${src}" muted playsinline></video>`
                                            : `<img src="${src}" alt="thumbnail ${i + 1}" loading="lazy">`;
                                    thumb.innerHTML = html;
                                }
                            });
                        }
                        card.querySelectorAll('.ed-expander__featured video').forEach(v => v.play().catch(() => { }));
                        setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
                    }
                });
            });

            // Click outside any card collapses the expanded one
            document.addEventListener('click', (e) => {
                // Ignore if clicking a card or the nav (contains theme toggle)
                if (e.target.closest('.ed-card') || e.target.closest('.nav')) return;

                grid.querySelectorAll('.ed-card.is-expanded').forEach(card => collapseCard(card));
            });

        }
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

    // Tap/click anywhere on about section toggles lock & animation
    aboutSection.addEventListener('click', function (e) {
        // If clicking a link, don't toggle
        if (e.target.closest('a')) return;

        locked = !locked;
        wrapper.style.cursor = locked ? 'default' : 'pointer';

        const animatedEls = [
            wrapper.querySelector('.about__photo-border'),
            wrapper.querySelector('.about__photo-inner'),
            wrapper.querySelector('.about__photo')
        ].filter(Boolean);

        if (locked) {
            resetBorder();

            // 1. Capture current computed rotation matrix as inline style
            animatedEls.forEach(el => {
                const style = window.getComputedStyle(el);
                el.style.transform = style.transform;
            });

            // 2. Enable transition class
            wrapper.classList.add('is-resetting');

            // 3. Glide back to zero in next frame
            requestAnimationFrame(() => {
                animatedEls.forEach(el => {
                    el.style.transform = 'rotate(0deg)';
                });
            });

            // 4. Once transition finishes, switch to absolute static state
            setTimeout(() => {
                if (locked) {
                    wrapper.classList.remove('is-resetting');
                    wrapper.classList.add('is-reset');
                    animatedEls.forEach(el => el.style.transform = '');
                }
            }, 850); // Slightly past 800ms transition
        } else {
            wrapper.classList.remove('is-reset', 'is-resetting');
            animatedEls.forEach(el => el.style.transform = '');
        }
    });

    // Hint that the photo area is tappable
    wrapper.style.cursor = 'pointer';
})();

