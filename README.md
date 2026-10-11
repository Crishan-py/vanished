# Vanished

A map of places that no longer exist.

Every city has a layer of ghosts that no map records — the arcade that closed in 2021, the mall with the shuttered food court, the bakery on the corner. Vanished is a place to put those, with a pin, a year, and the story.

**Live:** https://crishan-py.github.io/vanished

---

## Run it

No build step, no npm install, no API key.

```bash
cd D:\projects\vanished
node dev-server.cjs 4173
```

Then open http://localhost:4173 — the [vanished dev server](#the-dev-server) tab in the
Terminal panel is already running it.

Works from `file://` too. The map tiles need an internet connection; everything else
works offline.

## Test it

```bash
cd D:\projects\vanished
node test.js
```

54 checks, no dependencies: seed validity, confidence handling, filtering, search,
validation, HTML escaping, add/persist/delete round-trip. Runs `app.js` against a
stubbed DOM, so it needs no browser.

---

## What's in it

**Part 1 — core**
- Leaflet + OpenStreetMap map (free, no key, no account)
- Add / edit / delete places
- Click-to-place a pin, or type coordinates
- Filter by kind of place and by the year it closed
- Search across name, address, and story
- Export / import the whole set as JSON
- Your additions are saved in the browser automatically

**Part 2 — usable**
- **Address lookup** — type "Thamel" and it fills the address and coordinates
- **Confidence badges** — every entry says how much weight it carries
- **Installable as an app** — works offline, add to home screen
- **Deployed** to GitHub Pages on every push

## Read this before you edit the seed data

Every entry in `places.js` carries a `confidence` flag, and the map shows it:

| Flag | Means |
|---|---|
| `verified` | Name, year and story checked. |
| `approximate` | True of this area, but no specific building is named. |
| `recalled` | From memory. **Check it before you trust it.** |

The Kathmandu entries are `approximate` or `recalled`. They are honest about what
they are: area-level claims about the 2015 earthquake and the metro works, and three
named structures I could not verify. They are *not* presented as confirmed history,
and you should not either.

**Do not copy this pattern of shipping claims you haven't checked.** If you edit the
seed, set the flag to match how sure you actually are. The badge is only worth having
if it's honest.

Coordinates are city or district level, not street addresses. They say roughly where
something was, not the doorstep.

## How your data is stored

Three separate things, deliberately kept apart:

| Where | What it is | How to change it |
|---|---|---|
| `places.js` | The seed data | Edit the file |
| Browser localStorage | Places **you** added | Export JSON, or Reset my edits |
| `vanished-places.json` | Whatever you exported | Move it around |

**Reset my edits** only removes what you added. It never touches `places.js`, so your notes in the seed file survive. To edit a seed entry itself, use Edit in the app — those edits are remembered as overrides.

There is no server and no database. Nothing is uploaded anywhere. Your data lives in this browser, on this machine. **Export JSON if you want to keep it.**

---

## Files

```
vanished/
├── index.html     structure
├── style.css      dark theme
├── app.js         all the logic
├── places.js      seed data — edit this
├── sw.js          offline support
├── manifest.json  installable app metadata
├── icon-*.png     app icons
├── make-icons.cjs regenerates the icons, no dependencies
├── dev-server.cjs static file server, no dependencies
├── test.js        54 checks, run with: node test.js
└── .github/workflows/deploy.yml   auto-deploy to Pages
```

## The dev server

`npx serve` needs a download and wasn't working here. `dev-server.cjs` is 40 lines
of Node with zero dependencies that does the same job — it just serves files. Change
the port with `node dev-server.cjs 8080`.

You don't need it: opening `index.html` directly works. Use it when you want a real
`http://` origin instead of `file://`.

## Data format

One entry in `places.js`:

```js
{
  id:          'wembley-old',        unique string
  name:        'Wembley Stadium (the old one)',
  lat:         51.5580,              number, required
  lng:         -0.2830,              number, required
  category:    'sport',              see CATEGORIES in app.js
  closed:      2003,                 year number, 0 = unknown
  address:     'Wembley, London',    free text
  description: 'The twin towers...',  the part that matters
  photo:       '',                   image URL
  source:      '',                   link
  confidence:  'verified',           verified | approximate | recalled
  seed:        true
}
```

Categories: `cinema` `arcade` `mall` `cafe` `shop` `park` `sport` `transit` `landmark` `zoo` `factory` `airport` `hotel` `school` `other`

---

## Roadmap

- [x] **Part 1** — core map, add/edit/delete, filter, search, JSON, localStorage
- [x] **Part 2** — address lookup, confidence badges, PWA install, GitHub Pages deploy
- [ ] **Part 3** — public sharing; multiple people adding to the same map
- [ ] **Later** — timeline scrubber, memory prompts ("what's missing near here?")

Part 3 is the one that decides whether this is a personal notebook or a real shared
map of loss. It needs a backend, which is the first thing in this project that costs
more than $0.

## Credits

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, tiles via Leaflet.
Address lookup by [Nominatim](https://nominatim.org/), used within their usage policy.