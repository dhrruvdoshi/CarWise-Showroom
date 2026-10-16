/* CarWise — shared app shell.
   Handles: Supabase auth, shortlist (compare list), header rendering,
   and small reusable UI helpers (toast, car card, car SVG). Loaded on
   every page after supabase-config.js and cars-data.js. */

const CarWise = (() => {
  const SHORTLIST_KEY = "carwise_shortlist"; // localStorage fallback for guests

  let _currentUser = null;    // { id, name, email } or null
  let _shortlistCache = [];   // array of car IDs

  /* ---------- auth helpers ---------- */
  async function loadSession() {
    try {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session && session.user) {
        const { data: profile } = await _supabase
          .from('profiles')
          .select('name, email')
          .eq('id', session.user.id)
          .single();

        _currentUser = {
          id: session.user.id,
          name: profile ? profile.name : session.user.email,
          email: session.user.email
        };
      } else {
        _currentUser = null;
      }
    } catch (e) {
      console.warn('CarWise: session check failed', e);
      _currentUser = null;
    }
  }

  function getSession() {
    return _currentUser;
  }

  async function signIn(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await loadSession();
    await migrateLocalShortlist();
    return data;
  }

  async function signUp(name, email, password) {
    const { data, error } = await _supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    await loadSession();
    await migrateLocalShortlist();
    return data;
  }

  async function signOut() {
    await _supabase.auth.signOut();
    _currentUser = null;
    _shortlistCache = [];
  }

  /* ---------- shortlist / compare tray ---------- */
  async function loadShortlist() {
    if (_currentUser) {
      try {
        const { data, error } = await _supabase
          .from('shortlists')
          .select('car_id')
          .eq('user_id', _currentUser.id);

        if (!error && data) {
          _shortlistCache = data.map(row => row.car_id);
        } else {
          _shortlistCache = [];
        }
      } catch (e) {
        console.warn('CarWise: shortlist load failed', e);
        _shortlistCache = [];
      }
    } else {
      /* Guest user — read from localStorage */
      try {
        _shortlistCache = JSON.parse(localStorage.getItem(SHORTLIST_KEY)) || [];
      } catch {
        _shortlistCache = [];
      }
    }
  }

  /* When a guest signs in, move their localStorage picks into Supabase. */
  async function migrateLocalShortlist() {
    if (!_currentUser) return;
    try {
      const local = JSON.parse(localStorage.getItem(SHORTLIST_KEY)) || [];
      if (local.length === 0) return;

      await loadShortlist();

      for (const carId of local) {
        if (!_shortlistCache.includes(carId)) {
          await _supabase.from('shortlists').insert({
            user_id: _currentUser.id,
            car_id: carId
          });
        }
      }

      localStorage.removeItem(SHORTLIST_KEY);
      await loadShortlist();
    } catch (e) {
      console.warn('CarWise: shortlist migration failed', e);
    }
  }

  function getShortlist() {
    return [..._shortlistCache];
  }

  function isShortlisted(id) {
    return _shortlistCache.includes(id);
  }

  /* Toggle is kept synchronous for snappy UI — the cache updates
     immediately and Supabase syncs in the background. */
  function toggleShortlist(id) {
    if (_shortlistCache.includes(id)) {
      _shortlistCache = _shortlistCache.filter(x => x !== id);

      if (_currentUser) {
        _supabase.from('shortlists')
          .delete()
          .eq('user_id', _currentUser.id)
          .eq('car_id', id)
          .then(({ error }) => { if (error) console.warn('Shortlist sync error:', error); });
      } else {
        localStorage.setItem(SHORTLIST_KEY, JSON.stringify(_shortlistCache));
      }

      updateCompareBadge();
      return { saved: false, limitReached: false };
    }

    if (_shortlistCache.length >= 3) {
      showToast("You can compare up to 3 cars at a time. Remove one first.");
      return { saved: false, limitReached: true };
    }

    _shortlistCache.push(id);

    if (_currentUser) {
      _supabase.from('shortlists')
        .insert({ user_id: _currentUser.id, car_id: id })
        .then(({ error }) => { if (error) console.warn('Shortlist sync error:', error); });
    } else {
      localStorage.setItem(SHORTLIST_KEY, JSON.stringify(_shortlistCache));
    }

    updateCompareBadge();
    return { saved: true, limitReached: false };
  }

  function removeFromShortlist(id) {
    _shortlistCache = _shortlistCache.filter(x => x !== id);

    if (_currentUser) {
      _supabase.from('shortlists')
        .delete()
        .eq('user_id', _currentUser.id)
        .eq('car_id', id)
        .then(({ error }) => { if (error) console.warn('Shortlist sync error:', error); });
    } else {
      localStorage.setItem(SHORTLIST_KEY, JSON.stringify(_shortlistCache));
    }

    updateCompareBadge();
  }

  function updateCompareBadge() {
    document.querySelectorAll("[data-compare-badge]").forEach((el) => {
      const n = _shortlistCache.length;
      el.textContent = n;
      el.style.display = n > 0 ? "inline-flex" : "none";
    });
  }

  /* ---------- toast ---------- */
  let toastTimer = null;
  function showToast(message) {
    let toast = document.getElementById("cw-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "cw-toast";
      toast.className = "cw-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("cw-toast--visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("cw-toast--visible"), 2600);
  }

  /* ---------- celebration confetti burst ---------- */
  function launchConfetti() {
    try {
      const canvas = document.createElement("canvas");
      canvas.id = "cw-confetti-canvas";
      canvas.style.position = "fixed";
      canvas.style.inset = "0";
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "99999";
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);

      const particles = [];
      const colors = ["#f59e0b", "#10b981", "#38bdf8", "#ec4899", "#8b5cf6", "#fbbf24", "#34d399"];

      for (let i = 0; i < 90; i++) {
        particles.push({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2 - 40,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.7) * 18,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          alpha: 1
        });
      }

      const startTime = Date.now();
      function animate() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        const elapsed = Date.now() - startTime;

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.36;
          p.rotation += p.vRot;
          p.alpha = Math.max(0, 1 - elapsed / 2400);

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });

        if (elapsed < 2400) {
          requestAnimationFrame(animate);
        } else {
          canvas.remove();
        }
      }
      requestAnimationFrame(animate);
    } catch (e) {
      console.warn("Confetti animation skipped:", e);
    }
  }

  /* ---------- car silhouette icon, reused everywhere with a theme tint ---------- */
  function carIconSVG() {
    return `
    <svg viewBox="0 0 220 120" class="car-silhouette" aria-hidden="true">
      <ellipse cx="110" cy="102" rx="92" ry="8" class="car-shadow"></ellipse>
      <path class="car-body" d="M22 78 C 20 55, 40 52, 55 44 C 66 38, 82 30, 108 30 C 132 30, 148 38, 162 46 C 176 54, 196 56, 200 74 C 201 80, 199 86, 192 86 L 30 86 C 24 86, 21 83, 22 78 Z"></path>
      <path class="car-glass" d="M70 44 C 80 36, 92 32, 108 32 C 122 32, 134 36, 144 44 L 138 52 L 76 52 Z"></path>
      <circle cx="62" cy="88" r="14" class="car-wheel"></circle>
      <circle cx="62" cy="88" r="6" class="car-hub"></circle>
      <circle cx="158" cy="88" r="14" class="car-wheel"></circle>
      <circle cx="158" cy="88" r="6" class="car-hub"></circle>
      <rect x="150" y="60" width="10" height="6" rx="2" class="car-light"></rect>
    </svg>`;
  }

  /* ---------- reusable car card markup ---------- */
  function carCardHTML(car) {
    const saved = isShortlisted(car.id);
    const powerIcon = car.powertrain === "Electric" ? "⚡ Electric" : car.powertrain === "Hybrid" ? "🔋 Hybrid" : "⛽ Petrol";
    const estEmi = Math.round(car.price * 1.64);

    return `
    <article class="car-card" data-car="${car.id}">
      <div class="car-card__media car-card__media--${car.theme}">
        <span class="car-card__badge">${powerIcon}</span>
        <span class="car-card__range-pill">${car.range} ${car.rangeUnit}</span>
        <img class="car-card__photo" src="img/${car.id}.jpg" alt="${car.brand} ${car.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="car-card__fallback" style="display:none;">${carIconSVG()}</div>
        <button class="icon-btn car-card__save ${saved ? "is-active" : ""}" type="button"
          data-action="save" data-id="${car.id}" aria-pressed="${saved}"
          aria-label="${saved ? "Remove from shortlist" : "Add to shortlist"}">
          <svg viewBox="0 0 24 24"><path d="M12 20.6 4.6 13c-2-2-2-5.4 0-7.4 2-2 5.2-2 7.1 0l.3.3.3-.3c2-2 5.2-2 7.1 0 2 2 2 5.4 0 7.4L12 20.6Z"/></svg>
        </button>
      </div>
      <div class="car-card__body">
        <p class="car-card__tag">${car.tag}</p>
        <h3 class="car-card__name">${car.brand} ${car.name}</h3>
        <p class="car-card__trim">${car.trim}</p>

        <div class="car-card__price-row">
          <div class="car-card__price">
            <strong>${formatPrice(car.price)}</strong>
            <span>ex-showroom</span>
          </div>
          <div class="car-card__emi">EMI ~${formatPrice(estEmi)}/mo</div>
        </div>

        <div class="car-card__stats">
          <div class="car-card__stat-chip"><strong>${car.bodyType}</strong><span>Body</span></div>
          <div class="car-card__stat-chip"><strong>${car.economy}</strong><span>${car.powertrain === "Electric" ? "Efficiency" : "Mileage"}</span></div>
          <div class="car-card__stat-chip"><strong>⭐ ${car.safety}/5</strong><span>Safety</span></div>
        </div>

        <p class="car-card__desc">${car.tagline}</p>

        <div class="car-card__actions">
          <div class="car-card__actions-row">
            <a class="btn btn--amber btn--sm" href="buy.html?id=${car.id}">
              ⚡ Buy / Reserve
            </a>
            <a class="btn btn--dark btn--sm" href="test-drive.html?id=${car.id}">
              📅 Test Drive
            </a>
          </div>
          <div class="car-card__actions-row">
            <a class="btn btn--ghost-small btn--block" href="car.html?id=${car.id}#tradeoffs">
              Tradeoffs & Details →
            </a>
            <button class="btn btn--outline-square ${saved ? "is-active" : ""}" type="button" data-action="compare" data-id="${car.id}"
              aria-label="Add ${car.brand} ${car.name} to compare">${saved ? "✓" : "+"}</button>
          </div>
        </div>
      </div>
    </article>`;
  }

  function bindCardEvents(root = document) {
    root.querySelectorAll('[data-action="save"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const result = toggleShortlist(id);
        if (result.limitReached) return;
        btn.classList.toggle("is-active", result.saved);
        btn.setAttribute("aria-pressed", result.saved);
        btn.setAttribute("aria-label", result.saved ? "Remove from shortlist" : "Add to shortlist");
        showToast(result.saved ? "Saved to your shortlist" : "Removed from your shortlist");
      });
    });
    root.querySelectorAll('[data-action="compare"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const result = toggleShortlist(id);
        if (result.limitReached) return;
        btn.classList.toggle("is-active", result.saved);
        btn.textContent = result.saved ? "✓" : "+";
        const card = btn.closest(".car-card");
        const saveBtn = card ? card.querySelector('[data-action="save"]') : null;
        if (saveBtn) {
          saveBtn.classList.toggle("is-active", result.saved);
          saveBtn.setAttribute("aria-pressed", result.saved);
        }
        showToast(
          result.saved
            ? "Added to compare — open the compare tray when ready"
            : "Removed from compare"
        );
      });
    });
  }

  /* ---------- header / nav, shared across every page ---------- */
  function renderHeader(activePage) {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const session = getSession();
    const compareCount = _shortlistCache.length;

    mount.innerHTML = `
      <div class="nav-wrap">
        <a class="brand" href="index.html">
          <span class="brand__mark">${carIconSVG()}</span>
          CarWise<span class="brand__dot">.</span>
        </a>
        <nav class="nav-links" aria-label="Primary">
          <a href="index.html" class="${activePage === "home" ? "is-active" : ""}">Discover</a>
          <a href="browse.html" class="${activePage === "browse" ? "is-active" : ""}">Browse cars</a>
          <a href="compare.html" class="${activePage === "compare" ? "is-active" : ""}">Compare</a>
          <a href="test-drive.html" class="${activePage === "test-drive" ? "is-active" : ""}">Test drive</a>
          <a href="buy.html" class="${activePage === "buy" ? "is-active" : ""}">Buy online</a>
        </nav>
        <div class="nav-actions">
          <a href="activity.html" class="btn btn--ghost-small ${activePage === "activity" ? "is-active" : ""}" id="header-activity-btn" title="View your booked test drives & vehicle orders">📋 My Activity</a>
          <a href="compare.html" class="compare-pill" aria-label="Open compare tray">
            Compare
            <span class="compare-pill__count" data-compare-badge style="display:${compareCount > 0 ? "inline-flex" : "none"}">${compareCount}</span>
          </a>
          ${
            session
              ? `<div class="account-menu">
                   <span class="account-name">Hi, ${session.name.split(" ")[0]}</span>
                   <button class="btn btn--ghost-small" id="logout-btn" type="button">Sign out</button>
                 </div>`
              : `<a href="login.html" class="btn btn--dark-small">Sign in</a>`
          }
          <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>`;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut();
        showToast("Signed out");
        setTimeout(() => location.reload(), 400);
      });
    }

    const toggle = document.getElementById("nav-toggle");
    const links = mount.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", () => {
        const open = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open);
      });
    }
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    mount.innerHTML = `
      <div class="footer-wrap">
        <div class="footer-brand">
          <span class="brand brand--light">CarWise<span class="brand__dot">.</span></span>
          <p>Research better. Choose with confidence.</p>
        </div>
        <div class="footer-links">
          <div>
            <h4>Explore</h4>
            <a href="index.html">Discover</a>
            <a href="browse.html">Browse cars</a>
            <a href="compare.html">Compare</a>
          </div>
          <div>
            <h4>Account</h4>
            <a href="login.html">Sign in</a>
            <a href="signup.html">Create account</a>
          </div>
        </div>
        <p class="footer-copy">© ${new Date().getFullYear()} CarWise Showroom — a student HCI project.</p>
      </div>`;
  }

  async function init(activePage) {
    await loadCarsFromDB();
    await loadSession();
    await loadShortlist();
    renderHeader(activePage);
    renderFooter();
  }

  return {
    init,
    getSession,
    signIn,
    signUp,
    signOut,
    getShortlist,
    isShortlisted,
    toggleShortlist,
    removeFromShortlist,
    updateCompareBadge,
    showToast,
    launchConfetti,
    carIconSVG,
    carCardHTML,
    bindCardEvents,
    renderHeader,
    renderFooter
  };
})();
