document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("compare");
  let highlightDiffs = false;
  render();

  function render() {
    const container = document.getElementById("compare-container");
    const ids = CarWise.getShortlist();
    const cars = ids.map(getCarById).filter(Boolean);

    if (cars.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Your compare tray is empty</h3>
          <p>Head to Browse cars and tap the <strong>+</strong> button on any card to compare up to three vehicles side by side.</p>
          <a href="browse.html" class="btn btn--dark" style="margin-top: 18px;">Browse vehicles →</a>
        </div>`;
      return;
    }

    const availableToAdd = CARS.filter(c => !ids.includes(c.id));

    const rows = [
      {
        label: "Starting price",
        get: (c) => `<strong style="font-size:1.15rem; color:var(--navy-950);">${formatPrice(c.price)}</strong><span style="display:block; font-size:0.75rem; color:var(--ink-500);">ex-showroom</span>`
      },
      { label: "Body type", get: (c) => `<span style="font-weight:600;">${c.bodyType}</span>` },
      {
        label: "Powertrain",
        get: (c) => `<span class="cw-badge ${c.powertrain === 'Electric' ? 'cw-badge--green' : 'cw-badge--gold'}">${c.powertrain}</span>`
      },
      {
        label: "Range / Efficiency",
        get: (c) => `<strong>${c.range} ${c.rangeUnit}</strong><span style="display:block; font-size:0.78rem; color:var(--ink-700); margin-top:2px;">${c.economy}</span>`
      },
      { label: "Seating", get: (c) => `<span>${c.seats} passengers</span>` },
      { label: "Safety rating", get: (c) => `<strong style="color:var(--mint-700);">⭐ ${c.safety} / 5 NCAP</strong>` },
      {
        label: "Where it wins",
        get: (c) => `<ul class="compare-pros" style="display:flex; flex-direction:column; gap:6px;">${c.pros.slice(0, 3).map((p) => `<li style="display:flex; gap:6px; color:#15803d; font-size:0.86rem;"><span style="font-weight:700;">✓</span> ${p}</li>`).join("")}</ul>`
      },
      {
        label: "Where it compromises",
        get: (c) => `<ul class="compare-cons" style="display:flex; flex-direction:column; gap:6px;">${c.cons.slice(0, 3).map((co) => `<li style="display:flex; gap:6px; color:#be123c; font-size:0.86rem;"><span style="font-weight:700;">✗</span> ${co}</li>`).join("")}</ul>`
      }
    ];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
        <div class="filter-count" style="margin:0;">
          Comparing <strong>${cars.length}</strong> of 3 possible contenders.
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          ${availableToAdd.length > 0 && cars.length < 3 ? `
            <select id="quick-add-compare" style="border:1.5px solid var(--line); border-radius:999px; padding:7px 14px; font-size:0.84rem; font-weight:600; outline:none; background:#fff; cursor:pointer;">
              <option value="">+ Add a vehicle...</option>
              ${availableToAdd.map(c => `<option value="${c.id}">${c.brand} ${c.name} (${formatPrice(c.price)})</option>`).join("")}
            </select>
          ` : ""}
          <a href="browse.html" class="btn btn--ghost-small">Browse all →</a>
        </div>
      </div>

      <div class="compare-table-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th style="background:var(--sand-50); border-right:1px solid var(--line);">
                <div style="padding:10px 0;">
                  <span style="font-size:0.78rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-500); font-weight:700;">Showroom Contenders</span>
                </div>
              </th>
              ${cars
                .map(
                  (c) => `
                <th>
                  <div class="compare-head-card">
                    <div class="compare-head-card__media car-card__media--${c.theme}">
                      <img class="cw-car-pill__photo" src="${c.image || `img/${c.id}.jpg`}" alt="${c.brand} ${c.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />
                      <div style="display:none; width:100%; height:100%; padding:20px;">${CarWise.carIconSVG()}</div>
                    </div>
                    <h3>${c.brand} ${c.name}</h3>
                    <p>${c.trim} · ${c.powertrain}</p>
                    <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                      <div style="display:flex; gap:6px;">
                        <a href="buy.html?id=${c.id}" class="btn btn--amber btn--sm" style="flex:1;">⚡ Reserve</a>
                        <a href="test-drive.html?id=${c.id}" class="btn btn--dark btn--sm" style="flex:1;">📅 Drive</a>
                      </div>
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                        <a href="car.html?id=${c.id}" class="btn--link" style="font-size:0.82rem;">Full Details →</a>
                        <button class="compare-remove" type="button" data-remove="${c.id}" aria-label="Remove ${c.brand} ${c.name}">Remove ✕</button>
                      </div>
                    </div>
                  </div>
                </th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                <td class="row-label" style="background:var(--sand-50); border-right:1px solid var(--line);">${row.label}</td>
                ${cars.map((c) => `<td>${row.get(c)}</td>`).join("")}
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

    container.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        CarWise.removeFromShortlist(btn.dataset.remove);
        CarWise.showToast("Removed from compare");
        render();
      });
    });

    const quickAddSelect = document.getElementById("quick-add-compare");
    if (quickAddSelect) {
      quickAddSelect.addEventListener("change", () => {
        if (!quickAddSelect.value) return;
        const result = CarWise.toggleShortlist(quickAddSelect.value);
        if (result && result.limitReached) return;
        CarWise.showToast("Added to comparison");
        render();
      });
    }
  }
});
