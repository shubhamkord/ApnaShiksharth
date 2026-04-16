/**
 * ================================================================
 * APNA SHIKSHARTH — MAIN JAVASCRIPT
 * Handles: Preloader, Dark Mode, Navbar, Mobile Menu,
 *          Smooth Scroll, Scroll Reveal, Animated Counters,
 *          Course Filter, Testimonials Slider, Pricing Toggle,
 *          Form Validation, Back-to-Top, Micro-interactions
 * ================================================================
 */

'use strict';

/* ================================================================
   UTILITY HELPERS
================================================================ */

/**
 * Shorthand for querySelector
 * @param {string} selector
 * @param {Element|Document} [scope=document]
 */
const $ = (selector, scope = document) => scope.querySelector(selector);

/**
 * Shorthand for querySelectorAll
 * @param {string} selector
 * @param {Element|Document} [scope=document]
 */
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/**
 * Debounce — delays execution until after wait ms have elapsed
 * since the last invocation.
 */
function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Easing function for animated counters
 */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

/* ================================================================
   1. PRELOADER
================================================================ */
(function initPreloader() {
  const preloader = $('#preloader');
  if (!preloader) return;

  // Hide preloader after page load (with a small buffer for polish)
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('hidden');
      document.body.style.overflow = ''; // re-enable scroll
    }, 400);
  });

  // Safety net: always hide after 3 seconds max
  setTimeout(() => {
    preloader.classList.add('hidden');
    document.body.style.overflow = '';
  }, 3000);

  // Prevent body scroll while preloader shows
  document.body.style.overflow = 'hidden';
})();

/* ================================================================
   2. DARK MODE TOGGLE
================================================================ */
(function initDarkMode() {
  const toggle  = $('#dark-mode-toggle');
  const icon    = $('#theme-icon');
  const htmlEl  = document.documentElement;

  if (!toggle) return;

  // Load saved preference (or system preference)
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = saved || (prefersDark ? 'dark' : 'light');

  applyTheme(initialTheme);

  toggle.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (icon) {
      if (theme === 'dark') {
        icon.classList.replace('fa-moon', 'fa-sun');
      } else {
        icon.classList.replace('fa-sun', 'fa-moon');
      }
    }
  }
})();

/* ================================================================
   3. STICKY NAVBAR — scroll behaviour
================================================================ */
(function initNavbar() {
  const navbar = $('#navbar');
  if (!navbar) return;

  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    // Add shadow class when scrolled
    navbar.classList.toggle('scrolled', scrollY > 40);

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', debounce(onScroll, 10), { passive: true });
  onScroll(); // run once on init
})();

/* ================================================================
   4. ACTIVE NAV LINK (scroll-spy)
================================================================ */
(function initScrollSpy() {
  const links    = $$('.nav-link');
  const sections = $$('section[id]');

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach((link) => {
            const isActive = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isActive);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
})();

/* ================================================================
   5. MOBILE HAMBURGER MENU
================================================================ */
(function initMobileMenu() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  const mobileLinks = $$('.mobile-link');

  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close on link click
  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on mobile CTA click
  const mobileCta = $('.mobile-cta', mobileMenu);
  if (mobileCta) mobileCta.addEventListener('click', closeMenu);

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();

/* ================================================================
   6. SMOOTH SCROLLING (for all anchor links)
================================================================ */
(function initSmoothScroll() {
  const navbar = $('#navbar');
  const navbarH = navbar ? navbar.offsetHeight : 72;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    const offset = target.getBoundingClientRect().top + window.scrollY - navbarH - 12;

    window.scrollTo({ top: offset, behavior: 'smooth' });
  });
})();

/* ================================================================
   7. SCROLL REVEAL ANIMATION
================================================================ */
(function initScrollReveal() {
  const revealEls = $$('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

/* ================================================================
   8. ANIMATED COUNTERS
================================================================ */
(function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  let started = false;

  function startCounting() {
    if (started) return;
    started = true;

    counters.forEach((counter) => {
      const target  = parseInt(counter.dataset.target, 10);
      const suffix  = counter.dataset.suffix || '';
      const duration = 2000; // ms
      const start    = performance.now();

      function step(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = easeOutQuart(progress);
        const current  = Math.round(eased * target);

        // Format large numbers with commas
        counter.textContent = current.toLocaleString('en-IN') + suffix;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          counter.textContent = target.toLocaleString('en-IN') + suffix;
        }
      }

      requestAnimationFrame(step);
    });
  }

  // Trigger when stats section enters viewport
  const statsSection = $('#stats');
  if (!statsSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        startCounting();
        observer.disconnect();
      }
    },
    { threshold: 0.3 }
  );

  observer.observe(statsSection);
})();

/* ================================================================
   9. COURSE FILTER TABS
================================================================ */
(function initCourseFilter() {
  const filterBtns = $$('.filter-btn');
  const courseCards = $$('.course-card');

  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.dataset.filter;

      // Show/hide cards with fade
      courseCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;

        if (match) {
          card.classList.remove('hidden');
          // Trigger reflow for animation
          void card.offsetWidth;
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.classList.add('hidden');
          card.style.opacity   = '';
          card.style.transform = '';
          card.style.transition = '';
        }
      });
    });
  });
})();

/* ================================================================
   10. TESTIMONIALS SLIDER / CAROUSEL
================================================================ */
(function initTestimonialsSlider() {
  const track    = $('#testimonials-track');
  const prevBtn  = $('#slider-prev');
  const nextBtn  = $('#slider-next');
  const dotsWrap = $('#slider-dots');

  if (!track) return;

  const cards       = $$('.testimonial-card', track);
  const totalCards  = cards.length;

  if (totalCards === 0) return;

  let currentIndex   = 0;
  let autoPlayTimer  = null;
  let visibleCount   = getVisibleCount();

  // Create dots
  const maxIndex = totalCards - visibleCount;

  for (let i = 0; i <= maxIndex; i++) {
    const dot = document.createElement('button');
    dot.classList.add('dot');
    dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
    dot.setAttribute('role', 'listitem');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  function getVisibleCount() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function goTo(index) {
    visibleCount  = getVisibleCount();
    const maxIdx  = Math.max(0, totalCards - visibleCount);
    currentIndex  = Math.max(0, Math.min(index, maxIdx));

    // Calculate card width + gap
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap       = 28; // matches CSS gap
    const offset    = currentIndex * (cardWidth + gap);

    track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    $$('.dot', dotsWrap).forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  function next() {
    visibleCount = getVisibleCount();
    const max    = Math.max(0, totalCards - visibleCount);
    goTo(currentIndex >= max ? 0 : currentIndex + 1);
  }

  function prev() {
    visibleCount = getVisibleCount();
    const max    = Math.max(0, totalCards - visibleCount);
    goTo(currentIndex <= 0 ? max : currentIndex - 1);
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAutoPlay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAutoPlay(); });

  // Auto-play
  function startAutoPlay() {
    autoPlayTimer = setInterval(next, 5000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  }

  startAutoPlay();

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoPlayTimer));
  track.addEventListener('mouseleave', startAutoPlay);

  // Touch / swipe support
  let touchStartX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
      resetAutoPlay();
    }
  }, { passive: true });

  // Keyboard navigation
  track.parentElement.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { next(); resetAutoPlay(); }
    if (e.key === 'ArrowLeft')  { prev(); resetAutoPlay(); }
  });

  // Recalculate on resize
  window.addEventListener('resize', debounce(() => {
    goTo(currentIndex);
  }, 200));
})();

/* ================================================================
   11. PRICING BILLING TOGGLE (Monthly / Annual)
================================================================ */
(function initPricingToggle() {
  const toggle      = $('#billing-toggle');
  const amounts     = $$('.price-amount[data-monthly]');

  if (!toggle) return;

  toggle.addEventListener('change', () => {
    const isAnnual = toggle.checked;

    amounts.forEach((el) => {
      const monthly = parseFloat(el.dataset.monthly);
      const annual  = parseFloat(el.dataset.annual);

      if (isNaN(monthly)) return; // skip custom price

      const target = isAnnual ? annual : monthly;

      // Animate the number change
      animateValue(el, parseFloat(el.textContent.replace(/,/g, '')) || 0, target, 400);
    });
  });

  function animateValue(el, from, to, duration) {
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value    = Math.round(from + (to - from) * easeOutQuart(progress));

      el.textContent = value.toLocaleString('en-IN');

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }
})();

/* ================================================================
   12. CONTACT FORM VALIDATION
================================================================ */
(function initContactForm() {
  const form        = $('#contact-form');
  const submitBtn   = $('#form-submit');
  const successMsg  = $('#form-success');

  if (!form) return;

  const fields = {
    name: {
      el:      $('#contact-name'),
      errorEl: $('#name-error'),
      validate: (v) => v.trim().length >= 2 ? '' : 'Please enter your full name (min 2 characters).',
    },
    email: {
      el:      $('#contact-email'),
      errorEl: $('#email-error'),
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.',
    },
    message: {
      el:      $('#contact-message'),
      errorEl: $('#message-error'),
      validate: (v) => v.trim().length >= 10 ? '' : 'Please enter a message (min 10 characters).',
    },
  };

  /**
   * Show or clear field error
   */
  function showError(field, message) {
    const { el, errorEl } = field;
    errorEl.textContent = message;

    if (message) {
      el.classList.add('error');
      el.setAttribute('aria-invalid', 'true');
      errorEl.classList.add('visible');
    } else {
      el.classList.remove('error');
      el.removeAttribute('aria-invalid');
      errorEl.classList.remove('visible');
    }
  }

  /**
   * Validate a single field
   */
  function validateField(fieldKey) {
    const field = fields[fieldKey];
    const error = field.validate(field.el.value);
    showError(field, error);
    return !error;
  }

  /**
   * Live validation on blur
   */
  Object.keys(fields).forEach((key) => {
    const { el } = fields[key];

    el.addEventListener('blur', () => validateField(key));

    el.addEventListener('input', debounce(() => {
      if (el.classList.contains('error')) validateField(key);
    }, 300));
  });

  /**
   * Form submit handler
   */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all fields
    const allValid = Object.keys(fields).every((key) => validateField(key));

    if (!allValid) {
      // Focus first invalid field
      const firstInvalid = Object.values(fields).find((f) =>
        f.el.classList.contains('error')
      );
      if (firstInvalid) firstInvalid.el.focus();
      return;
    }

    // Simulate form submission
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;

      // Show success message
      form.style.display = 'none';
      if (successMsg) {
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1800);
  });
})();

/* ================================================================
   13. BACK TO TOP BUTTON
================================================================ */
(function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  function toggle() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }

  window.addEventListener('scroll', debounce(toggle, 100), { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ================================================================
   14. NEWSLETTER FORM (Footer)
================================================================ */
(function initNewsletter() {
  const form = $('#newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.value.trim()) return;

    const btn = form.querySelector('button');
    const originalIcon = btn.innerHTML;

    // Visual feedback
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.style.background = '#10B981';
    input.value = '';
    input.placeholder = 'You\'re subscribed! 🎉';

    setTimeout(() => {
      btn.innerHTML = originalIcon;
      btn.style.background = '';
      input.placeholder = 'your@email.com';
    }, 3000);
  });
})();

/* ================================================================
   15. NAVBAR HEIGHT UPDATE ON RESIZE
================================================================ */
(function updateNavbarHeight() {
  const navbar = $('#navbar');
  if (!navbar) return;

  function update() {
    document.documentElement.style.setProperty(
      '--navbar-height', `${navbar.offsetHeight}px`
    );
  }

  window.addEventListener('resize', debounce(update, 200));
  update();
})();

/* ================================================================
   16. CARD HOVER MICRO-INTERACTIONS
         Add ripple effect to CTA buttons on click
================================================================ */
(function initRippleEffect() {
  function createRipple(e) {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius   = diameter / 2;
    const rect     = btn.getBoundingClientRect();

    circle.style.cssText = `
      position: absolute;
      width: ${diameter}px;
      height: ${diameter}px;
      left: ${e.clientX - rect.left - radius}px;
      top: ${e.clientY - rect.top - radius}px;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 600ms linear;
      pointer-events: none;
    `;

    // Add ripple keyframe if not already present
    if (!document.querySelector('#ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `
        @keyframes ripple {
          to { transform: scale(3); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove previous ripples
    const existing = btn.querySelector('.ripple-circle');
    if (existing) existing.remove();

    circle.classList.add('ripple-circle');
    btn.appendChild(circle);

    circle.addEventListener('animationend', () => circle.remove());
  }

  $$('.btn-primary').forEach((btn) => {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', createRipple);
  });
})();

/* ================================================================
   17. LAZY IMAGE LOADING ENHANCEMENT
         Adds a fade-in effect when images load
================================================================ */
(function initLazyImages() {
  const images = $$('img[loading="lazy"]');

  images.forEach((img) => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';

    if (img.complete) {
      img.style.opacity = '1';
    } else {
      img.addEventListener('load', () => {
        img.style.opacity = '1';
      });
      img.addEventListener('error', () => {
        // Fallback for broken images
        img.style.opacity = '0.3';
      });
    }
  });
})();

/* ================================================================
   18. FEATURE CARDS — Tilt effect on mouse move
================================================================ */
(function initCardTilt() {
  const cards = $$('.feature-card, .course-card, .oc-card, .pricing-card');

  // Only on non-touch devices
  if ('ontouchstart' in window) return;

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'none';
    });
  });
})();

/* ================================================================
   19. TYPING ANIMATION (optional subtle enhancement on hero)
================================================================ */
(function initTypingHint() {
  // Small animated caret on the hero badge to attract attention
  const badge = $('.hero-badge');
  if (!badge) return;

  let visible = true;
  setInterval(() => {
    badge.style.borderColor = visible
      ? 'rgba(59,130,246,0.4)'
      : 'rgba(59,130,246,0.1)';
    visible = !visible;
  }, 1000);
})();

/* ================================================================
   20. SECTION PROGRESS INDICATOR
         Thin progress bar at the very top of the page
================================================================ */
(function initReadingProgress() {
  const bar = document.createElement('div');
  bar.id = 'reading-progress';
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    width: 0%;
    background: linear-gradient(90deg, #3B82F6, #6366F1, #8B5CF6);
    z-index: 10000;
    transition: width 0.1s linear;
    pointer-events: none;
  `;
  document.body.prepend(bar);

  window.addEventListener('scroll', debounce(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${Math.min(progress, 100)}%`;
  }, 10), { passive: true });
})();

/* ================================================================
   LOG — All modules initialised
================================================================ */
console.log('%c✅ Apna Shiksharth — All UI modules initialised', 'color:#3B82F6;font-weight:700;font-size:13px');
