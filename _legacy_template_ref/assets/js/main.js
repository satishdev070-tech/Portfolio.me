/**
 * Ajeet Kumar Mishra — Academic Portfolio
 * 5-Theme Switcher & Bilingual (EN / हिन्दी) Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeManager();
  initLanguageManager();
  initClipboard();
  initPrintCV();
  initMobileNav();
  initActiveSectionHighlight();
  initScrollNavShadow();
  initBackToTop();
});

/* ========================================================
   5-THEME MANAGER
   ======================================================== */
const THEMES = {
  parchment: { name: 'Parchment', color: '#9A3412' },
  obsidian: { name: 'Obsidian', color: '#EA580C' },
  terracotta: { name: 'Terracotta', color: '#B94719' },
  sandstone: { name: 'Sandstone', color: '#A16207' },
  sage: { name: 'Sage', color: '#2D6A4F' }
};

function initThemeManager() {
  const themeBtn = document.getElementById('theme-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const themeLabel = document.getElementById('current-theme-name');
  const themeDot = document.getElementById('theme-dot-active');
  const optionButtons = document.querySelectorAll('[data-set-theme]');

  const storedTheme = localStorage.getItem('portfolio_theme') || 'parchment';
  applyTheme(THEMES[storedTheme] ? storedTheme : 'parchment');

  if (themeBtn && themeDropdown) {
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!themeDropdown.contains(e.target) && e.target !== themeBtn) {
        themeDropdown.classList.remove('show');
      }
    });

    // Touch-friendly theme dropdown (Close on touch outside)
    document.addEventListener('touchstart', (e) => {
      if (!themeDropdown.contains(e.target) && e.target !== themeBtn) {
        themeDropdown.classList.remove('show');
      }
    }, { passive: true });
  }

  optionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const themeKey = btn.getAttribute('data-set-theme');
      if (THEMES[themeKey]) {
        applyTheme(themeKey);
      }
      if (themeDropdown) {
        themeDropdown.classList.remove('show');
      }
    });
  });

  function applyTheme(themeKey) {
    document.documentElement.setAttribute('data-theme', themeKey);
    localStorage.setItem('portfolio_theme', themeKey);

    const themeConfig = THEMES[themeKey];
    if (themeLabel) themeLabel.textContent = themeConfig.name;
    if (themeDot) themeDot.style.backgroundColor = themeConfig.color;

    optionButtons.forEach(btn => {
      const isSelected = btn.getAttribute('data-set-theme') === themeKey;
      btn.classList.toggle('active', isSelected);
      const check = btn.querySelector('.theme-check');
      if (check) {
        check.style.opacity = isSelected ? '1' : '0';
      }
    });
  }
}

/* ========================================================
   BILINGUAL (ENGLISH / हिन्दी) ENGINE
   ======================================================== */
function initLanguageManager() {
  const langToggles = document.querySelectorAll('.lang-toggle-btn');
  const storedLang = localStorage.getItem('portfolio_lang') || 'en';

  setLanguage(storedLang);

  langToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const current = document.documentElement.getAttribute('data-lang') || 'en';
      const next = current === 'en' ? 'hi' : 'en';
      setLanguage(next);
    });
  });

  function setLanguage(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('portfolio_lang', lang);

    // Update elements with data-en and data-hi
    const translatables = document.querySelectorAll('[data-en][data-hi]');
    translatables.forEach(el => {
      const text = lang === 'hi' ? el.getAttribute('data-hi') : el.getAttribute('data-en');
      if (text) {
        el.innerHTML = text;
      }
    });

    // Update toggle button labels
    langToggles.forEach(btn => {
      const label = btn.querySelector('.lang-btn-label');
      if (label) {
        label.textContent = lang === 'en' ? 'हिन्दी' : 'English';
      }
    });
  }
}

/* ========================================================
   CLIPBOARD COPY
   ======================================================== */
function initClipboard() {
  const copyButtons = document.querySelectorAll('[data-copy]');
  const toast = document.getElementById('toast');
  let toastTimer;

  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-copy');
      const lang = document.documentElement.getAttribute('data-lang') || 'en';
      const copyNotice = lang === 'hi' ? `कॉपी किया: ${val}` : `Copied: ${val}`;

      navigator.clipboard.writeText(val).then(() => {
        showToast(copyNotice);
      }).catch(() => {
        const temp = document.createElement('input');
        temp.value = val;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showToast(copyNotice);
      });
    });
  });

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }
}

/* ========================================================
   PRINT CV
   ======================================================== */
function initPrintCV() {
  document.querySelectorAll('.btn-print').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    });
  });
}

/* ========================================================
   MOBILE NAVIGATION & RESPONSIVE BEHAVIORS
   ======================================================== */
function initMobileNav() {
  const menuBtn = document.getElementById('menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (!menuBtn || !mobileNav) return;

  // Initial state — ensure nav starts closed
  if (mobileNav.classList.contains('hidden')) {
    mobileNav.classList.remove('hidden');
  }
  mobileNav.classList.add('mobile-nav-closed');

  const openNav = () => {
    mobileNav.classList.remove('mobile-nav-closed');
    mobileNav.classList.add('mobile-nav-open');
    menuBtn.classList.add('menu-open');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  };

  const closeNav = () => {
    mobileNav.classList.remove('mobile-nav-open');
    mobileNav.classList.add('mobile-nav-closed');
    menuBtn.classList.remove('menu-open');
    document.body.style.overflow = ''; // Restore body scroll
  };

  const toggleNav = () => {
    if (mobileNav.classList.contains('mobile-nav-open')) {
      closeNav();
    } else {
      openNav();
    }
  };

  menuBtn.addEventListener('click', toggleNav);

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('mobile-nav-open')) {
      closeNav();
    }
  });

  // Close on scroll (so when user finds their section it closes or just robust handling)
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    if (mobileNav.classList.contains('mobile-nav-open') && Math.abs(window.scrollY - lastScrollY) > 50) {
      closeNav();
    }
    lastScrollY = window.scrollY;
  }, { passive: true });

  // Resize handler to close nav if expanded to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && mobileNav.classList.contains('mobile-nav-open')) {
      closeNav();
    }
  });
}

/* ========================================================
   ACTIVE SECTION HIGHLIGHTING
   ======================================================== */
function initActiveSectionHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav a[href^="#"], #mobile-nav a[href^="#"]');

  if (!sections.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '-50% 0px -50% 0px',
    threshold: 0
  };

  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        navLinks.forEach(link => {
          link.classList.remove('active');
        });

        const activeLinks = document.querySelectorAll(`nav a[href="#${id}"], #mobile-nav a[href="#${id}"]`);
        activeLinks.forEach(link => {
          link.classList.add('active');
        });
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);
  sections.forEach(sec => observer.observe(sec));
}

/* ========================================================
   SCROLL NAV SHADOW
   ======================================================== */
function initScrollNavShadow() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      nav.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
    } else {
      nav.style.boxShadow = 'none';
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initialize on load
}

/* ========================================================
   BACK-TO-TOP FLOATING BUTTON
   ======================================================== */
function initBackToTop() {
  let bttBtn = document.getElementById('back-to-top');
  
  if (!bttBtn) {
    bttBtn = document.createElement('button');
    bttBtn.id = 'back-to-top';
    bttBtn.className = 'fixed bottom-6 right-6 p-3 rounded-full shadow-lg transition-all duration-300 opacity-0 translate-y-10 pointer-events-none z-50 no-print';
    bttBtn.style.cssText = 'background-color: var(--accent); color: #fff; border: none; cursor: pointer;';
    bttBtn.setAttribute('aria-label', 'Back to top');
    
    bttBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    `;
    
    document.body.appendChild(bttBtn);
  }

  const handleScroll = () => {
    if (window.scrollY > 600) {
      bttBtn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
      bttBtn.classList.add('opacity-100', 'translate-y-0');
      bttBtn.style.pointerEvents = 'auto';
    } else {
      bttBtn.classList.remove('opacity-100', 'translate-y-0');
      bttBtn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
      bttBtn.style.pointerEvents = 'none';
    }
  };

  bttBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}
