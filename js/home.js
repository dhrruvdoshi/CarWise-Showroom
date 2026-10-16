document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("home");

  // Spotlight Cars Showcase
  const spotlightIds = ["volvo-ex30", "tesla-model3", "hyundai-kona", "mg-zs-ev", "toyota-corolla"];
  let currentSpotlightIdx = 0;

  function updateSpotlight(carId) {
    const car = getCarById(carId) || CARS.find(c => c.id === carId) || CARS[0];
    if (!car) return;
    const heroEl = document.getElementById("hero-car-media");
    const nameEl = document.getElementById("hero-car-name");
    const tagEl = document.getElementById("hero-car-tag");
    const priceEl = document.getElementById("hero-car-price");
    const buyBtn = document.getElementById("hero-buy-btn");
    const driveBtn = document.getElementById("hero-drive-btn");

    if (heroEl) {
      heroEl.innerHTML = `
        <div style="position:relative; width:100%; height:220px; border-radius:10px; overflow:hidden; background: var(--sand-50);">
          <span class="car-card__badge" style="top:10px; left:10px;">${car.powertrain === "Electric" ? "⚡ Electric" : car.powertrain === "Hybrid" ? "🔋 Hybrid" : "⛽ Petrol"}</span>
          <span class="car-card__range-pill" style="bottom:10px; right:10px;">${car.range} ${car.rangeUnit}</span>
          <img src="img/${car.id}.jpg" alt="${car.brand} ${car.name}" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div style="display:none; padding:40px;">${CarWise.carIconSVG()}</div>
        </div>
      `;
    }
    if (nameEl) nameEl.textContent = `${car.brand} ${car.name}`;
    if (tagEl) tagEl.textContent = `${car.trim} · ${car.tagline || car.tag}`;
    if (priceEl) priceEl.textContent = formatPrice(car.price);
    if (buyBtn) buyBtn.href = `buy.html?id=${car.id}`;
    if (driveBtn) driveBtn.href = `test-drive.html?id=${car.id}`;
  }

  updateSpotlight(spotlightIds[0]);

  const switchBtn = document.getElementById("hero-switch-car");
  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      currentSpotlightIdx = (currentSpotlightIdx + 1) % spotlightIds.length;
      updateSpotlight(spotlightIds[currentSpotlightIdx]);
      CarWise.showToast("Spotlight changed to " + spotlightIds[currentSpotlightIdx].replace(/-/g, " ").toUpperCase());
    });
  }

  // Persona Lifestyle Cards
  const PERSONAS = [
    {
      id: "commute",
      title: "Daily Commute",
      desc: "Ultra-quiet, efficient and effortless to park in city spaces",
      match: (c) => c.powertrain === "Hybrid" || c.powertrain === "Electric",
      icon: `<path d="M3 12h18M12 3v18"/>`
    },
    {
      id: "family",
      title: "Family & Cargo",
      desc: "Maximum cabin versatility, generous boot, and 5-seater comfort",
      match: (c) => c.bodyType === "SUV" || c.bodyType === "Wagon",
      icon: `<path d="M4 17h16M6 17V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8M4 17a2 2 0 0 0 4 0M16 17a2 2 0 0 0 4 0"/>`
    },
    {
      id: "drive",
      title: "Dynamic Character",
      desc: "Responsive steering, instant torque, and highway poise",
      match: (c) => c.tag.toLowerCase().includes("drive") || c.bodyType === "Sedan",
      icon: `<path d="M13 2 3 14h7l-1 8 11-14h-7z"/>`
    },
    {
      id: "electric",
      title: "Pure Zero-Emission",
      desc: "Future-proof 100% electric motoring with home charging simplicity",
      match: (c) => c.powertrain === "Electric",
      icon: `<path d="M7 17a5 5 0 0 1 10 0M12 3v6M9 9h6"/>`
    }
  ];

  const personaGrid = document.getElementById("persona-grid");
  if (personaGrid) {
    personaGrid.innerHTML = PERSONAS.map(
      (p) => `
      <button class="persona-card" type="button" data-persona="${p.id}">
        <span class="persona-card__icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${p.icon}</svg></span>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
      </button>`
    ).join("");

    personaGrid.querySelectorAll("[data-persona]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.href = `browse.html?persona=${btn.dataset.persona}`;
      });
    });
  }

  /* ---------- Live Mini Browse Preview & Filter Chips ---------- */
  const bodySelect = document.getElementById("home-body");
  const powerSelect = document.getElementById("home-power");
  const searchInput = document.getElementById("home-search");
  const grid = document.getElementById("home-grid");
  const countEl = document.getElementById("home-count");
  const statCars = document.getElementById("stat-cars");
  if (statCars) statCars.textContent = CARS.length;

  const bodyTypes = [...new Set(CARS.map((c) => c.bodyType))].sort();
  const powertrains = [...new Set(CARS.map((c) => c.powertrain))].sort();
  if (bodySelect) bodySelect.insertAdjacentHTML("beforeend", bodyTypes.map((b) => `<option value="${b}">${b}</option>`).join(""));
  if (powerSelect) powerSelect.insertAdjacentHTML("beforeend", powertrains.map((p) => `<option value="${p}">${p}</option>`).join(""));

  let activeChip = "all";
  document.querySelectorAll("#home-quick-chips .cw-quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#home-quick-chips .cw-quick-chip").forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeChip = chip.dataset.filter;
      render();
    });
  });

  function render() {
    const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const body = bodySelect ? bodySelect.value : "";
    const power = powerSelect ? powerSelect.value : "";

    let results = CARS.filter((c) => {
      const haystack = `${c.brand} ${c.name} ${c.tag} ${c.tagline} ${c.powertrain} ${c.bodyType}`.toLowerCase();
      const matchesQ = !q || haystack.includes(q);
      const matchesBody = !body || c.bodyType === body;
      const matchesPower = !power || c.powertrain === power;

      let matchesChip = true;
      if (activeChip === "electric") matchesChip = c.powertrain === "Electric";
      else if (activeChip === "hybrid") matchesChip = c.powertrain === "Hybrid";
      else if (activeChip === "petrol") matchesChip = c.powertrain === "Petrol";
      else if (activeChip === "safety") matchesChip = c.safety === 5;
      else if (activeChip === "budget") matchesChip = c.price <= 30000;

      return matchesQ && matchesBody && matchesPower && matchesChip;
    });

    if (countEl) countEl.textContent = results.length;
    if (grid) {
      grid.innerHTML = results.length
        ? results.map(CarWise.carCardHTML).join("")
        : `<div class="empty-state" style="grid-column:1/-1">
            <h3>No vehicles match that combination</h3>
            <p>Try resetting the search or tapping 'All Vehicles' above.</p>
          </div>`;
      CarWise.bindCardEvents(grid);
    }
  }

  [searchInput, bodySelect, powerSelect].forEach((el) => {
    if (el) el.addEventListener("input", render);
  });
  render();
});
