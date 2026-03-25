export const stars = [1, 2, 3, 4, 5]

export const slots = [
  { id: 'top', name: '上衣' },
  { id: 'bottom', name: '下装' },
  { id: 'shoulder', name: '头肩' },
  { id: 'belt', name: '腰带' },
  { id: 'shoes', name: '鞋子' },
  { id: 'necklace', name: '项链' },
  { id: 'bracelet', name: '手镯' },
  { id: 'ring', name: '戒指' },
  { id: 'support', name: '辅助装备' },
  { id: 'magic-stone', name: '魔法石' },
  { id: 'earring', name: '耳环' },
]

export const highResistSlots = new Set(['top', 'bracelet', 'earring'])

export const baseResistTable = {
  high: [6665, 7417, 8170, 8922, 9675],
  normal: [5805, 6557, 7310, 8062, 8815],
}

export const setBonusTable = {
  2: [2200, 2400, 2600, 2800, 3000],
  5: [3400, 3800, 4200, 4600, 5000],
  8: [4400, 4800, 5200, 5600, 6000],
  11: [4600, 5000, 5400, 5800, 6200],
}

export const sets = [
  { id: 'wanling-faze', name: '万灵法则', color: '#b84552' },
  { id: 'eternal-war', name: '永恒战律', color: '#d16a28' },
  { id: 'echo-night', name: '残夜回响', color: '#9f7d1b' },
  { id: 'revive-scale', name: '复苏龙鳞', color: '#718a22' },
  { id: 'glacier-dream', name: '冰川之梦', color: '#2d9186' },
  { id: 'cross-dimension', name: '纵横次元', color: '#0b7aa8' },
  { id: 'lingyun-celestial', name: '凌云天仪', color: '#3867d6' },
  { id: 'stellar-destiny', name: '星辰命运', color: '#6753c8' },
  { id: 'glory-ever', name: '万世荣光', color: '#9151b5' },
  { id: 'heaven-tribulation', name: '天劫', color: '#b14f84' },
  { id: 'night-shadow', name: '暗夜之影', color: '#6d5c4d' },
  { id: 'time-trace', name: '时光的轨迹', color: '#4e7a72' },
  { id: 'demise-force', name: '逝魔之力', color: '#836d62' },
  { id: 'iron-lance', name: '铁马长戈', color: '#5b5b44' },
  { id: 'shangyuan-festival', name: '上元节祭典', color: '#cc5f3b' },
]

export const specialItems = [
  {
    id: 'transcendent-film-top',
    setId: 'special-top-film',
    name: '70B超凡贴膜·上衣',
    slotId: 'top',
    resist: 10520,
    color: '#2e3642',
  },
  {
    id: 'transcendent-film-bracelet',
    setId: 'special-bracelet-film',
    name: '70B超凡贴膜·手镯',
    slotId: 'bracelet',
    resist: 9520,
    color: '#4a4340',
  },
]

export const slotById = Object.fromEntries(slots.map((slot) => [slot.id, slot]))

export function getBaseResist(slotId, star) {
  if (!star) {
    return 0
  }

  const table = highResistSlots.has(slotId) ? baseResistTable.high : baseResistTable.normal
  return table[star - 1]
}

