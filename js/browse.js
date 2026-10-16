document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("browse");

  const searchInput = document.getElementById("search");
  const bodySelect = document.getElementById("filter-body");
  const powerSelect = document.getElementById("filter-power");
  const sortSelect = document.getElementById("sort-by");
  const grid = document.getElementById("browse-grid");
  const countEl = document.getElementById("result-count");
  const personaNote = document.getElementById("persona-note");
  const resetBtn = document.getElementById("reset-filters");

  const bodyTypes = [...new Set(CARS.map((c) => c.bodyType))].sort();
  const powertrains = [...new Set(CARS.map((c) => c.powertrain))].sort();
  if (bodySelect) bodySelect.insertAdjacentHTML("beforeend", bodyTypes.map((b) => `<option value="${b}">${b}</option>`).join(""));
  if (powerSelect) powerSelect.insertAdjacentHTML("beforeend", powertrains.map((p) => `<option value="${p}">${p}</option>`).join(""));

  const PERSONA_RULES = {
    commute: { power: "Hybrid", label: "Showing cars optimal for daily commuting." },
    family: { body: "SUV", label: "Showing cars with generous room for family and cargo." },
    drive: { body: "Sedan", label: "Showing cars with driver-focused character and balance." },
    electric: { power: "Electric", label: "Showing zero-emission electric vehicles." }
  };

  const params = new URLSearchParams(window.location.search);
  const persona = params.get("persona");
  if (persona && PERSONA_RULES[persona]) {
    const rule = PERSONA_RULES[persona];
    if (rule.body && bodySelect) bodySelect.value = rule.body;
    if (rule.power && powerSelect) powerSelect.value = rule.power;
    if (personaNote) personaNote.textContent = rule.label;
  }

  let activeChip = "all";
  document.querySelectorAll("#browse-quick-chips .cw-quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("#browse-quick-chips .cw-quick-chip").forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      activeChip = chip.dataset.filter;
      render();
    });
  });

  function render() {
    const q = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const body = bodySelect ? bodySelect.value : "";
    const power = powerSelect ? powerSelect.value : "";
    const sort = sortSelect ? sortSelect.value : "recommended";

    let results = CARS.filter((c) => {
      const haystack = `${c.brand} ${c.name} ${c.tag} ${c.tagline} ${c.bodyType} ${c.powertrain}`.toLowerCase();
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

    switch (sort) {
      case "price-asc": results.sort((a, b) => a.price - b.price); break;
      case "price-desc": results.sort((a, b) => b.price - a.price); break;
      case "safety-desc": results.sort((a, b) => b.safety - a.safety); break;
      case "name-asc": results.sort((a, b) => (a.brand + a.name).localeCompare(b.brand + b.name)); break;
      default: break; // "recommended"
    }

    if (countEl) countEl.textContent = results.length;
    if (grid) {
      grid.innerHTML = results.length
        ? results.map(CarWise.carCardHTML).join("")
        : `<div class="empty-state" style="grid-column:1/-1">
            <h3>No cars match those filters</h3>
            <p>Try clearing filters or search keywords to view our full curated showroom.</p>
            <button class="btn btn--dark" id="empty-reset" type="button">Reset all filters</button>
          </div>`;
      CarWise.bindCardEvents(grid);
    }

    const emptyReset = document.getElementById("empty-reset");
    if (emptyReset) emptyReset.addEventListener("click", resetAll);
  }

  function resetAll() {
    if (searchInput) searchInput.value = "";
    if (bodySelect) bodySelect.value = "";
    if (powerSelect) powerSelect.value = "";
    if (sortSelect) sortSelect.value = "recommended";
    if (personaNote) personaNote.textContent = "";
    activeChip = "all";
    document.querySelectorAll("#browse-quick-chips .cw-quick-chip").forEach(c => c.classList.remove("is-active"));
    const allChip = document.querySelector('#browse-quick-chips [data-filter="all"]');
    if (allChip) allChip.classList.add("is-active");
    render();
  }

  [searchInput, bodySelect, powerSelect, sortSelect].forEach((el) => {
    if (el) el.addEventListener("input", render);
  });
  if (resetBtn) resetBtn.addEventListener("click", resetAll);
  render();
});
