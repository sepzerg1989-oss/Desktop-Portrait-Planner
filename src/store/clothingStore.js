import { createLibraryStore } from './createLibraryStore'

export const useClothingStore = createLibraryStore('clothing', {
  apiPrefix: 'Clothing',
  itemsKey: 'clothings',
  defaultName: '未命名服装搭配',
  extraFields: ['description', 'link', 'price']
})