"""Split the home energy scene into a static picture and a light animated layer,
and make the night version that the page shows in dark mode.

Usage: python3 build_figure.py MASTER.svg OUTDIR
Writes, in OUTDIR:
  base.svg        everything that stays still
  base-night.svg  the same at night: night sky with the moon and stars, moonlit
                  colours, lights on in most windows and by the front door
  overlay.svg     only the moving parts, with the definitions they use. Parts with
                  class="n-grade" take the night colours and parts with class="n-hide"
                  (birds, sunlight on the panels, the solar flow) are hidden at night,
                  by the dark-mode rules in the page's CSS
  static.svg      all parts frozen, no labels
  labelled.svg    all parts and the labels
Rasterise base.svg, base-night.svg, static.svg and labelled.svg with a browser, frozen at time 0.
"""
import re, sys, copy, random
from xml.etree import ElementTree as ET

SVGNS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVGNS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
N = '{%s}' % SVGNS

src, out = sys.argv[1], sys.argv[2]
text = open(src, encoding='utf-8').read()
root = ET.fromstring(text)
top = list(root)
defs = top[0]

def is_anim(e):
    return any(x.tag.replace(N, '').startswith('animate') for x in e.iter())
def gid(e):
    return e.get('id')

# Moving parts, in drawing order. Each run also takes the still pieces drawn on top of it
# (hub caps, the window tint over the display, the fan grille) so the stacking stays right.
keep_still = set()
moving = []
for i, e in enumerate(top):
    if i == 0 or gid(e) == 'labels':
        continue
    if is_anim(e):
        moving.append(i)
# clouds and the sun stay in the picture: they move too slowly to matter
sky_rect = next(i for i, e in enumerate(top) if (e.get('fill') or '') == 'url(#bakeSky)')
land_rect = next(i for i, e in enumerate(top) if (e.get('fill') or '') == 'url(#bakeLand)')
moving = [i for i in moving if not (sky_rect < i < land_rect and i <= 9) or i >= 10]
moving = [i for i in moving if i not in range(sky_rect + 1, sky_rect + 9)]  # sun and clouds
# still pieces that sit between or just after moving parts belong with them
first, last_before_flows = moving[0], max(i for i in moving if gid(top[i]) != 'energy-flows')
over_idx = sorted(set(moving) | {i for i in range(land_rect + 1, last_before_flows + 1)})
over_idx = [i for i in over_idx if (top[i].get('fill') or '') not in ('url(#bloom)', 'url(#vign)')]
base_idx = [i for i in range(1, len(top)) if i not in over_idx and gid(top[i]) not in ('labels', 'energy-flows')]

# definitions used by the moving layer, followed through references
defs_by_id = {d.get('id'): d for d in defs.iter() if d.get('id')}
ref_re = re.compile(r'url\(#([^)]+)\)|href="#([^"]+)"')
def refs(e):
    s = ET.tostring(e, encoding='unicode')
    return {a or b for a, b in ref_re.findall(s)}
need, todo = set(), set()
for i in over_idx:
    todo |= refs(top[i])
while todo:
    r = todo.pop()
    if r in need or r not in defs_by_id:
        continue
    need.add(r)
    todo |= refs(defs_by_id[r])

def svg_with(children, extra_defs=None):
    s = ET.Element(N + 'svg', {'viewBox': '0 0 1920 1080', 'width': '1920', 'height': '1080'})
    if extra_defs is not None:
        s.append(extra_defs)
    for c in children:
        s.append(copy.deepcopy(c))
    return ET.tostring(s, encoding='unicode')

def frag(xml):
    """Parse SVG markup into a list of elements."""
    return list(ET.fromstring('<g xmlns="%s">%s</g>' % (SVGNS, xml)))

# ---------- Night colours ----------
def grade(k, sat, tint, lift):
    """Colour matrix: keep `sat` of the colour (the rest goes grey), scale by k,
    tint each channel and lift the blacks. Used for moonlight."""
    luma = (0.2126, 0.7152, 0.0722)
    rows = []
    for ch in range(3):
        r = [(1 - sat) * l for l in luma]
        r[ch] += sat
        rows.append(' '.join('%.4f' % (k * tint[ch] * v) for v in r) + ' 0 %.4f' % lift[ch])
    return '  '.join(rows + ['0 0 0 1 0'])

NIGHT = grade(0.50, 0.55, (0.80, 0.92, 1.22), (0.020, 0.035, 0.075))   # land, house, cars
CLOUDS = grade(0.38, 0.30, (0.85, 0.95, 1.20), (0.030, 0.045, 0.090))  # moonlit clouds

def matrix_filter(fid, values):
    return ('<filter id="%s" x="0" y="0" width="1920" height="1080" filterUnits="userSpaceOnUse" '
            'color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="%s"/></filter>'
            % (fid, values))

# ---------- Moving layer ----------
# Lights and screens look the same by day and night; the rest takes the night colours.
EMISSIVE = {'#5fd3a8', '#f2b45a', '#59e3a7', '#5ff0c7', '#55e0a8', '#ffb02e', 'url(#ledGlow)', '#1a120c'}
def night_class(e):
    if any(x.tag == N + 'animateMotion' for x in e.iter()):
        return 'n-hide'                      # birds
    if e.get('clip-path') == 'url(#pvClip)' or e.get('fill') == 'url(#glassReflUS)':
        return 'n-hide'                      # sunlight on the panels and on the window
    if gid(e) == 'energy-flows':
        return None
    paints = {x.get('fill') for x in e.iter()} | {x.get('stroke') for x in e.iter()}
    return None if paints & EMISSIVE else 'n-grade'

over_children, run, run_cls = [], [], None
def flush():
    global run
    if run_cls and run:
        g = ET.Element(N + 'g', {'class': run_cls})
        g.extend(copy.deepcopy(e) for e in run)
        over_children.append(g)
    else:
        over_children.extend(copy.deepcopy(e) for e in run)
    run = []
for i in over_idx:
    c = night_class(top[i])
    if c != run_cls:
        flush()
        run_cls = c
    run.append(top[i])
flush()
flows_copy = next(e for e in over_children if gid(e) == 'energy-flows')
for f in flows_copy:
    if any(x.get('stroke') == '#ffd46b' for x in f.iter()):
        f.set('class', 'n-hide')             # no flow from the solar panels at night

over_defs = ET.Element(N + 'defs')
for d in defs:  # keep the original order of top-level definitions
    if d.get('id') in need:
        over_defs.append(copy.deepcopy(d))
over_defs.extend(frag(matrix_filter('nightGrade', NIGHT)))
open(out + '/overlay.svg', 'w').write(svg_with(over_children, over_defs))
open(out + '/base.svg', 'w').write(svg_with([top[i] for i in base_idx], defs))
labels = next(e for e in top if gid(e) == 'labels')
flows = next(e for e in top if gid(e) == 'energy-flows')
static_children = [e for e in top[1:] if gid(e) != 'labels']
open(out + '/static.svg', 'w').write(svg_with(static_children, defs))
open(out + '/labelled.svg', 'w').write(svg_with(top[1:], defs))
print('moving layer:', over_idx, '| definitions:', sorted(need))
print('picture layer:', base_idx)

# ---------- Night picture ----------
# Windows with the lights on (the right-hand bedroom stays dark), and how each is lit.
LIT = {'pane599_725': 'warmIn', 'pane654_725': 'warmIn', 'pane599_550': 'warmBed',
       'pane654_550': 'warmBed', 'pane873_550': 'warmIn'}
ROOM = 'pane1009_714'                 # the living room, with the lamp and the smart display
DOOR_GLASS = (881.5, 726.7, 19.3, 78.9)
LAMP = (963.6, 747.0)                 # the lantern by the front door
MOON = (520, 128)                     # where the sun is by day

def light_up(e):
    """Turn the lights on in a window, the door glass or the lantern."""
    m = re.match(r'url\(#(pane\w+)\)', e.get('clip-path') or '')
    pid = m.group(1) if m else None
    if pid in LIT:
        for c in e:
            fill = c.get('fill')
            if fill == 'url(#glassIn)':
                c.set('fill', 'url(#%s)' % LIT[pid])
            elif fill == 'url(#glassRefl)':
                c.set('opacity', '0.06')
            elif fill == '#ffffff':
                c.set('opacity', '0.04')
            elif fill == '#d9cfbf':           # curtains, lit from inside
                c.set('fill', '#f7deaa')
                c.set('opacity', '0.9')
            elif c.get('stroke') == '#b9ad9a':
                c.set('stroke', '#d9b273')
    elif pid == ROOM:
        e.set('filter', 'url(#roomLit)')
        for c in e:
            fill = c.get('fill')
            if fill == 'url(#glassRefl)':
                c.set('opacity', '0.05')
            elif fill == '#ffffff':
                c.set('opacity', '0.04')
            elif fill == '#1a120c':
                c.set('opacity', '0.06')
            elif fill == 'url(#lampGlow)':
                c.set('fill', 'url(#lampGlowNight)')
                c.set('r', '78')
    elif e.get('fill') == 'url(#frost)':
        e.set('fill', 'url(#warmFrost)')
    else:                                     # the lantern's glass
        e.set('fill', '#fff6da')
        e.set('opacity', '1')

def is_lit(e):
    m = re.match(r'url\(#(pane\w+)\)', e.get('clip-path') or '')
    return bool(m and (m.group(1) in LIT or m.group(1) == ROOM)) or e.get('fill') == 'url(#frost)' \
        or (e.get('fill') == '#e9dfc4' and e.get('x') == '961.6')

# The land at night: everything takes the moonlit colours except the lit windows, the
# door glass and the lantern, so things in front of a window (the heat pump, a pipe)
# still cover it correctly.
night_defs = copy.deepcopy(defs)
day_land = defs_by_id['bakeLand']
night_land = ET.SubElement(night_defs, N + 'pattern', dict(day_land.attrib, id='bakeLandNight'))
run = None
for e in day_land:
    e = copy.deepcopy(e)
    if is_lit(e):
        light_up(e)
        night_land.append(e)
        run = None
    else:
        if run is None:
            run = ET.SubElement(night_land, N + 'g', {'filter': 'url(#nightGrade)'})
        run.append(e)

def clip_rect(cid):
    r = next(iter(defs_by_id[cid]))
    return tuple(float(r.get(k)) for k in ('x', 'y', 'width', 'height'))
lit_rects = [clip_rect(p) for p in list(LIT) + [ROOM]] + [DOOR_GLASS, (961.6, 743, 4, 8)]
rect = lambda r, extra='': '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" %s/>' % (r + (extra,))

night_defs.extend(frag(
    matrix_filter('nightGrade', NIGHT) + matrix_filter('cloudNight', CLOUDS) +
    matrix_filter('roomLit', '1.18 0 0 0 0.06  0 1.06 0 0 0.03  0 0 0.84 0 0  0 0 0 1 0') +
    '<filter id="glowBlur" x="0" y="0" width="1920" height="1080" filterUnits="userSpaceOnUse">'
    '<feGaussianBlur stdDeviation="13"/></filter>'
    '<linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="490" gradientUnits="userSpaceOnUse">'
    '<stop offset="0" stop-color="#040b1a"/><stop offset="0.5" stop-color="#0a1a35"/>'
    '<stop offset="0.8" stop-color="#15304f"/><stop offset="1" stop-color="#2b4566"/></linearGradient>'
    '<radialGradient id="moonHalo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#dfe8ff" stop-opacity="0.32"/>'
    '<stop offset="0.3" stop-color="#b9c9ee" stop-opacity="0.12"/><stop offset="1" stop-color="#b9c9ee" stop-opacity="0"/></radialGradient>'
    '<radialGradient id="moonDisc" cx="0.42" cy="0.4" r="0.65"><stop offset="0" stop-color="#fffdf3"/>'
    '<stop offset="0.75" stop-color="#efe9d8"/><stop offset="1" stop-color="#d6cfbd"/></radialGradient>'
    '<radialGradient id="warmIn" cx="0.5" cy="0.15" r="0.95"><stop offset="0" stop-color="#ffe9b8"/>'
    '<stop offset="0.55" stop-color="#f7c472"/><stop offset="1" stop-color="#d48a3c"/></radialGradient>'
    '<radialGradient id="warmBed" cx="0.5" cy="0.2" r="0.95"><stop offset="0" stop-color="#ffd99a"/>'
    '<stop offset="0.6" stop-color="#e9a95a"/><stop offset="1" stop-color="#b9702f"/></radialGradient>'
    '<linearGradient id="warmFrost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffecc0"/>'
    '<stop offset="0.5" stop-color="#f6cf86"/><stop offset="1" stop-color="#f9dfa6"/></linearGradient>'
    '<radialGradient id="lampGlowNight" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffdca6" stop-opacity="0.95"/>'
    '<stop offset="1" stop-color="#ffdca6" stop-opacity="0"/></radialGradient>'
    '<radialGradient id="pool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffc56e" stop-opacity="0.5"/>'
    '<stop offset="1" stop-color="#ffc56e" stop-opacity="0"/></radialGradient>'
    '<radialGradient id="lampHalo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe2a8" stop-opacity="0.85"/>'
    '<stop offset="0.25" stop-color="#ffcf80" stop-opacity="0.35"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>'))

rnd = random.Random(7)
stars = []
while len(stars) < 190:
    x, y = rnd.uniform(0, 1920), 410 * rnd.random() ** 1.35
    if (x - MOON[0]) ** 2 + (y - MOON[1]) ** 2 < 85 ** 2:
        continue
    r = rnd.choice((0.6, 0.7, 0.8, 0.9, 1.1, 1.3))
    o = rnd.uniform(0.35, 0.95) * (1 - 0.45 * y / 410)
    stars.append('<circle cx="%.1f" cy="%.1f" r="%.1f" opacity="%.2f"/>' % (x, y, r, o))
for x, y in ((1268, 62), (1712, 118), (214, 74), (905, 40), (1530, 210), (66, 250)):
    stars.append('<circle cx="%d" cy="%d" r="5" opacity="0.12"/><circle cx="%d" cy="%d" r="1.6"/>' % (x, y, x, y))

mx, my = MOON
night_children = frag(
    '<rect x="0" y="0" width="1920" height="490" fill="url(#nightSky)"/>'
    '<g fill="#f4f7ff">%s</g>' % ''.join(stars) +
    '<circle cx="%d" cy="%d" r="200" fill="url(#moonHalo)"/>' % (mx, my) +
    '<circle cx="%d" cy="%d" r="26" fill="url(#moonDisc)"/>' % (mx, my) +
    '<g fill="#bdb6a2" opacity="0.35"><circle cx="%d" cy="%d" r="7"/><circle cx="%d" cy="%d" r="4.5"/>'
    '<circle cx="%d" cy="%d" r="3.2"/><circle cx="%d" cy="%d" r="2.4"/></g>'
    % (mx - 8, my - 7, mx + 9, my + 6, mx - 3, my + 12, mx + 11, my - 10))
clouds = ET.Element(N + 'g', {'filter': 'url(#cloudNight)'})
clouds.extend(copy.deepcopy(top[i]) for i in base_idx if sky_rect < i < land_rect and i != sky_rect + 1)
land = copy.deepcopy(top[land_rect])
land.set('fill', 'url(#bakeLandNight)')
night_children += [clouds, land]
lx, ly = LAMP
room = clip_rect(ROOM)
glow_rects = ''.join(rect(r, 'fill="#ffb54d"') for r in lit_rects[:-1])
night_children += frag(
    '<g style="mix-blend-mode:screen" opacity="0.55" filter="url(#glowBlur)">%s</g>' % glow_rects +
    '<g style="mix-blend-mode:screen">'
    '<ellipse cx="652" cy="905" rx="95" ry="20" fill="url(#pool)"/>'
    '<ellipse cx="891" cy="900" rx="70" ry="18" fill="url(#pool)"/>'
    '<ellipse cx="%.1f" cy="905" rx="125" ry="24" fill="url(#pool)"/>' % (room[0] + room[2] / 2) +
    '<ellipse cx="%.1f" cy="%.1f" rx="30" ry="64" fill="url(#pool)" opacity="0.6"/>' % (lx, ly + 40) +
    '<circle cx="%.1f" cy="%.1f" r="48" fill="url(#lampHalo)"/></g>' % (lx, ly))
night_children.append(copy.deepcopy(next(e for e in top if (e.get('fill') or '') == 'url(#vign)')))
open(out + '/base-night.svg', 'w').write(svg_with(night_children, night_defs))
print('night picture: written')
