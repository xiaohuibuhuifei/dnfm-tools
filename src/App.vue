<script setup>
import { computed, ref, watch } from 'vue'
import AppModal from './components/AppModal.vue'
import InventoryMatrix from './components/InventoryMatrix.vue'
import LoadoutResults from './components/LoadoutResults.vue'
import ProfileSidebar from './components/ProfileSidebar.vue'
import { getBaseResist, sets, slots, specialItems, stars } from './data/gameData.js'
import { findBestLoadout, getEffectiveGearStar, getHighestCraftableStar } from './utils/calculator.js'
import {
  createEmptyInventory,
  createProfile,
  createStarBuckets,
  loadActiveProfileId,
  loadProfiles,
  saveActiveProfileId,
  saveProfiles,
} from './utils/storage.js'

const profiles = ref(loadProfiles())
const activeProfileId = ref(loadActiveProfileId(profiles.value[0]?.id || null))
const result = ref(null)
const isDirty = ref(true)
const isRulesModalOpen = ref(false)
const editingCountCell = ref(null)
const countEditorDraft = ref(createStarBuckets())
const ruleLines = [
  '同套装同部位两件低星自动合成一件高一星。',
  '同一套装的 2 / 5 / 8 / 11 件套会同时累加。',
  '每档件套按当前已装备件中的第 N 高星来取档位。',
  '若某个槽位没有任何候选，结果里会保留为空，不会硬塞垃圾装备。',
]

if (!profiles.value.some((profile) => profile.id === activeProfileId.value)) {
  activeProfileId.value = profiles.value[0]?.id || null
}

const activeProfile = computed(() => profiles.value.find((profile) => profile.id === activeProfileId.value) || null)
const editingSetMeta = computed(() => sets.find((setMeta) => setMeta.id === editingCountCell.value?.setId) || null)
const editingSlot = computed(() => slots.find((slot) => slot.id === editingCountCell.value?.slotId) || null)
const countEditorTitle = computed(() =>
  editingSetMeta.value && editingSlot.value ? `${editingSetMeta.value.name} · ${editingSlot.value.name}` : '数量录入',
)
const countPreviewStar = computed(() => getHighestCraftableStar(countEditorDraft.value))
const countPreviewResist = computed(() => {
  if (!editingSlot.value || !countPreviewStar.value) {
    return 0
  }

  return getBaseResist(editingSlot.value.id, countPreviewStar.value)
})
const numberFormatter = new Intl.NumberFormat('zh-CN')

const craftableSummaryBySet = computed(() => {
  const profile = activeProfile.value

  if (!profile) {
    return {}
  }

  return Object.fromEntries(
    sets.map((setMeta) => {
      let count = 0
      const bySlot = {}

      for (const slot of slots) {
        const star = getEffectiveGearStar(
          profile.inventory.gearCounts[setMeta.id][slot.id],
          profile.inventory.manualStars[setMeta.id][slot.id],
        )
        const resist = star ? getBaseResist(slot.id, star) : 0

        bySlot[slot.id] = {
          star,
          resist,
        }

        if (star) {
          count += 1
        }
      }

      return [setMeta.id, { count, bySlot }]
    }),
  )
})

const totalAvailablePieces = computed(() =>
  sets.reduce((total, setMeta) => total + (craftableSummaryBySet.value[setMeta.id]?.count || 0), 0),
)

watch(
  profiles,
  (nextProfiles) => {
    saveProfiles(nextProfiles)
  },
  { deep: true },
)

watch(
  activeProfileId,
  (profileId) => {
    saveActiveProfileId(profileId)
  },
  { immediate: true },
)

function formatNumber(value) {
  return numberFormatter.format(value || 0)
}

function sanitizeCount(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function sanitizeSelectedStar(value) {
  const parsed = Number.parseInt(value, 10)
  return stars.includes(parsed) ? parsed : null
}

function cloneStarBuckets(source) {
  const buckets = createStarBuckets()

  for (const star of stars) {
    buckets[star] = sanitizeCount(source?.[star] ?? source?.[String(star)] ?? 0)
  }

  return buckets
}

function touchActiveProfile() {
  if (!activeProfile.value) {
    return
  }

  activeProfile.value.updatedAt = Date.now()
  isDirty.value = true
}

function closeCountEditor() {
  editingCountCell.value = null
  countEditorDraft.value = createStarBuckets()
}

function selectProfile(profileId) {
  if (profileId === activeProfileId.value) {
    return
  }

  activeProfileId.value = profileId
  closeCountEditor()
  result.value = null
  isDirty.value = true
}

function updateManualStar(setId, slotId, rawStar) {
  const profile = activeProfile.value

  if (!profile) {
    return
  }

  profile.inventory.manualStars[setId][slotId] = sanitizeSelectedStar(rawStar)
  profile.inventory.gearCounts[setId][slotId] = createStarBuckets()
  touchActiveProfile()
}

function openCountEditor(setId, slotId) {
  const profile = activeProfile.value

  if (!profile) {
    return
  }

  editingCountCell.value = { setId, slotId }
  countEditorDraft.value = cloneStarBuckets(profile.inventory.gearCounts[setId][slotId])
}

function updateCountDraft(star, rawValue) {
  countEditorDraft.value[star] = sanitizeCount(rawValue)
}

function resetCountDraft() {
  countEditorDraft.value = createStarBuckets()
}

function confirmCountEditor() {
  const profile = activeProfile.value

  if (!profile || !editingCountCell.value) {
    return
  }

  const { setId, slotId } = editingCountCell.value
  profile.inventory.gearCounts[setId][slotId] = cloneStarBuckets(countEditorDraft.value)
  profile.inventory.manualStars[setId][slotId] = null
  touchActiveProfile()
  closeCountEditor()
}

function toggleSpecialItem(itemId, checked) {
  const profile = activeProfile.value

  if (!profile) {
    return
  }

  profile.inventory.specials[itemId] = Boolean(checked)
  touchActiveProfile()
}

function handleCalculate() {
  if (!activeProfile.value) {
    return
  }

  result.value = findBestLoadout(activeProfile.value.inventory)
  isDirty.value = false
}

function handleAddProfile() {
  const nextName = window.prompt('输入新配置名称', `配置 ${profiles.value.length + 1}`)

  if (nextName === null) {
    return
  }

  const profile = createProfile(nextName)
  profiles.value = [...profiles.value, profile]
  activeProfileId.value = profile.id
  closeCountEditor()
  result.value = null
  isDirty.value = true
}

function handleRenameProfile() {
  if (!activeProfile.value) {
    return
  }

  const nextName = window.prompt('输入新的配置名称', activeProfile.value.name)

  if (nextName === null) {
    return
  }

  activeProfile.value.name = String(nextName).trim() || activeProfile.value.name
  touchActiveProfile()
}

function handleResetProfile() {
  if (!activeProfile.value) {
    return
  }

  const confirmed = window.confirm(`确认重置配置“${activeProfile.value.name}”吗？`)

  if (!confirmed) {
    return
  }

  activeProfile.value.inventory = createEmptyInventory()
  closeCountEditor()
  result.value = null
  isDirty.value = true
  activeProfile.value.updatedAt = Date.now()
}

function handleDeleteProfile() {
  const profile = activeProfile.value

  if (!profile) {
    return
  }

  const confirmed = window.confirm(`确认删除配置“${profile.name}”吗？`)

  if (!confirmed) {
    return
  }

  if (profiles.value.length === 1) {
    const replacement = createProfile()
    profiles.value = [replacement]
    activeProfileId.value = replacement.id
    closeCountEditor()
    result.value = null
    isDirty.value = true
    return
  }

  profiles.value = profiles.value.filter((item) => item.id !== profile.id)
  activeProfileId.value = profiles.value[0].id
  closeCountEditor()
  result.value = null
  isDirty.value = true
}
</script>

<template>
  <div class="app-shell">
    <header class="panel hero">
      <div class="hero-brand">
        <h1 class="hero-title">抗魔模拟器</h1>
        <button class="icon-button" type="button" aria-label="查看计算规则" @click="isRulesModalOpen = true">?</button>
      </div>

      <div class="hero-actions">
        <span class="status-chip">
          当前配置：{{ activeProfile?.name || '未选择配置' }} / 可用候选：{{ totalAvailablePieces }} 件
        </span>
        <span class="status-chip" :class="{ 'status-chip--dirty': isDirty }">
          {{ isDirty ? '库存已变动' : '库存未变动' }}
        </span>
        <button class="primary-button" type="button" @click="handleCalculate">
          计算最新搭配
        </button>
      </div>
    </header>

    <main class="workspace">
      <ProfileSidebar
        :profiles="profiles"
        :active-profile-id="activeProfileId"
        @select-profile="selectProfile"
        @add-profile="handleAddProfile"
        @rename-profile="handleRenameProfile"
        @reset-profile="handleResetProfile"
        @delete-profile="handleDeleteProfile"
      />

      <LoadoutResults :result="result" :slots="slots" />

      <InventoryMatrix
        v-if="activeProfile"
        :sets="sets"
        :slots="slots"
        :inventory="activeProfile.inventory"
        :craftable-summary="craftableSummaryBySet"
        :total-available-pieces="totalAvailablePieces"
        :special-items="specialItems"
        :special-flags="activeProfile.inventory.specials"
        @select-star="updateManualStar"
        @open-count-editor="openCountEditor"
        @toggle-special="toggleSpecialItem"
      />
    </main>

    <AppModal :open="isRulesModalOpen" title="计算规则" width="min(560px, calc(100vw - 1.5rem))" @close="isRulesModalOpen = false">
      <ul class="note-list">
        <li v-for="rule in ruleLines" :key="rule">{{ rule }}</li>
      </ul>
    </AppModal>

    <AppModal :open="Boolean(editingCountCell)" :title="countEditorTitle" @close="closeCountEditor">
      <div class="count-editor">
        <p class="muted-text">
          输入各星级库存数量后点“确认自动计算”。弹窗数量会保留；但如果你回到主页手动改这个格子的星级，这里的数量会被清空。
        </p>

        <div class="count-editor__grid">
          <label v-for="star in stars" :key="`draft-${star}`" class="count-editor__field">
            <span>{{ star }}★ 数量</span>
            <input
              class="number-field"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              :value="countEditorDraft[star]"
              @input="updateCountDraft(star, $event.target.value)"
            />
          </label>
        </div>

        <div class="count-editor__summary">
          <span>自动结果</span>
          <strong>{{ countPreviewStar ? `${countPreviewStar} 星` : '无可用单件' }}</strong>
          <span>单件抗魔 {{ formatNumber(countPreviewResist) }}</span>
        </div>

        <div class="count-editor__actions">
          <button class="action-button" type="button" @click="resetCountDraft">清空数量</button>
          <button class="action-button" type="button" @click="closeCountEditor">取消</button>
          <button class="primary-button" type="button" @click="confirmCountEditor">确认自动计算</button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem 1rem;
  flex-wrap: wrap;
  padding: 0.85rem 1rem;
}

.hero-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
}

.hero-brand > * {
  flex: 0 0 auto;
}

.hero-title {
  margin: 0;
  font-size: clamp(1.35rem, 2.5vw, 1.9rem);
  line-height: 1;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.65rem;
}

.icon-button {
  width: 1.7rem;
  height: 1.7rem;
  border: none;
  border-radius: 999px;
  background: rgba(25, 43, 61, 0.08);
  color: var(--ink);
  font-weight: 700;
  font-size: 0.9rem;
}

.hero :deep(.status-chip) {
  padding: 0.35rem 0.7rem;
  font-size: 0.84rem;
}

.hero :deep(.primary-button) {
  padding: 0.65rem 0.95rem;
}

.workspace {
  display: grid;
  width: 100%;
  gap: 1rem;
}

.workspace > * {
  min-width: 0;
}

.note-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding-left: 1.2rem;
  color: var(--muted);
}

.count-editor {
  display: grid;
  gap: 1rem;
}

.count-editor__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
}

.count-editor__field {
  display: grid;
  gap: 0.4rem;
}

.count-editor__field span {
  color: var(--muted);
  font-size: 0.86rem;
}

.count-editor__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(13, 118, 148, 0.12), rgba(209, 106, 40, 0.15));
}

.count-editor__summary strong {
  font-size: 1.1rem;
}

.count-editor__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 1080px) {
  .hero {
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .count-editor__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hero-actions,
  .count-editor__actions {
    justify-content: flex-start;
  }
}
</style>
