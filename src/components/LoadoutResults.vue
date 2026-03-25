<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: {
    type: Object,
    default: null,
  },
  slots: {
    type: Array,
    required: true,
  },
})

const numberFormatter = new Intl.NumberFormat('zh-CN')

const orderedRows = computed(() =>
  props.slots.map((slot) => ({
    slot,
    item: props.result?.itemsBySlot?.[slot.id] || null,
  })),
)

const bonusLines = computed(() => props.result?.setBonuses || [])

function formatNumber(value) {
  return numberFormatter.format(value || 0)
}

function formatItemName(item) {
  if (!item) {
    return '暂无装备'
  }

  if (item.isSpecial) {
    return item.name
  }

  return `${item.star} 星 ${item.name}`
}
</script>

<template>
  <section class="panel result-panel">
    <div class="panel-heading">
      <h2 class="panel-title">最优结果</h2>
      <span v-if="props.result" class="status-chip">{{ props.result.equippedCount }} / {{ props.slots.length }} 槽位</span>
    </div>

    <div v-if="props.result" class="result-body">
      <div class="result-layout">
        <aside class="result-summary">
          <span class="result-summary__label">总抗魔</span>
          <strong>{{ formatNumber(props.result.totalResist) }}</strong>

          <dl class="result-summary__metrics">
            <div>
              <dt>单件</dt>
              <dd>{{ formatNumber(props.result.itemResist) }}</dd>
            </div>
            <div>
              <dt>套装</dt>
              <dd>{{ formatNumber(props.result.bonusResist) }}</dd>
            </div>
            <div>
              <dt>评估</dt>
              <dd>{{ props.result.groupsEvaluated }} 组</dd>
            </div>
          </dl>
        </aside>

        <article class="result-card result-card--loadout">
          <h3>装备搭配</h3>

          <div class="result-list">
            <div v-for="row in orderedRows" :key="row.slot.id" class="result-item">
              <span class="result-item__slot">{{ row.slot.name }}</span>

              <div v-if="row.item" class="result-item__content">
                <span class="set-pill" :style="{ '--set-color': row.item.color }">{{ row.item.setName }}</span>
                <span class="result-item__name">{{ formatItemName(row.item) }}</span>
              </div>

              <span v-else class="result-item__empty">暂无装备</span>

              <strong>{{ formatNumber(row.item?.resist) }}</strong>
            </div>
          </div>
        </article>

        <article class="result-card result-card--bonus">
          <h3>套装加成</h3>

          <div v-if="bonusLines.length" class="result-list">
            <div v-for="bonus in bonusLines" :key="bonus.id" class="result-item">
              <span class="set-pill" :style="{ '--set-color': bonus.color }">{{ bonus.setName }}</span>
              <span class="result-item__name">{{ bonus.pieces }} 件套 / {{ bonus.star }} 星</span>
              <strong>{{ formatNumber(bonus.resist) }}</strong>
            </div>
          </div>

          <p v-else class="empty-note">当前最优解没有触发任何套装加成。</p>
        </article>
      </div>
    </div>

    <div v-else class="result-empty">
      <p>请点击右上方【计算最新搭配】按钮</p>
    </div>
  </section>
</template>

<style scoped>
.result-body {
  display: grid;
  gap: 0.8rem;
}

.result-layout {
  display: grid;
  grid-template-columns: minmax(180px, 0.22fr) minmax(0, 0.39fr) minmax(0, 0.39fr);
  gap: 0.8rem;
  align-items: start;
}

.result-summary {
  display: grid;
  gap: 0.8rem;
  padding: 0.95rem 1rem;
  border-radius: 18px;
  border: 1px solid rgba(209, 106, 40, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(242, 235, 226, 0.82)),
    linear-gradient(145deg, rgba(209, 106, 40, 0.12), rgba(11, 122, 168, 0.08));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.result-summary__label {
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.result-summary strong {
  font-size: clamp(1.9rem, 3.5vw, 2.6rem);
  line-height: 1;
}

.result-summary__metrics {
  display: grid;
  gap: 0.55rem;
  margin: 0;
}

.result-summary__metrics div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(37, 55, 77, 0.08);
}

.result-summary__metrics dt,
.result-summary__metrics dd {
  margin: 0;
}

.result-summary__metrics dt {
  color: var(--muted);
  font-size: 0.8rem;
}

.result-summary__metrics dd {
  color: var(--ink);
  font-weight: 700;
  font-size: 0.86rem;
}

.result-card--loadout,
.result-card--bonus {
  min-height: 100%;
}

.result-card {
  display: grid;
  gap: 0.75rem;
  padding: 0.95rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(37, 55, 77, 0.08);
}

.result-card h3 {
  margin: 0;
  font-size: 0.94rem;
}

.result-list {
  display: grid;
  gap: 0.55rem;
}

.result-item {
  display: grid;
  grid-template-columns: minmax(64px, 0.5fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.55rem;
}

.result-item__slot {
  color: var(--muted);
  font-size: 0.82rem;
}

.result-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.result-item__name {
  color: var(--ink);
  font-size: 0.86rem;
}

.result-item__empty,
.empty-note,
.result-empty p {
  color: var(--muted);
}

.result-empty {
  padding: 0.15rem 0;
}

.result-empty p {
  margin: 0;
}

@media (max-width: 1100px) {
  .result-layout {
    grid-template-columns: minmax(180px, 0.28fr) minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 920px) {
  .result-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .result-item {
    grid-template-columns: 1fr;
    justify-items: start;
  }
}
</style>
