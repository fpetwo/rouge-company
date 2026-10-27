"""Build data/game-data.json from the blizzhackers/d2data repository (game tables as JSON).

Usage:  git clone --depth 1 https://github.com/blizzhackers/d2data /path/to/d2data
        python3 scripts/extract_game_data.py /path/to/d2data/json

Only factual table values (names, requirements, damage, defense, sockets) are extracted.
"""
import json, subprocess, sys
from pathlib import Path

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / 'data' / 'game-data.json'
load = lambda f: json.load(open(src / f, encoding='utf-8'))

strings = load('allstrings-eng.json')
types = {v['Code']: v for v in load('itemtypes.json').values()}
weapons = {v['code']: v for v in load('weapons.json').values() if v.get('code')}
armor = {v['code']: v for v in load('armor.json').values() if v.get('code')}
misc = {v['code']: v for v in load('misc.json').values() if v.get('code')}
bases = {**misc, **weapons, **armor}
CLASS = {'ama': 'Amazon', 'ass': 'Assassin', 'bar': 'Barbarian', 'dru': 'Druid', 'nec': 'Necromancer', 'pal': 'Paladin', 'sor': 'Sorceress', 'war': 'Warlock'}

# Friendlier names for a few internal item type names.
TYPE_NAME = {'Hand to Hand': 'Claw', 'Hand to Hand 2': 'Claw', 'Knife': 'Dagger', 'Voodoo Heads': 'Shrunken Head',
             'Auric Shields': 'Paladin Shield', 'Primal Helm': 'Barbarian Helm', 'Armor': 'Body Armor', 'Pelt': 'Druid Pelt',
             'Amazon Bow': 'Amazon Bow', 'Orb': 'Sorceress Orb', 'Grimoire': 'Warlock Grimoire'}

def type_name(code):
    n = types.get(code, {}).get('ItemType', '')
    return TYPE_NAME.get(n, n)

def name_of(key):
    return strings.get(key, key)

def tier(b):
    return 'Elite' if b['code'] == b.get('ultracode') else 'Exceptional' if b['code'] == b.get('ubercode') else 'Normal'

def max_sockets(b):
    t = types.get(b['type'], {})
    return min(b.get('gemsockets') or 0, (b.get('invwidth') or 1) * (b.get('invheight') or 1), t.get('MaxSockets3') or 0)

def item_class(b):
    t = types.get(b['type'], {})
    return CLASS.get(t.get('Class') or '', '')

def rng(a, b):
    return f'{a}–{b}' if a is not None and b is not None else ''

# ---- base items ----
weapon_rows = []
for b in weapons.values():
    if b.get('spawnable') != 1 or b['type'] == 'tpot':
        continue
    one = rng(b.get('mindam'), b.get('maxdam')) if not b.get('2handed') or b.get('1or2handed') else ''
    two = rng(b.get('2handmindam'), b.get('2handmaxdam'))
    weapon_rows.append({
        'name': name_of(b['code']), 'code': b['code'], 'type': type_name(b['type']), 'typeCode': b['type'],
        'tier': tier(b), 'family': b.get('normcode') or b['code'], 'class': item_class(b), 'oneHand': one, 'twoHand': two, 'throw': rng(b.get('minmisdam'), b.get('maxmisdam')),
        'str': b.get('reqstr') or 0, 'dex': b.get('reqdex') or 0, 'lvl': b.get('levelreq') or 0, 'qlvl': b.get('level') or 0,
        'speed': b.get('speed') or 0, 'sockets': max_sockets(b)})

armor_rows = []
for b in armor.values():
    if b.get('spawnable') != 1:
        continue
    armor_rows.append({
        'name': name_of(b['code']), 'code': b['code'], 'type': type_name(b['type']), 'typeCode': b['type'],
        'tier': tier(b), 'family': b.get('normcode') or b['code'], 'class': item_class(b), 'def': rng(b.get('minac'), b.get('maxac')),
        'block': b.get('block') or 0, 'str': b.get('reqstr') or 0, 'lvl': b.get('levelreq') or 0, 'qlvl': b.get('level') or 0,
        'sockets': max_sockets(b)})

def base_info(code):
    b = bases.get(code, {})
    return name_of(code), type_name(b.get('type', '')), b.get('levelreq') or 0

# ---- uniques ----
uniques, seen = [], set()
for u in load('uniqueitems.json').values():
    if u.get('spawnable') != 1 or not u.get('code'):
        continue
    base, btype, blvl = base_info(u['code'])
    if u['code'] not in bases or bases[u['code']].get('quest'):   # quest items (Horadric Staff, Khalim's Will, ...)
        continue
    name = name_of(u['index'])
    lvl = max(u.get('lvl req') or 0, blvl)
    key = (name, base)
    if key in seen:   # Rainbow Facet and similar have one row per variant
        continue
    seen.add(key)
    uniques.append({'name': name, 'base': base, 'type': btype, 'lvl': lvl, 'ownLvl': u.get('lvl req') or 0, 'baseLvl': blvl, 'tier': tier(bases[u['code']]) if 'ultracode' in bases[u['code']] else ''})
uniques.sort(key=lambda r: (r['lvl'], r['name']))

# ---- sets ----
set_items = {}
for s in load('setitems.json').values():
    if s.get('spawnable') != 1 or not s.get('set'):
        continue
    base, btype, blvl = base_info(s['item'])
    lvl = max(s.get('lvl req') or 0, blvl)
    set_items.setdefault(s['set'], []).append({'name': name_of(s['index']), 'base': base, 'type': btype, 'lvl': lvl})
sets = []
for s in load('sets.json').values():
    items = set_items.get(s['index'])
    if not items:
        continue
    items.sort(key=lambda r: (r['lvl'], r['name']))
    sets.append({'name': name_of(s['name']), 'lvl': max(i['lvl'] for i in items), 'minLvl': min(i['lvl'] for i in items), 'items': items})
sets.sort(key=lambda r: (r['lvl'], r['name']))

try:
    rev = subprocess.run(['git', '-C', str(src), 'log', '-1', '--format=%h %cs'], capture_output=True, text=True).stdout.strip()
except Exception:
    rev = ''
out.write_text(json.dumps({'source': f'blizzhackers/d2data {rev}', 'weapons': weapon_rows, 'armor': armor_rows, 'uniques': uniques, 'sets': sets}, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(weapon_rows)} weapons, {len(armor_rows)} armor, {len(uniques)} uniques, {len(sets)} sets -> {out}')
