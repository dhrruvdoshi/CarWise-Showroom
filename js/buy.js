document.addEventListener("DOMContentLoaded", async () => {
  await CarWise.init("buy");

  const container = document.getElementById("buy-page-container");
  const params = new URLSearchParams(window.location.search);
  let selectedCarId = params.get("id") || (CARS.length > 0 ? CARS[0].id : null);
  let selectedCar = getCarById(selectedCarId) || CARS[0];

  const session = CarWise.getSession();

  function renderCheckout() {
    if (!selectedCar) {
      container.innerHTML = `<div class="empty-state"><h3>No car selected</h3><a href="browse.html" class="btn btn--dark">Browse showroom catalog</a></div>`;
      return;
    }

    const tokenDeposit = 25000;
    const downPayment = Math.round(selectedCar.price * 0.1);
    const fullPrice = selectedCar.price;
    let selectedAmount = tokenDeposit;

    container.innerHTML = `
      <div class="checkout-layout">
        <div class="checkout-panel">
          <div class="cw-modal-header" style="text-align: left; margin-bottom: 24px;">
            <p class="eyebrow">Direct Online Booking</p>
            <h2 style="font-size: 1.85rem;">Vehicle Allocation & Payment</h2>
            <p class="cw-modal-subtitle">Choose your advance booking plan for the <strong>${selectedCar.brand} ${selectedCar.name}</strong>.</p>
          </div>

          <div class="field" style="margin-bottom: 22px;">
            <label for="checkout-car-selector" style="font-weight: 600; font-size: 0.88rem; margin-bottom: 6px; display: block;">Change Vehicle Model</label>
            <select id="checkout-car-selector" style="width: 100%; padding: 11px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--line); font-size: 0.92rem; background: #fff;">
              ${CARS.map(c => `
                <option value="${c.id}" ${c.id === selectedCar.id ? 'selected' : ''}>
                  ${c.brand} ${c.name} — ${c.trim} (${c.powertrain}) — ${formatPrice(c.price)}
                </option>
              `).join('')}
            </select>
          </div>

          <label style="font-weight: 600; font-size: 0.88rem; margin-bottom: 10px; display: block;">Select Payment Plan</label>
          <div class="cw-payment-tiers">
            <label class="cw-tier-card is-selected" data-amount="${tokenDeposit}">
              <input type="radio" name="payment_tier" value="${tokenDeposit}" checked />
              <div class="cw-tier-card__info">
                <span class="cw-tier-title">Priority Reservation Token (Recommended)</span>
                <span class="cw-tier-desc">100% refundable reservation advance. Secures the vehicle allotment immediately.</span>
              </div>
              <div class="cw-tier-price">${formatPrice(tokenDeposit)}</div>
            </label>

            <label class="cw-tier-card" data-amount="${downPayment}">
              <input type="radio" name="payment_tier" value="${downPayment}" />
              <div class="cw-tier-card__info">
                <span class="cw-tier-title">10% Down Payment Advance</span>
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

          <form id="checkout-form" class="cw-form" style="margin-top: 24px;">
            <h3 style="font-size: 1.2rem; margin-bottom: 6px;">Buyer Information</h3>
            <div class="cw-form-row">
              <div class="field">
                <label for="buy-name">Full legal name <span class="required">*</span></label>
                <input type="text" id="buy-name" required value="${session ? session.name : ''}" placeholder="Buyer name" />
              </div>
              <div class="field">
                <label for="buy-email">Email for invoice <span class="required">*</span></label>
                <input type="email" id="buy-email" required value="${session ? session.email : ''}" placeholder="name@example.com" />
              </div>
            </div>

            <div class="cw-form-row">
              <div class="field">
                <label for="buy-phone">10-Digit Mobile Number <span class="required">*</span></label>
                <input type="tel" id="buy-phone" required pattern="[0-9]{10}" maxlength="10" placeholder="Mobile number" />
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

            <div id="checkout-error" class="cw-form-error" style="display:none;"></div>

            <div class="cw-form-actions" style="margin-top: 20px;">
              <a href="car.html?id=${selectedCar.id}" class="btn btn--ghost">← Back to Car Details</a>
              <button type="submit" class="btn btn--amber" id="checkout-submit">Pay <span id="btn-pay-amount">${formatPrice(tokenDeposit)}</span> Online →</button>
            </div>
          </form>
        </div>

        <div class="checkout-summary-card">
          <h3 style="font-size: 1.25rem; margin-bottom: 16px;">Order Summary</h3>
          <div class="cw-car-pill" style="padding: 10px 14px; margin-bottom: 16px;">
            <div class="cw-car-pill__media car-card__media--${selectedCar.theme}">
              <img class="cw-car-pill__photo" src="img/${selectedCar.id}.jpg" alt="${selectedCar.brand} ${selectedCar.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
              <div style="display:none;">${CarWise.carIconSVG()}</div>
            </div>
            <div class="cw-car-pill__details">
              <h4>${selectedCar.brand} ${selectedCar.name}</h4>
              <p>${selectedCar.trim} · ${selectedCar.powertrain}</p>
            </div>
          </div>

          <div class="cw-receipt-breakdown" style="padding: 6px 0;">
            <div class="cw-receipt-line">
              <span>Ex-Showroom Price</span>
              <span>${formatPrice(selectedCar.price)}</span>
            </div>
            <div class="cw-receipt-line">
              <span>Delivery Timeframe</span>
              <span>10 – 14 business days</span>
            </div>
            <div class="cw-receipt-line">
              <span>Deposit Type</span>
              <span id="summary-deposit-type">Priority Token</span>
            </div>
            <div class="cw-receipt-divider"></div>
            <div class="cw-receipt-line cw-receipt-total">
              <strong>Due Today</strong>
              <strong id="summary-due-amount" style="font-size: 1.25rem; color: var(--navy-950);">${formatPrice(tokenDeposit)}</strong>
            </div>
          </div>

          <div style="background: var(--sand-50); border-radius: var(--radius-sm); padding: 14px; margin-top: 16px; font-size: 0.82rem; color: var(--ink-700); line-height: 1.5;">
            <p>🔒 <strong>Secure Checkout:</strong> Processed via Razorpay 256-bit SSL encrypted gateway.</p>
            <p style="margin-top: 6px;">🛡️ <strong>CarWise Guarantee:</strong> Booking token is 100% refundable should you change your mind prior to chassis allocation.</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById("checkout-car-selector").addEventListener("change", (e) => {
      selectedCar = getCarById(e.target.value);
      renderCheckout();
    });

    const tierCards = container.querySelectorAll(".cw-tier-card");
    const summaryDepositType = container.querySelector("#summary-deposit-type");
    const summaryDueAmount = container.querySelector("#summary-due-amount");
    const btnPayAmount = container.querySelector("#btn-pay-amount");

    tierCards.forEach(card => {
      card.addEventListener("click", () => {
        tierCards.forEach(c => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        const radio = card.querySelector("input[type=radio]");
        radio.checked = true;
        selectedAmount = parseInt(card.dataset.amount, 10);

        summaryDepositType.textContent = card.querySelector(".cw-tier-title").textContent.split("(")[0].trim();
        summaryDueAmount.textContent = formatPrice(selectedAmount);
        btnPayAmount.textContent = formatPrice(selectedAmount);
      });
    });

    const form = document.getElementById("checkout-form");
    const errorBox = document.getElementById("checkout-error");
    const submitBtn = document.getElementById("checkout-submit");

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

      const key = (typeof RAZORPAY_KEY_ID !== "undefined" && RAZORPAY_KEY_ID && !RAZORPAY_KEY_ID.includes("placeholder") && !RAZORPAY_KEY_ID.includes("MockDemoKey"))
        ? RAZORPAY_KEY_ID
        : null;

      if (window.Razorpay && key) {
        try {
          const options = {
            key: key,
            amount: selectedAmount * 100,
            currency: "INR",
            name: "CarWise Showroom",
            description: `Vehicle Reservation: ${selectedCar.brand} ${selectedCar.name}`,
            prefill: { name, email, contact: phone },
            theme: { color: "#eea23e" },
            handler: async function (response) {
              await completePurchase({
                paymentId: response.razorpay_payment_id || ("pay_" + Math.random().toString(36).substring(2, 11)),
                amount: selectedAmount,
                car: selectedCar,
                name, email, phone, city, address
              });
            },
            modal: {
              ondismiss: function () {
                submitBtn.disabled = false;
                submitBtn.textContent = `Pay ${formatPrice(selectedAmount)} Online →`;
              }
            }
          };
          const rzp = new Razorpay(options);
          rzp.open();
          return;
        } catch (err) {
          console.warn("Razorpay launch issue, falling back to instant sandbox simulator:", err);
        }
      }

      // Interactive Payment Simulator with Card, UPI, NetBanking, EMI options and validations
      showSandboxModal({
        amount: selectedAmount,
        car: selectedCar,
        name, email, phone, city, address
      });
    });
  }

  function showSandboxModal(orderInfo) {
    if (typeof PaymentSimulator !== "undefined") {
      PaymentSimulator.open({
        amount: orderInfo.amount,
        car: orderInfo.car,
        customerName: orderInfo.name,
        customerEmail: orderInfo.email,
        customerPhone: orderInfo.phone,
        onSuccess: async (result) => {
          await completePurchase({
            ...orderInfo,
            paymentId: result.paymentId,
            paymentMethod: result.paymentMethod,
            paymentSummary: result.paymentSummary
          });
        },
        onCancel: () => {
          const submitBtn = document.getElementById("checkout-submit");
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = `Pay ${formatPrice(orderInfo.amount)} Online →`;
          }
        }
      });
    }
  }

  async function completePurchase(info) {
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

        if (!error && data && data.id) {
          orderDbId = data.id.slice(0, 8).toUpperCase();
        }
      }
    } catch (e) {
      console.warn("Supabase orders error:", e);
    }

    // Save to local cache
    const activityList = JSON.parse(localStorage.getItem("carwise_user_activities")) || [];
    activityList.unshift({
      type: "order",
      id: orderDbId,
      car_id: info.car.id,
      car_name: `${info.car.brand} ${info.car.name}`,
      amount: info.amount,
      payment_id: info.paymentId,
      payment_status: "paid",
      city: info.city,
      created_at: new Date().toISOString()
    });
    localStorage.setItem("carwise_user_activities", JSON.stringify(activityList));

    // Render receipt view
    container.innerHTML = `
      <div class="booking-page-wrap" style="text-align: center;">
        <div class="cw-success-state">
          <div class="cw-success-icon cw-success-icon--order">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h2 style="font-size: 2rem;">Order Payment Successful!</h2>
          <p class="cw-success-msg">Congratulations! Your booking for the <strong>${info.car.brand} ${info.car.name}</strong> has been secured.</p>

          <div class="cw-receipt-card" style="margin: 24px auto; max-width: 600px;">
            <div class="cw-receipt-header">
              <div>
                <span class="cw-receipt-id">Order Reference #${orderDbId}</span>
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
                <span>Transaction ID</span>
                <code class="cw-code">${info.paymentId}</code>
              </div>
              <div class="cw-receipt-line">
                <span>Buyer Name</span>
                <span>${info.name} (+91 ${info.phone})</span>
              </div>
              <div class="cw-receipt-line">
                <span>Delivery City</span>
                <span>${info.city || 'Standard Regional Hub'}</span>
              </div>
              <div class="cw-receipt-line cw-receipt-total">
                <strong>Amount Paid Today</strong>
                <strong>${formatPrice(info.amount)}</strong>
              </div>
            </div>

            <div class="cw-receipt-footer">
              <p>🚗 An official relationship manager will contact you within 24 hours to begin documentation and schedule car delivery.</p>
            </div>
          </div>

          <div class="cw-form-actions cw-form-actions--center" style="gap: 16px;">
            <button class="btn btn--ghost" onclick="window.print()">🖨️ Print Invoice Receipt</button>
            <a href="activity.html" class="btn btn--amber">View in My Activity →</a>
            <a href="browse.html" class="btn btn--dark">Back to Showroom</a>
          </div>
        </div>
      </div>
    `;

    CarWise.showToast("Car order confirmed successfully!");
    if (typeof CarWise.launchConfetti === "function") {
      CarWise.launchConfetti();
    }
  }

  renderCheckout();
});
