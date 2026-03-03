(function () {
    'use strict';

    /* ── Early exits ── */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var heroSection = document.getElementById('hero');
    if (!heroSection) return;
    heroSection.classList.add('hero--animated');

    /* ── Shared constants ── */
    var GLYPHS = '01+-*/.:#@|\\^~%$!?<>[]{}()'.split('');
    var PIXEL_FONTS = [
        "'GeistPixel-Square'",
        "'GeistPixel-Grid'",
        "'GeistPixel-Circle'",
        "'GeistPixel-Triangle'",
        "'GeistPixel-Line'"
    ];

    /* ── Theme color helper ── */
    function getPixelColor() {
        var theme = document.documentElement.getAttribute('data-theme');
        return theme === 'light' ? '45,45,45' : '237,237,237';
    }
    var colorBase = getPixelColor();

    var themeObs = new MutationObserver(function () { colorBase = getPixelColor(); });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* ── Hero visibility (pause/resume) ── */
    var isHeroVisible = window.__heroInView !== undefined ? window.__heroInView : true;
    document.addEventListener('hero-visibility', function (e) {
        isHeroVisible = e.detail.visible;
    });

    /* ── Canvas setup ── */
    var canvas = document.getElementById('heroCanvas');
    var ctx = canvas ? canvas.getContext('2d') : null;
    if (!canvas || !ctx) return;

    function resizeCanvas() {
        var dpr = window.devicePixelRatio || 1;
        var rect = heroSection.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { w: rect.width, h: rect.height };
    }

    /* ════════════════════════════════════════════════════
       PHASE 1: SCRAMBLE — Geist Pixel text scramble
       ════════════════════════════════════════════════════ */
    var cells = [];
    var gridW = 0, gridH = 0, cellSize = 8;
    var startTime = 0;
    var scrambleAnimating = false;
    var heroNameEl = document.getElementById('heroName');

    // Timing (ms)
    var SCRAMBLE_END = 1500;
    var RESOLVE_START = 1500;
    var RESOLVE_END = 4000;
    var DISSOLVE_DURATION = 1200;

    function getCellSize() {
        var w = window.innerWidth;
        if (w <= 480) return 6;
        if (w <= 768) return 7;
        return 8;
    }

    function buildGrid() {
        var dims = resizeCanvas();
        if (!dims) return;
        cellSize = getCellSize();
        gridW = Math.floor(dims.w / cellSize);
        gridH = Math.floor(dims.h / cellSize);

        // Cap cell count
        if (gridW * gridH > 12000) {
            cellSize = Math.ceil(Math.sqrt(dims.w * dims.h / 12000));
            gridW = Math.floor(dims.w / cellSize);
            gridH = Math.floor(dims.h / cellSize);
        }

        // Get hero name position and font size from actual DOM element
        var computedSize = heroNameEl ? parseFloat(getComputedStyle(heroNameEl).fontSize) : 100;
        var fontFamily = "'Forum', serif";
        var letterSpacing = heroNameEl ? parseFloat(getComputedStyle(heroNameEl).letterSpacing) || 0 : -3;

        // Get actual position of hero name relative to hero section
        var heroRect = heroSection.getBoundingClientRect();
        var nameRect = heroNameEl ? heroNameEl.getBoundingClientRect() : null;
        var textCenterX = nameRect ? (nameRect.left - heroRect.left + nameRect.width / 2) : dims.w / 2;
        var textCenterY = nameRect ? (nameRect.top - heroRect.top + nameRect.height / 2) : dims.h / 2;
        // Correct for canvas textBaseline:'middle' vs CSS box centering
        textCenterY += computedSize * 0.04;

        // Draw text on offscreen canvas to get pixel mask
        var offCanvas = document.createElement('canvas');
        offCanvas.width = dims.w;
        offCanvas.height = dims.h;
        var offCtx = offCanvas.getContext('2d');
        offCtx.fillStyle = '#000';
        offCtx.font = '700 ' + computedSize + 'px ' + fontFamily;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        if (offCtx.letterSpacing !== undefined) {
            offCtx.letterSpacing = letterSpacing + 'px';
        }
        offCtx.fillText('Saumil Shah', textCenterX, textCenterY);

        var imgW = Math.floor(dims.w);
        var imgH = Math.floor(dims.h);
        var imageData = offCtx.getImageData(0, 0, imgW, imgH);
        var pixels = imageData.data;

        // Multi-point sampling helper
        function sampleCell(cx, cy) {
            var half = Math.floor(cellSize / 2);
            var offsets = [[0, 0], [-half, 0], [half, 0], [0, -half], [0, half]];
            for (var k = 0; k < offsets.length; k++) {
                var sx = cx + offsets[k][0];
                var sy = cy + offsets[k][1];
                if (sx >= 0 && sx < imgW && sy >= 0 && sy < imgH) {
                    var idx = (sy * imgW + sx) * 4;
                    if (pixels[idx + 3] > 80) return true;
                }
            }
            return false;
        }

        cells = [];
        for (var row = 0; row < gridH; row++) {
            for (var col = 0; col < gridW; col++) {
                var cx = Math.floor(col * cellSize + cellSize / 2);
                var cy = Math.floor(row * cellSize + cellSize / 2);

                var isText = sampleCell(cx, cy);

                var resolveDelay = RESOLVE_START + (row / gridH) * (RESOLVE_END - RESOLVE_START)
                    + (Math.random() - 0.5) * 400;

                // Include ~12% of non-text cells for scramble effect
                if (!isText && Math.random() > 0.12) continue;

                cells.push({
                    x: cx,
                    y: cy,
                    isText: isText,
                    currentChar: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
                    resolved: false,
                    resolveTime: resolveDelay,
                    resolvedAt: 0,
                    lastSwap: 0,
                    pixelFont: PIXEL_FONTS[Math.floor(Math.random() * PIXEL_FONTS.length)]
                });
            }
        }

        // Adjust timing for mobile
        if (window.innerWidth <= 480) {
            SCRAMBLE_END = 1000;
            RESOLVE_START = 1000;
            RESOLVE_END = 2500;
            cells.forEach(function (c) {
                c.resolveTime = RESOLVE_START + (c.y / dims.h) * (RESOLVE_END - RESOLVE_START)
                    + (Math.random() - 0.5) * 300;
            });
        }
    }

    function renderScramble() {
        if (!isHeroVisible) {
            scrambleAnimating = false;
            return;
        }
        scrambleAnimating = true;

        var now = performance.now();
        if (!startTime) startTime = now;
        var elapsed = now - startTime;

        var dims = { w: canvas.width / (window.devicePixelRatio || 1), h: canvas.height / (window.devicePixelRatio || 1) };
        ctx.clearRect(0, 0, dims.w, dims.h);

        var largeFont = 14;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        var isLight = document.documentElement.getAttribute('data-theme') === 'light';
        var alphaBoost = isLight ? 1.6 : 1.0;

        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];

            if (elapsed < SCRAMBLE_END || (!cell.resolved && elapsed < cell.resolveTime)) {
                if (now - cell.lastSwap > 60 + Math.random() * 40) {
                    cell.currentChar = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                    cell.lastSwap = now;
                }
                var flickerAlpha = (cell.isText
                    ? 0.3 + Math.sin(now * 0.005 + i) * 0.2
                    : 0.08 + Math.sin(now * 0.003 + i * 0.5) * 0.06) * alphaBoost;
                ctx.font = largeFont + 'px ' + cell.pixelFont + ', monospace';
                ctx.fillStyle = 'rgba(' + colorBase + ',' + flickerAlpha.toFixed(3) + ')';
                ctx.fillText(cell.currentChar, cell.x, cell.y);

            } else {
                if (!cell.resolved) {
                    cell.resolved = true;
                    cell.resolvedAt = now;
                }
                var dissolveProg = Math.min((now - cell.resolvedAt) / DISSOLVE_DURATION, 1);
                if (dissolveProg < 1) {
                    var fadeAlpha = (1 - dissolveProg) * (cell.isText ? 0.5 : 0.1) * alphaBoost;
                    if (fadeAlpha > 0.003) {
                        ctx.font = largeFont + 'px ' + cell.pixelFont + ', monospace';
                        ctx.fillStyle = 'rgba(' + colorBase + ',' + fadeAlpha.toFixed(3) + ')';
                        ctx.fillText(cell.currentChar, cell.x, cell.y);
                    }
                }
            }
        }

        // Fade in hero text during resolve window
        if (heroNameEl && elapsed >= RESOLVE_START) {
            var textProg = Math.min((elapsed - RESOLVE_START) / (RESOLVE_END - RESOLVE_START), 1);
            heroNameEl.style.visibility = 'visible';
            heroNameEl.style.opacity = textProg.toFixed(3);
        }

        // Trigger Outro as soon as Name is fully solid (Desktop: 4s, Mobile: 2.5s)
        var stage1Complete = elapsed >= (window.innerWidth <= 480 ? 2500 : RESOLVE_END);

        if (stage1Complete) {
            // Scramble complete — outro: top-to-bottom clip-path exit
            scrambleAnimating = false;
            heroSection.classList.add('hero--anim-done');
            document.dispatchEvent(new CustomEvent('hero-animation-done'));

            canvas.style.transition = 'clip-path 0.8s ease-in, opacity 0.6s ease';
            canvas.offsetHeight; // force reflow
            canvas.style.clipPath = 'inset(100% 0 0 0)';
            canvas.style.opacity = '0';

            setTimeout(function () {
                canvas.style.display = 'none';
                canvas.style.clipPath = '';
                canvas.style.opacity = '';
                canvas.style.transition = '';
                startCodeVapors();
            }, 850);
            return;
        }

        requestAnimationFrame(renderScramble);
    }

    /* ════════════════════════════════════════════════════
       PHASE 2: CODE VAPORS — Ambient background particles
       ════════════════════════════════════════════════════ */
    var particles = [];
    var vapDims = { w: 0, h: 0 };
    var vaporsAnimating = false;

    // Wind state (cursor influence on vapors)
    var windX = 0, windY = 0;
    var _lastMX = -1, _lastMY = -1;
    var WIND_DECAY = 0.92;

    function getParticleCount() {
        var w = window.innerWidth;
        if (w <= 480) return 40;
        if (w <= 768) return 65;
        return 100;
    }

    function createParticle(canW, canH, offscreen) {
        var x, y;
        if (offscreen) {
            // Always spawn from the bottom
            x = Math.random() * canW;
            y = canH + 10 + Math.random() * 20;
        } else {
            x = Math.random() * canW;
            y = canH * 0.4 + Math.random() * canH * 0.6; // start in lower 60%
        }

        var isShape = Math.random() < 0.3;
        return {
            x: x,
            y: y,
            char: isShape ? null : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
            shape: isShape ? ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] : null,
            size: 10 + Math.random() * 8,
            alpha: 0,
            targetAlpha: 0.04 + Math.random() * 0.10,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.3 - Math.random() * 0.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.005,
            life: 0,
            maxLife: 300 + Math.random() * 400,
            fadeInDuration: 60,
            fadeOutStart: 0,
            pixelFont: PIXEL_FONTS[Math.floor(Math.random() * PIXEL_FONTS.length)]
        };
    }

    function initVaporParticles() {
        var d = resizeCanvas();
        if (!d) return;
        vapDims = d;
        particles = [];
        var count = getParticleCount();
        for (var i = 0; i < count; i++) {
            var p = createParticle(vapDims.w, vapDims.h, false);
            p.life = Math.random() * p.maxLife * 0.5;
            p.fadeOutStart = p.maxLife - 80;
            particles.push(p);
        }
    }

    function drawShape(p, alpha) {
        var halfSize = p.size * 0.4;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = 'rgba(' + colorBase + ',' + alpha.toFixed(3) + ')';

        if (p.shape === 'square') {
            ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
        } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(0, -halfSize);
            ctx.lineTo(halfSize, halfSize);
            ctx.lineTo(-halfSize, halfSize);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    function renderVapors() {
        if (!isHeroVisible) {
            vaporsAnimating = false;
            return;
        }
        vaporsAnimating = true;

        ctx.clearRect(0, 0, vapDims.w, vapDims.h);

        // Decay wind each frame towards zero
        windX *= WIND_DECAY;
        windY *= WIND_DECAY;

        var isLight = document.documentElement.getAttribute('data-theme') === 'light';
        var alphaBoost = isLight ? 1.6 : 1.0;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Update — cursor wind steers particle velocity each frame
            p.life++;
            p.vx += windX * 0.04;
            p.vy += windY * 0.04;
            p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
            p.vy = Math.max(-1.5, Math.min(1.5, p.vy));
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            // Fade envelope
            if (p.life < p.fadeInDuration) {
                p.alpha = (p.life / p.fadeInDuration) * p.targetAlpha;
            } else if (p.life > p.fadeOutStart) {
                var fadeProgress = (p.life - p.fadeOutStart) / (p.maxLife - p.fadeOutStart);
                p.alpha = p.targetAlpha * (1 - fadeProgress);
            } else {
                p.alpha = p.targetAlpha;
            }

            // Recycle dead particles
            if (p.life >= p.maxLife || p.x < -30 || p.x > vapDims.w + 30 || p.y < -30 || p.y > vapDims.h + 30) {
                particles[i] = createParticle(vapDims.w, vapDims.h, true);
                particles[i].fadeOutStart = particles[i].maxLife - 80;
                continue;
            }

            // Draw
            var displayAlpha = Math.min(p.alpha * alphaBoost, 1);
            if (displayAlpha <= 0.001) continue;

            if (p.shape) {
                drawShape(p, displayAlpha);
            } else {
                ctx.font = p.size + 'px ' + p.pixelFont + ', monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(' + colorBase + ',' + displayAlpha.toFixed(3) + ')';
                ctx.fillText(p.char, p.x, p.y);
            }
        }

        requestAnimationFrame(renderVapors);
    }

    function startCodeVapors() {
        // Soft reveal from bottom to top
        canvas.style.opacity = '0';
        canvas.style.display = 'block';
        canvas.style.clipPath = 'inset(100% 0 0 0)';
        canvas.style.transition = 'clip-path 2.5s ease-out, opacity 2s ease';

        // Trigger reflow to ensure transition starts
        canvas.offsetHeight;
        canvas.style.clipPath = 'inset(0 0 0 0)';
        canvas.style.opacity = '1';

        initVaporParticles();
        requestAnimationFrame(renderVapors);
    }

    /* ── Start Scramble on font load ── */
    document.fonts.ready.then(function () {
        buildGrid();
        startTime = 0;
        // Intro: fade the canvas in before starting the scramble loop
        requestAnimationFrame(function () {
            canvas.style.opacity = '1';
            requestAnimationFrame(renderScramble);
        });
    });

    /* ── Debounced resize ── */
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (vaporsAnimating) {
                initVaporParticles();
            } else {
                startTime = 0;
                buildGrid();
                requestAnimationFrame(renderScramble);
            }
        }, 250);
    });

    /* ── Resume on hero visibility ── */
    document.addEventListener('hero-visibility', function (e) {
        if (e.detail.visible) {
            if (vaporsAnimating === false && heroSection.classList.contains('hero--anim-done')) {
                requestAnimationFrame(renderVapors);
            } else if (!scrambleAnimating) {
                requestAnimationFrame(renderScramble);
            }
        }
    });

    /* ── Tap/click burst for Code Vapors ── */
    var speedMultiplier = 1;
    var resetTimer;

    heroSection.addEventListener('click', function (e) {
        if (!heroSection.classList.contains('hero--anim-done')) return;

        var rect = heroSection.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var clickY = e.clientY - rect.top;

        // Spawn burst particles at click point
        var burstCount = 8 + Math.floor(Math.random() * 8);
        for (var i = 0; i < burstCount; i++) {
            var angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.5;
            var speed = 0.8 + Math.random() * 1.5;
            var isShape = Math.random() < 0.3;
            particles.push({
                x: clickX + (Math.random() - 0.5) * 20,
                y: clickY + (Math.random() - 0.5) * 20,
                char: isShape ? null : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
                shape: isShape ? ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] : null,
                size: 12 + Math.random() * 10,
                alpha: 0,
                targetAlpha: 0.08 + Math.random() * 0.12,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01,
                life: 0,
                maxLife: 150 + Math.random() * 200,
                fadeInDuration: 20,
                fadeOutStart: 0,
                pixelFont: PIXEL_FONTS[Math.floor(Math.random() * PIXEL_FONTS.length)]
            });
        }

        // Increase speed permanently with each tap (cap at 10x)
        speedMultiplier = Math.min(speedMultiplier + 1, 10);

        // Reset after 5s of no taps
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
            speedMultiplier = 1;
            var defaultCount = getParticleCount();
            if (particles.length > defaultCount) {
                particles.length = defaultCount;
            }
        }, 5000);
    });

    // Cursor velocity → wind for Code Vapors
    heroSection.addEventListener('mousemove', function (e) {
        if (!heroSection.classList.contains('hero--anim-done')) return;

        var rect = heroSection.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;

        if (_lastMX >= 0) {
            var dx = mx - _lastMX;
            var dy = my - _lastMY;
            var len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0.5) {
                // Normalize: wind stays in ~[-1,1] regardless of mouse speed
                windX = windX * 0.6 + (dx / Math.max(len, 10)) * 0.4;
                windY = windY * 0.6 + (dy / Math.max(len, 10)) * 0.4;
            }
        }

        _lastMX = mx;
        _lastMY = my;
    });

    heroSection.addEventListener('mouseleave', function () {
        _lastMX = -1;
        _lastMY = -1;
    });

    // Expose speedMultiplier to renderVapors — patch the update loop
    var _origRenderVapors = renderVapors;
    renderVapors = function () {
        // Apply speed multiplier to particle velocities during render
        if (speedMultiplier !== 1) {
            for (var i = 0; i < particles.length; i++) {
                particles[i].x += particles[i].vx * (speedMultiplier - 1);
                particles[i].y += particles[i].vy * (speedMultiplier - 1);
            }
        }
        _origRenderVapors();
    };

})();
