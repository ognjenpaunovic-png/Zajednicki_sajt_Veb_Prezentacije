// ── HEADER SCROLL ANIMATION ──
		const header = document.getElementById('site-header');
		const lineLeft = document.getElementById('line-left');
		const lineRight = document.getElementById('line-right');
		const svgEl = document.getElementById('header-svg');
		const svgLeft = document.getElementById('svg-left');
		const svgRight = document.getElementById('svg-right');

		const SCROLL_RANGE = 130;

		function remap(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
		function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

		function updateHeader() {
			const raw = Math.min(1, window.scrollY / SCROLL_RANGE);

			// Get real positions of original lines
			const headerRect = header.getBoundingClientRect();
			const leftRect   = lineLeft.getBoundingClientRect();
			const rightRect  = lineRight.getBoundingClientRect();

			// y of original lines relative to header SVG
			const lineY = leftRect.top - headerRect.top + 0.5;

			// Target Y = very bottom of header padding (18px below row)
			const targetY = headerRect.height - 1;

			// Phase 1 (0→0.55): lines drop from lineY to targetY
			const p1 = ease(remap(raw, 0, 0.55));
			const currentY = Math.min(targetY, lineY + (targetY - lineY) * p1);

			// Hide original lines immediately as SVG takes over
			lineLeft.style.opacity  = raw > 0.05 ? 0 : 1;
			lineRight.style.opacity = raw > 0.05 ? 0 : 1;

			if (raw > 0.05) {
				svgEl.style.display = 'block';
				svgEl.setAttribute('height', headerRect.height);

				// SVG left line: starts at left edge of original line-left, ends at its right edge
				// x positions relative to header
				const lx1 = leftRect.left - headerRect.left;
				const lx2 = leftRect.right - headerRect.left;
				const rx1 = rightRect.left - headerRect.left;
				const rx2 = rightRect.right - headerRect.left;

				// Phase 2 (0.45→1): left grows rightward, right grows leftward — they meet in center
				const p2 = ease(remap(raw, 0.45, 1));
				// Left line grows from lx1 toward rx2 (right edge of right line)
				const leftEnd  = lx2 + (rx2 - lx2) * p2;
				// Right line grows from rx2 toward lx1
				const rightStart = rx1 - (rx1 - lx1) * p2;

				const clampedY = Math.min(headerRect.height - 1, currentY);
				// Stroke grows from 1px to 3px as lines drop
				const sw = (1 + p1 * 1.5).toFixed(2);

				svgLeft.setAttribute('x1', lx1);
				svgLeft.setAttribute('y1', clampedY);
				svgLeft.setAttribute('x2', leftEnd);
				svgLeft.setAttribute('y2', clampedY);
				svgLeft.setAttribute('stroke-width', sw);

				svgRight.setAttribute('x1', rightStart);
				svgRight.setAttribute('y1', clampedY);
				svgRight.setAttribute('x2', rx2);
				svgRight.setAttribute('y2', clampedY);
				svgRight.setAttribute('stroke-width', sw);

				svgLeft.style.opacity  = 1;
				svgRight.style.opacity = 1;
			} else {
				svgEl.style.display = 'none';
				lineLeft.style.opacity  = 1;
				lineRight.style.opacity = 1;
			}
		}

		window.addEventListener('scroll', updateHeader, { passive: true });
		window.addEventListener('resize', updateHeader);
		updateHeader();

		const dot = document.getElementById('cursor-dot');

		document.addEventListener('mousemove', (e) => {
			dot.style.left = e.clientX + 'px';
			dot.style.top = e.clientY + 'px';
			spawnTrace(e.clientX, e.clientY);
		});

		// Cursor morphs to rotating square on card hover
		document.querySelectorAll('.projekat').forEach(card => {
			card.addEventListener('mouseenter', () => dot.classList.add('on-card'));
			card.addEventListener('mouseleave', () => dot.classList.remove('on-card'));
		});

		// ── ZAP LINE ANIMATION ──
		const activeCards = new Map();

		document.querySelectorAll('.projekat').forEach(card => {
			const zap = card.querySelector('.zap-line');
			if (!zap) return;

			card.addEventListener('mouseenter', () => {
				activeCards.set(card, { rafId: null });
				animateZap(card, zap);
			});

			card.addEventListener('mouseleave', () => {
				const entry = activeCards.get(card);
				if (entry) {
					cancelAnimationFrame(entry.rafId);
					activeCards.delete(card);
				}
				zap.setAttribute('points', '0,5 100,5');
			});
		});

		function animateZap(card, zap) {
			if (!activeCards.has(card)) return;
			const segs = 6 + Math.floor(Math.random() * 9);
			const pts = ['0,5'];
			const step = 100 / segs;
			for (let i = 1; i < segs; i++) {
				const x = i * step + (Math.random() - 0.5) * step * 0.4;
				const y = 5 + (Math.random() - 0.5) * 7;
				pts.push(x.toFixed(1) + ',' + y.toFixed(1));
			}
			pts.push('100,5');
			zap.setAttribute('points', pts.join(' '));
			const delay = 30 + Math.random() * 60;
			const entry = activeCards.get(card);
			if (entry) entry.rafId = setTimeout(() => animateZap(card, zap), delay);
		}

		let lastSpawn = 0;
		function spawnTrace(x, y) {
			const now = Date.now();
			if (now - lastSpawn < 45) return;
			lastSpawn = now;

			const types = ['dot', 'line-h', 'line-v', 'rect', 'circle'];
			const type = types[Math.floor(Math.random() * types.length)];
			const el = document.createElement('div');
			el.classList.add('cursor-trace');
			const off = () => (Math.random() - 0.5) * 28;

			if (type === 'dot') {
				const s = 2 + Math.random() * 3;
				el.style.cssText = 'width:' + s + 'px;height:' + s + 'px;background:#000;border-radius:50%;left:' + (x+off()) + 'px;top:' + (y+off()) + 'px;';
			} else if (type === 'line-h') {
				const w = 10 + Math.random() * 22;
				el.style.cssText = 'width:' + w + 'px;height:1px;background:#000;left:' + (x+off()) + 'px;top:' + (y+off()) + 'px;';
			} else if (type === 'line-v') {
				const h = 10 + Math.random() * 22;
				el.style.cssText = 'width:1px;height:' + h + 'px;background:#000;left:' + (x+off()) + 'px;top:' + (y+off()) + 'px;';
			} else if (type === 'rect') {
				const w = 7 + Math.random() * 12;
				const h = 5 + Math.random() * 10;
				el.style.cssText = 'width:' + w + 'px;height:' + h + 'px;border:1px solid #000;left:' + (x+off()) + 'px;top:' + (y+off()) + 'px;';
			} else {
				const r = 4 + Math.random() * 9;
				el.style.cssText = 'width:' + (r*2) + 'px;height:' + (r*2) + 'px;border:1px solid #000;border-radius:50%;left:' + (x+off()) + 'px;top:' + (y+off()) + 'px;';
			}

			document.body.appendChild(el);
			setTimeout(() => el.remove(), 700);
		}
// ── MOBILE HEADER HIDE/SHOW ON SCROLL ──
(function() {
	if (window.innerWidth > 600) return;

	let lastY = window.scrollY;
	let ticking = false;

	header.style.transition = 'transform 0.3s cubic-bezier(0.4,0,0.2,1)';

	function handleMobileScroll() {
		const currentY = window.scrollY;
		const delta = currentY - lastY;

		if (delta > 4) {
			// Skrolujes dole — sakrij header
			header.style.transform = 'translateY(-100%)';
		} else if (delta < -4) {
			// Skrolujes gore — pokazi header
			header.style.transform = 'translateY(0)';
		}

		lastY = currentY;
		ticking = false;
	}

	window.addEventListener('scroll', () => {
		if (!ticking) {
			requestAnimationFrame(handleMobileScroll);
			ticking = true;
		}
	}, { passive: true });

	window.addEventListener('resize', () => {
		if (window.innerWidth > 600) {
			header.style.transform = '';
			header.style.transition = '';
		}
	});
})();
