/* CarWise — Interactive Payment Simulator
   Provides realistic payment options:
   1. Credit / Debit Card (with live card preview, number masking, brand detection, expiry/CVV validation)
   2. UPI / QR (with animated QR scan laser, countdown timer, UPI ID regex validation)
   3. NetBanking (with top Indian bank cards & searchable select)
   4. Monthly EMI (with tenure breakdowns)
   100% test sandbox — zero real money charged, full realistic validation!
*/

const PaymentSimulator = (() => {
  function formatMoney(amount) {
    if (typeof formatPrice === "function") return formatPrice(amount);
    return "₹" + Number(amount).toLocaleString("en-IN");
  }

  // Detect card brand by initial digits
  function detectCardBrand(num) {
    const clean = num.replace(/\D/g, "");
    if (/^4/.test(clean)) return "VISA";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
    if (/^(60|65|81|82)/.test(clean)) return "RuPay";
    if (/^3[47]/.test(clean)) return "AMEX";
    return "CARD";
  }

  // Validate expiry date MM/YY
  function validateExpiry(val) {
    if (!/^\d{2}\/\d{2}$/.test(val)) return false;
    const parts = val.split("/");
    const month = parseInt(parts[0], 10);
    const year = parseInt("20" + parts[1], 10);
    if (month < 1 || month > 12) return false;

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    if (year < curYear) return false;
    if (year === curYear && month < curMonth) return false;
    return true;
  }

  // Open the payment simulator modal
  function open(options) {
    const {
      amount,
      car,
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      onSuccess = () => {},
      onCancel = () => {}
    } = options;

    // Remove any existing overlay
    const existing = document.getElementById("cw-pay-simulator-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "cw-pay-simulator-overlay";
    overlay.className = "cw-modal-overlay is-visible";
    overlay.innerHTML = `
      <div class="cw-modal-dialog" role="dialog" aria-modal="true" style="max-width: 540px; padding: 24px;">
        <button class="cw-modal-close" id="cw-pay-close-btn" type="button" aria-label="Close modal">&times;</button>

        <div class="cw-pay-modal">
          <!-- Processing State Overlay -->
          <div class="cw-pay-processing" id="cw-pay-processing">
            <div class="cw-pay-spinner"></div>
            <h4 id="cw-pay-proc-title" style="margin: 0 0 6px; font-size: 1.15rem; color: var(--navy-950);">Connecting to Bank Gateway...</h4>
            <p id="cw-pay-proc-sub" style="font-size: 0.85rem; color: var(--ink-500); margin: 0;">Simulating 3D Secure 2.0 authorization</p>
          </div>

          <!-- Header -->
          <div class="cw-pay-header">
            <div class="cw-sandbox-badge">
              <span>🔒</span> 256-Bit Encrypted Test Sandbox
            </div>
            <h3>Complete Reservation Payment</h3>
            <p>Car: <strong>${car ? car.brand + ' ' + car.name : 'Vehicle Reservation'}</strong> · Amount: <strong style="color: var(--amber-700); font-size: 1.05rem;">${formatMoney(amount)}</strong></p>
          </div>

          <!-- Error Alert Banner -->
          <div class="cw-pay-error" id="cw-pay-error" role="alert">
            <span style="font-size: 1.1rem;">⚠️</span>
            <span id="cw-pay-error-msg">Please correct the highlighted fields</span>
          </div>

          <!-- Method Selection Tabs -->
          <div class="cw-pay-tabs" role="tablist">
            <button class="cw-pay-tab is-active" type="button" data-tab="card">
              <span class="cw-pay-tab-icon">💳</span>
              <span>Cards</span>
            </button>
            <button class="cw-pay-tab" type="button" data-tab="upi">
              <span class="cw-pay-tab-icon">📱</span>
              <span>UPI / QR</span>
            </button>
            <button class="cw-pay-tab" type="button" data-tab="netbanking">
              <span class="cw-pay-tab-icon">🏦</span>
              <span>NetBanking</span>
            </button>
            <button class="cw-pay-tab" type="button" data-tab="emi">
              <span class="cw-pay-tab-icon">📊</span>
              <span>EMI</span>
            </button>
          </div>

          <!-- ================= TAB 1: CARD PANE ================= -->
          <div class="cw-pay-pane" id="cw-pane-card">
            <!-- Virtual Card Graphic -->
            <div class="cw-card-visual">
              <div class="cw-card-visual-top">
                <div class="cw-card-chip"></div>
                <div class="cw-card-brand" id="cw-card-brand-display">VISA</div>
              </div>
              <div class="cw-card-num-display" id="cw-card-num-display">•••• •••• •••• ••••</div>
              <div class="cw-card-visual-bot">
                <div>
                  <div style="font-size: 0.65rem; color: rgba(255,255,255,0.6);">CARDHOLDER</div>
                  <div class="cw-card-holder-display" id="cw-card-holder-display">${(customerName || 'YOUR NAME').toUpperCase()}</div>
                </div>
                <div>
                  <div style="font-size: 0.65rem; color: rgba(255,255,255,0.6);">EXPIRES</div>
                  <div class="cw-card-exp-display" id="cw-card-exp-display">MM/YY</div>
                </div>
              </div>
            </div>

            <!-- Card Inputs -->
            <div class="cw-pay-field">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <label for="cw-card-num">Card Number <span class="required">*</span></label>
                <button type="button" id="cw-card-autofill-btn" style="background:none; border:none; color:var(--amber-700); font-size:0.75rem; font-weight:600; cursor:pointer; text-decoration:underline;">💡 Fill Test Card</button>
              </div>
              <input type="text" id="cw-card-num" class="cw-pay-input" placeholder="4532 •••• •••• ••••" maxlength="19" autocomplete="cc-number" inputmode="numeric" />
            </div>

            <div class="cw-pay-field">
              <label for="cw-card-name">Cardholder Name <span class="required">*</span></label>
              <input type="text" id="cw-card-name" class="cw-pay-input" placeholder="Name as printed on card" value="${customerName || ''}" autocomplete="cc-name" />
            </div>

            <div class="cw-pay-row">
              <div class="cw-pay-field">
                <label for="cw-card-exp">Expiry Date <span class="required">*</span></label>
                <input type="text" id="cw-card-exp" class="cw-pay-input" placeholder="MM / YY" maxlength="5" autocomplete="cc-exp" inputmode="numeric" />
              </div>
              <div class="cw-pay-field">
                <label for="cw-card-cvv">CVV / CVC <span class="required">*</span></label>
                <input type="password" id="cw-card-cvv" class="cw-pay-input" placeholder="3 digits" maxlength="4" autocomplete="cc-csc" inputmode="numeric" />
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; margin: 10px 0 16px; font-size: 0.78rem; color: var(--ink-700);">
              <input type="checkbox" id="cw-card-save" checked style="accent-color: var(--amber-500);" />
              <label for="cw-card-save" style="cursor: pointer;">Save card securely with RBI-compliant tokenization</label>
            </div>
          </div>

          <!-- ================= TAB 2: UPI / QR PANE ================= -->
          <div class="cw-pay-pane" id="cw-pane-upi" style="display: none;">
            <div style="display: flex; gap: 10px; margin-bottom: 14px;">
              <label class="cw-method-pill is-active" id="cw-upi-mode-qr" style="cursor: pointer; flex: 1; text-align: center;">
                <input type="radio" name="upi_mode" value="qr" checked style="display: none;" />
                <span>📷 Scan QR Code</span>
              </label>
              <label class="cw-method-pill" id="cw-upi-mode-id" style="cursor: pointer; flex: 1; text-align: center;">
                <input type="radio" name="upi_mode" value="id" style="display: none;" />
                <span>@ Enter UPI ID / VPA</span>
              </label>
            </div>

            <!-- UPI QR Box -->
            <div id="cw-upi-qr-section">
              <div class="cw-pay-qr-wrap">
                <div class="cw-pay-qr-img">
                  <div class="cw-pay-scan-line"></div>
                  <svg viewBox="0 0 100 100" width="130" height="130">
                    <rect width="100" height="100" fill="#ffffff"/>
                    <rect x="8" y="8" width="28" height="28" fill="#142027"/>
                    <rect x="14" y="14" width="16" height="16" fill="#ffffff"/>
                    <rect x="18" y="18" width="8" height="8" fill="#142027"/>
                    <rect x="64" y="8" width="28" height="28" fill="#142027"/>
                    <rect x="70" y="14" width="16" height="16" fill="#ffffff"/>
                    <rect x="74" y="18" width="8" height="8" fill="#142027"/>
                    <rect x="8" y="64" width="28" height="28" fill="#142027"/>
                    <rect x="14" y="70" width="16" height="16" fill="#ffffff"/>
                    <rect x="18" y="74" width="8" height="8" fill="#142027"/>
                    <!-- Centers and dots -->
                    <rect x="44" y="44" width="12" height="12" fill="#eea23e"/>
                    <rect x="42" y="12" width="14" height="20" fill="#142027"/>
                    <rect x="12" y="44" width="24" height="10" fill="#142027"/>
                    <rect x="66" y="44" width="22" height="12" fill="#142027"/>
                    <rect x="42" y="72" width="20" height="16" fill="#142027"/>
                    <rect x="72" y="72" width="16" height="16" fill="#142027"/>
                  </svg>
                </div>
                <div class="cw-pay-timer" id="cw-qr-timer">⏱️ QR code active for 04:59</div>
                <p style="font-size: 0.78rem; color: var(--ink-500); margin: 6px 0 0;">Scan using Google Pay, PhonePe, Paytm, BHIM, or any banking app</p>
              </div>
            </div>

            <!-- UPI ID Field -->
            <div id="cw-upi-id-section" style="display: none;">
              <div class="cw-pay-field">
                <label for="cw-upi-input">Virtual Payment Address (VPA) / UPI ID <span class="required">*</span></label>
                <input type="text" id="cw-upi-input" class="cw-pay-input" placeholder="e.g. rahul@okhdfcbank" autocomplete="off" />
                <div class="cw-upi-chips">
                  <span style="font-size: 0.72rem; color: var(--ink-500); line-height: 22px;">Quick handles:</span>
                  <button type="button" class="cw-upi-chip" data-suffix="@okhdfcbank">@okhdfcbank</button>
                  <button type="button" class="cw-upi-chip" data-suffix="@okaxis">@okaxis</button>
                  <button type="button" class="cw-upi-chip" data-suffix="@paytm">@paytm</button>
                  <button type="button" class="cw-upi-chip" data-suffix="@ybl">@ybl</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB 3: NETBANKING PANE ================= -->
          <div class="cw-pay-pane" id="cw-pane-netbanking" style="display: none;">
            <p style="font-size: 0.8rem; font-weight: 600; color: var(--ink-700); margin-bottom: 8px;">Popular Indian Banks</p>
            <div class="cw-pay-banks-grid" id="cw-banks-grid">
              <div class="cw-pay-bank-tile is-selected" data-bank="HDFC Bank">
                <span class="cw-pay-bank-icon">🏛️</span>
                <span>HDFC Bank</span>
              </div>
              <div class="cw-pay-bank-tile" data-bank="State Bank of India">
                <span class="cw-pay-bank-icon">🔵</span>
                <span>SBI</span>
              </div>
              <div class="cw-pay-bank-tile" data-bank="ICICI Bank">
                <span class="cw-pay-bank-icon">🟠</span>
                <span>ICICI Bank</span>
              </div>
              <div class="cw-pay-bank-tile" data-bank="Axis Bank">
                <span class="cw-pay-bank-icon">🟣</span>
                <span>Axis Bank</span>
              </div>
              <div class="cw-pay-bank-tile" data-bank="Kotak Mahindra Bank">
                <span class="cw-pay-bank-icon">🔴</span>
                <span>Kotak Bank</span>
              </div>
              <div class="cw-pay-bank-tile" data-bank="Punjab National Bank">
                <span class="cw-pay-bank-icon">🟡</span>
                <span>PNB</span>
              </div>
            </div>

            <div class="cw-pay-field">
              <label for="cw-bank-select">Or choose other banks</label>
              <select id="cw-bank-select" class="cw-pay-input">
                <option value="">-- Select from 30+ Other Banks --</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
                <option value="Canara Bank">Canara Bank</option>
                <option value="Union Bank of India">Union Bank of India</option>
                <option value="IndusInd Bank">IndusInd Bank</option>
                <option value="Yes Bank">Yes Bank</option>
                <option value="IDFC FIRST Bank">IDFC FIRST Bank</option>
                <option value="Federal Bank">Federal Bank</option>
                <option value="Central Bank of India">Central Bank of India</option>
                <option value="Indian Bank">Indian Bank</option>
                <option value="Bank of India">Bank of India</option>
                <option value="RBL Bank">RBL Bank</option>
                <option value="AU Small Finance Bank">AU Small Finance Bank</option>
              </select>
            </div>
          </div>

          <!-- ================= TAB 4: EMI PANE ================= -->
          <div class="cw-pay-pane" id="cw-pane-emi" style="display: none;">
            <p style="font-size: 0.8rem; font-weight: 600; color: var(--ink-700); margin-bottom: 8px;">Select EMI Financing Tenure</p>
            <div class="cw-pay-emi-grid" id="cw-emi-grid">
              <div class="cw-pay-emi-item is-selected" data-months="3" data-rate="0">
                <div>
                  <strong>3 Months (No Cost EMI)</strong>
                  <div style="font-size: 0.74rem; color: #15803d; font-weight: 600;">0% Interest · Zero Processing Fee</div>
                </div>
                <strong style="color: var(--navy-950);">${formatMoney(Math.round(amount / 3))} / mo</strong>
              </div>
              <div class="cw-pay-emi-item" data-months="6" data-rate="0">
                <div>
                  <strong>6 Months (No Cost EMI)</strong>
                  <div style="font-size: 0.74rem; color: #15803d; font-weight: 600;">0% Interest · Recommended</div>
                </div>
                <strong style="color: var(--navy-950);">${formatMoney(Math.round(amount / 6))} / mo</strong>
              </div>
              <div class="cw-pay-emi-item" data-months="12" data-rate="13.5">
                <div>
                  <strong>12 Months (@ 13.5% p.a.)</strong>
                  <div style="font-size: 0.74rem; color: var(--ink-500);">Standard Bank Credit Card EMI</div>
                </div>
                <strong style="color: var(--navy-950);">${formatMoney(Math.round((amount * 1.075) / 12))} / mo</strong>
              </div>
              <div class="cw-pay-emi-item" data-months="24" data-rate="14.5">
                <div>
                  <strong>24 Months (@ 14.5% p.a.)</strong>
                  <div style="font-size: 0.74rem; color: var(--ink-500);">Low Monthly Outflow</div>
                </div>
                <strong style="color: var(--navy-950);">${formatMoney(Math.round((amount * 1.15) / 24))} / mo</strong>
              </div>
            </div>
            <p style="font-size: 0.74rem; color: var(--ink-500); margin: 0;">EMI will be pre-authorized on your card and charged monthly by your issuing bank.</p>
          </div>

          <!-- Footer Actions -->
          <div class="cw-form-actions" style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn--ghost" id="cw-pay-cancel-btn">Cancel</button>
            <button type="button" class="btn btn--amber" id="cw-pay-submit-btn">✓ Authorize Payment (${formatMoney(amount)})</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Elements
    const modalClose = overlay.querySelector("#cw-pay-close-btn");
    const cancelBtn = overlay.querySelector("#cw-pay-cancel-btn");
    const submitBtn = overlay.querySelector("#cw-pay-submit-btn");
    const errorBox = overlay.querySelector("#cw-pay-error");
    const errorMsg = overlay.querySelector("#cw-pay-error-msg");
    const processing = overlay.querySelector("#cw-pay-processing");
    const procTitle = overlay.querySelector("#cw-pay-proc-title");
    const procSub = overlay.querySelector("#cw-pay-proc-sub");

    // Card inputs
    const cardNum = overlay.querySelector("#cw-card-num");
    const cardName = overlay.querySelector("#cw-card-name");
    const cardExp = overlay.querySelector("#cw-card-exp");
    const cardCvv = overlay.querySelector("#cw-card-cvv");
    const autofillBtn = overlay.querySelector("#cw-card-autofill-btn");

    // Displays
    const cardBrandDisplay = overlay.querySelector("#cw-card-brand-display");
    const cardNumDisplay = overlay.querySelector("#cw-card-num-display");
    const cardHolderDisplay = overlay.querySelector("#cw-card-holder-display");
    const cardExpDisplay = overlay.querySelector("#cw-card-exp-display");

    // UPI elements
    const upiModeQR = overlay.querySelector("#cw-upi-mode-qr");
    const upiModeID = overlay.querySelector("#cw-upi-mode-id");
    const qrSection = overlay.querySelector("#cw-upi-qr-section");
    const idSection = overlay.querySelector("#cw-upi-id-section");
    const upiInput = overlay.querySelector("#cw-upi-input");

    // NetBanking elements
    const bankTiles = overlay.querySelectorAll(".cw-pay-bank-tile");
    const bankSelect = overlay.querySelector("#cw-bank-select");
    let selectedBank = "HDFC Bank";

    // EMI elements
    const emiItems = overlay.querySelectorAll(".cw-pay-emi-item");
    let selectedEMI = "3 Months (No Cost EMI)";

    let activeTab = "card";
    let upiSubMode = "qr";

    // Close logic
    function closeDialog() {
      if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
      onCancel();
    }
    modalClose.addEventListener("click", closeDialog);
    cancelBtn.addEventListener("click", closeDialog);

    // Clear errors
    function showError(msg, fieldEl) {
      errorMsg.textContent = msg;
      errorBox.classList.add("is-visible");
      if (fieldEl) {
        fieldEl.classList.add("is-invalid");
        fieldEl.focus();
      }
    }

    function clearError() {
      errorBox.classList.remove("is-visible");
      overlay.querySelectorAll(".cw-pay-input").forEach(el => el.classList.remove("is-invalid"));
    }

    // Input listeners to clear error dynamically
    overlay.querySelectorAll(".cw-pay-input").forEach(el => {
      el.addEventListener("input", clearError);
    });

    // Tab Switching
    const tabs = overlay.querySelectorAll(".cw-pay-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        clearError();
        tabs.forEach(t => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        activeTab = tab.dataset.tab;

        // Hide all panes
        overlay.querySelectorAll(".cw-pay-pane").forEach(p => p.style.display = "none");
        overlay.querySelector(`#cw-pane-${activeTab}`).style.display = "block";

        if (activeTab === "card") {
          submitBtn.textContent = `✓ Authorize Payment (${formatMoney(amount)})`;
        } else if (activeTab === "upi") {
          submitBtn.textContent = upiSubMode === "qr" ? "✓ Confirm QR Payment on Mobile" : `✓ Verify & Pay (${formatMoney(amount)})`;
        } else if (activeTab === "netbanking") {
          submitBtn.textContent = `Pay via ${selectedBank} (${formatMoney(amount)}) →`;
        } else if (activeTab === "emi") {
          submitBtn.textContent = `Confirm EMI Plan (${formatMoney(amount)}) →`;
        }
      });
    });

    // ---------------- CARD INTERACTIONS ----------------
    // Format card number with spaces
    cardNum.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 16);
      let formatted = val.replace(/(.{4})/g, "$1 ").trim();
      e.target.value = formatted;

      // Update card visual
      cardNumDisplay.textContent = formatted || "•••• •••• •••• ••••";
      const brand = detectCardBrand(val);
      cardBrandDisplay.textContent = brand;
    });

    // Format cardholder name
    cardName.addEventListener("input", (e) => {
      cardHolderDisplay.textContent = e.target.value.toUpperCase() || "YOUR NAME";
    });

    // Format expiry date MM/YY
    cardExp.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 4);
      if (val.length >= 3) {
        val = val.substring(0, 2) + "/" + val.substring(2);
      }
      e.target.value = val;
      cardExpDisplay.textContent = val || "MM/YY";
    });

    // CVV formatting
    cardCvv.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
    });

    // Auto-fill test card button
    autofillBtn.addEventListener("click", () => {
      clearError();
      cardNum.value = "4532 8821 9012 3456";
      cardNumDisplay.textContent = "4532 8821 9012 3456";
      cardBrandDisplay.textContent = "VISA";

      cardName.value = customerName || "Dhruv Sharma";
      cardHolderDisplay.textContent = (customerName || "Dhruv Sharma").toUpperCase();

      cardExp.value = "12/28";
      cardExpDisplay.textContent = "12/28";

      cardCvv.value = "742";
    });

    // ---------------- UPI INTERACTIONS ----------------
    upiModeQR.addEventListener("click", () => {
      clearError();
      upiModeQR.classList.add("is-active");
      upiModeID.classList.remove("is-active");
      qrSection.style.display = "block";
      idSection.style.display = "none";
      upiSubMode = "qr";
      submitBtn.textContent = "✓ Confirm QR Payment on Mobile";
    });

    upiModeID.addEventListener("click", () => {
      clearError();
      upiModeID.classList.add("is-active");
      upiModeQR.classList.remove("is-active");
      qrSection.style.display = "none";
      idSection.style.display = "block";
      upiSubMode = "id";
      submitBtn.textContent = `✓ Verify & Pay (${formatMoney(amount)})`;
      upiInput.focus();
    });

    // UPI quick suffix chips
    overlay.querySelectorAll(".cw-upi-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        clearError();
        const suffix = chip.dataset.suffix;
        let cur = upiInput.value.trim();
        if (cur.includes("@")) {
          cur = cur.split("@")[0];
        }
        upiInput.value = (cur || "username") + suffix;
      });
    });

    // Dynamic ticking timer for QR
    let secondsLeft = 299; // 4m 59s
    const timerEl = overlay.querySelector("#cw-qr-timer");
    const timerInterval = setInterval(() => {
      if (!overlay.parentElement) {
        clearInterval(timerInterval);
        return;
      }
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        if (timerEl) timerEl.textContent = "⏱️ QR expired. Click Refresh.";
        return;
      }
      const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
      const secs = (secondsLeft % 60).toString().padStart(2, "0");
      if (timerEl) timerEl.textContent = `⏱️ QR code active for ${mins}:${secs}`;
    }, 1000);

    // ---------------- NETBANKING INTERACTIONS ----------------
    bankTiles.forEach(tile => {
      tile.addEventListener("click", () => {
        clearError();
        bankTiles.forEach(t => t.classList.remove("is-selected"));
        tile.classList.add("is-selected");
        selectedBank = tile.dataset.bank;
        bankSelect.value = "";
        submitBtn.textContent = `Pay via ${selectedBank} (${formatMoney(amount)}) →`;
      });
    });

    bankSelect.addEventListener("change", (e) => {
      clearError();
      if (e.target.value) {
        bankTiles.forEach(t => t.classList.remove("is-selected"));
        selectedBank = e.target.value;
        submitBtn.textContent = `Pay via ${selectedBank} (${formatMoney(amount)}) →`;
      }
    });

    // ---------------- EMI INTERACTIONS ----------------
    emiItems.forEach(item => {
      item.addEventListener("click", () => {
        clearError();
        emiItems.forEach(i => i.classList.remove("is-selected"));
        item.classList.add("is-selected");
        selectedEMI = `${item.dataset.months} Months EMI`;
        submitBtn.textContent = `Confirm ${selectedEMI} (${formatMoney(amount)}) →`;
      });
    });

    // ---------------- VALIDATION & SUBMIT ----------------
    submitBtn.addEventListener("click", async () => {
      clearError();

      let paymentMethodName = "";
      let paymentSummary = "";

      // 1. Validate Card
      if (activeTab === "card") {
        const rawNum = cardNum.value.replace(/\D/g, "");
        if (!rawNum || rawNum.length < 15) {
          showError("Please enter a valid 16-digit card number.", cardNum);
          return;
        }

        const nameVal = cardName.value.trim();
        if (!nameVal || nameVal.length < 3) {
          showError("Please enter the cardholder's full name (minimum 3 characters).", cardName);
          return;
        }

        const expVal = cardExp.value.trim();
        if (!validateExpiry(expVal)) {
          showError("Please enter a valid future expiry date (MM/YY) that is not expired.", cardExp);
          return;
        }

        const cvvVal = cardCvv.value.trim();
        if (!cvvVal || cvvVal.length < 3) {
          showError("Please enter a valid 3-digit CVV number.", cardCvv);
          return;
        }

        paymentMethodName = `${detectCardBrand(rawNum)} Card`;
        paymentSummary = `${paymentMethodName} ending in ${rawNum.slice(-4)}`;
      }

      // 2. Validate UPI
      else if (activeTab === "upi") {
        if (upiSubMode === "id") {
          const upiVal = upiInput.value.trim();
          const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9]{2,}$/;
          if (!upiVal || !upiRegex.test(upiVal)) {
            showError("Please enter a valid UPI ID (e.g. yourname@okhdfcbank).", upiInput);
            return;
          }
          paymentMethodName = "UPI";
          paymentSummary = `UPI ID (${upiVal})`;
        } else {
          // QR code confirmed
          paymentMethodName = "UPI QR";
          paymentSummary = "UPI QR Code Scanner (Completed on Mobile)";
        }
      }

      // 3. Validate NetBanking
      else if (activeTab === "netbanking") {
        if (!selectedBank) {
          showError("Please select a bank to proceed with NetBanking.", bankSelect);
          return;
        }
        paymentMethodName = "NetBanking";
        paymentSummary = `NetBanking (${selectedBank})`;
      }

      // 4. Validate EMI
      else if (activeTab === "emi") {
        paymentMethodName = "EMI";
        paymentSummary = `Card EMI (${selectedEMI})`;
      }

      // All Validations Passed! Show Simulated Gateway Processing
      submitBtn.disabled = true;
      cancelBtn.disabled = true;
      processing.classList.add("is-visible");

      // Stage 1: Authenticating
      procTitle.textContent = "Connecting to Bank Gateway...";
      procSub.textContent = `Validating ${paymentMethodName} credentials...`;

      setTimeout(() => {
        // Stage 2: 3D Secure / OTP
        procTitle.textContent = "3D Secure 2.0 Authorization Approved ✓";
        procSub.textContent = `Verified with banking network for ${formatMoney(amount)}`;

        setTimeout(() => {
          // Stage 3: Order Registration
          procTitle.textContent = "Payment Successful!";
          procSub.textContent = "Finalizing your vehicle reservation in CarWise database...";

          setTimeout(() => {
            // Success! Close modal and invoke callback
            clearInterval(timerInterval);
            if (overlay.parentElement) overlay.parentElement.removeChild(overlay);

            const dummyPayId = "pay_sim_" + Math.random().toString(36).substring(2, 12).toUpperCase();

            onSuccess({
              paymentId: dummyPayId,
              paymentMethod: paymentMethodName,
              paymentSummary: paymentSummary,
              amount: amount,
              car: car
            });
          }, 500);
        }, 600);
      }, 550);
    });
  }

  return {
    open,
    formatMoney
  };
})();

if (typeof window !== "undefined") {
  window.PaymentSimulator = PaymentSimulator;
}
