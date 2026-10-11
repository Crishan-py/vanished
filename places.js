/* ==================================================================
   VANISHED — seed data
   ------------------------------------------------------------------
   These are STARTER entries: eight widely-documented closures, given
   at city/district-level coordinates, not street addresses. Treat the
   coords as approximate and replace the whole set with places you
   actually remember — the app is only as good as what you put in it.

   To swap them: edit this file, or just add your own in the UI and
   use Export JSON to get your set back out.

   Shape of one entry:
   {
     id:        'wembley-old',        unique, no spaces needed
     name:      'Wembley Stadium (old)',
     lat:       51.5580,              number, required
     lng:       -0.2830,              number, required
     category:  'sport',              must exist in CATEGORIES in app.js
     closed:    2003,                 year, optional
     address:   'Wembley, London',    free text, optional
     description: '...',              the part that matters
     photo:     '',                   image URL, optional
     source:    '',                   link, optional
     seed:      true                  true = ships with the app
   }
   ================================================================== */

window.SEED_PLACES = [

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
    seed: true
  },

  {
    id: 'dawn-bus',
    name: 'The last blue-and-white bus to Budhanilkantha',
    lat: 27.6760, lng: 85.3150,
    category: 'transit',
    closed: 0,
    address: 'Kathmandu',
    description:
      'PLACEHOLDER — delete me. Put a Kathmandu place here that you actually lost: ' +
      'the video shop that only had the one copy, the bakery on the corner, the ' +
      'rooftop with the letters. This is the seed file; entries added in the app ' +
      'are kept separately and survive even if you edit this one.',
    photo: '',
    source: '',
    seed: true
  }

];