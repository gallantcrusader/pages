// Safety guides. Plain content, stored in the app so it works offline.
// Sources: Ready.gov, CDC, EPA, USDA/FoodSafety.gov, FDA, NWS, FEMA.

export const GUIDES = [
  {
    id: 'before',
    icon: '📋',
    title: 'Before the storm',
    summary: 'Supplies, documents and a plan — a checklist that saves your progress.',
    checklist: [
      ['water', 'Water: at least 1 gallon per person per day for several days (2 weeks if you can). Include pets.'],
      ['food', 'Food that needs no cooking or refrigeration, plus a manual can opener.'],
      ['meds', 'Prescription medicines (refill early), glasses, hearing-aid batteries, medical supplies.'],
      ['power', 'Charged power banks, car charger, flashlights and extra batteries. Avoid candles.'],
      ['radio', 'Battery or hand-crank radio (NOAA Weather Radio if possible).'],
      ['docs', 'IDs, insurance policies, deeds, medical info in a waterproof bag. Photos of them on your phone.'],
      ['cash', 'Cash in small bills — card readers and ATMs go down with the power.'],
      ['zone', 'Know your evacuation zone and at least two routes out.'],
      ['plan', 'Family plan: where to meet, an out-of-town contact everyone checks in with.'],
      ['gas', 'Fill your car’s gas tank and any approved fuel cans (store outdoors).'],
      ['photos', 'Take photos/video of your home and belongings for insurance.'],
      ['yard', 'Bring in or tie down outdoor furniture, grills and anything that can blow away.'],
      ['fridge', 'Set fridge and freezer to the coldest setting; freeze water bottles and ice packs.'],
      ['tub', 'Fill bathtubs and buckets with water for flushing toilets and cleaning.'],
      ['pets', 'Pet supplies, carrier, leash, vaccination records and a current photo.'],
      ['medical', 'If you rely on powered medical equipment, tell your power company and have a backup plan.'],
      ['co', 'Battery-powered carbon monoxide alarm installed and tested.'],
      ['contacts', 'Save your providers’ outage numbers (this app can download them to your contacts).'],
    ],
  },
  {
    id: 'during',
    icon: '🌀',
    title: 'During the storm',
    summary: 'Where to shelter, flooding, and staying in touch.',
    html: `
      <ul>
        <li><strong>Leave if told to evacuate.</strong> Follow local officials, not social media rumors.</li>
        <li>Shelter in a small interior room, closet or hallway on the lowest floor that will not flood, away from windows.</li>
        <li>If flood water is rising, go to the highest level. <strong>Do not climb into a closed attic</strong> — you can be trapped. Go onto the roof only if you must, and signal for help.</li>
        <li><strong>The calm “eye” is not the end.</strong> Winds return quickly from the other direction. Stay inside until officials say the storm has passed.</li>
        <li><strong>Text instead of calling</strong> — texts get through when networks are jammed. Keep calls short and save 911 lines for emergencies.</li>
        <li>Save phone battery: lower screen brightness, turn on low-power mode, close apps, turn off Bluetooth and Wi-Fi if not in use.</li>
        <li>Never drive or walk through flood water. <strong>Turn Around, Don’t Drown.</strong></li>
      </ul>`,
  },
  {
    id: 'after',
    icon: '🧹',
    title: 'After the storm',
    summary: 'Hidden dangers, documenting damage, getting help, avoiding scams.',
    html: `
      <ul>
        <li>Wait for officials to say it is safe to return. Roads may be blocked or washed out.</li>
        <li><strong>Stay far away from downed power lines</strong> (at least 35 feet) and anything touching them, including water. Call 911 and your power company.</li>
        <li>Stay out of flood water — it can hide sharp debris, sewage, chemicals, snakes and live wires.</li>
        <li>Photograph all damage <em>before</em> you clean up or throw anything away. Keep every receipt.</li>
        <li>Call your insurance company, then apply for help at <a href="https://www.disasterassistance.gov" target="_blank" rel="noopener noreferrer">DisasterAssistance.gov</a> or 1-800-621-3362 if your county has a federal declaration.</li>
        <li>Wear gloves, sturdy boots and an N95 mask for cleanup. Dry or remove wet materials within 24–48 hours to limit mold.</li>
        <li>Chainsaws: never cut alone, and watch for trees under tension.</li>
        <li><strong>Heat kills after hurricanes.</strong> Without A/C, rest in the coolest spot, drink water, and check on older neighbors.</li>
        <li>Beware of scams: FEMA never charges for help. Don’t pay contractors the full price up front, and verify licenses.</li>
      </ul>`,
  },
  {
    id: 'power',
    icon: '🔌',
    title: 'Power outage',
    summary: 'Food safety, staying cool, medical devices and what to report.',
    html: `
      <ul>
        <li><strong>Report the outage</strong> to your power company even if neighbors have — it helps them map the damage. Write down your ticket number.</li>
        <li>Unplug electronics and appliances to protect them from surges when power returns. Leave one light switched on so you know when it’s back.</li>
        <li>Keep the fridge and freezer closed. A closed fridge keeps food safe about <strong>4 hours</strong>; a full freezer about <strong>48 hours</strong> (24 if half full).</li>
        <li>Use flashlights, not candles. Never use a gas stove, oven or grill to heat your home.</li>
        <li>If someone depends on powered medical equipment and you can’t keep it running, call 911 or go to a shelter or hospital.</li>
        <li>In heat, go to a cooling center, library or mall if you can. Keep curtains closed during the day.</li>
      </ul>
      <p>Use the <a href="#/services/power">food safety timer</a> on the Power page to track how long the power has been out.</p>`,
  },
  {
    id: 'generator',
    icon: '⚠️',
    title: 'Generator & carbon monoxide',
    summary: 'CO poisoning is one of the top causes of death after hurricanes.',
    html: `
      <ul>
        <li><strong>Never run a generator inside</strong> a home, garage, carport, basement or crawl space — not even with doors or windows open.</li>
        <li>Keep it outdoors and <strong>at least 20 feet</strong> from the house, with the exhaust pointed away from windows, doors and vents.</li>
        <li>Install battery-operated CO alarms near sleeping areas.</li>
        <li><strong>Never plug a generator into a wall outlet</strong> (“backfeeding”). It can electrocute you, your neighbors and line workers. Use heavy-duty outdoor extension cords or a transfer switch installed by an electrician.</li>
        <li>Turn it off and let it cool before refueling. Store fuel outside the house.</li>
        <li>Keep it dry — run it under an open canopy, never in standing water.</li>
      </ul>
      <div class="callout danger">
        <strong>Carbon monoxide symptoms:</strong> headache, dizziness, weakness, upset stomach, vomiting, chest pain, confusion. If you feel sick, dizzy or weak, <strong>get to fresh air right away and call 911</strong>. CO can kill sleeping people before they wake.
      </div>`,
  },
  {
    id: 'water',
    icon: '💧',
    title: 'Boil-water notices & safe water',
    summary: 'How to boil or disinfect water, and what you can use it for.',
    html: `
      <h3>When a boil-water notice is in effect</h3>
      <ul>
        <li>Use bottled or boiled water for <strong>drinking, cooking, making ice, brushing teeth, washing produce and preparing baby formula</strong>.</li>
        <li>To boil: bring clear water to a <strong>rolling boil for 1 minute</strong> (3 minutes above 6,500 ft). Let it cool and store it in clean, covered containers.</li>
        <li>If the water is cloudy, let it settle or filter it through a clean cloth, paper towel or coffee filter first.</li>
        <li>Showering and bathing are usually fine — don’t swallow the water. Sponge-bathe babies.</li>
        <li>Wash hands with soap and tap water, or use hand sanitizer.</li>
        <li>Dishes: use a dishwasher with a sanitizing cycle, or hand-wash, then soak for 1 minute in 1 teaspoon of unscented bleach per gallon of water and air dry.</li>
        <li>When the notice is lifted, flush taps for several minutes, and replace fridge water filters and ice.</li>
      </ul>
      <h3>Disinfecting with bleach (if you can’t boil)</h3>
      <p>Use plain, unscented liquid household bleach (check the label for 6% or 8.25% sodium hypochlorite). Add bleach, stir, and <strong>wait 30 minutes</strong>. The water should smell slightly of chlorine; if not, repeat the dose and wait 15 more minutes. <strong>Double the amount for cloudy, colored or very cold water.</strong></p>
      <div id="bleach-calc"></div>
      <table class="table">
        <thead><tr><th>Water</th><th>6% bleach</th><th>8.25% bleach</th></tr></thead>
        <tbody>
          <tr><td>1 quart / liter</td><td>2 drops</td><td>2 drops</td></tr>
          <tr><td>1 gallon</td><td>8 drops</td><td>6 drops</td></tr>
          <tr><td>2 gallons</td><td>16 drops (¼ tsp)</td><td>12 drops (⅛ tsp)</td></tr>
          <tr><td>4 gallons</td><td>⅓ tsp</td><td>¼ tsp</td></tr>
          <tr><td>8 gallons</td><td>⅔ tsp</td><td>½ tsp</td></tr>
        </tbody>
      </table>
      <p class="small muted">Amounts from the U.S. EPA’s emergency disinfection guidance. Bleach does not remove chemical contamination — if fuel or chemicals got into your water, don’t drink it.</p>
      <h3>Private wells</h3>
      <p>If your well was flooded, don’t drink from it until it has been disinfected and tested. Your county health department can help.</p>`,
  },
  {
    id: 'flood',
    icon: '🌊',
    title: 'Flooding',
    summary: 'Turn Around, Don’t Drown — and what to do after water gets in.',
    html: `
      <ul>
        <li><strong>6 inches</strong> of moving water can knock you down. <strong>12 inches</strong> can float a car. <strong>2 feet</strong> of rushing water can carry away most vehicles.</li>
        <li>Never drive around barricades. Many flood deaths happen in vehicles, often at night.</li>
        <li>If your car stalls in rising water, get out and move to higher ground if it is safe to do so.</li>
        <li>Storm surge is the deadliest part of most hurricanes. If you are told to leave a surge zone, go.</li>
        <li>After flooding: don’t turn on power if you are standing in water or if outlets got wet — have an electrician check first.</li>
        <li>Throw out food, medicine and cosmetics that touched flood water.</li>
      </ul>`,
  },
  {
    id: 'heat',
    icon: '🌡️',
    title: 'Heat illness',
    summary: 'Signs of heat exhaustion and heat stroke when the A/C is out.',
    html: `
      <div class="callout danger">
        <strong>Heat stroke — call 911.</strong> High body temperature (103°F+), hot red dry or damp skin, fast strong pulse, headache, dizziness, nausea, confusion or passing out. Move the person somewhere cooler and cool them with wet cloths or a cool bath. Don’t give them anything to drink.
      </div>
      <div class="callout warn">
        <strong>Heat exhaustion.</strong> Heavy sweating, cold pale clammy skin, fast weak pulse, nausea or vomiting, muscle cramps, tiredness, dizziness, headache, fainting. Move to a cool place, loosen clothing, use cool wet cloths, sip water. Get medical help if they are throwing up, or symptoms get worse or last longer than 1 hour.
      </div>
      <ul>
        <li>Drink water regularly, even if you aren’t thirsty. Avoid alcohol and sugary drinks.</li>
        <li>Check on older adults, babies, people with health conditions and anyone living alone — twice a day.</li>
        <li>Never leave children or pets in a parked car.</li>
      </ul>`,
  },
  {
    id: 'food-meds',
    icon: '🥫',
    title: 'Food & medicine without power',
    summary: 'What to keep, what to throw out, and insulin storage.',
    html: `
      <ul>
        <li>Throw out perishable food (meat, poultry, fish, eggs, leftovers, milk, soft cheese) that has been above 40°F for more than 2 hours. <strong>When in doubt, throw it out.</strong></li>
        <li>Frozen food that still has ice crystals or is at 40°F or below can be refrozen or cooked.</li>
        <li>Never taste food to decide if it is safe.</li>
        <li>Most insulin can be kept unrefrigerated (59–86°F) for up to 28 days. Keep it out of direct heat and sunlight, and replace it as soon as you can.</li>
        <li>If medicine got wet or overheated, ask a pharmacist before using it. Many pharmacies can do emergency refills during declared disasters.</li>
      </ul>`,
  },
  {
    id: 'scams',
    icon: '🛑',
    title: 'Scams & price gouging',
    summary: 'Fake FEMA agents, contractor fraud and illegal price hikes.',
    html: `
      <ul>
        <li>FEMA and other agencies never charge to apply for help. Ask any “inspector” for photo ID.</li>
        <li>Never pay with gift cards, wire transfers or crypto. Don’t give out your Social Security or bank number to unexpected callers.</li>
        <li>Get written estimates, check contractor licenses and reviews, and don’t pay the full amount up front.</li>
        <li>Many states ban price gouging on essentials (water, fuel, hotels, generators, repairs) during a declared emergency. Save receipts and photos of prices, and report it to your state attorney general.</li>
        <li>Report fraud involving FEMA or other disaster aid to the DHS Inspector General hotline: 1-800-323-8603.</li>
      </ul>`,
  },
  {
    id: 'people',
    icon: '🤝',
    title: 'Kids, pets & mental health',
    summary: 'Taking care of the people (and animals) around you.',
    html: `
      <ul>
        <li>Keep routines where you can. Let kids ask questions and limit how much storm coverage they watch.</li>
        <li>Most emergency shelters accept service animals; many now accept pets — call ahead or check local pet-friendly shelters.</li>
        <li>Keep pets indoors during and after the storm. Floods move animals and debris; keep them on a leash.</li>
        <li>Stress, trouble sleeping and anxiety are normal after a disaster. The <strong>Disaster Distress Helpline</strong> (call or text 1-800-985-5990) is free, confidential and open 24/7.</li>
        <li>In a mental health crisis, call or text <strong>988</strong>.</li>
      </ul>`,
  },
];

export function getGuide(id) {
  return GUIDES.find((g) => g.id === id) || null;
}
