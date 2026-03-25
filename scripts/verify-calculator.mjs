import assert from 'node:assert/strict'
import { findBestLoadout, getEffectiveGearStar, getHighestCraftableStar } from '../src/utils/calculator.js'
import { createEmptyInventory } from '../src/utils/storage.js'

function testHighestCraftableStar() {
  assert.equal(getHighestCraftableStar({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }), null)
  assert.equal(getHighestCraftableStar({ 1: 1, 2: 0, 3: 0, 4: 0, 5: 0 }), 1)
  assert.equal(getHighestCraftableStar({ 1: 2, 2: 0, 3: 0, 4: 0, 5: 0 }), 2)
  assert.equal(getHighestCraftableStar({ 1: 4, 2: 0, 3: 0, 4: 0, 5: 0 }), 3)
  assert.equal(getHighestCraftableStar({ 1: 7, 2: 1, 3: 0, 4: 0, 5: 0 }), 4)
}

function testSetBonusProgression() {
  const inventory = createEmptyInventory()
  const setId = 'wanling-faze'

  inventory.gearCounts[setId].top[5] = 1
  inventory.gearCounts[setId].bracelet[5] = 1
  inventory.gearCounts[setId].bottom[4] = 1
  inventory.gearCounts[setId].belt[4] = 1
  inventory.gearCounts[setId].shoes[3] = 1

  const result = findBestLoadout(inventory)

  assert.equal(result.itemResist, 42784)
  assert.equal(result.bonusResist, 7200)
  assert.equal(result.totalResist, 49984)
  assert.deepEqual(
    result.setBonuses.map((line) => [line.pieces, line.star, line.resist]),
    [
      [2, 5, 3000],
      [5, 3, 4200],
    ],
  )
}

function testManualStarOverridesCountBuckets() {
  const inventory = createEmptyInventory()
  const setId = 'wanling-faze'

  inventory.gearCounts[setId].top[1] = 4
  inventory.manualStars[setId].top = 5

  assert.equal(getEffectiveGearStar(inventory.gearCounts[setId].top, inventory.manualStars[setId].top), 5)

  const result = findBestLoadout(inventory)

  assert.equal(result.itemsBySlot.top?.star, 5)
  assert.equal(result.itemsBySlot.top?.resist, 9675)
}

function testSpecialItemsWinWhenTheyShould() {
  const inventory = createEmptyInventory()

  inventory.gearCounts['wanling-faze'].earring[5] = 1
  inventory.specials['transcendent-film-top'] = true
  inventory.specials['transcendent-film-bracelet'] = true

  const result = findBestLoadout(inventory)

  assert.equal(result.totalResist, 29715)
  assert.equal(result.itemResist, 29715)
  assert.equal(result.bonusResist, 0)
  assert.equal(result.itemsBySlot.top?.isSpecial, true)
  assert.equal(result.itemsBySlot.bracelet?.isSpecial, true)
}

testHighestCraftableStar()
testSetBonusProgression()
testManualStarOverridesCountBuckets()
testSpecialItemsWinWhenTheyShould()

console.log('calculator checks passed')
