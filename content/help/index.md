---
title: Help – How to Use the D2R Summoner Calculator
order: 12
description: Step-by-step help for the D2R summoner DPS calculator: presets, Beast mode, skill levels, auras and carriers, revives, enemy pack, results, sharing and a glossary.
nav: Help
menu: true
breadcrumb: Help
faq:
  - q: Why does the calculator say my auras are not possible?
    a: Every aura needs a carrier slot. The check tries all ways to put the checked auras on the Necromancer, the merc and the Iron Golem at the levels you entered. If no single set of items gives all of them, uncheck an aura, pick a level that an item can actually roll, or load a preset.
  - q: What does Beast mode do?
    a: It puts Beast (Fanaticism level 9) on the Iron Golem instead of Mania (Fanaticism level 1). It is only available for the Low budget and Rogue Company presets, because Desert Storm already uses Beast and Max Auras gets Fanaticism from Faith on the Rogue.
  - q: Why is the "during play" skill level lower than "on summoning"?
    a: Many summoners summon with all their +skill gear and then swap to a damage or aura item. Minions keep the stats they were summoned with, but the maximum number follows your current level, so the extra ones disappear after the swap.
  - q: How do I save or share a setup?
    a: Every change is written into the page address. Bookmark it, or press "Copy link to this setup" and send the link. Opening it restores every input. Nothing is stored on a server.
  - q: Are the numbers exact?
    a: They are a consistent model, not a combat log. All minions are assumed to stand in every aura and attack all the time, and a few values (enemy swing rate, golem and Rogue damage) are reference values you can change. Use the results to compare setups.
---

# Help

<p class="lead">How to use the calculator, what every input means and how to read the result. If you want the formulas behind the numbers, read <a href="/guide/how-it-works/">how the calculator works</a>.</p>

## Quick start

1. Open the [calculator](/) and **pick a preset** that is close to your gear.
2. Change your **skill levels** to the values your character screen shows, including all +skills.
3. Check the **auras** you really have and set their levels from your item tooltips.
4. Pick the **monsters** you revive and the ones you fight.
5. Read the **Army DPS** box. On a phone it is at the top, on a wide screen it stays next to the inputs while you scroll.

## Presets and Beast mode

The presets are four complete, wearable setups. Clicking one sets skill levels, auras and the Iron Golem; your revive and enemy choices stay as they are, so you can compare presets against the same monsters.

| Preset | Merc | Iron Golem | Idea |
|---|---|---|---|
| Low budget | Rogue: Mist (Concentration 9), Bramble (Thorns 15) | Mania | No Ber or Jah needed |
| Rogue Company | Rogue: Mist (Concentration 12), Bramble (Thorns 21) | Mania | Same items, best aura rolls |
| Desert Storm | Act 2 Offensive: Might 19, Pride, Bramble | Beast | Might instead of Inner Sight |
| Max Auras | Rogue: Faith, Bramble | Pride | Last Wish swap, four damage auras, 25 revives |

**Beast mode** swaps the Iron Golem's Mania (Fanaticism 1) for Beast (Fanaticism 9). The switch is only active while Low budget or Rogue Company is selected. As soon as you change an input, the preset is no longer highlighted, because your setup is now your own. The [presets guide](/guide/presets/) lists the full gear and the damage of each one.

## 1 · Skills

- **On summoning (pre-buff)** is your skill level at the moment you cast, with every +skill item and Battle Command you have then. Skeleton damage, attack rating and the mages' missile level are fixed at that moment. The presets assume Battle Command from Call to Arms, so they summon exactly one level above "during play" (Max Auras additionally loses Arm of King Leoric's bonus after the swap).
- **During play** is your level after a gear swap. It only decides how many minions you can keep. If it is lower, the extra minions disappear.
- If you never swap gear, enter the same value in both columns.
- **Skeleton Mastery** and **character level** have no "during play" value. They only change minion stats, and those are kept from the moment of summoning.
- **Raise Skeleton** sets the warriors' damage, attack rating and count. **Skeleton Mastery** adds damage and raises the mages' missile level. **Raise Skeletal Mage** sets the number of mages and their missile level. **Revive** sets how many revives you can have.

## 2 · Auras and buffs

Tick an aura to turn it on and enter its level from the item tooltip. Under each aura you see where it can come from and who can carry that item:

- <span class="chip ok">N</span> Necromancer · <span class="chip ok">R</span> Rogue (bows only) · <span class="chip ok">A2</span> Act 2 merc (polearms and spears only) · <span class="chip ok">G</span> Iron Golem (metal items, no bows)
- A <span class="chip no">struck</span> chip means that carrier cannot use the item. **2H** marks two-handed weapons, which cost the Necromancer his shield.

The orange box checks whether your ticked auras fit on real gear at the levels you entered. It names one valid set of items, or tells you that no combination works. Two rules matter here:

- **Item auras do not grow with +skills.** Only the Act 2 merc's own aura does.
- **The same aura from different carriers does not stack.** Only the highest level counts. Two items with the same aura on one carrier do add up.

**Amplify Damage** is your curse: it removes 100% physical resistance and is the biggest single boost for skeletons. Inner Sight is the Rogue's own skill, so it needs a Rogue.

## 3 · Golem and Rogue

- **Golem:** pick Iron, Clay, Blood or Fire Golem, or none. Only the Iron Golem wears an item and adds its aura. If you switch to another golem and an aura has no carrier left, the gear check in section 2 says so and offers one-click fixes, for example "Uncheck Concentration".
- **Golem skill level and Golem Mastery:** your levels while summoning, including +skills and Battle Command.
- **Golem item** (folded, Iron Golem only): base weapon and runeword. Picking a runeword fills in its best rolls; you can change every value. Two-handed weapons give no weapon damage.
- **Golem synergies** (folded): your hard skill points in the other golems. Only Fire Golem (+6% damage) and Clay Golem (+20 AR) change the damage.
- The line under the golem shows its damage per hit, attack speed, hit chance and, for the Clay Golem, its slow.
- **Rogue: Cold Arrow** is a reference value you can type in. It is on by default whenever the merc is a Rogue, because Cold Arrow is her default attack. Uncheck it to see the Necromancer's army only.

## 4 · Revives

Pick one melee and one ranged monster and how many of each you revive. Each revive uses that monster's own Hell stats; your auras and Amplify Damage boost it like any other minion. If you enter more revives than your Revive level allows during play, all groups are cut down proportionally.

The swing and shot rates are assumptions; the defaults are typical values. Whether Fanaticism's attack speed applies to revives is not confirmed, so it is a separate switch and off by default.

## 5 · Enemy pack

Choose the monsters you fight. The army's damage is spread over the pack by count, and each monster's defense and resistances count separately: cold-immune Flesh Archers take nothing from the mages' cold missiles, for example.

- **Swings/s per melee enemy** is how often each melee monster attacks, hit or miss. Thorns' flat damage triggers on every swing.
- **Hits your minions** is calculated, not entered: each enemy's attack rating and level against your minions' defense and level, with the game's hit formula. Skeleton and mage defense come from Raise Skeleton, Raise Skeletal Mage, Skeleton Mastery and your character level at summoning; revives keep their own defense. Thorns' percentage part only triggers on hits.

Diablo is a fixed second target with his Hell values, so you can always compare against a boss.

## Reading the result

- **vs. pack** is the damage per second your army deals to the whole enemy pack, **vs. Diablo** the same against Diablo.
- The table below splits the total into skeleton warriors, skeletal mages, Iron Golem, revives, Thorns and, if switched on, the Rogue's arrows.
- **Per minion values** shows the details for one skeleton (damage bonus, damage per hit, attack rating, chance to hit, attack frames) and one mage (missile damage per element).

## How attack rating, defense and attack speed change the damage

Every minion's damage per second is **damage per hit × chance to hit × attacks per second**. Auras like Concentration and Might only raise the first part. Attack rating, monster defense and attack speed decide the other two, and they multiply.

### Chance to hit

The game's formula, for every minion against every monster:

**Chance to hit = 2 × attacker level / (attacker level + defender level) × AR / (AR + defense)**, limited to 5–95%.

- **Attacker level** is your character level at summoning for skeletons, mages and golems (revives use their own level, at most yours). Against a level 82 Doom Knight a level 84 Necro gets a factor of 1.01, against level 94 Diablo only 0.94.
- **Attack rating (AR)** comes from Raise Skeleton, Skeleton Mastery and your character level, then Fanaticism and Heart of Wolverine add a percentage on top.
- **Defense** of the monster is lowered by Inner Sight (a flat amount) and Conviction (a percentage).

Skeletons at 45/45 against a Doom Knight (defense 1,837), from the calculator:

| Setup | AR | Monster defense | Chance to hit |
|---|---|---|---|
| No auras | 4,726 | 1,837 | 73% |
| Fanaticism 15 + Heart of Wolverine 5 | 12,429 | 1,837 | 88% |
| No auras, Inner Sight 31 | 4,726 | 122 | 95% (cap) |
| Fanaticism 15 + HoW 5 + Inner Sight 31 | 12,429 | 122 | 95% (cap) |

**What this means:** once you hit 95%, more AR or less defense adds nothing. Inner Sight alone gets skeletons to the cap against most Hell monsters, so with a Rogue the AR from Fanaticism is mostly wasted, and against high-defense targets without Inner Sight (Act 2 merc) it matters a lot. Against Diablo the level penalty keeps skeletons below the cap: 80% without Inner Sight, 91% with it.

### Attack speed

Minions attack in frames (25 frames = 1 second). A skeleton warrior needs 18 frames per swing without speed bonuses, and after every swing the AI waits another 15 frames before the next one. Fanaticism lowers the swing, not the pause:

| Fanaticism | Attack speed bonus | Frames per swing | With 15-frame pause | Attacks per second |
|---|---|---|---|---|
| none | 0 | 18 | 33 | 0.76 |
| 1 (Mania) | +14 | 16 | 31 | 0.81 |
| 9 (Beast) | +29 | 14 | 29 | 0.86 |
| 15 (Faith) | +33 | 13 | 28 | 0.89 |

**What this means:** because of the pause, even maximum Fanaticism only gives about +18% attacks. Fanaticism is still one of the strongest auras, because it also adds damage and AR, but its speed part is smaller than the tooltip suggests. Speed works in steps (breakpoints): a bonus between two steps changes nothing.

The Iron Golem works the same way, with his own frame table: his weapon's speed and the item's attack speed count too. The line under the golem in section 3 shows his frames and hit chance.

### Defense of your minions

The same hit formula runs the other way for enemies attacking your army. Skeleton and mage defense comes from Raise Skeleton, Raise Skeletal Mage, Skeleton Mastery and your character level at summoning. It only changes how often enemies land a hit, which in the calculator matters for Thorns: the flat part triggers on every swing, the percentage part only on hits. The enemy pack table shows the result as "Hits your minions".

## Saving, sharing and resetting

Your setup is stored in the page address after every change. **Copy link to this setup** copies it; anyone who opens the link sees exactly your inputs. **Reset** returns to the default setup: a level 88 character without Call to Arms, Mist (Concentration 9) and Bramble (Thorns 15) on the Rogue, Mania in the Iron Golem and 24 revives (14 melee, 10 ranged). Nothing is saved on a server and the site sets no cookies.

## Glossary

<dl class="glossary">
<dt>DPS</dt><dd>Damage per second.</dd>
<dt>AR (attack rating)</dt><dd>Decides together with the target's defense how often an attack hits. Hit chance is capped between 5% and 95%.</dd>
<dt>alvl / dlvl</dt><dd>Attacker level and defender level. Higher-level monsters are harder to hit.</dd>
<dt>Physical resistance</dt><dd>Reduces physical damage by a percentage. Amplify Damage lowers it by 100 points.</dd>
<dt>Immune</dt><dd>A resistance of 100% or more. The monster takes no damage of that type.</dd>
<dt>Carrier</dt><dd>Whoever wears the item that gives an aura: Necromancer, merc or Iron Golem.</dd>
<dt>Aura radius</dt><dd>How far an aura reaches from its carrier, in yards. The calculator assumes every minion is in range.</dd>
<dt>Concentration, Might, Fanaticism</dt><dd>Auras that add percentage damage. Fanaticism also adds attack speed and attack rating.</dd>
<dt>Thorns</dt><dd>Returns damage to melee attackers: a flat amount on every swing and a percentage of the damage on every hit.</dd>
<dt>Inner Sight</dt><dd>A Rogue skill that lowers the defense of nearby monsters, so the army hits more often.</dd>
<dt>Heart of Wolverine</dt><dd>A Druid spirit (for example from Wisp Projector charges) that adds damage and attack rating.</dd>
<dt>Missile level</dt><dd>The skill level the skeletal mages cast at. It comes from Raise Skeletal Mage and Skeleton Mastery.</dd>
<dt>Last Wish swap</dt><dd>Summon with your +skill weapon, then switch to Last Wish for its Might aura. Minions keep their summoned stats.</dd>
<dt>Ethereal</dt><dd>An item with higher base damage or defense and lower Str/Dex requirements, but it cannot be repaired.</dd>
</dl>

## Item database

The [item database](/items/) lists every weapon and armor base and all unique and set items by level. It is a plain reference: no prices, no trading.
