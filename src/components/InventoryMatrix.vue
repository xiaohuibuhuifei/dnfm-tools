<script setup>
import { stars } from '../data/gameData.js'

const props = defineProps({
  sets: {
    type: Array,
    required: true,
  },
  slots: {
    type: Array,
    required: true,
  },
  inventory: {
    type: Object,
    required: true,
  },
  craftableSummary: {
    type: Object,
    required: true,
  },
  totalAvailablePieces: {
    type: Number,
    default: 0,
  },
  specialItems: {
    type: Array,
    default: () => [],
  },
  specialFlags: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['select-star', 'open-count-editor', 'toggle-special'])
const numberFormatter = new Intl.NumberFormat('zh-CN')

function getEffectiveStar(setId, slotId) {
  return props.craftableSummary?.[setId]?.bySlot?.[slotId]?.star ?? null
}

function getResist(setId, slotId) {
  return props.craftableSummary?.[setId]?.bySlot?.[slotId]?.resist ?? 0
}

function getSetCount(setId) {
  return props.craftableSummary?.[setId]?.count ?? 0
}

function getManualStar(setId, slotId) {
  return props.inventory?.manualStars?.[setId]?.[slotId] ?? null
}

function hasCountData(setId, slotId) {
  const counts = props.inventory?.gearCounts?.[setId]?.[slotId]
  return stars.some((star) => Number(counts?.[star] ?? counts?.[String(star)] ?? 0) > 0)
}

function getModeLabel(setId, slotId) {
  if (getManualStar(setId, slotId)) {
    return '手动'
  }

  if (hasCountData(setId, slotId)) {
    return '数量'
  }

  return '未录'
}

function formatNumber(value) {
  return numberFormatter.format(value || 0)
}

function handleSelect(setId, slotId, event) {
  emit('select-star', setId, slotId, event.target.value)
}

function openCountEditor(setId, slotId) {
  emit('open-count-editor', setId, slotId)
}

function isSpecialEnabled(itemId) {
  return Boolean(props.specialFlags?.[itemId])
}

function getSpecialShortName(item) {
  return item.slotId === 'top' ? '上衣贴膜' : '手镯贴膜'
}

function toggleSpecial(itemId, event) {
  emit('toggle-special', itemId, event.target.checked)
}
</script>

<template>
  <section class="panel inventory-matrix">
    <div class="panel-heading inventory-matrix__heading">
      <h2 class="panel-title">装备录入</h2>

      <div class="inventory-matrix__toolbar">
        <div class="inventory-matrix__specials">
          <span class="inventory-matrix__toolbar-label">超凡贴膜</span>
          <label
            v-for="item in props.specialItems"
            :key="item.id"
            class="inventory-matrix__special-chip"
            :style="{ '--set-color': item.color }"
          >
            <input type="checkbox" :checked="isSpecialEnabled(item.id)" @change="toggleSpecial(item.id, $event)" />
            <span>{{ getSpecialShortName(item) }}</span>
          </label>
        </div>

        <span class="status-chip">{{ props.totalAvailablePieces }} 件可用候选</span>
      </div>
    </div>

    <div class="inventory-matrix__scroll">
      <table class="inventory-matrix__table">
        <colgroup>
          <col class="inventory-matrix__col inventory-matrix__col--set" />
          <col
            v-for="slot in props.slots"
            :key="`col-${slot.id}`"
            class="inventory-matrix__col inventory-matrix__col--slot"
          />
        </colgroup>

        <thead>
          <tr>
            <th class="inventory-matrix__corner">套装 / 部位</th>
            <th v-for="slot in props.slots" :key="slot.id" class="inventory-matrix__slot">{{ slot.name }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="setMeta in props.sets" :key="setMeta.id">
            <th class="inventory-matrix__set">
              <div class="inventory-matrix__set-name">
                <span class="inventory-matrix__set-dot" :style="{ '--set-color': setMeta.color }"></span>
                <span>{{ setMeta.name }}</span>
              </div>
              <span class="inventory-matrix__set-count">{{ getSetCount(setMeta.id) }} / {{ props.slots.length }}</span>
            </th>

            <td v-for="slot in props.slots" :key="`${setMeta.id}-${slot.id}`" class="inventory-matrix__cell-wrap">
              <div
                class="inventory-matrix__cell"
                :class="{
                  'inventory-matrix__cell--ready': getEffectiveStar(setMeta.id, slot.id),
                  'inventory-matrix__cell--manual': getManualStar(setMeta.id, slot.id),
                }"
                :style="{ '--set-color': setMeta.color }"
              >
                <div class="inventory-matrix__controls">
                  <select
                    class="inventory-matrix__select"
                    :value="String(getEffectiveStar(setMeta.id, slot.id) || '')"
                    @change="handleSelect(setMeta.id, slot.id, $event)"
                  >
                    <option value="">空</option>
                    <option v-for="star in stars" :key="`${setMeta.id}-${slot.id}-${star}`" :value="String(star)">
                      {{ star }}★
                    </option>
                  </select>

                  <button class="inventory-matrix__count-button" type="button" @click="openCountEditor(setMeta.id, slot.id)">
                    数量
                  </button>
                </div>

                <div class="inventory-matrix__meta">
                  <span>{{ getModeLabel(setMeta.id, slot.id) }}</span>
                  <strong>{{ formatNumber(getResist(setMeta.id, slot.id)) }}</strong>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.inventory-matrix {
  display: grid;
  gap: 1rem;
}

.inventory-matrix__heading {
  align-items: center;
  gap: 0.75rem;
}

.inventory-matrix__scroll {
  overflow: hidden;
}

.inventory-matrix__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.inventory-matrix__specials {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.inventory-matrix__toolbar-label {
  color: var(--muted);
  font-size: 0.8rem;
}

.inventory-matrix__special-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--set-color) 18%, rgba(37, 55, 77, 0.08));
  background: color-mix(in srgb, var(--set-color) 7%, rgba(255, 255, 255, 0.94));
  font-size: 0.76rem;
  white-space: nowrap;
}

.inventory-matrix__special-chip input {
  width: 0.95rem;
  height: 0.95rem;
  margin: 0;
  accent-color: var(--set-color);
}

.inventory-matrix__table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0.25rem;
}

.inventory-matrix__col--set {
  width: 12%;
}

.inventory-matrix__col--slot {
  width: 8%;
}

.inventory-matrix__corner,
.inventory-matrix__slot,
.inventory-matrix__set {
  background: rgba(248, 242, 234, 0.96);
  color: var(--ink);
}

.inventory-matrix__slot {
  text-align: center;
}

.inventory-matrix__set {
  padding: 0.5rem 0.55rem;
  border-radius: 12px;
  text-align: left;
  vertical-align: top;
}

.inventory-matrix__set-name {
  display: flex;
  align-items: flex-start;
  gap: 0.38rem;
  font-weight: 700;
  font-size: 0.76rem;
  line-height: 1.1;
  word-break: break-word;
}

.inventory-matrix__set-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--set-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--set-color) 14%, transparent);
  margin-top: 0.18rem;
}

.inventory-matrix__set-count {
  display: inline-block;
  margin-top: 0.28rem;
  color: var(--muted);
  font-size: 0.7rem;
}

.inventory-matrix__corner,
.inventory-matrix__slot {
  padding: 0.5rem 0.35rem;
  border-radius: 12px;
  font-size: 0.78rem;
}

.inventory-matrix__cell-wrap {
  min-width: 0;
}

.inventory-matrix__cell {
  display: grid;
  gap: 0.25rem;
  padding: 0.35rem;
  border-radius: 12px;
  border: 1px solid rgba(37, 55, 77, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(242, 236, 228, 0.72));
}

.inventory-matrix__cell--ready {
  border-color: color-mix(in srgb, var(--set-color) 28%, rgba(37, 55, 77, 0.12));
  box-shadow: 0 14px 24px color-mix(in srgb, var(--set-color) 10%, transparent);
}

.inventory-matrix__cell--manual {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(242, 236, 228, 0.8)),
    linear-gradient(135deg, color-mix(in srgb, var(--set-color) 12%, transparent), transparent);
}

.inventory-matrix__controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.2rem;
  align-items: center;
}

.inventory-matrix__select,
.inventory-matrix__count-button {
  width: 100%;
  min-width: 0;
  border-radius: 9px;
  border: 1px solid rgba(37, 55, 77, 0.12);
  background: rgba(255, 255, 255, 0.95);
  color: var(--ink);
  font-size: 0.72rem;
}

.inventory-matrix__select {
  min-height: 1.8rem;
  padding: 0.25rem 0.35rem;
}

.inventory-matrix__count-button {
  width: auto;
  min-height: 1.8rem;
  padding: 0.25rem 0.38rem;
  font-weight: 700;
  white-space: nowrap;
}

.inventory-matrix__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.25rem;
  color: var(--muted);
  font-size: 0.64rem;
}

.inventory-matrix__meta strong {
  color: var(--ink);
  font-size: 0.68rem;
}

@media (max-width: 1200px) {
  .inventory-matrix__heading {
    align-items: start;
  }

  .inventory-matrix__corner,
  .inventory-matrix__slot {
    font-size: 0.72rem;
  }

  .inventory-matrix__set-name,
  .inventory-matrix__set-count,
  .inventory-matrix__select,
  .inventory-matrix__count-button,
  .inventory-matrix__meta {
    font-size: 0.62rem;
  }
}

@media (max-width: 900px) {
  .inventory-matrix__toolbar {
    justify-content: flex-start;
  }
}
</style>
