<script setup>
const props = defineProps({
  profiles: {
    type: Array,
    required: true,
  },
  activeProfileId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'select-profile',
  'add-profile',
  'rename-profile',
  'reset-profile',
  'delete-profile',
])

</script>

<template>
  <section class="panel profile-panel">
    <div class="panel-heading">
      <div class="profile-heading">
        <h2 class="panel-title">配置管理</h2>
        <span class="status-chip">{{ props.profiles.length }} 份配置</span>
      </div>

      <div class="profile-actions">
        <button class="action-button" type="button" @click="emit('add-profile')">新增配置</button>
        <button class="action-button" type="button" @click="emit('rename-profile')">重命名</button>
        <button class="action-button" type="button" @click="emit('reset-profile')">重置当前</button>
        <button class="action-button action-button--danger" type="button" @click="emit('delete-profile')">删除当前</button>
      </div>
    </div>

    <div class="profile-list">
      <button
        v-for="profile in props.profiles"
        :key="profile.id"
        class="profile-card"
        :class="{ 'profile-card--active': profile.id === props.activeProfileId }"
        type="button"
        @click="emit('select-profile', profile.id)"
      >
        <strong>{{ profile.name }}</strong>
      </button>
    </div>
  </section>
</template>

<style scoped>
.profile-panel {
  display: grid;
  gap: 0.65rem;
}

.profile-heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
}

.profile-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.panel-heading {
  align-items: center;
}

.profile-card {
  display: inline-flex;
  align-items: center;
  width: auto;
  padding: 0.55rem 0.85rem;
  border: 1px solid rgba(37, 55, 77, 0.12);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(243, 236, 226, 0.78));
  text-align: left;
  color: var(--ink);
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.profile-actions .action-button {
  padding: 0.5rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
}

.profile-card:hover {
  transform: translateY(-1px);
  border-color: rgba(11, 122, 168, 0.3);
  box-shadow: 0 12px 20px rgba(34, 52, 75, 0.08);
}

.profile-card strong {
  font-size: 0.86rem;
}

.profile-card--active {
  border-color: rgba(11, 122, 168, 0.45);
  box-shadow: 0 14px 28px rgba(11, 122, 168, 0.14);
}

@media (max-width: 720px) {
  .panel-heading {
    align-items: start;
  }

  .profile-actions {
    justify-content: flex-start;
  }
}
</style>
