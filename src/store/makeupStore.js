import { createLibraryStore } from './createLibraryStore'

export const useMakeupStore = createLibraryStore('makeup', {
  apiPrefix: 'Makeup',
  itemsKey: 'makeups',
  defaultName: '未命名妆容',
  extraFields: ['description']
})