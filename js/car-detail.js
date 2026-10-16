document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("detail-container");
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");

  // Immediate synchronous lookup so there is 0ms delay and no blank screen
  let car = getCarById(requestedId) || CARS.find(c => c.id === requestedId) || CARS[0];

  function render(currentCar) {
    if (!currentCar) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>We couldn't find that car</h3>
          <p>It may have been removed from the lineup. Try browsing the full catalog instead.</p>
          <a href="browse.html" class="btn btn--dark">Browse cars →</a>
        </div>`;
      return;
    }

    document.title = `${currentCar.brand} ${currentCar.name} — CarWise Showroom`;
    const saved = CarWise.isShortlisted ? CarWise.isShortlisted(currentCar.id) : false;
    const pros = Array.isArray(currentCar.pros) ? currentCar.pros : [];
    const cons = Array.isArray(currentCar.cons) ? currentCar.cons : [];
    const estEmi = Math.round(currentCar.price * 1.64);
    const powerIcon = currentCar.powertrain === "Electric" ? "⚡ 100% Electric" : currentCar.powertrain === "Hybrid" ? "🔋 Smart Hybrid" : "⛽ Petrol Power";

    const COLORS = [
      { name: "Glacier White", hex: "#f8fafc", glow: "rgba(248, 250, 252, 0.4)" },
      { name: "Obsidian Slate", hex: "#1e293b", glow: "rgba(30, 41, 59, 0.5)" },
      { name: "Midnight Navy", hex: "#0f2a4a", glow: "rgba(15, 42, 74, 0.5)" },
      { name: "Sunset Crimson", hex: "#991b1b", glow: "rgba(153, 27, 27, 0.4)" }
    ];

    container.innerHTML = `
      <section class="detail-hero">
        <div class="detail-media car-card__media--${currentCar.theme}" id="detail-media-box">
          <span class="car-card__badge" style="top: 16px; left: 16px;">${powerIcon}</span>
          <span class="car-card__range-pill" style="bottom: 16px; right: 16px;">${currentCar.range} ${currentCar.rangeUnit}</span>
          <img class="detail-photo" id="detail-photo-img" src="img/${currentCar.id}.jpg" alt="${currentCar.brand} ${currentCar.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div style="display:none; padding: 40px;">${CarWise.carIconSVG()}</div>
        </div>

        <div class="detail-info">
          <p class="car-card__tag">${currentCar.tag}</p>
          <h1>${currentCar.brand} ${currentCar.name}</h1>
          <p class="trim">${currentCar.trim} · ${currentCar.bodyType} · ${currentCar.powertrain}</p>

          <div class="detail-price">
            ${formatPrice(currentCar.price)}
            <span>ex-showroom</span>
            <span class="car-card__emi" style="font-size:0.85rem; padding: 4px 10px;">EMI ~${formatPrice(estEmi)}/mo</span>
          </div>

          <p>${currentCar.description}</p>

          <!-- Interactive Color Swatches -->
          <div class="cw-color-swatches">
            <span class="cw-color-label">Color: <strong id="cw-selected-color-name" style="color:var(--navy-950);">Glacier White</strong></span>
            <div class="cw-swatches-list">
              ${COLORS.map((c, i) => `
                <button type="button" class="cw-swatch ${i === 0 ? "is-active" : ""}"
                  style="background-color: ${c.hex};"
                  data-color-name="${c.name}"
                  data-color-glow="${c.glow}"
                  aria-label="Select ${c.name} color"></button>
              `).join("")}
            </div>
          </div>

          <!-- Spec Grid -->
          <div class="spec-grid">
            <div class="spec-box">
              <strong>${currentCar.range}</strong>
              <span>${currentCar.rangeUnit}</span>
            </div>
            <div class="spec-box">
              <strong>${currentCar.economy}</strong>
              <span>${currentCar.powertrain === "Electric" ? "efficiency" : "fuel economy"}</span>
            </div>
            <div class="spec-box">
              <strong>${currentCar.seats}</strong>
              <span>seats</span>
            </div>
            <div class="spec-box">
              <strong>⭐ ${currentCar.safety}/5</strong>
              <span>safety rating</span>
            </div>
          </div>

          <!-- Direct Actions -->
          <div class="detail-actions">
            <a class="btn btn--amber" href="buy.html?id=${currentCar.id}">
              ⚡ Reserve / Buy Online
            </a>
            <a class="btn btn--dark" href="test-drive.html?id=${currentCar.id}">
              📅 Book Test Drive
            </a>
            <button class="btn btn--ghost" id="shortlist-btn" data-id="${currentCar.id}">
              ${saved ? "Saved to shortlist ✓" : "Add to shortlist"}
            </button>
            <button class="btn btn--ghost" id="compare-btn" data-id="${currentCar.id}">
              ${saved ? "In your compare tray" : "Add to compare"}
            </button>
            <a href="#tradeoffs" class="btn btn--ghost" id="scroll-tradeoffs-btn">
              ↓ View Tradeoffs
            </a>
            <a href="browse.html" class="btn btn--ghost">← Back to browsing</a>
          </div>
        </div>
      </section>

      <!-- Honest Tradeoffs Section -->
      <section class="section section--tight" id="tradeoffs">
        <div class="section-head">
          <div>
            <p class="eyebrow eyebrow--gold">✦ Objective Independent Balance</p>
            <h2>The tradeoffs, plainly.</h2>
          </div>
          <p>Every vehicle makes compromises. Here is our objective assessment of what you gain and what you give up before stepping into any dealership.</p>
        </div>
        <div class="tradeoff-grid">
          <div class="tradeoff-col tradeoff-col--pro">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:24px; height:24px; color:#16a34a;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              Where it wins
            </h3>
            <ul>
              ${pros.length > 0 ? pros.map((p) => `
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"></path></svg>
                  <span>${p}</span>
                </li>
              `).join("") : '<li>No known major advantages recorded</li>'}
            </ul>
          </div>
          <div class="tradeoff-col tradeoff-col--con">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:24px; height:24px; color:#e11d48;"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
              Where it compromises
            </h3>
            <ul>
              ${cons.length > 0 ? cons.map((c) => `
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"></path></svg>
                  <span>${c}</span>
                </li>
              `).join("") : '<li>No known major compromises recorded</li>'}
            </ul>
          </div>
        </div>
      </section>`;

    // Swatch Interaction
    const mediaBox = document.getElementById("detail-media-box");
    const colorNameEl = document.getElementById("cw-selected-color-name");
    container.querySelectorAll(".cw-swatch").forEach((swatch) => {
      swatch.addEventListener("click", () => {
        container.querySelectorAll(".cw-swatch").forEach(s => s.classList.remove("is-active"));
        swatch.classList.add("is-active");
        const cName = swatch.dataset.colorName;
        const cGlow = swatch.dataset.colorGlow;
        if (colorNameEl) colorNameEl.textContent = cName;
        if (mediaBox) {
          mediaBox.style.boxShadow = `0 24px 60px -15px ${cGlow}, 0 0 20px ${cGlow}`;
        }
      });
    });

    function refreshButtons() {
      const nowSaved = CarWise.isShortlisted ? CarWise.isShortlisted(currentCar.id) : false;
      const slBtn = document.getElementById("shortlist-btn");
      const cpBtn = document.getElementById("compare-btn");
      if (slBtn) slBtn.textContent = nowSaved ? "Saved to shortlist ✓" : "Add to shortlist";
      if (cpBtn) cpBtn.textContent = nowSaved ? "In your compare tray" : "Add to compare";
    }

    ["shortlist-btn", "compare-btn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => {
          const result = CarWise.toggleShortlist(currentCar.id);
          if (result && result.limitReached) return;
          CarWise.showToast(result && result.saved ? "Saved to your shortlist" : "Removed from your shortlist");
          refreshButtons();
        });
      }
    });

    const scrollBtn = document.getElementById("scroll-tradeoffs-btn");
    if (scrollBtn) {
      scrollBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const tradeoffsSec = document.getElementById("tradeoffs");
        if (tradeoffsSec) {
          tradeoffsSec.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    /* related cars: same body type or powertrain, excluding this one */
    const related = CARS.filter(
      (c) => c.id !== currentCar.id && (c.bodyType === currentCar.bodyType || c.powertrain === currentCar.powertrain)
    ).slice(0, 3);

    const relatedSec = document.getElementById("related-section");
    const relatedGrid = document.getElementById("related-grid");
    if (related.length && relatedSec && relatedGrid) {
      relatedSec.style.display = "";
      relatedGrid.innerHTML = related.map(CarWise.carCardHTML).join("");
      CarWise.bindCardEvents(relatedGrid);
    }
  }

  // Render immediately
  render(car);

  // If URL has #tradeoffs, scroll smoothly to it
  if (window.location.hash === "#tradeoffs") {
    setTimeout(() => {
      const el = document.getElementById("tradeoffs");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  // Background live sync
  try {
    await CarWise.init("");
    const liveCar = getCarById(requestedId);
    if (liveCar) render(liveCar);
  } catch (e) {
    console.warn("Background init warning:", e);
  }
});
