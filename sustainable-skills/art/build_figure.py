"""Split the home energy scene into a static picture and a light animated layer.

Usage: python3 build_figure.py MASTER.svg OUTDIR
Writes OUTDIR/base.svg (everything that stays still), OUTDIR/overlay.svg (only the
moving parts, with the definitions they use), OUTDIR/static.svg (all parts frozen,
no labels) and OUTDIR/labelled.svg (all parts and the labels). Rasterise base.svg,
static.svg and labelled.svg with a browser, frozen at time 0.
"""
import re, sys, copy
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

over_defs = ET.Element(N + 'defs')
for d in defs:  # keep the original order of top-level definitions
    if d.get('id') in need:
        over_defs.append(copy.deepcopy(d))
open(out + '/overlay.svg', 'w').write(svg_with([top[i] for i in over_idx], over_defs))
open(out + '/base.svg', 'w').write(svg_with([top[i] for i in base_idx], defs))
labels = next(e for e in top if gid(e) == 'labels')
flows = next(e for e in top if gid(e) == 'energy-flows')
static_children = [e for e in top[1:] if gid(e) != 'labels']
open(out + '/static.svg', 'w').write(svg_with(static_children, defs))
open(out + '/labelled.svg', 'w').write(svg_with(top[1:], defs))
print('moving layer:', over_idx, '| definitions:', sorted(need))
print('picture layer:', base_idx)
