document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("test-drive");

  const mount = document.getElementById("test-drive-mount");
  const params = new URLSearchParams(window.location.search);
  let selectedCarId = params.get("id") || (CARS.length > 0 ? CARS[0].id : null);
  let selectedCar = getCarById(selectedCarId) || CARS[0];

  const session = CarWise.getSession();
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDateStr = today.toISOString().split("T")[0];

  function renderPage() {
    if (!selectedCar) {
      mount.innerHTML = `<div class="empty-state"><h3>No cars found</h3><a href="browse.html" class="btn btn--dark">Browse catalog</a></div>`;
      return;
    }

    mount.innerHTML = `
      <div class="cw-booking-flow">
        <div class="cw-modal-header" style="text-align: left; margin-bottom: 24px;">
          <p class="eyebrow">CarWise Showroom</p>
          <h2 style="font-size: 2rem;">Book a Test Drive</h2>
          <p class="cw-modal-subtitle">Experience the performance, comfort, and handling of the <strong>${selectedCar.brand} ${selectedCar.name}</strong>.</p>
        </div>

        <div class="field" style="margin-bottom: 20px;">
          <label for="car-selector" style="font-weight: 600; font-size: 0.9rem; margin-bottom: 6px; display: block;">Select Vehicle Model</label>
          <select id="car-selector" style="width: 100%; padding: 12px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--line); font-size: 0.95rem; background: #fff;">
            ${CARS.map(c => `
              <option value="${c.id}" ${c.id === selectedCar.id ? 'selected' : ''}>
                ${c.brand} ${c.name} — ${c.trim} (${c.powertrain}) — ${formatPrice(c.price)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="cw-car-pill" style="margin-bottom: 24px;">
          <div class="cw-car-pill__media car-card__media--${selectedCar.theme}">
            <img class="cw-car-pill__photo" src="${selectedCar.image || `img/${selectedCar.id}.jpg`}" alt="${selectedCar.brand} ${selectedCar.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div style="display:none;">${CarWise.carIconSVG()}</div>
          </div>
          <div class="cw-car-pill__details">
            <h4>${selectedCar.brand} ${selectedCar.name}</h4>
            <p>${selectedCar.trim} · ${selectedCar.powertrain} · ${selectedCar.range} ${selectedCar.rangeUnit} · ${formatPrice(selectedCar.price)}</p>
          </div>
        </div>

        ${!session ? `
          <div class="cw-alert-banner">
            <span>💡 <strong>Tip:</strong> <a href="login.html" class="cw-link">Sign in to your CarWise account</a> to automatically sync this test drive and view it in My Activity. Guest bookings are also supported!</span>
          </div>
        ` : ''}

        <form id="td-page-form" class="cw-form">
          <div class="cw-form-row">
            <div class="field">
              <label for="td-name">Full name <span class="required">*</span></label>
              <input type="text" id="td-name" required value="${session ? session.name : ''}" placeholder="e.g. Rahul Sharma" />
            </div>
            <div class="field">
              <label for="td-phone">10-Digit Mobile Number <span class="required">*</span></label>
              <input type="tel" id="td-phone" required pattern="[0-9]{10}" maxlength="10" placeholder="Mobile number" />
            </div>
          </div>

          <div class="cw-form-row">
            <div class="field">
              <label for="td-date">Preferred date <span class="required">*</span></label>
              <input type="date" id="td-date" required min="${minDateStr}" value="${minDateStr}" />
            </div>
            <div class="field">
              <label for="td-time">Preferred time window <span class="required">*</span></label>
              <select id="td-time" required>
                <option value="10:00 AM - 01:00 PM">10:00 AM - 01:00 PM (Morning)</option>
                <option value="01:00 PM - 04:00 PM" selected>01:00 PM - 04:00 PM (Afternoon)</option>
                <option value="04:00 PM - 07:00 PM">04:00 PM - 07:00 PM (Evening)</option>
                <option value="07:00 PM - 08:30 PM">07:00 PM - 08:30 PM (Sunset / Night)</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="td-location">Test drive venue</label>
            <select id="td-location">
              <option value="Flagship Experience Center (Central Hub)">Flagship Experience Center (Central Hub)</option>
              <option value="CarWise Showroom North">CarWise Showroom North</option>
              <option value="CarWise Showroom South">CarWise Showroom South</option>
              <option value="Doorstep Test Drive (At your home or office)">Doorstep Test Drive (At your home or office)</option>
            </select>
          </div>

          <div class="field">
            <label for="td-message">Notes or specific requests (optional)</label>
            <textarea id="td-message" rows="2" placeholder="Tell us if you want highway route, special booster seat, or specific features demonstrated..."></textarea>
          </div>

          <div id="td-error" class="cw-form-error" style="display:none;"></div>

          <div class="cw-form-actions" style="margin-top: 24px;">
            <a href="browse.html" class="btn btn--ghost">← Back to Catalog</a>
            <button type="submit" class="btn btn--amber" id="td-submit">Confirm Test Drive Appointment →</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("car-selector").addEventListener("change", (e) => {
      selectedCar = getCarById(e.target.value);
      renderPage();
    });

    const form = document.getElementById("td-page-form");
    const errorBox = document.getElementById("td-error");
    const submitBtn = document.getElementById("td-submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";

      const name = document.getElementById("td-name").value.trim();
      const phone = document.getElementById("td-phone").value.trim();
      const date = document.getElementById("td-date").value;
      const time = document.getElementById("td-time").value;
      const location = document.getElementById("td-location").value;
      const notes = document.getElementById("td-message").value.trim();

      if (!phone || phone.length < 10) {
        errorBox.textContent = "Please enter a valid 10-digit phone number.";
        errorBox.style.display = "block";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Scheduling appointment...";

      const fullMessage = `${location ? `[${location}] ` : ''}${notes}`.trim();

      try {
        let bookingId = "TD-" + Math.floor(100000 + Math.random() * 900000);

        if (session && _supabase) {
          const { data, error } = await _supabase
            .from("test_drive_bookings")
            .insert({
              user_id: session.id,
              car_id: selectedCar.id,
              preferred_date: date,
              preferred_time: time,
              phone: phone,
              message: fullMessage,
              status: "confirmed"
            })
            .select()
            .single();

          if (!error && data && data.id) {
            bookingId = data.id.slice(0, 8).toUpperCase();
          }
        }

        // Also record in local activity cache
        const activityList = JSON.parse(localStorage.getItem("carwise_user_activities")) || [];
        activityList.unshift({
          type: "test_drive",
          id: bookingId,
          car_id: selectedCar.id,
          car_name: `${selectedCar.brand} ${selectedCar.name}`,
          date,
          time,
          location,
          phone,
          status: "confirmed",
          created_at: new Date().toISOString()
        });
        localStorage.setItem("carwise_user_activities", JSON.stringify(activityList));

        // Render ticket
        const formattedDate = new Date(date).toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric"
        });

        mount.innerHTML = `
          <div class="cw-success-state">
            <div class="cw-success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2>Test Drive Confirmed!</h2>
            <p class="cw-success-msg">Your appointment has been reserved with CarWise Concierge for <strong>${selectedCar.brand} ${selectedCar.name}</strong>.</p>

            <div class="cw-ticket" style="max-width: 600px; margin: 24px auto;">
              <div class="cw-ticket__header">
                <span>Pass #${bookingId}</span>
                <span class="cw-badge cw-badge--green">Confirmed</span>
              </div>
              <div class="cw-ticket__body">
                <h3>${selectedCar.brand} ${selectedCar.name}</h3>
                <p class="cw-ticket__sub">${selectedCar.trim} · ${selectedCar.powertrain}</p>
                <div class="cw-ticket__grid">
                  <div>
                    <strong>DATE</strong>
                    <span>${formattedDate}</span>
                  </div>
                  <div>
                    <strong>TIME WINDOW</strong>
                    <span>${time}</span>
                  </div>
                  <div>
                    <strong>LOCATION</strong>
                    <span>${location}</span>
                  </div>
                  <div>
                    <strong>CONTACT</strong>
                    <span>+91 ${phone}</span>
                  </div>
                </div>
              </div>
              <div class="cw-ticket__footer">
                <span>Please carry your valid driver's license for verification on the day of the drive.</span>
              </div>
            </div>

            <div class="cw-form-actions cw-form-actions--center" style="gap: 16px;">
              <a href="activity.html" class="btn btn--amber">View in My Activity →</a>
              <a href="browse.html" class="btn btn--dark">Back to Showroom</a>
            </div>
          </div>
        `;
        CarWise.showToast("Test drive successfully booked!");
        if (typeof CarWise.launchConfetti === "function") {
          CarWise.launchConfetti();
        }
      } catch (err) {
        console.error(err);
        errorBox.textContent = "Could not complete booking right now. Please try again.";
        errorBox.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Test Drive Appointment →";
      }
    });
  }

  renderPage();
});
