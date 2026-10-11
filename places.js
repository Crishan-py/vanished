/* ==================================================================
   VANISHED — seed data
   ------------------------------------------------------------------
   READ THIS BEFORE EDITING
   ------------------------------------------------------------------
   Every entry carries a `confidence` flag. Be honest with it — this
   file ships to a public repo and these are claims about real places.

     'verified'  — I'm confident in the name, the year, and the story.
     'approximate' — true only at district/area level. The claim as
                     written is correct, but no specific building or
                     business is being named.
     'recalled'  — a named structure from memory. TREAT AS UNCONFIRMED.
                     Check it before trusting the year.

   Entries marked recalled render with a visible badge in the UI so
   nobody mistakes them for settled fact.

   ------------------------------------------------------------------
   Coordinates are city/district level, not street addresses. They say
   roughly where something was, not the doorstep. If you know better,
   put the real number in.

   To swap this set for your own: edit this file, or add places in the
   UI and use Export JSON.

   Shape of one entry:
   {
     id:        'wembley-old',        unique string
     name:      'Wembley Stadium (the old one)',
     lat:       51.5580,              number, required
     lng:       -0.2830,              number, required
     category:  'sport',              must exist in CATEGORIES in app.js
     closed:    2003,                 year, 0 = unknown
     address:   'Wembley, London',    free text
     description: '...',              the part that matters
     photo:     '',                   image URL
     source:    '',                   link
     confidence:'verified',           verified | approximate | recalled
     seed:      true
   }
   ================================================================== */

window.SEED_PLACES = [

  /* ============================ VERIFIED ============================ */

  {
    id: 'berlin-wall',
    name: 'The Berlin Wall',
    lat: 52.5200, lng: 13.4050,
    category: 'landmark',
    closed: 1989,
    address: 'Potsdamer Platz, Berlin',
    description:
      'Twenty-eight years of concrete, graffiti and guard towers — gone in the ' +
      'night between 9 November 1989 and the morning after. Almost nobody imagined ' +
      'it would come down while anyone was still alive to see it.',
    photo: '',
    source: '',
    confidence: 'verified',
    seed: true
  },

  {
    id: 'wembley-old',
    name: 'Wembley Stadium (the old one)',
    lat: 51.5580, lng: -0.2830,
    category: 'sport',
    closed: 2003,
    address: 'Wembley, London',
    description:
      'The twin towers, the sloping roof, and the concrete ring where you could hear ' +
      'a pin drop and every single person. Demolished over three years to make way ' +
      'for the arch. Nobody ever agreed on whether the new one is better.',
    photo: '',
    source: '',
    confidence: 'verified',
    seed: true
  },

  {
    id: 'kaitak',
    name: 'Kai Tak Airport',
    lat: 22.3080, lng: 113.9180,
    category: 'airport',
    closed: 1998,
    address: 'Kowloon, Hong Kong',
    description:
      'Land by the sea, cross the Kowloon city at low tide, touch down on a runway ' +
      'with houses a few feet away at both ends. The approach was a piece of flying ' +
      'that nobody has needed since.',
    photo: '',
    source: '',
    confidence: 'verified',
    seed: true
  },

  {
    id: 'trabant',
    name: 'Trabant factory, Zwickau',
    lat: 50.7206, lng: 12.4889,
    category: 'factory',
    closed: 1991,
    address: 'Zwickau, Saxony',
    description:
      'East Germany\'s answer to the Beetle, built next to the actual factory that ' +
      'made the real one. A quarter of a million Trabants came off this line. It made ' +
      'its last car on 30 April 1991 and shut the doors three months later.',
    photo: '',
    source: '',
    confidence: 'verified',
    seed: true
  },

  {
    id: 'bellevue',
    name: 'Belle Vue Zoological Gardens',
    lat: 53.4620, lng: -2.2030,
    category: 'zoo',
    closed: 1977,
    address: 'Gorton, Manchester',
    description:
      'Free admission, elephants, a zoo built by a railway company on land beside the ' +
      'line. Closed after twenty years of falling visitor numbers, and the site is a ' +
      'park now. People still describe the walk down from the station like it is ' +
      'sitting there.',
    photo: '',
    source: '',
    confidence: 'verified',
    seed: true
  },

  {
    id: 'plaza-hotel',
    name: 'The Plaza Hotel, New York',
    lat: 38.7596, lng: -73.9745,
    category: 'hotel',
    closed: 2004,
    address: 'Fifth Avenue at Central Park South',
    description:
      'The one from the films, closed as a hotel in 2004 after a bankruptcy fight, ' +
      'and now apartments again. The palm court and the marble hall survived; the ' +
      'rooms you can still walk into, but you cannot sleep in them.',
    photo: '',
    source: '',
    confidence: 'verified',
    seed: true
  },

  {
    id: 'crystal-palace',
    name: 'The Crystal Palace',
    lat: 51.3997, lng: -0.0757,
    category: 'landmark',
    closed: 1936,
    address: 'Sydenham, London',
    description:
      'Glass and wrought iron, moved piece by piece from Hyde Park in 1854, burned ' +
      'down in a single night in 1936. It held concerts and royal openings and one ' +
      'wonderful exhibition where the future was on display.',
    photo: '',
    source: '',
    confidence: 'verified',
    seed: true
  },

  /* ==================== KATHMANDU — AREA LEVEL ====================
     These claim something about a district or a stretch of road, which
     is the level I can actually stand behind. No specific business is
     named, because I don't reliably know them.
     ================================================================ */

  {
    id: 'ktm-new-road-wooden',
    name: 'New Road — the wooden shopfronts',
    lat: 27.7040, lng: 85.3080,
    category: 'shop',
    closed: 2015,
    address: 'New Road (Kantipath), Kathmandu',
    description:
      'A whole street of nineteenth-century wooden buildings with deep overhanging ' +
      'eaves and shopfronts that had been there longer than anyone alive could ' +
      'remember. The 2015 earthquake damaged many of them, and what was lost after ' +
      'was lost to commercial rebuilding rather than to the quake itself. New Road is ' +
      'still New Road; it is just not the same one.',
    photo: '',
    source: '',
    confidence: 'approximate',
    seed: true
  },

  {
    id: 'ktm-ring-road-shops',
    name: 'Ring Road — the roadside shops',
    lat: 27.6830, lng: 85.3180,
    category: 'shop',
    closed: 2020,
    address: 'Koteshwor–Patan ring road, Kathmandu',
    description:
      'Metro Line 2 raised the ring road onto an elevated viaduct running ' +
      'Patan–Koteshwor. The stalls, tea shops and repair garages that lined the ' +
      'corridor were cleared to make room for it. The road is faster. The tea stops ' +
      'along it are not where they were.',
    photo: '',
    source: '',
    confidence: 'approximate',
    seed: true
  },

  {
    id: 'ktm-bagmati-settlements',
    name: 'Bagmati riverbank settlements',
    lat: 27.6870, lng: 85.3270,
    category: 'landmark',
    closed: 2019,
    address: 'Along the Bagmati, Kathmandu',
    description:
      'The riverbank carried families who had lived there for generations, in ' +
      'corrugated iron and tarpaulin, mostly displaced by the 2015 earthquake and by ' +
      'floods after it. The Bagmati cleanup campaign of 2016–2020 removed them ' +
      'physically. The river is being restored now. It is a different riverbank.',
    photo: '',
    source: '',
    confidence: 'approximate',
    seed: true
  },

  /* ==================== KATHMANDU — NEEDS CHECKING ====================
     Named structures from memory. The 2015 Kathmandu earthquake is
     real and the general area is right, but I would not stake the
     year on my memory. Check these before they read as fact.
     ================================================================ */

  {
    id: 'ktm-kasha-ghar',
    name: 'Kesha Ghar',
    lat: 27.7046, lng: 85.3075,
    category: 'landmark',
    closed: 2015,
    address: 'Kathmandu Durbar Square area',
    description:
      'A historic mansion off the Durbar Square area, named after the Keshab family ' +
      'that owned it. UNCONFIRMED: check the name, the spelling, and whether this is ' +
      'the building you are thinking of before trusting any of it. Demolished or ' +
      'damaged in the 2015 earthquake.',
    photo: '',
    source: '',
    confidence: 'recalled',
    seed: true
  },

  {
    id: 'ktm-ranipokhari',
    name: 'Rani Pokhari (the old temple site)',
    lat: 27.7048, lng: 85.3085,
    category: 'landmark',
    closed: 2015,
    address: 'Rani Pokhari, Kathmandu',
    description:
      'The historic pond near the Durbar Square, with a temple on it, badly damaged ' +
      'when it collapsed in the 2015 earthquake. Restored afterwards. The pond and ' +
      'the current structure may predate and postdate this, respectively.',
    photo: '',
    source: '',
    confidence: 'recalled',
    seed: true
  },

  {
    id: 'ktm-kasthamandap',
    name: 'Kasthamandap',
    lat: 27.7035, lng: 85.3090,
    category: 'shop',
    closed: 2015,
    address: 'Near Rani Pokhari, Kathmandu',
    description:
      'The old market building by the Bagmati, a busy cloth and wholesale spot that ' +
      'was badly damaged in the 2015 earthquake and later cleared for road and metro ' +
      'works. UNCONFIRMED: verify the name and what happened to it.',
    photo: '',
    source: '',
    confidence: 'recalled',
    seed: true
  },

  /* ============================ YOUR TURN ============================
     Replace this with places you actually lost. The video shop that
     only had the one copy. The bakery. The rooftop with the letters.
     This is the only entry that really matters.
     ================================================================ */

  {
    id: 'placeholder-yours',
    name: 'REPLACE ME — a place you lost',
    lat: 27.6710, lng: 85.3400,
    category: 'other',
    closed: 0,
    address: 'Kathmandu',
    description:
      'Delete this. Add somewhere real: a shop, a hall, a school, a tea shop, a ' +
      'cinema. The exact spot if you know it, the street if you don\'t. What it was, ' +
      'and one detail you would not find in a news article — the light in there, ' +
      'who ran it, what it smelled like. That is the part no map has.',
    photo: '',
    source: '',
    confidence: 'recalled',
    seed: true
  }

];