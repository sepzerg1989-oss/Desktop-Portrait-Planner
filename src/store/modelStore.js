import { createLibraryStore } from './createLibraryStore'

export const useModelStore = createLibraryStore('model', {
  apiPrefix: 'Model',
  itemsKey: 'models',
  defaultName: '未命名模特',
  extraFields: ['avatar_path', 'model_card_path', 'social', 'region', 'price']
})