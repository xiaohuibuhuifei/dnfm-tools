import { getBaseResist, setBonusTable, sets, slots, slotById, specialItems } from '../data/gameData.js'

const slotIndexMap = Object.fromEntries(slots.map((slot, index) => [slot.id, index]))
const bonusThresholds = [2, 5, 8, 11]
const totalMasks = 1 << slots.length

function sanitizeCounts(countsByStar) {
  const counts = Array(6).fill(0)

  for (let star = 1; star <= 5; star += 1) {
    const rawValue = countsByStar?.[star] ?? countsByStar?.[String(star)] ?? 0
    const parsed = Number.parseInt(rawValue, 10)
    counts[star] = Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  return counts
}

function getSubsets(mask) {
  const subsets = []
  let current = mask

  while (true) {
    subsets.push(current)

    if (current === 0) {
      break
    }

    current = (current - 1) & mask
  }

  return subsets
}

function getSelectedStars(group, subsetMask) {
  const stars = []

  for (const slot of slots) {
    const bit = 1 << slotIndexMap[slot.id]

    if ((subsetMask & bit) === 0) {
      continue
    }

    stars.push(group.itemBySlot[slot.id].star)
  }

  stars.sort((left, right) => right - left)
  return stars
}

function getSetBonusLines(group, subsetMask) {
  const stars = getSelectedStars(group, subsetMask)
  const bonuses = []

  for (const pieces of bonusThresholds) {
    if (stars.length < pieces) {
      continue
    }

    const star = stars[pieces - 1]
    const resist = setBonusTable[pieces][star - 1]

    bonuses.push({
      id: `${group.id}:${pieces}`,
      setId: group.id,
      setName: group.name,
      color: group.color,
      pieces,
      star,
      resist,
    })
  }

  return bonuses
}

function describeSetSelection(group, subsetMask) {
  const items = []
  let itemResist = 0

  for (const slot of slots) {
    const bit = 1 << slotIndexMap[slot.id]

    if ((subsetMask & bit) === 0) {
      continue
    }

    const item = group.itemBySlot[slot.id]
    items.push(item)
    itemResist += item.resist
  }

  const bonuses = getSetBonusLines(group, subsetMask)
  const bonusResist = bonuses.reduce((total, bonus) => total + bonus.resist, 0)

  return {
    items,
    itemResist,
    bonusResist,
    bonuses,
  }
}

function buildSetGroup(setMeta, gearCounts, manualStars) {
  const itemBySlot = {}
  let availableMask = 0

  for (const slot of slots) {
    const star = getEffectiveGearStar(gearCounts?.[slot.id], manualStars?.[slot.id])

    if (!star) {
      continue
    }

    const resist = getBaseResist(slot.id, star)
    const bit = 1 << slotIndexMap[slot.id]

    itemBySlot[slot.id] = {
      id: `${setMeta.id}:${slot.id}:${star}`,
      slotId: slot.id,
      slotName: slot.name,
      name: slot.name,
      setId: setMeta.id,
      setName: setMeta.name,
      color: setMeta.color,
      star,
      resist,
      isSpecial: false,
    }

    availableMask |= bit
  }

  return {
    id: setMeta.id,
    type: 'set',
    name: setMeta.name,
    color: setMeta.color,
    availableMask,
    itemBySlot,
  }
}

function buildSpecialGroups(specialFlags) {
  return specialItems
    .filter((item) => Boolean(specialFlags?.[item.id]))
    .map((item) => {
      const slot = slotById[item.slotId]
      const bit = 1 << slotIndexMap[item.slotId]

      return {
        id: item.setId,
        type: 'special',
        name: item.name,
        color: item.color,
        availableMask: bit,
        item: {
          id: item.id,
          slotId: item.slotId,
          slotName: slot.name,
          name: item.name,
          setId: item.setId,
          setName: '超凡贴膜',
          color: item.color,
          star: null,
          resist: item.resist,
          isSpecial: true,
        },
      }
    })
}

function buildScoreTable(group) {
  const subsets = getSubsets(group.availableMask)
  const scores = Array(totalMasks).fill(0)

  for (const subset of subsets) {
    if (subset === 0) {
      continue
    }

    if (group.type === 'set') {
      const detail = describeSetSelection(group, subset)
      scores[subset] = detail.itemResist + detail.bonusResist
      continue
    }

    scores[subset] = group.item.resist
  }

  return {
    group,
    subsets,
    scores,
  }
}

export function getHighestCraftableStar(countsByStar) {
  const counts = sanitizeCounts(countsByStar)

  for (let star = 1; star < 5; star += 1) {
    const carry = Math.floor(counts[star] / 2)
    counts[star] %= 2
    counts[star + 1] += carry
  }

  for (let star = 5; star >= 1; star -= 1) {
    if (counts[star] > 0) {
      return star
    }
  }

  return null
}

export function getEffectiveGearStar(countsByStar, manualStar) {
  const parsedManualStar = Number.parseInt(manualStar, 10)

  if (Number.isFinite(parsedManualStar) && parsedManualStar >= 1 && parsedManualStar <= 5) {
    return parsedManualStar
  }

  return getHighestCraftableStar(countsByStar)
}

export function buildCandidates(inventory) {
  const setGroups = sets.map((setMeta) =>
    buildSetGroup(setMeta, inventory?.gearCounts?.[setMeta.id], inventory?.manualStars?.[setMeta.id]),
  )
  const specialGroups = buildSpecialGroups(inventory?.specials)

  return [...setGroups, ...specialGroups].filter((group) => group.availableMask !== 0)
}

export function calculateSetBonuses(selectedItems) {
  const itemsBySet = new Map()

  for (const item of selectedItems) {
    if (item.isSpecial) {
      continue
    }

    const existing = itemsBySet.get(item.setId) || {
      id: item.setId,
      name: item.setName,
      color: item.color,
      stars: [],
    }

    existing.stars.push(item.star)
    itemsBySet.set(item.setId, existing)
  }

  const bonuses = []

  for (const group of itemsBySet.values()) {
    group.stars.sort((left, right) => right - left)

    for (const pieces of bonusThresholds) {
      if (group.stars.length < pieces) {
        continue
      }

      const star = group.stars[pieces - 1]
      const resist = setBonusTable[pieces][star - 1]

      bonuses.push({
        id: `${group.id}:${pieces}`,
        setId: group.id,
        setName: group.name,
        color: group.color,
        pieces,
        star,
        resist,
      })
    }
  }

  return bonuses
}

export function findBestLoadout(inventory) {
  const groups = buildCandidates(inventory)
  const scoreTables = groups.map(buildScoreTable)
  const histories = []
  let dp = Array(totalMasks).fill(Number.NEGATIVE_INFINITY)

  dp[0] = 0

  for (const table of scoreTables) {
    const nextDp = Array(totalMasks).fill(Number.NEGATIVE_INFINITY)
    const trace = Array(totalMasks).fill(null)

    for (let mask = 0; mask < totalMasks; mask += 1) {
      const currentScore = dp[mask]

      if (!Number.isFinite(currentScore)) {
        continue
      }

      for (const subset of table.subsets) {
        if ((subset & mask) !== 0) {
          continue
        }

        const newMask = mask | subset
        const candidateScore = currentScore + table.scores[subset]

        if (candidateScore <= nextDp[newMask]) {
          continue
        }

        nextDp[newMask] = candidateScore
        trace[newMask] = {
          prevMask: mask,
          subset,
        }
      }
    }

    dp = nextDp
    histories.push(trace)
  }

  let bestMask = 0
  let bestScore = 0

  for (let mask = 0; mask < totalMasks; mask += 1) {
    if (dp[mask] > bestScore) {
      bestScore = dp[mask]
      bestMask = mask
    }
  }

  const chosenSubsets = Array(scoreTables.length).fill(0)
  let cursor = bestMask

  for (let index = scoreTables.length - 1; index >= 0; index -= 1) {
    const step = histories[index]?.[cursor] || {
      prevMask: cursor,
      subset: 0,
    }

    chosenSubsets[index] = step.subset
    cursor = step.prevMask
  }

  const itemsBySlot = Object.fromEntries(slots.map((slot) => [slot.id, null]))
  const setBonuses = []
  let itemResist = 0
  let bonusResist = 0

  for (let index = 0; index < scoreTables.length; index += 1) {
    const subset = chosenSubsets[index]

    if (subset === 0) {
      continue
    }

    const { group } = scoreTables[index]

    if (group.type === 'special') {
      itemsBySlot[group.item.slotId] = group.item
      itemResist += group.item.resist
      continue
    }

    const detail = describeSetSelection(group, subset)

    for (const item of detail.items) {
      itemsBySlot[item.slotId] = item
    }

    itemResist += detail.itemResist
    bonusResist += detail.bonusResist
    setBonuses.push(...detail.bonuses)
  }

  const selectedItems = slots.map((slot) => itemsBySlot[slot.id]).filter(Boolean)

  return {
    totalResist: itemResist + bonusResist,
    itemResist,
    bonusResist,
    equippedCount: selectedItems.length,
    selectedItems,
    itemsBySlot,
    setBonuses,
    groupsEvaluated: groups.length,
  }
}
