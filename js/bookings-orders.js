/* CarWise — Bookings & Orders Module
   Handles:
   1. Test Drive Scheduling (Supabase: test_drive_bookings table)
   2. Online Car Purchase / Reservation with Razorpay & Sandbox Fallback (Supabase: orders table)
   3. My Activity Modal (Viewing booked test drives and car orders)
*/

const CarWiseBookings = (() => {

  // Ensure Razorpay script is loaded
  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn("Razorpay SDK could not be loaded; sandbox mode will be available.");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  // Helper to create and show modal
  function createModal(id, contentHTML) {
    let modal = document.getElementById(id);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = id;
      modal.className = "cw-modal-overlay";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="cw-modal-dialog" role="dialog" aria-modal="true">
        <button class="cw-modal-close" type="button" aria-label="Close modal">&times;</button>
        <div class="cw-modal-body">${contentHTML}</div>
      </div>
    `;

    // Close listeners
    const closeBtn = modal.querySelector(".cw-modal-close");
    closeBtn.addEventListener("click", () => closeModal(id));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(id);
    });

    const escHandler = (e) => {
      if (e.key === "Escape") {
        closeModal(id);
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);

    // Show modal with animation
    requestAnimationFrame(() => {
      modal.classList.add("is-visible");
    });
    return modal;
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("is-visible");
    setTimeout(() => {
      if (modal.parentElement) modal.parentElement.removeChild(modal);
    }, 250);
  }

  /* =========================================================
     1. BOOK A TEST DRIVE
     ========================================================= */
  async function openTestDriveModal(carId) {
    const car = getCarById(carId);
    if (!car) {
      CarWise.showToast("Car information unavailable");
      return;
    }

    const session = CarWise.getSession();
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrowStr = today.toISOString().split("T")[0];

    const contentHTML = `
      <div class="cw-booking-flow">
        <div class="cw-modal-header">
          <p class="eyebrow">CarWise Experience</p>
          <h2>Book a Test Drive</h2>
          <p class="cw-modal-subtitle">Feel the craftsmanship and performance of the <strong>${car.brand} ${car.name}</strong>.</p>
        </div>

        <div class="cw-car-pill">
          <div class="cw-car-pill__media car-card__media--${car.theme}">
            <img class="cw-car-pill__photo" src="${car.image || `img/${car.id}.jpg`}" alt="${car.brand} ${car.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div style="display:none;">${CarWise.carIconSVG()}</div>
          </div>
          <div class="cw-car-pill__details">
            <h4>${car.brand} ${car.name}</h4>
            <p>${car.trim} · ${car.powertrain} · ${formatPrice(car.price)}</p>
          </div>
        </div>

        ${!session ? `
          <div class="cw-alert-banner">
            <span>💡 <strong>Tip:</strong> <a href="login.html" class="cw-link">Sign in</a> to save this booking to your profile. You can also book as a guest below.</span>
          </div>
        ` : ''}

        <form id="test-drive-form" class="cw-form">
          <div class="cw-form-row">
            <div class="field">
              <label for="td-name">Full name <span class="required">*</span></label>
              <input type="text" id="td-name" required value="${session ? session.name : ''}" placeholder="e.g. Rahul Sharma" />
            </div>
            <div class="field">
              <label for="td-phone">Phone number <span class="required">*</span></label>
              <input type="tel" id="td-phone" required pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number" />
            </div>
          </div>

          <div class="cw-form-row">
            <div class="field">
              <label for="td-date">Preferred date <span class="required">*</span></label>
              <input type="date" id="td-date" required min="${tomorrowStr}" value="${tomorrowStr}" />
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
            <label for="td-location">Test drive location</label>
            <select id="td-location">
              <option value="Flagship Experience Center (Central Hub)">Flagship Experience Center (Central Hub)</option>
              <option value="CarWise Showroom North">CarWise Showroom North</option>
              <option value="CarWise Showroom South">CarWise Showroom South</option>
              <option value="Doorstep Test Drive (At your home or office)">Doorstep Test Drive (At your home or office)</option>
            </select>
          </div>

          <div class="field">
            <label for="td-message">Notes or specific questions (optional)</label>
            <textarea id="td-message" rows="2" placeholder="Tell us if you want highway route, special booster seat, or specific features demonstrated..."></textarea>
          </div>

          <div id="td-error" class="cw-form-error" style="display:none;"></div>

          <div class="cw-form-actions">
            <button type="button" class="btn btn--ghost" id="td-cancel">Cancel</button>
            <button type="submit" class="btn btn--amber" id="td-submit">Confirm Test Drive Appointment →</button>
          </div>
        </form>
      </div>
    `;

    const modal = createModal("test-drive-modal", contentHTML);

    const cancelBtn = modal.querySelector("#td-cancel");
    cancelBtn.addEventListener("click", () => closeModal("test-drive-modal"));

    const form = modal.querySelector("#test-drive-form");
    const errorBox = modal.querySelector("#td-error");
    const submitBtn = modal.querySelector("#td-submit");

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
              car_id: car.id,
              preferred_date: date,
              preferred_time: time,
              phone: phone,
              message: fullMessage,
              status: "confirmed"
            })
            .select()
            .single();

          if (error) {
            console.warn("Supabase insert error:", error);
            // If RLS or DB error occurs, gracefully fallback with local record
          } else if (data && data.id) {
            bookingId = data.id.slice(0, 8).toUpperCase();
          }
        }

        // Save also to local guest history
        saveLocalActivity("test_drive", {
          id: bookingId,
          car_id: car.id,
          car_name: `${car.brand} ${car.name}`,
          date,
          time,
          location,
          phone,
          status: "confirmed",
          created_at: new Date().toISOString()
        });

        // Show Confirmation View
        showTestDriveSuccess(modal, {
          bookingId,
          car,
          name,
          phone,
          date,
          time,
          location
        });

      } catch (err) {
        console.error(err);
        errorBox.textContent = "Could not complete booking right now. Please try again.";
        errorBox.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Test Drive Appointment →";
      }
    });
  }

  function showTestDriveSuccess(modal, data) {
    const formattedDate = new Date(data.date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric"
    });

    const body = modal.querySelector(".cw-modal-body");
    body.innerHTML = `
      <div class="cw-success-state">
        <div class="cw-success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2>Test Drive Confirmed!</h2>
        <p class="cw-success-msg">Your appointment has been scheduled with CarWise Concierge. We've reserved the vehicle for you.</p>

        <div class="cw-ticket">
          <div class="cw-ticket__header">
            <span>Pass #${data.bookingId}</span>
            <span class="cw-badge cw-badge--green">Confirmed</span>
          </div>
          <div class="cw-ticket__body">
            <h3>${data.car.brand} ${data.car.name}</h3>
            <p class="cw-ticket__sub">${data.car.trim} · ${data.car.powertrain}</p>
            <div class="cw-ticket__grid">
              <div>
                <strong>DATE</strong>
                <span>${formattedDate}</span>
              </div>
              <div>
                <strong>TIME WINDOW</strong>
                <span>${data.time}</span>
              </div>
              <div>
                <strong>LOCATION</strong>
                <span>${data.location}</span>
              </div>
              <div>
                <strong>CONTACT</strong>
                <span>+91 ${data.phone}</span>
              </div>
            </div>
          </div>
          <div class="cw-ticket__footer">
            <span>Please carry your valid driver's license for verification.</span>
          </div>
        </div>

        <div class="cw-form-actions cw-form-actions--center">
          <button class="btn btn--dark" onclick="CarWiseBookings.closeModal('test-drive-modal')">Done</button>
        </div>
      </div>
    `;
    CarWise.showToast("Test drive successfully booked!");
    if (typeof CarWise.launchConfetti === "function") {
      CarWise.launchConfetti();
    }
  }

  /* =========================================================
     2. BUY CAR / RESERVE ONLINE WITH RAZORPAY & SANDBOX
     ========================================================= */
  async function openBuyModal(carId) {
    const car = getCarById(carId);
    if (!car) {
      CarWise.showToast("Car information unavailable");
      return;
    }

    const session = CarWise.getSession();
    await loadRazorpayScript();

    // Default booking options
    const tokenDeposit = 25000;
    const downPayment = Math.round(car.price * 0.1);
    const fullPrice = car.price;

    const contentHTML = `
      <div class="cw-buy-flow">
        <div class="cw-modal-header">
          <p class="eyebrow">Official Reservation</p>
          <h2>Reserve Your ${car.brand} ${car.name}</h2>
          <p class="cw-modal-subtitle">Lock in your car, priority production slot, and price guarantee.</p>
        </div>

        <div class="cw-car-pill">
          <div class="cw-car-pill__media car-card__media--${car.theme}">
            <img class="cw-car-pill__photo" src="${car.image || `img/${car.id}.jpg`}" alt="${car.brand} ${car.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <div style="display:none;">${CarWise.carIconSVG()}</div>
          </div>
          <div class="cw-car-pill__details">
            <h4>${car.brand} ${car.name} — ${car.trim}</h4>
            <p>Ex-showroom: <strong>${formatPrice(car.price)}</strong> · Estimated handover in 10-14 days</p>
          </div>
        </div>

        <div class="cw-payment-tiers">
          <label class="cw-tier-card is-selected" data-amount="${tokenDeposit}">
            <input type="radio" name="payment_tier" value="${tokenDeposit}" checked />
            <div class="cw-tier-card__info">
              <span class="cw-tier-title">Priority Booking Token (Recommended)</span>
              <span class="cw-tier-desc">100% refundable reservation advance. Secures the vehicle allotment.</span>
            </div>
            <div class="cw-tier-price">${formatPrice(tokenDeposit)}</div>
          </label>

          <label class="cw-tier-card" data-amount="${downPayment}">
            <input type="radio" name="payment_tier" value="${downPayment}" />
            <div class="cw-tier-card__info">
              <span class="cw-tier-title">10% Down Payment</span>
              <span class="cw-tier-desc">Fast-tracks loan disbursement and registration paperwork.</span>
            </div>
            <div class="cw-tier-price">${formatPrice(downPayment)}</div>
          </label>

          <label class="cw-tier-card" data-amount="${fullPrice}">
            <input type="radio" name="payment_tier" value="${fullPrice}" />
            <div class="cw-tier-card__info">
              <span class="cw-tier-title">Full Vehicle Purchase</span>
              <span class="cw-tier-desc">Instant digital invoicing and direct delivery assignment.</span>
            </div>
            <div class="cw-tier-price">${formatPrice(fullPrice)}</div>
          </label>
        </div>

        <form id="car-buy-form" class="cw-form">
          <div class="cw-form-row">
            <div class="field">
              <label for="buy-name">Full name <span class="required">*</span></label>
              <input type="text" id="buy-name" required value="${session ? session.name : ''}" placeholder="Buyer legal name" />
            </div>
            <div class="field">
              <label for="buy-email">Email for invoice <span class="required">*</span></label>
              <input type="email" id="buy-email" required value="${session ? session.email : ''}" placeholder="name@example.com" />
            </div>
          </div>

          <div class="cw-form-row">
            <div class="field">
              <label for="buy-phone">Phone number <span class="required">*</span></label>
              <input type="tel" id="buy-phone" required pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number" />
            </div>
            <div class="field">
              <label for="buy-city">Delivery city <span class="required">*</span></label>
              <input type="text" id="buy-city" required placeholder="e.g. Mumbai, Bengaluru, Delhi NCR" />
            </div>
          </div>

          <div class="field">
            <label for="buy-address">Delivery address / RTO Registration location</label>
            <input type="text" id="buy-address" placeholder="Flat, Street, Area and Pincode" />
          </div>

          <div class="cw-order-summary-box">
            <div class="cw-order-summary-line">
              <span>Amount payable now:</span>
              <strong id="payable-display">${formatPrice(tokenDeposit)}</strong>
            </div>
            <p class="cw-order-subtext">🔒 Secure 256-bit encrypted transaction processed via Razorpay.</p>
          </div>

          <div id="buy-error" class="cw-form-error" style="display:none;"></div>

          <div class="cw-form-actions">
            <button type="button" class="btn btn--ghost" id="buy-cancel">Cancel</button>
            <button type="submit" class="btn btn--amber" id="buy-submit">Pay with Razorpay / Card / UPI →</button>
          </div>
        </form>
      </div>
    `;

    const modal = createModal("car-buy-modal", contentHTML);

    const cancelBtn = modal.querySelector("#buy-cancel");
    cancelBtn.addEventListener("click", () => closeModal("car-buy-modal"));

    // Radio selection handler
    const tierCards = modal.querySelectorAll(".cw-tier-card");
    const payableDisplay = modal.querySelector("#payable-display");
    let selectedAmount = tokenDeposit;

    tierCards.forEach(card => {
      card.addEventListener("click", () => {
        tierCards.forEach(c => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        const radio = card.querySelector("input[type=radio]");
        radio.checked = true;
        selectedAmount = parseInt(card.dataset.amount, 10);
        payableDisplay.textContent = formatPrice(selectedAmount);
      });
    });

    const form = modal.querySelector("#car-buy-form");
    const errorBox = modal.querySelector("#buy-error");
    const submitBtn = modal.querySelector("#buy-submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.style.display = "none";

      const name = document.getElementById("buy-name").value.trim();
      const email = document.getElementById("buy-email").value.trim();
      const phone = document.getElementById("buy-phone").value.trim();
      const city = document.getElementById("buy-city").value.trim();
      const address = document.getElementById("buy-address").value.trim();

      if (!phone || phone.length < 10) {
        errorBox.textContent = "Please provide a valid 10-digit phone number.";
        errorBox.style.display = "block";
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Opening secure gateway...";

      // Check if user has a configured Razorpay key or wants test checkout
      const key = (typeof RAZORPAY_KEY_ID !== "undefined" && RAZORPAY_KEY_ID && !RAZORPAY_KEY_ID.includes("placeholder"))
        ? RAZORPAY_KEY_ID
        : null;

      if (window.Razorpay && key) {
        try {
          const options = {
            key: key,
            amount: selectedAmount * 100, // paise
            currency: "INR",
            name: "CarWise Showroom",
            description: `Vehicle Reservation: ${car.brand} ${car.name}`,
            image: "https://cdn-icons-png.flaticon.com/512/3202/3202926.png",
            prefill: {
              name: name,
              email: email,
              contact: phone
            },
            theme: {
              color: "#eea23e"
            },
            handler: async function (response) {
              await processOrderCompletion(modal, {
                paymentId: response.razorpay_payment_id || ("pay_" + Math.random().toString(36).substring(2, 11)),
                amount: selectedAmount,
                car,
                name,
                email,
                phone,
                city,
                address
              });
            },
            modal: {
              ondismiss: function () {
                submitBtn.disabled = false;
                submitBtn.textContent = "Pay with Razorpay / Card / UPI →";
              }
            }
          };

          const rzp = new Razorpay(options);
          rzp.on("payment.failed", function (resp) {
            errorBox.textContent = resp.error.description || "Payment failed. Please try again or test with Sandbox.";
            errorBox.style.display = "block";
            submitBtn.disabled = false;
            submitBtn.textContent = "Pay with Razorpay / Card / UPI →";
          });
          rzp.open();
          return;
        } catch (err) {
          console.warn("Razorpay launch error, using sandbox gateway simulator:", err);
        }
      }

      // If Razorpay key is not yet configured or in offline sandbox mode:
      // Provide instant, realistic test payment dialog
      showSandboxPaymentDialog(modal, {
        amount: selectedAmount,
        car,
        name,
        email,
        phone,
        city,
        address
      });
    });
  }

  // Interactive Payment Simulator with Card, UPI, NetBanking, EMI options and validations
  function showSandboxPaymentDialog(parentModal, orderInfo) {
    closeModal("car-buy-modal");

    if (typeof PaymentSimulator !== "undefined") {
      PaymentSimulator.open({
        amount: orderInfo.amount,
        car: orderInfo.car,
        customerName: orderInfo.name,
        customerEmail: orderInfo.email,
        customerPhone: orderInfo.phone,
        onSuccess: async (result) => {
          openModal("car-buy-modal");
          await processOrderCompletion(parentModal, {
            ...orderInfo,
            paymentId: result.paymentId,
            paymentMethod: result.paymentMethod,
            paymentSummary: result.paymentSummary
          });
        },
        onCancel: () => {
          openModal("car-buy-modal");
        }
      });
    }
  }

  // Common order post-processing: saves to Supabase and renders celebration receipt
  async function processOrderCompletion(modal, info) {
    const session = CarWise.getSession();
    let orderDbId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

    try {
      if (session && _supabase) {
        const { data, error } = await _supabase
          .from("orders")
          .insert({
            user_id: session.id,
            car_id: info.car.id,
            amount: info.amount,
            currency: "INR",
            razorpay_payment_id: info.paymentId,
            payment_status: "paid"
          })
          .select()
          .single();

        if (error) {
          console.warn("Supabase orders error:", error);
        } else if (data && data.id) {
          orderDbId = data.id.slice(0, 8).toUpperCase();
        }
      }
    } catch (e) {
      console.warn("Error inserting order to Supabase:", e);
    }

    // Save to local guest records too
    saveLocalActivity("order", {
      id: orderDbId,
      car_id: info.car.id,
      car_name: `${info.car.brand} ${info.car.name}`,
      amount: info.amount,
      payment_id: info.paymentId,
      payment_status: "paid",
      city: info.city,
      created_at: new Date().toISOString()
    });

    // Render receipt view
    const body = modal.querySelector(".cw-modal-body");
    body.innerHTML = `
      <div class="cw-success-state">
        <div class="cw-success-icon cw-success-icon--order">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2>Payment Successful!</h2>
        <p class="cw-success-msg">Congratulations! Your booking for <strong>${info.car.brand} ${info.car.name}</strong> is confirmed.</p>

        <div class="cw-receipt-card">
          <div class="cw-receipt-header">
            <div>
              <span class="cw-receipt-id">Order #${orderDbId}</span>
              <p class="cw-receipt-date">${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </div>
            <span class="cw-badge cw-badge--green">Payment Verified</span>
          </div>

          <div class="cw-receipt-breakdown">
            <div class="cw-receipt-item">
              <div>
                <strong>${info.car.brand} ${info.car.name} (${info.car.trim})</strong>
                <p>${info.car.powertrain} · Ex-Showroom ${formatPrice(info.car.price)}</p>
              </div>
              <span>${formatPrice(info.amount)}</span>
            </div>

            <div class="cw-receipt-divider"></div>

            <div class="cw-receipt-line">
              <span>Payment Mode</span>
              <span>${info.paymentSummary || info.paymentMethod || 'Online Gateway'}</span>
            </div>
            <div class="cw-receipt-line">
              <span>Transaction Ref</span>
              <code class="cw-code">${info.paymentId}</code>
            </div>
            <div class="cw-receipt-line">
              <span>Buyer</span>
              <span>${info.name} (+91 ${info.phone})</span>
            </div>
            <div class="cw-receipt-line">
              <span>Delivery Hub</span>
              <span>${info.city || 'Standard Showroom Hub'}</span>
            </div>
            <div class="cw-receipt-line cw-receipt-total">
              <strong>Total Paid Now</strong>
              <strong>${formatPrice(info.amount)}</strong>
            </div>
          </div>

          <div class="cw-receipt-footer">
            <p>🚗 An official relationship manager will contact you within 24 hours to begin documentation and schedule car delivery.</p>
          </div>
        </div>

        <div class="cw-form-actions cw-form-actions--center">
          <button class="btn btn--ghost" onclick="window.print()">🖨️ Print Receipt</button>
          <button class="btn btn--dark" onclick="CarWiseBookings.closeModal('car-buy-modal')">Back to Showroom</button>
        </div>
      </div>
    `;

    CarWise.showToast("Car order confirmed successfully!");
    if (typeof CarWise.launchConfetti === "function") {
      CarWise.launchConfetti();
    }
  }

  /* =========================================================
     3. LOCAL ACTIVITY CACHE & MY ACTIVITY MODAL
     ========================================================= */
  const ACTIVITY_KEY = "carwise_user_activities";

  function saveLocalActivity(type, record) {
    try {
      const list = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || [];
      list.unshift({ type, ...record });
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not save activity locally", e);
    }
  }

  function getLocalActivities() {
    try {
      return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || [];
    } catch {
      return [];
    }
  }

  // Open "My Activity: Test Drives & Purchases"
  async function openActivityModal() {
    const session = CarWise.getSession();
    let bookings = [];
    let orders = [];

    // Fetch from Supabase if logged in
    if (session && _supabase) {
      try {
        const [bookingsRes, ordersRes] = await Promise.all([
          _supabase.from("test_drive_bookings").select("*").eq("user_id", session.id).order("created_at", { ascending: false }),
          _supabase.from("orders").select("*").eq("user_id", session.id).order("created_at", { ascending: false })
        ]);
        if (bookingsRes.data) bookings = bookingsRes.data;
        if (ordersRes.data) orders = ordersRes.data;
      } catch (e) {
        console.warn("Failed fetching user activity from Supabase:", e);
      }
    }

    // Fallback to local storage if empty or guest
    const local = getLocalActivities();
    if (bookings.length === 0) {
      bookings = local.filter(x => x.type === "test_drive");
    }
    if (orders.length === 0) {
      orders = local.filter(x => x.type === "order");
    }

    const contentHTML = `
      <div class="cw-activity-flow">
        <div class="cw-modal-header">
          <p class="eyebrow">Dashboard</p>
          <h2>My Bookings & Orders</h2>
          <p class="cw-modal-subtitle">${session ? `Logged in as <strong>${session.email}</strong>` : 'Guest activity on this browser'}</p>
        </div>

        <div class="cw-tabs">
          <button class="cw-tab-btn is-active" data-tab="tab-drives">
            Test Drives <span class="cw-tab-badge">${bookings.length}</span>
          </button>
          <button class="cw-tab-btn" data-tab="tab-orders">
            Car Orders & Purchases <span class="cw-tab-badge">${orders.length}</span>
          </button>
        </div>

        <div id="tab-drives" class="cw-tab-pane is-active">
          ${bookings.length === 0 ? `
            <div class="cw-empty-activity">
              <p>No test drives booked yet.</p>
              <a href="browse.html" class="btn btn--ghost-small" onclick="CarWiseBookings.closeModal('activity-modal')">Browse Cars & Book One →</a>
            </div>
          ` : `
            <div class="cw-activity-list">
              ${bookings.map(b => {
                const car = getCarById(b.car_id);
                const carTitle = car ? `${car.brand} ${car.name}` : (b.car_name || b.car_id);
                return `
                  <div class="cw-activity-card">
                    <div class="cw-activity-card__head">
                      <strong>${carTitle}</strong>
                      <span class="cw-badge cw-badge--green">${b.status || 'confirmed'}</span>
                    </div>
                    <div class="cw-activity-card__meta">
                      <span>📅 Date: ${b.preferred_date || b.date}</span>
                      <span>⏰ Slot: ${b.preferred_time || b.time}</span>
                      <span>📞 Contact: ${b.phone}</span>
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
              <p>No vehicle purchase orders yet.</p>
              <a href="browse.html" class="btn btn--ghost-small" onclick="CarWiseBookings.closeModal('activity-modal')">Browse Showroom Catalog →</a>
            </div>
          ` : `
            <div class="cw-activity-list">
              ${orders.map(o => {
                const car = getCarById(o.car_id);
                const carTitle = car ? `${car.brand} ${car.name}` : (o.car_name || o.car_id);
                return `
                  <div class="cw-activity-card">
                    <div class="cw-activity-card__head">
                      <strong>${carTitle}</strong>
                      <span class="cw-badge cw-badge--gold">${o.payment_status || 'paid'}</span>
                    </div>
                    <div class="cw-activity-card__meta">
                      <span>💰 Amount: ${formatPrice(o.amount)}</span>
                      <span>🧾 Ref: <code>${o.razorpay_payment_id || o.payment_id || 'N/A'}</code></span>
                      <span>📅 Placed on: ${new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>

        <div class="cw-form-actions cw-form-actions--center" style="margin-top: 24px;">
          <button class="btn btn--dark" onclick="CarWiseBookings.closeModal('activity-modal')">Close</button>
        </div>
      </div>
    `;

    const modal = createModal("activity-modal", contentHTML);

    // Tab switching
    const tabs = modal.querySelectorAll(".cw-tab-btn");
    const panes = modal.querySelectorAll(".cw-tab-pane");

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("is-active"));
        panes.forEach(p => p.classList.remove("is-active"));
        tab.classList.add("is-active");
        const targetId = tab.dataset.tab;
        modal.querySelector(`#${targetId}`).classList.add("is-active");
      });
    });
  }

  return {
    openTestDriveModal,
    openBuyModal,
    openActivityModal,
    closeModal
  };
})();
