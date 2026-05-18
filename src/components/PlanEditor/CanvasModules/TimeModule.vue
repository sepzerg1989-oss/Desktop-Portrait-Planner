<template>
  <div class="mb-0">
    <h3 class="text-[10px] uppercase tracking-[0.3em] text-morandi-muted mb-8 font-bold text-center">拍摄时间 / SCHEDULE</h3>
    
    <div v-if="module.data.date || module.data.startTime" class="text-center mb-8">
      <h2 class="text-6xl font-sans font-medium text-morandi-text tracking-tight mb-4">
        {{ formatDate(module.data.date) }}
      </h2>
      <p class="text-xl text-morandi-text/80 font-sans tracking-[0.1em] flex items-center justify-center gap-4">
        <span class="w-12 h-px bg-black/10"></span>
        {{ (module.data.startTime || 'TBD') + (module.data.endTime ? ' - ' + module.data.endTime : '') }}
        <span class="w-12 h-px bg-black/10"></span>
      </p>
    </div>
    <div v-else class="text-center text-morandi-muted italic text-sm mb-10">
      日期未定
    </div>
    
    <!-- 光线时刻表 -->
    <div v-if="module.data.showSunTimes && module.data.lat" class="mt-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-black/5 border border-black/5">
        <div v-for="(group, idx) in sunTimes" :key="idx" 
             class="bg-white p-8 text-center hover:bg-morandi-canvas/30 transition-colors">
          <h4 class="text-xs text-morandi-muted font-bold mb-5 tracking-widest">{{ group.label }}</h4>
          <div class="space-y-2">
            <div v-for="(timeStr, tIdx) in group.times" :key="tIdx" class="text-xl font-sans text-morandi-text [font-variant-numeric:tabular-nums] tracking-tight">
              {{ timeStr }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="module.data.showSunTimes" class="text-center text-sm text-morandi-muted/50 mt-8 italic">
      请在右侧选择拍摄城市以计算光线时刻
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SunCalc from 'suncalc'

const props = defineProps({
  module: {
    type: Object,
    required: true
  }
})

// 注册摄影专业高度角 (根据 PhotoPills 算法标准)
SunCalc.addTime(-4, 'blueHourEnd', 'blueHourStart')

const formatDate = (dateStr) => {
  if (!dateStr) return '0000.00.00'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const formatTime = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return '--:--'
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`
}

const sunTimes = computed(() => {
  const data = props.module.data
  if (!data.date || !data.lat || !data.lng) return []
  
  const d = new Date(`${data.date}T12:00:00`)
  if (isNaN(d.getTime())) return []
  
  const times = SunCalc.getTimes(d, data.lat, data.lng)
  
  return [
    { 
      label: '黄金时刻', 
      times: [
        `${formatTime(times.blueHourEnd)} - ${formatTime(times.goldenHourEnd)}`,
        `${formatTime(times.goldenHour)} - ${formatTime(times.blueHourStart)}`
      ]
    },
    { 
      label: '蓝调时刻', 
      times: [
        `${formatTime(times.dawn)} - ${formatTime(times.blueHourEnd)}`,
        `${formatTime(times.blueHourStart)} - ${formatTime(times.dusk)}`
      ]
    },
    { 
      label: '日出 / 日落', 
      times: [
        formatTime(times.sunrise),
        formatTime(times.sunset)
      ]
    }
  ]
})
</script>
