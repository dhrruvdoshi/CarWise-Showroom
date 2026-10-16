/* CarWise — shared car catalog.
   Loads from Supabase with hardcoded fallback so every page
   (home, browse, compare, detail) stays in sync. */

let CARS = [
  {
    id: "mg-zs-ev",
    brand: "MG",
    name: "ZS EV",
    trim: "Excite Pro",
    tag: "Everyday electric",
    tagline: "A quiet, easy-to-park EV with more space than its footprint suggests.",
    bodyType: "SUV",
    powertrain: "Electric",
    price: 23990,
    range: 273,
    rangeUnit: "mi range",
    economy: "4.7 mi/kWh",
    seats: 5,
    safety: 5,
    theme: "peach",
    pros: [
      "Cheapest way into an EV on this list",
      "Tight turning circle, easy in car parks",
      "7-year warranty as standard"
    ],
    cons: [
      "Charging speed trails newer EVs",
      "Interior plastics feel budget"
    ],
    description:
      "The ZS EV is built for people who want electric motoring without the premium price tag. It won't win a drag race, but around town it's calm, quiet, and cheap to live with — and the boot swallows a weekly shop without a fight."
  },
  {
    id: "toyota-corolla",
    brand: "Toyota",
    name: "Corolla",
    trim: "Hybrid Design",
    tag: "Low-stress miles",
    tagline: "The sensible pick that's composed in traffic and confident on the motorway.",
    bodyType: "Hatchback",
    powertrain: "Hybrid",
    price: 27650,
    range: 570,
    rangeUnit: "mi tank range",
    economy: "52 mpg",
    seats: 5,
    safety: 5,
    theme: "sky",
    pros: [
      "Excellent real-world fuel economy",
      "Toyota reliability record",
      "Hybrid battery needs no charging habit"
    ],
    cons: [
      "Boot is smaller than rivals",
      "Firm ride on larger wheels"
    ],
    description:
      "The Corolla doesn't ask you to change anything about how you drive. Fill it up like always, and the hybrid system quietly does the fuel-saving in the background. It's the car for someone who wants one less thing to think about."
  },
  {
    id: "volvo-ex30",
    brand: "Volvo",
    name: "EX30",
    trim: "Plus Single Motor",
    tag: "Small, considered",
    tagline: "A compact SUV with an unusually thoughtful cabin and a strong safety story.",
    bodyType: "SUV",
    powertrain: "Electric",
    price: 34900,
    range: 295,
    rangeUnit: "mi range",
    economy: "4.8 mi/kWh",
    seats: 5,
    safety: 5,
    theme: "mint",
    pros: [
      "Volvo-grade safety kit as standard",
      "Recycled materials, minimal but premium cabin",
      "Genuinely quick for the class"
    ],
    cons: [
      "Most controls live in the touchscreen",
      "Firmer ride than a typical Volvo"
    ],
    description:
      "The EX30 is proof a small EV doesn't have to feel like a compromise. It's quick, it's safe by design rather than as an afterthought, and the interior avoids the clutter most small SUVs are stuck with."
  },
  {
    id: "mazda-mazda3",
    brand: "Mazda",
    name: "Mazda3",
    trim: "e-Skyactiv X",
    tag: "Drive something",
    tagline: "A tactile, genuinely enjoyable sedan for people who still like the long way home.",
    bodyType: "Sedan",
    powertrain: "Petrol",
    price: 26480,
    range: 470,
    rangeUnit: "mi tank range",
    economy: "42 mpg",
    seats: 5,
    safety: 5,
    theme: "clay",
    pros: [
      "Best steering feel in this list",
      "Handsome, understated design",
      "Cabin quality above its price point"
    ],
    cons: [
      "Rear headroom is tight",
      "Infotainment feels dated"
    ],
    description:
      "Most cars in this price range are appliances. The Mazda3 isn't — the steering has weight, the chassis talks back, and it still returns a fair fuel economy number. If the commute is the only driving you do, this is the one that makes it feel worthwhile."
  },
  {
    id: "kia-niro",
    brand: "Kia",
    name: "Niro",
    trim: "2 Hybrid",
    tag: "Ready to grow",
    tagline: "Useful proportions, friendly controls, and a warranty that keeps the maths simple.",
    bodyType: "SUV",
    powertrain: "Hybrid",
    price: 30195,
    range: 560,
    rangeUnit: "mi tank range",
    economy: "53 mpg",
    seats: 5,
    safety: 5,
    theme: "lilac",
    pros: [
      "7-year, 100,000-mile warranty",
      "Genuinely easy to use touchscreen and dials",
      "Plug-in and full-EV siblings share the same body"
    ],
    cons: [
      "Not especially quick",
      "Divisive exterior styling"
    ],
    description:
      "The Niro is built to be lived with for a decade without surprises. The warranty backs that up, and the cabin is laid out so a new driver in the family can figure it out in a weekend, not a fortnight."
  },
  {
    id: "honda-civic",
    brand: "Honda",
    name: "Civic",
    trim: "e:HEV Advance",
    tag: "Room to grow",
    tagline: "A calm, spacious hybrid that makes the practical decision feel like a treat.",
    bodyType: "Hatchback",
    powertrain: "Hybrid",
    price: 33800,
    range: 500,
    rangeUnit: "mi tank range",
    economy: "47 mpg",
    seats: 5,
    safety: 5,
    theme: "rose",
    pros: [
      "Spacious rear seats and boot for the class",
      "Refined hybrid powertrain, quiet at speed",
      "Strong resale value"
    ],
    cons: [
      "Top trim gets expensive quickly",
      "Firmer suspension on 18-inch wheels"
    ],
    description:
      "Honda's tenth-generation Civic hybrid is the car equivalent of a good pair of shoes: nothing about it demands attention, and that's exactly the point. Everyone who rides in the back seat will notice the extra room; nobody will complain about the fuel bill."
  },
  {
    id: "hyundai-kona",
    brand: "Hyundai",
    name: "Kona Electric",
    trim: "Ultimate",
    tag: "Plug in, no drama",
    tagline: "An EV without the intimidation — familiar layout, strong range, sharp price.",
    bodyType: "SUV",
    powertrain: "Electric",
    price: 32750,
    range: 319,
    rangeUnit: "mi range",
    economy: "4.3 mi/kWh",
    seats: 5,
    safety: 5,
    theme: "sand",
    pros: [
      "Longest range EV under $35k on this list",
      "Physical buttons for climate — no menu-diving",
      "Fast-charges to 80% in around 40 minutes"
    ],
    cons: [
      "Ride can feel busy on rough roads",
      "Options list gets pricey"
    ],
    description:
      "The Kona Electric is aimed squarely at someone going electric for the first time. Nothing about the controls asks you to relearn how a car works — the range and the price are just better than most first-EV buyers expect."
  },
  {
    id: "skoda-octavia",
    brand: "Škoda",
    name: "Octavia",
    trim: "SE Technology",
    tag: "The one for cargo",
    tagline: "A sedan-sized wagon disguised as sensible, with a boot that shames larger SUVs.",
    bodyType: "Wagon",
    powertrain: "Diesel",
    price: 28990,
    range: 720,
    rangeUnit: "mi tank range",
    economy: "58 mpg",
    seats: 5,
    safety: 5,
    theme: "moss",
    pros: [
      "Enormous boot for the class",
      "Diesel economy suits long motorway miles",
      "Understated, ages well"
    ],
    cons: [
      "Diesel makes less sense for short trips",
      "Not visually exciting"
    ],
    description:
      "If the back of the car carries more than the front seats do, the Octavia earns its keep fast. It's the choice for people who've stopped shopping by badge and started shopping by boot volume and fuel receipts."
  },
  {
    id: "tesla-model3",
    brand: "Tesla",
    name: "Model 3",
    trim: "Rear-Wheel Drive",
    tag: "Tech-first",
    tagline: "The EV benchmark for range and charging speed, built around one big screen.",
    bodyType: "Sedan",
    powertrain: "Electric",
    price: 38990,
    range: 272,
    rangeUnit: "mi range",
    economy: "4.2 mi/kWh",
    seats: 5,
    safety: 5,
    theme: "steel",
    pros: [
      "Access to the Supercharger network",
      "Frequent over-the-air improvements",
      "Quick, and quieter than most EVs at speed"
    ],
    cons: [
      "Almost every control lives on the screen",
      "Panel gaps and finish trail rivals"
    ],
    description:
      "The Model 3 asks you to do things differently — indicators on the wheel, glovebox in the menu — and most owners say the charging network and software updates make that trade worth it. It's the car for someone who wants their vehicle to keep improving after they buy it."
  }
];

/* Load cars from Supabase (called during CarWise.init).
   On success the CARS array is replaced with live data;
   on failure the hardcoded fallback above is kept. */
async function loadCarsFromDB() {
  try {
    const { data, error } = await _supabase.from('cars').select('*');
    if (!error && data && data.length > 0) {
      CARS = data.map(row => ({
        id: row.id,
        brand: row.brand,
        name: row.name,
        trim: row.trim,
        tag: row.tag,
        tagline: row.tagline,
        bodyType: row.body_type,
        powertrain: row.powertrain,
        price: row.price,
        range: row.range_value,
        rangeUnit: row.range_unit,
        economy: row.economy,
        seats: row.seats,
        safety: row.safety,
        theme: row.theme,
        image: `img/${row.id}.jpg`,
        pros: Array.isArray(row.pros) ? row.pros : [],
        cons: Array.isArray(row.cons) ? row.cons : [],
        description: row.description
      }));
    }
  } catch (e) {
    console.warn('CarWise: Using fallback car data', e);
  }
}

/* Small helper used by multiple pages. */
function formatPrice(n) {
  return "$" + n.toLocaleString("en-US");
}

function getCarById(id) {
  const found = CARS.find((c) => c.id === id);
  if (found && !found.image) found.image = `img/${found.id}.jpg`;
  return found;
}
