<template>
  <div class="space-y-6 select-none">
    <!-- 日期选择 -->
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">拍摄日期 / DATE</label>
      <input 
        v-model="formData.date" 
        type="date" 
        class="w-full px-1 py-3 border-b border-morandi-border bg-transparent focus:border-morandi-text outline-none text-sm text-morandi-text transition-colors rounded-none"
      />
    </div>

    <!-- 时间选择 -->
    <div>
      <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">拍摄时间 / TIME</label>
      <div class="flex items-center justify-center border-b border-white/10 w-full py-2 text-morandi-text">
        <input 
          v-model="formData.startTime" 
          type="time" 
          class="w-[80px] text-center bg-transparent border-none outline-none focus:ring-0 text-sm text-morandi-text font-mono transition-colors time-picker-clean"
        />
        <span class="text-morandi-muted/60 mx-4 select-none">—</span>
        <input 
          v-model="formData.endTime" 
          type="time" 
          class="w-[80px] text-center bg-transparent border-none outline-none focus:ring-0 text-sm text-morandi-text font-mono transition-colors time-picker-clean"
        />
      </div>
    </div>

    <!-- 显示光线时刻开关 -->
    <div class="flex items-center space-x-3 pt-2 select-none">
      <div 
        @click="formData.showSunTimes = !formData.showSunTimes"
        class="w-4 h-4 border flex items-center justify-center cursor-pointer transition-all rounded-[2px]"
        :class="formData.showSunTimes ? 'bg-morandi-text border-morandi-text' : 'bg-transparent border-white/20'"
      >
        <svg v-if="formData.showSunTimes" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-morandi-canvas" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
      <label 
        class="text-xs tracking-wider cursor-pointer select-none transition-colors duration-300" 
        :class="formData.showSunTimes ? 'text-morandi-text font-medium' : 'text-morandi-muted'"
        @click="formData.showSunTimes = !formData.showSunTimes"
      >
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
          class="group flex items-center px-3 py-1 bg-morandi-canvas/40 border border-morandi-border text-[9px] tracking-wider uppercase text-morandi-text hover:bg-morandi-canvas cursor-pointer transition-all rounded-none"
        >
          <span>{{ fav.city }}</span>
          <button 
            @click.stop="removeFavorite(fav)" 
            class="ml-2 opacity-0 group-hover:opacity-100 text-morandi-muted hover:text-morandi-red transition-opacity flex items-center justify-center w-3 h-3"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- 城市级联选择器 -->
    <div v-if="formData.showSunTimes" class="space-y-4 pt-2 border-t border-morandi-border/30">
      <div>
        <label class="block text-[10px] uppercase tracking-wider text-morandi-muted mb-2 font-bold">省份 / PROVINCE</label>
        <CustomSelect 
          v-model="formData.province"
          @change="onProvinceChange"
          :options="provinces"
          placeholder="请选择省份"
        />
      </div>

      <div v-if="formData.province">
        <div class="flex justify-between items-center mb-2">
          <label class="block text-[10px] uppercase tracking-wider text-morandi-muted font-bold">城市 / CITY</label>
          <button 
            v-if="formData.city && !isCurrentCityFavorite" 
            @click="addFavorite"
            class="text-[10px] text-morandi-muted hover:text-white uppercase tracking-widest font-bold transition-colors outline-none"
          >
            + 存为常用
          </button>
        </div>
        <CustomSelect 
          v-model="formData.city"
          @change="onCityChange"
          :options="cityOptions"
          placeholder="请选择城市"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import LocationData from '../../../assets/Location.json'
import CustomSelect from '../../common/CustomSelect.vue'

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

const cityOptions = computed(() => {
  return availableCities.value.map(c => ({
    value: c.地市,
    label: c.地市
  }))
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

<style scoped>
/* 隐藏原生 time 输入框的时钟图标 */
.time-picker-clean::-webkit-calendar-picker-indicator {
  display: none;
  -webkit-appearance: none;
}
</style>
