# Home energy scene: the picture in "One home, many GCSE subjects"

`home-energy-scene.svg` is the original illustration (1920 x 1080), with its labels and energy flows. The page does not load it directly: its grass, brick and roof textures are slow to redraw while things move, especially on phones and school laptops. Instead it is split in two:

- `images/home-scene-1344.jpg` and `-800.jpg`: everything that stays still, as a picture
- `images/home-scene-night-1344.jpg` and `-800.jpg`: the same picture at night, shown when the device is set to dark mode. The build script makes it from the same source: a night sky with the moon and stars, moonlit colours, and lights on in most windows and by the front door
- the animated layer inside `<svg id="ex-anim">` in `index.html`: only the moving parts (the turbines, the heat pump fan and its air, sunlight on the panels, the energy flows, the smart display, the lights and the birds). In dark mode, the page's CSS gives the parts marked `n-grade` the night colours and hides the parts marked `n-hide`: the birds, sunlight on the panels and the window, and the flow from the solar panels
- `images/home-scene-labelled-1344.jpg` and `-800.jpg`: a still with the labels, used by the slides and the poster

## Rebuilding after a change to the picture

1. `python3 build_figure.py home-energy-scene.svg out` writes `out/base.svg`, `out/base-night.svg`, `out/overlay.svg`, `out/static.svg` and `out/labelled.svg`.
2. Open `out/base.svg`, `out/base-night.svg` and `out/labelled.svg` in a browser at 1920 x 1080 with the animations frozen at time 0 (in the console: `document.documentElement.pauseAnimations(); document.documentElement.setCurrentTime(0)`), save each as a picture, and scale them to 1344 x 756 and 800 x 450.
3. Replace the contents of `<svg id="ex-anim">` in `index.html` with the contents of `out/overlay.svg` (everything inside its `<svg>` tag).
4. If a part moves, update its `at` position (per cent across and down) in `PARTS` in `index.html`.
