import { createLibraryStore } from './createLibraryStore'

export const usePropsStore = createLibraryStore('props', {
  apiPrefix: 'Prop',
  itemsKey: 'propsList',
  defaultName: '未命名道具',
  extraFields: ['description', 'link', 'price']
})