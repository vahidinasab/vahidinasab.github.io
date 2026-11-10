# Home scene: source of the "One home, many GCSE subjects" picture

`scene.js` builds the picture as a 3D model with [three.js](https://threejs.org/) 0.170.0 (MIT licence): the house, solar panels, heat pump, home battery, charger and car, two installers, the garden and street, and the wind turbines and pylons on the hills. Everything is made in code, so it can be changed and rendered again, for example to change the car's colour or move a part.

## Render it

1. In this folder, add three.js: `npm install three@0.170.0`, then link it as `three` (for example `ln -s node_modules/three three`).
2. Serve the folder, for example `python3 -m http.server 8010`, and open:
   - `http://localhost:8010/index.html?w=2688&h=1504&mode=day&blades=0` for the daytime picture used on the page
   - `...&mode=night&blades=0` for the night picture shown in dark mode
   - `...&mode=day&blades=1` for a still with turbine blades (used for the sharing image)
3. Save the canvas as a PNG and scale it to 1344 x 752 (and 800 x 448 for phones) as `images/home-day-*.jpg` and `images/home-night-*.jpg`.

After rendering, `window.__proj` holds the on-screen positions (in a 1344 x 752 frame) of the heat pump fan, solar panels, charging cable, turbine hubs and the other parts. The page uses them for the moving layer and the dots in `index.html`: if you move a part, update those positions too.
