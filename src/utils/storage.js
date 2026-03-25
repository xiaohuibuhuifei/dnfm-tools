import { sets, slots, specialItems, stars } from '../data/gameData.js'

const STORAGE_KEY = 'dnfm-simulator:profiles'
const ACTIVE_PROFILE_KEY = 'dnfm-simulator:active-profile'

export function createStarBuckets() {
  return Object.fromEntries(stars.map((star) => [star, 0]))
}

function createManualStarMap() {
  const manualStars = {}

  for (const set of sets) {
    manualStars[set.id] = {}

    for (const slot of slots) {
      manualStars[set.id][slot.id] = null
    }
  }

  return manualStars
}

function normalizeCount(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function normalizeManualStar(value) {
  const parsed = Number.parseInt(value, 10)
  return stars.includes(parsed) ? parsed : null
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createEmptyInventory() {
  const gearCounts = {}

  for (const set of sets) {
    gearCounts[set.id] = {}

    for (const slot of slots) {
      gearCounts[set.id][slot.id] = createStarBuckets()
    }
  }

  const manualStars = createManualStarMap()
  const specials = Object.fromEntries(specialItems.map((item) => [item.id, false]))

  return {
    gearCounts,
    manualStars,
    specials,
  }
}

function normalizeInventory(rawInventory) {
  const inventory = createEmptyInventory()

  for (const set of sets) {
    for (const slot of slots) {
      for (const star of stars) {
        const rawValue = rawInventory?.gearCounts?.[set.id]?.[slot.id]?.[star]
        inventory.gearCounts[set.id][slot.id][star] = normalizeCount(rawValue)
      }

      inventory.manualStars[set.id][slot.id] = normalizeManualStar(rawInventory?.manualStars?.[set.id]?.[slot.id])
    }
  }

  for (const item of specialItems) {
    inventory.specials[item.id] = Boolean(rawInventory?.specials?.[item.id])
  }

  return inventory
}

export function createProfile(name = '默认配置') {
  const normalizedName = String(name).trim() || '默认配置'

  return {
    id: createId(),
    name: normalizedName,
    inventory: createEmptyInventory(),
    updatedAt: Date.now(),
  }
}

function normalizeProfile(rawProfile, index) {
  return {
    id: rawProfile?.id || createId(),
    name: String(rawProfile?.name || `配置 ${index + 1}`).trim() || `配置 ${index + 1}`,
    inventory: normalizeInventory(rawProfile?.inventory),
    updatedAt: Number.isFinite(rawProfile?.updatedAt) ? rawProfile.updatedAt : Date.now(),
  }
}

export function loadProfiles() {
  if (typeof window === 'undefined') {
    return [createProfile()]
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return [createProfile()]
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createProfile()]
    }

    return parsed.map(normalizeProfile)
  } catch (error) {
    console.warn('读取本地配置失败，已回退默认配置。', error)
    return [createProfile()]
  }
}

export function saveProfiles(profiles) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

export function loadActiveProfileId(fallbackId = null) {
  if (typeof window === 'undefined') {
    return fallbackId
  }

  return window.localStorage.getItem(ACTIVE_PROFILE_KEY) || fallbackId
}

export function saveActiveProfileId(profileId) {
  if (typeof window === 'undefined') {
    return
  }

  if (!profileId) {
    window.localStorage.removeItem(ACTIVE_PROFILE_KEY)
    return
  }

  window.localStorage.setItem(ACTIVE_PROFILE_KEY, profileId)
}
