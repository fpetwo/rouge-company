---
title: How the D2R Summoner DPS Calculator Works
order: 3
description: Every formula behind the D2R summoner DPS calculator – skeletons, hit chance, attack speed breakpoints, merc damage, revives and Thorns.
nav: How it works
breadcrumb: How it works
h1: How the calculator works
---

# How the calculator works

<p class="lead">The calculator turns your skills, auras and gear into one number: damage per second of the whole army, merc included. This page lists every step, so you can check the results or adjust the assumptions.</p>

## Army size

Raise Skeleton and Raise Skeletal Mage give one minion per level up to level 3, and 2 + ⌊level / 3⌋ from level 4. Level 40 gives 15 skeletons, level 45 gives 17. Revive raises one monster per skill level.

Two columns separate **summoning** from **playing**. Damage, attack rating and the mage missile level are fixed at the moment you cast, so summoning with your strongest +skill gear (and Battle Command) pays off. The minion limit, however, follows your current level. If you swap to a weapon with fewer +skills, minions above the new limit disappear and the rest keep their summoned stats.

## Skeleton warrior damage

- **Base damage and attack rating** come from Raise Skeleton and Skeleton Mastery. The calculator uses values calibrated against a detailed reference model at levels 40/40 and 45/45; levels far outside that range are less precise.
- **Percentage bonuses add up**: Skeleton Mastery's own bonus plus every damage aura (Concentration, Might, Fanaticism, Heart of Wolverine).
- **Critical hits**: a flat 5% chance for double damage.

| Aura | Damage bonus at level L |
|---|---|
| Concentration | +45 + 15·L % |
| Might | +30 + 10·L % |
| Fanaticism (allies) | +⌊(33 + 17·L) / 2⌋ % |
| Heart of Wolverine | +13 + 7·L % |

## Chance to hit

Chance to hit = 2 × attacker level / (attacker level + defender level) × AR / (AR + defense), limited to 5–95%. Skeletons use your character level. Fanaticism and Heart of Wolverine raise attack rating; Conviction lowers defense by a percentage and Inner Sight by a flat amount (1,615 at level 30).

## Attack speed

Fanaticism adds attack speed: min(10 + ⌊30 × ⌊110·L / (L + 6)⌋ / 100⌋, 40), which is +33 at level 15. In this model skeletons attack in 18 frames without it and 13 frames at +33. On top of every attack the game's monster AI waits about 15 frames, so a skeleton with Fanaticism 15 attacks about every 28 frames (25 frames = 1 second). This AI delay is the least certain part of the model.

## Resistances and Amplify Damage

Physical damage is multiplied by 1 − (resistance − 100 × Amplify Damage) / 100. Against a Doom Knight with 33% physical resist that is ×0.67 without and ×1.67 with Amplify Damage, which is why the curse matters more than almost any item.

## Skeletal mages

The mage missile level is ⌊(Raise Skeletal Mage − 2) / 2⌋ + Skeleton Mastery, so 44 mage levels and 45 mastery give missile level 66. Each mage is fire, lightning, cold or poison at random. Poison does not stack on the same target, so the calculator averages fire, lightning and cold over four mages and counts poison as zero. Elemental resistances and Conviction apply; Amplify Damage and the physical damage auras do not.

## Revives

Each revive uses its monster's own Hell level, attack rating and damage. Your auras boost its physical damage and attack rating like any other minion. Elemental add-on damage (for example a Doom Knight's random element) is not boosted and is reduced by the target's resistance. Monster attack speeds are not part of the published data, so the swings per second are an editable assumption.

## Thorns

Since patch 2.4 Thorns has two parts. The flat part (88 at level 15, 144 at level 20) hits on every enemy melee swing, even a miss. The percentage part (210 + 40·L %) only triggers on a swing that lands and scales with the damage it dealt. Only melee enemies trigger Thorns, which is why the enemy pack separates melee from ranged monsters.

How often an enemy lands a swing is calculated with the normal hit formula, from the enemy's attack rating and level against your minions' defense and level. Minion defense in Hell (Basin Wiki):

- Skeleton warrior: 6 + 15 × (Raise Skeleton + Skeleton Mastery) + monster-level defense at your character level
- Skeletal mage: 28 + 10 × (Raise Skeletal Mage + Skeleton Mastery) + monster-level defense at your character level
- Revives keep their monster's own defense.

The monster-level defense comes from the game's monster level table (about 1,634 at level 84). The hit chance is averaged over your army by count; the Iron Golem is left out.

## Golems

Golem damage is calculated from the game data (monstats.txt, skills.txt) and the Basin Wiki golem pages, all for Hell:

| Golem | Base damage | Own +% damage | Attack rating | Frames per attack (0 EIAS) |
|---|---|---|---|---|
| Iron | 12–33 + weapon | – | 197 + monster-level AR | 15 |
| Clay | 3–7 | +35% per level above 1 | 92 + 20 × level + monster-level AR | 17 |
| Blood | 12–33 | +55% per level above 1 | 148 + monster-level AR | 15 |
| Fire | 18–47 + fire damage | – | 298 + monster-level AR | 16 |

- **Damage per hit:** (base damage + the weapon's one-hand damage × (1 + the item's enhanced damage)) × (1 + all off-weapon +% damage). Off-weapon damage is your auras, the golem's own bonus and the Fire Golem synergy (+6% per hard point). Deadly Strike doubles the physical part.
- **Two-handed weapons** give the Iron Golem no weapon damage (d2emu). A Pride golem on a polearm hits with its base damage plus Pride's lightning.
- **Attack speed:** frames per attack from the Basin tables by EIAS (item attack speed, weapon speed and Fanaticism), plus a 15-frame AI pause between attacks.
- **Attack rating:** base + monster-level table at your character level + 25 per Golem Mastery level + 20 per Clay Golem hard point, then your aura and item AR bonuses.
- **Not counted:** Crushing Blow and Open Wounds (Beast), damage against demons (Pride), the Fire Golem's Holy Fire burst, and the Iron Golem's own Thorns, which only protects himself and is replaced by a Thorns aura.
- Only the Iron Golem can wear an item, so only he gives the gear check a golem aura slot.

## Mercenary

The merc is calculated from the game tables like the rest of the army, for every merc: Rogue (Act 1), Desert Mercenary (Act 2), Iron Wolf (Act 3) and the Act 5 Barbarian with one sword or dual wielding.

- **Stats by level** (hireling.txt, Hell rows): Strength, Dexterity and base damage grow by the table value / 8 per level above the hiring level, attack rating by the full value. A level 88 Rogue has 142 Strength and 215 Dexterity, exactly what the character screen shows.
- **Skill levels:** table level + ⌊levels above hiring level × LvlPerLvl / 32⌋, plus +skills from gear. Synergies use the base level without +skills. The Rogue's Freezing Arrow at level 14 deals 872–915 cold, the same as her tooltip.
- **Weapon damage:** base weapon damage × (1 + enhanced damage) plus +min/+max. Two-handed weapons add the merc's own base damage. The Act 2 merc and the Act 5 merc with one one-handed sword deal double weapon damage (Basin Wiki). Flat "Damage +" (Grief) is added once.
- **Percent damage:** Strength (swords, polearms, spears) or Dexterity (bows) as % damage, plus the party auras (Concentration, Might, Fanaticism, Heart of Wolverine) and the skill's own bonus (Jab, Bash, Frenzy). Fanaticism counts at its full value when the merc carries the Fanaticism item himself, half otherwise. The Act 5 merc has 5% critical strike; critical strike and Deadly Strike double the physical part.
- **Elemental damage:** gear adds (Mist's cold, Pride's lightning, a Vampire Gaze helm) and skill damage by level. Cold Arrow and Fire Arrow convert 3 + 2 × (level − 1) % of the physical damage to their element (missiles.txt), 69% at level 34.
- **Resistances:** physical damage is multiplied by the physical resist factor (Amplify Damage removes 100), each element by its own resist factor (Conviction lowers it, only a fifth against immunes). Cold Arrow's converted part therefore does nothing to a cold-immune Flesh Archer.
- **Attack rating:** table AR + AR per level × levels + 5 × Dexterity, then the skill's attack bonus, Fanaticism, Heart of Wolverine and gear AR %. Hit chance uses the merc's level. Spells always hit.
- **Which attack:** the merc AI rolls between his normal attack and his skills with the chances in hireling.txt (game code as reimplemented by D2MOO). A level 88 Act 2 merc uses Jab 83% of the time, a cold Rogue fires Freezing Arrow 42%, Cold Arrow 25%, normal arrows 29% and casts Inner Sight 4%. Inner Sight, Battle Cry, Taunt, Enchant and Static Field take an action but deal no damage here. You can switch to a single attack in the merc section.
- **Speed:** frames per attack from the attack speed formula below, plus 1 frame: mercs have an AI delay of 1 frame (monstats.txt), skeletons and golems 15.
- **Not counted:** Crushing Blow, Open Wounds, splash (Freezing Arrow, Exploding Arrow, Fire Ball) and pierce, Static Field. Charged Bolt counts a third of its bolts as hits.
- **Dual wield (Act 5):** in the game tables his Frenzy is a normal attack (one swing). By the player rule the two swords take turns, so a hit counts the average of both; the option "each hit uses both swords" adds them up instead. Which one the D2R merc does is not documented.

## Attack speed and breakpoints

Frames per attack = ⌈256 × animation length / ⌊256 × (100 + EIAS) / 100⌋⌉ − 1, where EIAS = ⌊120 × IAS / (120 + IAS)⌋ − weapon speed + skill speed (Fanaticism, Frenzy), capped at 75. Jab is a sequence and has no − 1. Only the primary weapon's and the armor's IAS count; with two swords the weapon speed is the average of both.

| Merc | Animation | Length | Frames at 0 EIAS | Fastest (EIAS 75) |
|---|---|---|---|---|
| Rogue | bow attack, arrow skills | 15 | 14 | 8 |
| Act 2 | normal attack | 16 | 15 | 9 |
| Act 2 | Jab (2 hits) | 14, sequence | 14 | 8 |
| Act 5 | attack, Bash, Stun, Frenzy | 16 | 15 | 9 |
| Act 3 | casting (Faster Cast Rate) | – | 17 | 10 at 138% FCR |

The animation lengths reproduce the Basin Wiki merc breakpoint tables exactly. The calculator shows the full table for your merc, with the IAS needed for each frame count by weapon speed.

## Sources

- Merc stats, skills and weapons: hireling.txt, skills.txt, missiles.txt, weapons.txt and monseq.txt from the D2R game tables ([blizzhackers/d2data](https://github.com/blizzhackers/d2data)); hireling formulas from [D2MOO](https://github.com/ThePhrozenKeep/D2MOO); merc tables and weapon doubling from the Basin Wiki merc pages.
- Skill formulas: [Basin Wiki](https://www.theamazonbasin.com/wiki/) pages for each skill (Concentration, Might, Fanaticism, Conviction, Thorns, Inner Sight, Heart of Wolverine, Raise Skeletal Mage, Iron Golem).
- Monster stats: [Diablo Wiki](https://diablo2.diablowiki.net/) monster pages, Hell difficulty at native level (data from Lord of Destruction 1.11). D2R changes after that version and higher area levels are not included.
- Patch notes: [Blizzard news](https://news.blizzard.com/en-us/diablo2) for patch 3.3 and Reign of the Warlock.

Data version: {{site.data}} · last reviewed {{site.updated}}.
