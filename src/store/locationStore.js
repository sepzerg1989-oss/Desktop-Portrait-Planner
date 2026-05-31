import { createLibraryStore } from './createLibraryStore'

export const useLocationStore = createLibraryStore('location', {
  apiPrefix: 'Location',
  itemsKey: 'locations',
  defaultName: '未命名场地',
  extraFields: ['address', 'price', 'cover_path']
})