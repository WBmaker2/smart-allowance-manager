export const CATEGORIES = [
  { id: 'snack', label: '간식', color: '#f97316' },
  { id: 'school', label: '학용품', color: '#2563eb' },
  { id: 'transport', label: '교통', color: '#14b8a6' },
  { id: 'hobby', label: '취미', color: '#a855f7' },
  { id: 'gift', label: '선물', color: '#ec4899' },
  { id: 'saving', label: '저금', color: '#22c55e' },
  { id: 'other', label: '기타', color: '#64748b' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']
