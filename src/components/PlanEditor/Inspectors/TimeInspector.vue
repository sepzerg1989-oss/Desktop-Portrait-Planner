<template>
  <div class="space-y-6">
    <!-- 日期选择 -->
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">拍摄日期 / DATE</label>
      <input 
        v-model="formData.date" 
        type="date" 
        class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30 transition-colors"
      />
    </div>

    <!-- 时间选择 -->
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">拍摄时间 / TIME</label>
      <div class="flex items-center gap-3">
        <input 
          v-model="formData.startTime" 
          type="time" 
          class="flex-1 px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30 transition-colors"
        />
        <span class="text-morandi-muted">-</span>
        <input 
          v-model="formData.endTime" 
          type="time" 
          class="flex-1 px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30 transition-colors"
        />
      </div>
    </div>

    <!-- 显示光线时刻开关 -->
    <div class="flex items-center space-x-3 pt-2">
      <div 
        @click="formData.showSunTimes = !formData.showSunTimes"
        class="w-5 h-5 border border-black/10 flex items-center justify-center cursor-pointer transition-colors"
        :class="formData.showSunTimes ? 'bg-morandi-blue border-morandi-blue' : 'bg-white'"
      >
        <svg v-if="formData.showSunTimes" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
      <label class="text-sm text-morandi-text cursor-pointer select-none" @click="formData.showSunTimes = !formData.showSunTimes">
        显示日出日落与光线时刻
      </label>
    </div>

    <!-- 常用城市标签 (快捷选择) -->
    <div v-if="formData.showSunTimes && favCities.length > 0" class="pt-2">
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">常用拍摄地 / FAVORITES</label>
      <div class="flex flex-wrap gap-2">
        <div 
          v-for="fav in favCities" 
          :key="fav.city"
          @click="selectFavorite(fav)"
          class="group flex items-center px-3 py-1 bg-morandi-canvas/50 border border-black/5 text-[10px] text-morandi-text hover:bg-morandi-blue/10 hover:border-morandi-blue/30 cursor-pointer transition-all"
        >
          <span>{{ fav.city }}</span>
          <button 
            @click.stop="removeFavorite(fav)" 
            class="ml-2 opacity-0 group-hover:opacity-100 text-morandi-muted hover:text-red-500 transition-opacity flex items-center justify-center w-3 h-3"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- 城市级联选择器 -->
    <div v-if="formData.showSunTimes" class="space-y-4 pt-2 border-t border-black/5">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">省份 / PROVINCE</label>
        <select 
          v-model="formData.province"
          @change="onProvinceChange"
          class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30 transition-colors appearance-none"
        >
          <option value="" disabled>请选择省份</option>
          <option v-for="prov in provinces" :key="prov" :value="prov">{{ prov }}</option>
        </select>
      </div>

      <div v-if="formData.province">
        <div class="flex justify-between items-center mb-2">
          <label class="block text-[10px] uppercase tracking-wider text-morandi-muted font-bold">城市 / CITY</label>
          <button 
            v-if="formData.city && !isCurrentCityFavorite" 
            @click="addFavorite"
            class="text-[10px] text-morandi-blue hover:underline uppercase tracking-widest font-bold transition-all"
          >
            + 存为常用
          </button>
        </div>
        <select 
          v-model="formData.city"
          @change="onCityChange"
          class="w-full px-4 py-3 border border-black/5 focus:border-morandi-blue outline-none text-sm bg-morandi-canvas/30 transition-colors appearance-none"
        >
          <option value="" disabled>请选择城市</option>
          <option v-for="city in availableCities" :key="city.地市" :value="city.地市">{{ city.地市 }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import LocationData from '../../../assets/Location.json'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const provinces = Object.keys(LocationData)

const availableCities = computed(() => {
  return props.formData.province ? LocationData[props.formData.province] : []
})

const onProvinceChange = () => {
  props.formData.city = ''
  props.formData.lat = null
  props.formData.lng = null
}

const onCityChange = () => {
  const cityData = availableCities.value.find(c => c.地市 === props.formData.city)
  if (cityData) {
    props.formData.lat = cityData.纬度
    props.formData.lng = cityData.经度
  } else {
    props.formData.lat = null
    props.formData.lng = null
  }
}

// ==================== 常用城市 (Favorites) 逻辑 ====================
const favCities = ref([])

onMounted(() => {
  const saved = localStorage.getItem('portrait_planner_fav_cities')
  if (saved) {
    try {
      favCities.value = JSON.parse(saved)
    } catch (e) {
      favCities.value = []
    }
  }
})

const saveFavs = () => {
  localStorage.setItem('portrait_planner_fav_cities', JSON.stringify(favCities.value))
}

const isCurrentCityFavorite = computed(() => {
  return favCities.value.some(f => f.city === props.formData.city && f.province === props.formData.province)
})

const addFavorite = () => {
  if (props.formData.city && props.formData.province && !isCurrentCityFavorite.value) {
    favCities.value.push({
      province: props.formData.province,
      city: props.formData.city,
      lat: props.formData.lat,
      lng: props.formData.lng
    })
    saveFavs()
  }
}

const removeFavorite = (fav) => {
  favCities.value = favCities.value.filter(f => !(f.city === fav.city && f.province === fav.province))
  saveFavs()
}

const selectFavorite = (fav) => {
  props.formData.province = fav.province
  props.formData.city = fav.city
  props.formData.lat = fav.lat
  props.formData.lng = fav.lng
}
</script>
