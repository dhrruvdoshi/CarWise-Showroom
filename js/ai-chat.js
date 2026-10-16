/* CarWise — AI Automotive Assistant
   Interactive AI chat assistant with deep automotive context on ALL 9 cars in the showroom.
   Answers queries on tradeoffs, range, charging, comparisons, financing/EMI, and family suitability.
*/

const CarWiseAI = (() => {
  // Helper to format currency
  function formatMoney(amount) {
    if (typeof formatPrice === "function") return formatPrice(amount);
    return "₹" + Number(amount).toLocaleString("en-IN");
  }

  // System prompt / knowledge base for the AI
  function getCarContext(carId) {
    if (!carId) return null;
    return typeof getCarById === "function" ? getCarById(carId) : (window.CARS ? window.CARS.find(c => c.id === carId) : null);
  }

  // Match ALL cars mentioned in a string
  function findCarsInText(text) {
    if (!text || typeof CARS === "undefined" || !CARS.length) return [];
    const t = text.toLowerCase();
    const matched = [];

    const addCar = (c) => {
      if (c && !matched.some(m => m.id === c.id)) matched.push(c);
    };

    // Check by ID or exact brand + name
    CARS.forEach(c => {
      const b = c.brand.toLowerCase();
      const n = c.name.toLowerCase();
      const fullName = (b + " " + n).toLowerCase();
      const id = c.id.toLowerCase();
      if (t.includes(fullName) || t.includes(id)) {
        addCar(c);
      }
    });

    // Brand and model keywords
    if (t.includes("tesla") || t.includes("model 3") || t.includes("model3")) addCar(CARS.find(c => c.id === "tesla-model3"));
    if (t.includes("volvo") || t.includes("ex30") || t.includes("ex 30")) addCar(CARS.find(c => c.id === "volvo-ex30"));
    if (t.includes("mg") || t.includes("zs ev") || t.includes("zsev") || t.includes("zs")) addCar(CARS.find(c => c.id === "mg-zs-ev"));
    if (t.includes("toyota") || t.includes("corolla")) addCar(CARS.find(c => c.id === "toyota-corolla"));
    if (t.includes("mazda") || t.includes("mazda3") || t.includes("mazda 3")) addCar(CARS.find(c => c.id === "mazda-mazda3"));
    if (t.includes("kia") || t.includes("niro")) addCar(CARS.find(c => c.id === "kia-niro"));
    if (t.includes("honda") || t.includes("civic")) addCar(CARS.find(c => c.id === "honda-civic"));
    if (t.includes("hyundai") || t.includes("kona")) addCar(CARS.find(c => c.id === "hyundai-kona"));
    if (t.includes("skoda") || t.includes("octavia")) addCar(CARS.find(c => c.id === "skoda-octavia"));

    return matched;
  }

  // Generate a mini car card widget inside chat
  function renderCarMiniCard(car) {
    return `
      <div class="cw-ai-car-card">
        <img src="${car.image || `img/${car.id}.jpg`}" alt="${car.brand} ${car.name}" class="cw-ai-car-thumb" onerror="this.style.display='none';" />
        <div class="cw-ai-car-card__body">
          <div class="cw-ai-car-card__title">
            <strong>${car.brand} ${car.name}</strong>
            <span class="cw-ai-pill">${car.powertrain}</span>
          </div>
          <div class="cw-ai-car-card__specs">
            <span>💰 ${formatMoney(car.price)}</span>
            <span>⚡ ${car.range} ${car.rangeUnit}</span>
            <span>⭐ ${car.safety}/5 Safety</span>
          </div>
        </div>
      </div>
    `;
  }

  // Smart response generator based on user message and context
  function generateAIResponse(userMessage, activeCar) {
    const msg = userMessage.toLowerCase().trim();
    const mentionedCars = findCarsInText(msg);

    // Scenario A: User wants a comparison between 2 specific cars (e.g. "Compare Tesla and Volvo")
    if (mentionedCars.length >= 2 || (mentionedCars.length === 1 && activeCar && mentionedCars[0].id !== activeCar.id && (msg.includes("vs") || msg.includes("compare") || msg.includes("better")))) {
      const carA = mentionedCars[0];
      const carB = mentionedCars.length >= 2 ? mentionedCars[1] : activeCar;

      return `
        <p><strong>Head-to-head comparison: ${carA.brand} ${carA.name} vs ${carB.brand} ${carB.name}</strong></p>
        <table class="cw-ai-table">
          <thead>
            <tr><th>Metric</th><th>${carA.brand} ${carA.name}</th><th>${carB.brand} ${carB.name}</th></tr>
          </thead>
          <tbody>
            <tr><td>Price</td><td><strong>${formatMoney(carA.price)}</strong></td><td><strong>${formatMoney(carB.price)}</strong></td></tr>
            <tr><td>Powertrain</td><td>${carA.powertrain}</td><td>${carB.powertrain}</td></tr>
            <tr><td>Range / Economy</td><td>${carA.range} ${carA.rangeUnit}</td><td>${carB.range} ${carB.rangeUnit}</td></tr>
            <tr><td>Safety Rating</td><td>${carA.safety}/5 Stars</td><td>${carB.safety}/5 Stars</td></tr>
            <tr><td>Top Strength</td><td>${(carA.pros && carA.pros[0]) || carA.tagline}</td><td>${(carB.pros && carB.pros[0]) || carB.tagline}</td></tr>
            <tr><td>Key Tradeoff</td><td>${(carA.cons && carA.cons[0]) || 'N/A'}</td><td>${(carB.cons && carB.cons[0]) || 'N/A'}</td></tr>
          </tbody>
        </table>
        <p><strong>Verdict:</strong> Choose the <em>${carA.name}</em> if you prioritize ${carA.tag.toLowerCase()}. Choose the <em>${carB.name}</em> if you prefer ${carB.tag.toLowerCase()}.</p>
        <div class="cw-ai-msg-actions">
          <a href="test-drive.html?id=${carA.id}" class="btn btn--sm btn--dark">Test Drive ${carA.name}</a>
          <a href="test-drive.html?id=${carB.id}" class="btn btn--sm btn--ghost">Test Drive ${carB.name}</a>
          <a href="compare.html" class="btn btn--sm btn--ghost">Full Matrix →</a>
        </div>
      `;
    }

    // Determine target car:
    // 1. Explicitly mentioned in message
    // 2. Active car on current page
    // 3. Otherwise null (do NOT default to MG!)
    const car = mentionedCars.length === 1 ? mentionedCars[0] : (activeCar || null);

    // Scenario B: User asked about ALL cars / Catalog / Showroom inventory
    if (msg.includes("all car") || msg.includes("what car") || msg.includes("list car") || msg.includes("show car") || msg.includes("options") || msg.includes("inventory") || msg.includes("catalog") || msg.includes("models")) {
      const allList = (typeof CARS !== "undefined" && CARS.length) ? CARS : [];
      return `
        <p>We feature <strong>9 carefully curated vehicles</strong> categorized by powertrain:</p>
        <div class="cw-ai-car-grid">
          ${allList.map(c => `
            <div class="cw-ai-car-item" onclick="document.getElementById('cw-ai-input').value='Tell me about ${c.brand} ${c.name}'; document.getElementById('cw-ai-form').dispatchEvent(new Event('submit'));">
              <img src="${c.image || `img/${c.id}.jpg`}" alt="${c.brand} ${c.name}" onerror="this.style.display='none';" />
              <strong>${c.brand} ${c.name}</strong>
              <span>${c.powertrain} · ${formatMoney(c.price)}</span>
            </div>
          `).join('')}
        </div>
        <p><em>Tip: Tap any car above or type its name (e.g. "Tell me about Tesla" or "How is the Corolla?") to explore tradeoffs and specs!</em></p>
      `;
    }

    // Scenario C: EMI / Financing calculation
    if (msg.includes("emi") || msg.includes("loan") || msg.includes("finance") || msg.includes("monthly") || msg.includes("interest")) {
      if (car) {
        const price = car.price;
        const downPaymentMatch = msg.match(/(?:down\s*payment|deposit|dp|down|advance)\s*(?:of|is|:)?\s*(?:₹|\$)?\s*(\d+[\d,]*)/i) || msg.match(/(?:₹|\$)\s*(\d+[\d,]*)/);
        const downPayment = downPaymentMatch ? parseInt(downPaymentMatch[1].replace(/,/g, ''), 10) : Math.round(price * 0.15);
        const loanAmount = Math.max(price - downPayment, 0);
        const annualRate = 0.085; // 8.5% p.a.
        const monthlyRate = annualRate / 12;
        const months = 60; // 5 years
        const emi = Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));

        return `
          ${renderCarMiniCard(car)}
          <p>Financing calculation for the <strong>${car.brand} ${car.name}</strong>:</p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Vehicle Price:</strong> ${formatMoney(price)}</li>
            <li><strong>Down Payment (15%):</strong> ${formatMoney(downPayment)}</li>
            <li><strong>Net Loan Amount:</strong> ${formatMoney(loanAmount)}</li>
            <li><strong>Estimated EMI (5 yrs @ 8.5%):</strong> <strong style="color:var(--navy-900); font-size:1.05rem;">${formatMoney(emi)} / month</strong></li>
          </ul>
          <p>You can reserve this vehicle online today with a 100% refundable token deposit or take a test drive first:</p>
          <div class="cw-ai-msg-actions">
            <a href="buy.html?id=${car.id}" class="btn btn--amber btn--sm">⚡ Reserve with ₹25,000</a>
            <a href="test-drive.html?id=${car.id}" class="btn btn--dark btn--sm">📅 Schedule Test Drive</a>
          </div>
        `;
      } else {
        return `
          <p>Here are representative monthly EMIs across our showroom (5-year tenure @ 8.5% with 15% down payment):</p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>MG ZS EV:</strong> ~${formatMoney(39400)} / mo (${formatMoney(23990)})</li>
            <li><strong>Toyota Corolla Hybrid:</strong> ~${formatMoney(45400)} / mo (${formatMoney(27650)})</li>
            <li><strong>Skoda Octavia:</strong> ~${formatMoney(46600)} / mo (${formatMoney(28340)})</li>
            <li><strong>Hyundai Kona Electric:</strong> ~${formatMoney(55300)} / mo (${formatMoney(33650)})</li>
            <li><strong>Volvo EX30:</strong> ~${formatMoney(57300)} / mo (${formatMoney(34900)})</li>
            <li><strong>Tesla Model 3:</strong> ~${formatMoney(65700)} / mo (${formatMoney(39990)})</li>
          </ul>
          <p>Which vehicle's exact financing would you like to customize?</p>
        `;
      }
    }

    // Scenario D: Battery / Range / Charging / Fuel Mileage
    if (msg.includes("range") || msg.includes("battery") || msg.includes("charging") || msg.includes("mileage") || msg.includes("km") || msg.includes("efficiency") || msg.includes("charge")) {
      if (car) {
        const isEV = car.powertrain === "Electric";
        return `
          ${renderCarMiniCard(car)}
          <p>Real-world efficiency and range for the <strong>${car.brand} ${car.name}</strong>:</p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Official Range:</strong> ${car.range} ${car.rangeUnit}</li>
            <li><strong>Efficiency:</strong> ${car.economy} (${isEV ? 'electricity consumption' : 'fuel economy'})</li>
            <li><strong>Powertrain:</strong> ${car.powertrain}</li>
            <li><strong>Real-World Highway Range:</strong> Expect ~${Math.round(car.range * 0.88)} to ${car.range} ${isEV ? 'miles on highway runs' : 'miles per tank'}.</li>
            ${isEV ? '<li><strong>DC Fast Charging:</strong> 10% to 80% in approx 28–38 mins on 150kW DC fast chargers.</li>' : '<li><strong>Fueling:</strong> Standard petrol station fill-up in 3 minutes with zero charging requirements.</li>'}
          </ul>
          <div class="cw-ai-msg-actions">
            <a href="test-drive.html?id=${car.id}" class="btn btn--dark btn--sm">📅 Book Test Drive</a>
            <a href="car.html?id=${car.id}#tradeoffs" class="btn btn--ghost btn--sm">🔍 View Tradeoffs</a>
          </div>
        `;
      } else {
        return `
          <p><strong>Electric Vehicle (EV) Range Hierarchy in CarWise:</strong></p>
          <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Tesla Model 3:</strong> 390 miles (Class leader)</li>
            <li><strong>Hyundai Kona Electric:</strong> 319 miles (Excellent daily commuter)</li>
            <li><strong>Volvo EX30:</strong> 295 miles (Compact premium SUV)</li>
            <li><strong>Kia Niro EV:</strong> 285 miles (Family friendly)</li>
            <li><strong>MG ZS EV:</strong> 273 miles (Budget EV champion)</li>
          </ol>
          <p><strong>Hybrid / Petrol Tank Range:</strong></p>
          <ul style="margin: 6px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Skoda Octavia 1.4 TSI:</strong> 620 miles per tank</li>
            <li><strong>Toyota Corolla Hybrid:</strong> 570 miles (52 mpg)</li>
            <li><strong>Honda Civic e:HEV:</strong> 520 miles (48 mpg)</li>
            <li><strong>Mazda 3 Petrol:</strong> 470 miles (42 mpg)</li>
          </ul>
          <p>Which one fits your daily commute distance best?</p>
        `;
      }
    }

    // Scenario E: Tradeoffs / Cons / Drawbacks
    if (msg.includes("tradeoff") || msg.includes("trade-off") || msg.includes("con") || msg.includes("drawback") || msg.includes("bad") || msg.includes("problem") || msg.includes("negative") || msg.includes("compromise")) {
      if (car) {
        const consList = Array.isArray(car.cons) ? car.cons : [];
        const prosList = Array.isArray(car.pros) ? car.pros : [];
        return `
          ${renderCarMiniCard(car)}
          <p>Honest, unbiased tradeoff analysis for the <strong>${car.brand} ${car.name}</strong>:</p>
          <div style="margin: 8px 0;">
            <strong style="color: var(--danger); display: flex; align-items: center; gap: 4px;">⚠️ What you compromise:</strong>
            <ul style="margin: 6px 0; padding-left: 20px; line-height: 1.5;">
              ${consList.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
          <div style="margin: 8px 0;">
            <strong style="color: var(--mint-700); display: flex; align-items: center; gap: 4px;">✅ Where it genuinely wins:</strong>
            <ul style="margin: 6px 0; padding-left: 20px; line-height: 1.5;">
              ${prosList.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
          <p><em>Verdict:</em> ${car.description}</p>
          <div class="cw-ai-msg-actions">
            <a href="car.html?id=${car.id}#tradeoffs" class="btn btn--amber btn--sm">Full Details & Specs →</a>
            <a href="test-drive.html?id=${car.id}" class="btn btn--dark btn--sm">Test Drive</a>
          </div>
        `;
      } else {
        return `
          <p>At CarWise, we believe every car has real tradeoffs:</p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Tesla Model 3:</strong> Blistering tech & range, but all controls moved to the center touchscreen (no indicator stalks).</li>
            <li><strong>Volvo EX30:</strong> Unmatched safety & recycled luxury, but firmer ride and touchscreen-heavy UI.</li>
            <li><strong>MG ZS EV:</strong> Lowest EV price & 7-yr warranty, but interior plastics feel budget and charging trails rivals.</li>
            <li><strong>Toyota Corolla:</strong> Indestructible reliability & 52 mpg, but smaller boot and plain cabin.</li>
            <li><strong>Skoda Octavia:</strong> Massive 640L boot, but estate body shape isn't for everyone.</li>
            <li><strong>Mazda 3:</strong> Superb steering feel, but tighter rear legroom.</li>
          </ul>
          <p>Ask me about any specific car to see its complete tradeoff dossier!</p>
        `;
      }
    }

    // Scenario F: Price / Budget / Cheapest Car
    if (msg.includes("cheap") || msg.includes("budget") || msg.includes("price") || msg.includes("cost") || msg.includes("lowest") || msg.includes("affordable") || msg.includes("under")) {
      if (car) {
        return `
          ${renderCarMiniCard(car)}
          <p>The <strong>${car.brand} ${car.name}</strong> (${car.trim}) starts at <strong>${formatMoney(car.price)}</strong> ex-showroom.</p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Refundable Token:</strong> ₹25,000 to hold vehicle allotment</li>
            <li><strong>Estimated Down Payment (20%):</strong> ${formatMoney(Math.round(car.price * 0.20))}</li>
            <li><strong>Estimated Monthly EMI:</strong> ~${formatMoney(Math.round(car.price * 1.64))} / mo</li>
          </ul>
          <div class="cw-ai-msg-actions">
            <a href="buy.html?id=${car.id}" class="btn btn--amber btn--sm">⚡ Reserve Online</a>
            <a href="test-drive.html?id=${car.id}" class="btn btn--dark btn--sm">📅 Book Test Drive</a>
          </div>
        `;
      } else {
        return `
          <p><strong>Showroom Price Ranking (Lowest to Highest):</strong></p>
          <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>MG ZS EV:</strong> ${formatMoney(23990)} <em>(Most affordable full EV)</em></li>
            <li><strong>Mazda 3:</strong> ${formatMoney(26480)} <em>(Most affordable petrol sedan)</em></li>
            <li><strong>Toyota Corolla:</strong> ${formatMoney(27650)} <em>(Most affordable self-charging hybrid)</em></li>
            <li><strong>Skoda Octavia:</strong> ${formatMoney(28340)} <em>(High practicality estate)</em></li>
            <li><strong>Honda Civic e:HEV:</strong> ${formatMoney(32800)} <em>(Refined sports hybrid)</em></li>
            <li><strong>Hyundai Kona Electric:</strong> ${formatMoney(33650)} <em>(319 mi range EV)</em></li>
            <li><strong>Volvo EX30:</strong> ${formatMoney(34900)} <em>(Compact Scandinavian luxury)</em></li>
            <li><strong>Kia Niro EV:</strong> ${formatMoney(36545)} <em>(Spacious family EV)</em></li>
            <li><strong>Tesla Model 3:</strong> ${formatMoney(39990)} <em>(High-tech performance flagship)</em></li>
          </ol>
          <p>What is your target budget range?</p>
        `;
      }
    }

    // Scenario G: Speed / Acceleration / 0-100 km/h / Performance
    if (msg.includes("fast") || msg.includes("speed") || msg.includes("0-100") || msg.includes("acceleration") || msg.includes("quick") || msg.includes("power") || msg.includes("bhp") || msg.includes("hp")) {
      return `
        <p><strong>Acceleration & Performance Rankings (0–100 km/h):</strong></p>
        <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
          <li>🏎️ <strong>Tesla Model 3:</strong> 4.2 sec (Instant dual-motor launch)</li>
          <li>⚡ <strong>Volvo EX30:</strong> 5.1 sec (Incredible compact SUV punch)</li>
          <li>🚀 <strong>Hyundai Kona Electric:</strong> 7.6 sec (Smooth, quiet acceleration)</li>
          <li>🏁 <strong>Kia Niro EV:</strong> 7.8 sec (Responsive single-motor torque)</li>
          <li>🏎️ <strong>Honda Civic e:HEV:</strong> 7.9 sec (Immediate electric motor step-off)</li>
          <li>🚗 <strong>MG ZS EV:</strong> 8.2 sec (Zippy around town)</li>
          <li>🚗 <strong>Skoda Octavia 1.4 TSI:</strong> 8.5 sec (Punchy turbocharged mid-range)</li>
          <li>🚗 <strong>Mazda 3:</strong> 8.9 sec (Linear, communicative atmospheric throttle)</li>
          <li>🚗 <strong>Toyota Corolla Hybrid:</strong> 9.2 sec (Tuned for maximum economy)</li>
        </ol>
        <p>Would you like to take the Tesla or Volvo for a spirited test drive?</p>
        <div class="cw-ai-msg-actions">
          <a href="test-drive.html?id=tesla-model3" class="btn btn--dark btn--sm">Test Drive Tesla</a>
          <a href="test-drive.html?id=volvo-ex30" class="btn btn--amber btn--sm">Test Drive Volvo</a>
        </div>
      `;
    }

    // Scenario H: Family Suitability / Space / Boot
    if (msg.includes("family") || msg.includes("seat") || msg.includes("boot") || msg.includes("luggage") || msg.includes("space") || msg.includes("child") || msg.includes("kids")) {
      if (car) {
        return `
          ${renderCarMiniCard(car)}
          <p>Family assessment for the <strong>${car.brand} ${car.name}</strong>:</p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Seating Capacity:</strong> ${car.seats} adults comfortably with ISOFIX child seat anchors.</li>
            <li><strong>Safety Score:</strong> ${car.safety} out of 5 stars (NCAP crash rating).</li>
            <li><strong>Cabin Space:</strong> ${car.bodyType === 'SUV' || car.bodyType === 'Wagon' ? 'Elevated roofline with easy child-seat loading and generous boot volume.' : 'Comfortable seating for 4-5 adults with practical daily boot space.'}</li>
            <li><strong>Verdict:</strong> ${car.description}</li>
          </ul>
          <div class="cw-ai-msg-actions">
            <a href="test-drive.html?id=${car.id}" class="btn btn--dark btn--sm">📅 Book Doorstep Test Drive</a>
          </div>
        `;
      } else {
        return `
          <p><strong>Top Family Cars in our Showroom:</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
            <li>🥇 <strong>Skoda Octavia Estate:</strong> Huge 640L boot (expandable to 1,700L) — best for prams, sports gear, and road trips.</li>
            <li>🥈 <strong>Kia Niro EV:</strong> Elevated SUV seating, wide rear doors, and flat floor for child seats.</li>
            <li>🥉 <strong>MG ZS EV:</strong> High value compact family SUV with easy ISOFIX access and 7-year warranty.</li>
            <li>🌟 <strong>Volvo EX30:</strong> Five-star Scandinavian safety cage, side impact airbags, and clean air filtration.</li>
          </ul>
          <p>Tell me how many people or child seats you travel with, and I'll find your perfect match!</p>
        `;
      }
    }

    // Scenario I: EV vs Hybrid guide
    if (msg.includes("hybrid") || msg.includes("electric") || msg.includes("ev vs") || msg.includes("difference")) {
      return `
        <p><strong>Full EV vs Self-Charging Hybrid: Which should you buy?</strong></p>
        <div style="background: var(--sand-50); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 10px; margin: 8px 0; font-size: 0.82rem;">
          <p><strong>⚡ Full Electric (Tesla, Volvo, MG, Hyundai, Kia):</strong><br>
          • <em>Running Cost:</em> ~₹1.2–₹1.8 per km (Home charging overnight).<br>
          • <em>Best if:</em> You can install a home charger or commute < 150 km daily.<br>
          • <em>Tradeoff:</em> Requires planning 25–35 min charging stops on long road trips.</p>
          <hr style="margin: 6px 0; border: none; border-top: 1px dashed var(--line);">
          <p><strong>🔋 Self-Charging Hybrid (Toyota Corolla, Honda Civic):</strong><br>
          • <em>Running Cost:</em> ~₹4.5–₹5.5 per km.<br>
          • <em>Best if:</em> You park on the street without a charger and want zero range anxiety.<br>
          • <em>Tradeoff:</em> Still uses petrol, higher tailpipe emissions than an EV.</p>
        </div>
        <p>Would you like to test drive an EV or a Hybrid?</p>
        <div class="cw-ai-msg-actions">
          <a href="test-drive.html?id=tesla-model3" class="btn btn--dark btn--sm">Test Drive Tesla EV</a>
          <a href="test-drive.html?id=toyota-corolla" class="btn btn--amber btn--sm">Test Drive Toyota Hybrid</a>
        </div>
      `;
    }

    // Scenario J: Target car specified (e.g. "Tell me about Tesla", "How is the Honda Civic?")
    if (car) {
      return `
        ${renderCarMiniCard(car)}
        <p>The <strong>${car.brand} ${car.name}</strong> (${car.trim}) is defined as <em>"${car.tag}"</em>.</p>
        <p style="margin: 8px 0; font-size: 0.85rem; color: var(--ink-700);">${car.description}</p>
        <div style="background: var(--sand-50); border: 1px solid var(--line); border-radius: 6px; padding: 10px; margin: 8px 0;">
          <strong style="font-size: 0.84rem; display: block; margin-bottom: 4px;">Top Highlights:</strong>
          <ul style="margin: 0; padding-left: 18px; font-size: 0.82rem; line-height: 1.5;">
            ${(car.pros || []).slice(0, 2).map(p => `<li>✅ ${p}</li>`).join('')}
            ${(car.cons || []).slice(0, 1).map(c => `<li>⚠️ ${c}</li>`).join('')}
          </ul>
        </div>
        <p>What would you like to explore next?</p>
        <div class="cw-ai-msg-actions">
          <a href="car.html?id=${car.id}#tradeoffs" class="btn btn--sm btn--ghost">🔍 Full Tradeoffs</a>
          <a href="test-drive.html?id=${car.id}" class="btn btn--sm btn--dark">📅 Book Test Drive</a>
          <a href="buy.html?id=${car.id}" class="btn btn--sm btn--amber">⚡ Reserve Online</a>
        </div>
      `;
    }

    // Scenario K: General Fallback / Welcome
    return `
      <p>I am your CarWise AI automotive advisor! I have deep technical specs, tradeoff dossiers, and real-time financing data on <strong>all 9 cars in our showroom</strong>:</p>
      <div class="cw-ai-car-grid">
        <div class="cw-ai-car-item" onclick="document.getElementById('cw-ai-input').value='Tell me about Tesla Model 3'; document.getElementById('cw-ai-form').dispatchEvent(new Event('submit'));">
          <img src="img/tesla-model3.jpg" alt="Tesla Model 3" onerror="this.style.display='none';" />
          <strong>Tesla Model 3</strong>
          <span>Electric · 390 mi</span>
        </div>
        <div class="cw-ai-car-item" onclick="document.getElementById('cw-ai-input').value='Tell me about Volvo EX30'; document.getElementById('cw-ai-form').dispatchEvent(new Event('submit'));">
          <img src="img/volvo-ex30.jpg" alt="Volvo EX30" onerror="this.style.display='none';" />
          <strong>Volvo EX30</strong>
          <span>Electric · 295 mi</span>
        </div>
        <div class="cw-ai-car-item" onclick="document.getElementById('cw-ai-input').value='Tell me about Toyota Corolla'; document.getElementById('cw-ai-form').dispatchEvent(new Event('submit'));">
          <img src="img/toyota-corolla.jpg" alt="Toyota Corolla" onerror="this.style.display='none';" />
          <strong>Toyota Corolla</strong>
          <span>Hybrid · 570 mi</span>
        </div>
        <div class="cw-ai-car-item" onclick="document.getElementById('cw-ai-input').value='Tell me about MG ZS EV'; document.getElementById('cw-ai-form').dispatchEvent(new Event('submit'));">
          <img src="img/mg-zs-ev.jpg" alt="MG ZS EV" onerror="this.style.display='none';" />
          <strong>MG ZS EV</strong>
          <span>Electric · 273 mi</span>
        </div>
      </div>
      <p>Ask me any question: <em>"What is the EMI for Tesla?"</em>, <em>"Compare Volvo vs MG"</em>, or <em>"Which car has the best range?"</em></p>
    `;
  }

  // Floating Chat Widget Renderer
  function initChatWidget() {
    if (document.getElementById("cw-ai-fab")) return;

    // Detect active car if on detail page or URL query
    const params = new URLSearchParams(window.location.search);
    const carId = params.get("id");
    const activeCar = getCarContext(carId);

    const fabHTML = `
      <div id="cw-ai-fab-container" class="cw-ai-container">
        <button id="cw-ai-fab" class="cw-ai-fab" type="button" aria-label="Open AI Car Assistant">
          <span class="cw-ai-fab-spark">✨</span>
          <span class="cw-ai-fab-label">${activeCar ? `Ask AI about ${activeCar.name}` : 'Chat with CarWise AI'}</span>
          <span class="cw-ai-fab-badge">AI</span>
        </button>

        <div id="cw-ai-window" class="cw-ai-window" style="display: none;" role="dialog" aria-modal="true">
          <div class="cw-ai-header">
            <div class="cw-ai-header-info">
              <div class="cw-ai-avatar">🤖</div>
              <div>
                <h4>CarWise AI Advisor</h4>
                <p class="cw-ai-status"><span>●</span> Online · ${activeCar ? `${activeCar.brand} ${activeCar.name}` : 'All 9 Showroom Models'}</p>
              </div>
            </div>
            <button id="cw-ai-close" class="cw-ai-close-btn" type="button" aria-label="Close Chat">&times;</button>
          </div>

          <div id="cw-ai-messages" class="cw-ai-messages">
            <div class="cw-ai-msg cw-ai-msg--bot">
              <p>Hello! I'm your CarWise AI automotive advisor. ${activeCar ? `I have complete technical specs, tradeoffs, and pricing data for the <strong>${activeCar.brand} ${activeCar.name}</strong>.` : 'I have full specs, real-world tradeoffs, and live pricing for all 9 vehicles (Tesla, Volvo, MG, Toyota, Mazda, Kia, Honda, Hyundai, Skoda).'}</p>
              <p style="margin-top: 6px;">How can I help you choose today?</p>
            </div>
          </div>

          <div class="cw-ai-chips-wrap">
            <div class="cw-ai-chips" id="cw-ai-chips">
              ${activeCar ? `
                <button class="cw-ai-chip" type="button" data-prompt="What are the biggest tradeoffs of ${activeCar.brand} ${activeCar.name}?">⚠️ Tradeoffs & Cons</button>
                <button class="cw-ai-chip" type="button" data-prompt="Calculate monthly EMI for ${activeCar.brand} ${activeCar.name}">💰 EMI Calculator</button>
                <button class="cw-ai-chip" type="button" data-prompt="What is the real-world range and charging time of ${activeCar.brand} ${activeCar.name}?">🔋 Real-World Range</button>
                <button class="cw-ai-chip" type="button" data-prompt="Is the ${activeCar.brand} ${activeCar.name} suitable for a family?">👨‍👩‍👧 Family Suitability</button>
              ` : `
                <button class="cw-ai-chip" type="button" data-prompt="Which electric car has the longest battery range?">⚡ Longest Range EV</button>
                <button class="cw-ai-chip" type="button" data-prompt="Compare Tesla Model 3 vs Volvo EX30">⚖️ Tesla vs Volvo</button>
                <button class="cw-ai-chip" type="button" data-prompt="Which is the most affordable car in the showroom?">💰 Best Budget Pick</button>
                <button class="cw-ai-chip" type="button" data-prompt="Show all 9 cars in the showroom">🚗 Show All 9 Cars</button>
                <button class="cw-ai-chip" type="button" data-prompt="Which car has the fastest 0-100 km/h acceleration?">🏎️ Fastest 0-100</button>
              `}
            </div>
          </div>

          <form id="cw-ai-form" class="cw-ai-input-bar">
            <input type="text" id="cw-ai-input" placeholder="${activeCar ? `Ask about ${activeCar.name}...` : 'Ask about Tesla, Volvo, Toyota, MG, Hyundai...'}" required autocomplete="off" />
            <button type="submit" class="cw-ai-send-btn" aria-label="Send Message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", fabHTML);

    const fab = document.getElementById("cw-ai-fab");
    const win = document.getElementById("cw-ai-window");
    const closeBtn = document.getElementById("cw-ai-close");
    const form = document.getElementById("cw-ai-form");
    const input = document.getElementById("cw-ai-input");
    const messages = document.getElementById("cw-ai-messages");
    const chips = document.getElementById("cw-ai-chips");

    function toggleChat(open) {
      if (open === undefined) open = win.style.display === "none";
      win.style.display = open ? "flex" : "none";
      fab.classList.toggle("is-active", open);
      if (open) {
        input.focus();
        messages.scrollTop = messages.scrollHeight;
      }
    }

    fab.addEventListener("click", () => toggleChat());
    closeBtn.addEventListener("click", () => toggleChat(false));

    function appendMessage(text, sender) {
      const msgDiv = document.createElement("div");
      msgDiv.className = `cw-ai-msg cw-ai-msg--${sender}`;
      if (sender === "user") {
        msgDiv.textContent = text;
      } else {
        msgDiv.innerHTML = text;
      }
      messages.appendChild(msgDiv);
      messages.scrollTop = messages.scrollHeight;
    }

    function handleUserInput(userText) {
      if (!userText || !userText.trim()) return;
      appendMessage(userText, "user");

      // Show typing indicator
      const typingDiv = document.createElement("div");
      typingDiv.className = "cw-ai-msg cw-ai-msg--bot cw-ai-typing";
      typingDiv.innerHTML = `<span class="cw-dot"></span><span class="cw-dot"></span><span class="cw-dot"></span>`;
      messages.appendChild(typingDiv);
      messages.scrollTop = messages.scrollHeight;

      setTimeout(() => {
        if (typingDiv.parentElement) typingDiv.parentElement.removeChild(typingDiv);
        const botReply = generateAIResponse(userText, activeCar);
        appendMessage(botReply, "bot");
      }, 500);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value;
      input.value = "";
      handleUserInput(val);
    });

    chips.querySelectorAll(".cw-ai-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prompt = chip.dataset.prompt;
        handleUserInput(prompt);
      });
    });
  }

  // Auto-init on page load
  document.addEventListener("DOMContentLoaded", () => {
    initChatWidget();
  });

  return {
    initChatWidget,
    generateAIResponse,
    findCarsInText
  };
})();

if (typeof window !== "undefined") {
  window.CarWiseAI = CarWiseAI;
}

