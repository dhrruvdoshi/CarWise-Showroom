document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("activity");

  const mount = document.getElementById("activity-mount");
  const session = CarWise.getSession();

  let bookings = [];
  let orders = [];

  // Query Supabase if session exists
  if (session && _supabase) {
    try {
      const [bRes, oRes] = await Promise.all([
        _supabase.from("test_drive_bookings").select("*").eq("user_id", session.id).order("created_at", { ascending: false }),
        _supabase.from("orders").select("*").eq("user_id", session.id).order("created_at", { ascending: false })
      ]);
      if (bRes.data) bookings = bRes.data;
      if (oRes.data) orders = oRes.data;
    } catch (e) {
      console.warn("Supabase activity fetch failed:", e);
    }
  }

  // Fallback to local storage if empty or guest
  const localList = JSON.parse(localStorage.getItem("carwise_user_activities")) || [];
  if (bookings.length === 0) {
    bookings = localList.filter(x => x.type === "test_drive");
  }
  if (orders.length === 0) {
    orders = localList.filter(x => x.type === "order");
  }

  mount.innerHTML = `
    <div class="cw-activity-flow">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; border-bottom: 1px solid var(--line); padding-bottom: 18px;">
        <div>
          <h2 style="font-size: 1.9rem; margin-bottom: 6px; font-weight:800; color:var(--navy-950);">Showroom Activity Hub</h2>
          <p style="color: var(--ink-700); font-size: 0.92rem;">
            ${session ? `Logged in as <strong>${session.email}</strong>` : 'Guest activity on this browser · <a href="login.html" class="cw-link">Sign in to cloud sync</a>'}
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <a href="test-drive.html" class="btn btn--dark btn--sm">📅 Book Test Drive</a>
          <a href="browse.html" class="btn btn--amber btn--sm">⚡ Buy a Car</a>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; margin-bottom: 24px;">
        <div style="background:var(--sand-50); border:1px solid var(--line); border-radius:var(--radius-sm); padding:16px; text-align:center;">
          <strong style="font-size:1.6rem; color:var(--navy-950); display:block;">${bookings.length}</strong>
          <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-500); font-weight:700;">Scheduled Test Drives</span>
        </div>
        <div style="background:var(--sand-50); border:1px solid var(--line); border-radius:var(--radius-sm); padding:16px; text-align:center;">
          <strong style="font-size:1.6rem; color:var(--amber-600); display:block;">${orders.length}</strong>
          <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-500); font-weight:700;">Vehicle Reservations</span>
        </div>
        <div style="background:var(--sand-50); border:1px solid var(--line); border-radius:var(--radius-sm); padding:16px; text-align:center;">
          <strong style="font-size:1.6rem; color:var(--mint-700); display:block;">100%</strong>
          <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-500); font-weight:700;">Protection Guarantee</span>
        </div>
      </div>

      <div class="cw-tabs">
        <button class="cw-tab-btn is-active" data-tab="tab-drives">
          Test Drives <span class="cw-tab-badge">${bookings.length}</span>
        </button>
        <button class="cw-tab-btn" data-tab="tab-orders">
          Car Orders & Payments <span class="cw-tab-badge">${orders.length}</span>
        </button>
      </div>

      <div id="tab-drives" class="cw-tab-pane is-active">
        ${bookings.length === 0 ? `
          <div class="cw-empty-activity">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--ink-500); margin-bottom: 12px;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            <h3>No test drives scheduled yet</h3>
            <p>Pick any car from our showroom and schedule an experience drive at our showroom or directly at your doorstep.</p>
            <a href="test-drive.html" class="btn btn--dark" style="margin-top: 16px;">Schedule a Test Drive →</a>
          </div>
        ` : `
          <div class="cw-activity-list">
            ${bookings.map(b => {
              const car = getCarById(b.car_id);
              const carTitle = car ? `${car.brand} ${car.name}` : (b.car_name || b.car_id);
              const carTrim = car ? `${car.trim} · ${car.powertrain}` : '';
              return `
                <div class="cw-activity-card" style="display: flex; gap: 16px; align-items: flex-start;">
                  ${car ? `<img src="${car.image || `img/${car.id}.jpg`}" alt="${carTitle}" style="width: 90px; height: 68px; object-fit: cover; border-radius: 8px; flex-shrink: 0; box-shadow: var(--shadow-sm);" onerror="this.style.display='none';" />` : ''}
                  <div style="flex: 1; min-width: 0;">
                    <div class="cw-activity-card__head">
                      <div>
                        <strong>${carTitle}</strong>
                        <span style="font-size: 0.8rem; color: var(--ink-500); margin-left: 8px;">${carTrim}</span>
                      </div>
                      <span class="cw-badge cw-badge--green">Confirmed Appointment</span>
                    </div>
                    <div class="cw-activity-card__meta">
                      <span>📅 <strong>Date:</strong> ${b.preferred_date || b.date}</span>
                      <span>⏰ <strong>Window:</strong> ${b.preferred_time || b.time}</span>
                      <span>📍 <strong>Venue:</strong> ${b.message && b.message.startsWith('[') ? b.message.split(']')[0].replace('[','') : 'Flagship Experience Center'}</span>
                      <span>📞 <strong>Contact:</strong> +91 ${b.phone}</span>
                    </div>

                    <!-- Progress tracker -->
                    <div style="display:flex; gap:12px; margin-top:10px; font-size:0.75rem; color:var(--ink-500); font-weight:600;">
                      <span style="color:#16a34a;">✓ Scheduled</span>
                      <span>→</span>
                      <span style="color:#16a34a;">✓ Vehicle Prepped</span>
                      <span>→</span>
                      <span style="color:var(--amber-600);">⏳ Concierge Ready</span>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <div id="tab-orders" class="cw-tab-pane">
        ${orders.length === 0 ? `
          <div class="cw-empty-activity">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--ink-500); margin-bottom: 12px;"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <h3>No car purchases or reservations yet</h3>
            <p>Ready to reserve your next vehicle? Choose between a ₹25,000 refundable token or advance down payment.</p>
            <a href="browse.html" class="btn btn--amber" style="margin-top: 16px;">Browse Cars to Buy →</a>
          </div>
        ` : `
          <div class="cw-activity-list">
            ${orders.map(o => {
              const car = getCarById(o.car_id);
              const carTitle = car ? `${car.brand} ${car.name}` : (o.car_name || o.car_id);
              return `
                <div class="cw-activity-card" style="display: flex; gap: 16px; align-items: flex-start;">
                  ${car ? `<img src="${car.image || `img/${car.id}.jpg`}" alt="${carTitle}" style="width: 90px; height: 68px; object-fit: cover; border-radius: 8px; flex-shrink: 0; box-shadow: var(--shadow-sm);" onerror="this.style.display='none';" />` : ''}
                  <div style="flex: 1; min-width: 0;">
                    <div class="cw-activity-card__head">
                      <div>
                        <strong>${carTitle}</strong>
                        <span style="font-size: 0.8rem; color: var(--ink-500); margin-left: 8px;">Order Ref #${(o.id || '').slice(0, 8).toUpperCase()}</span>
                      </div>
                      <span class="cw-badge cw-badge--gold">Verified Reservation</span>
                    </div>
                    <div class="cw-activity-card__meta">
                      <span>💰 <strong>Paid:</strong> ${formatPrice(o.amount)}</span>
                      <span>🧾 <strong>Txn Ref:</strong> <code class="cw-code">${o.razorpay_payment_id || o.payment_id || 'N/A'}</code></span>
                      <span>📅 <strong>Date:</strong> ${new Date(o.created_at).toLocaleDateString()}</span>
                    </div>

                    <!-- Progress tracker -->
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                      <div style="display:flex; gap:12px; font-size:0.75rem; color:var(--ink-500); font-weight:600;">
                        <span style="color:#16a34a;">✓ Payment Confirmed</span>
                        <span>→</span>
                        <span style="color:var(--amber-600);">⏳ Hub Assigned</span>
                        <span>→</span>
                        <span>📄 Delivery Handover</span>
                      </div>
                      <button class="btn btn--ghost-small" style="padding:4px 10px; font-size:0.76rem;" onclick="window.print()">🖨️ Print Invoice</button>
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    </div>
  `;

  // Tab switching
  const tabs = mount.querySelectorAll(".cw-tab-btn");
  const panes = mount.querySelectorAll(".cw-tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("is-active"));
      panes.forEach(p => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      const targetId = tab.dataset.tab;
      const targetEl = mount.querySelector(`#${targetId}`);
      if (targetEl) targetEl.classList.add("is-active");
    });
  });
});
