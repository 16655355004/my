<template>
  <div class="custom-date-picker" ref="datePickerRef">
    <div class="date-input-wrapper" @click="togglePicker">
      <input
        v-model="displayValue"
        type="text"
        readonly
        placeholder="选择日期"
        class="date-input"
        :class="{ active: isOpen }"
      />
      <div class="date-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <div v-if="isOpen" class="date-picker-dropdown" ref="dropdownRef">
      <div class="picker-header">
        <button @click="previousMonth" class="nav-btn">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="15,18 9,12 15,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="month-year">
          {{ currentMonthYear }}
        </div>
        <button @click="nextMonth" class="nav-btn">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="9,18 15,12 9,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>

      <div class="calendar-grid">
        <div
          v-for="date in calendarDates"
          :key="date.key"
          class="calendar-date"
          :class="{
            'other-month': !date.isCurrentMonth,
            'selected': date.isSelected,
            'today': date.isToday
          }"
          @click="selectDate(date)"
        >
          {{ date.day }}
        </div>
      </div>

      <div class="picker-footer">
        <button @click="selectToday" class="today-btn">今天</button>
        <button @click="closePicker" class="close-btn">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import gsap from 'gsap'

interface DateItem {
  date: Date
  day: number
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  key: string
}

const props = defineProps<{
  modelValue?: Date | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Date | null]
}>()

const datePickerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const isOpen = ref(false)
const currentDate = ref(new Date())

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
})

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  })
})

const calendarDates = computed((): DateItem[] => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 获取日历开始日期（包含上月末尾几天）
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  // 获取日历结束日期（包含下月开始几天）
  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))
  
  const dates: DateItem[] = []
  const current = new Date(startDate)
  const today = new Date()
  
  while (current <= endDate) {
    const isCurrentMonth = current.getMonth() === month
    const isSelected = props.modelValue ? 
      current.toDateString() === props.modelValue.toDateString() : false
    const isToday = current.toDateString() === today.toDateString()
    
    dates.push({
      date: new Date(current),
      day: current.getDate(),
      isCurrentMonth,
      isSelected,
      isToday,
      key: current.toISOString()
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return dates
})

const togglePicker = () => {
  if (isOpen.value) {
    closePicker()
  } else {
    openPicker()
  }
}

const openPicker = () => {
  isOpen.value = true
  nextTick(() => {
    if (dropdownRef.value) {
      gsap.fromTo(dropdownRef.value, 
        { 
          opacity: 0, 
          y: -20, 
          scale: 0.95 
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.3, 
          ease: "back.out(1.7)" 
        }
      )
    }
  })
}

const closePicker = () => {
  if (dropdownRef.value) {
    gsap.to(dropdownRef.value, {
      opacity: 0,
      y: -10,
      scale: 0.95,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        isOpen.value = false
      }
    })
  } else {
    isOpen.value = false
  }
}

const selectDate = (dateItem: DateItem) => {
  emit('update:modelValue', dateItem.date)
  closePicker()
}

const selectToday = () => {
  emit('update:modelValue', new Date())
  closePicker()
}

const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

// 点击外部关闭
const handleClickOutside = (event: Event) => {
  if (datePickerRef.value && !datePickerRef.value.contains(event.target as Node)) {
    closePicker()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.custom-date-picker {
  position: relative;
  width: 100%;
}

.date-input-wrapper {
  position: relative;
  cursor: pointer;
}

.date-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-input:focus,
.date-input.active {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: rgba(255, 255, 255, 0.08);
}

.date-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.date-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.date-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
  margin-top: 0.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.nav-btn svg {
  width: 16px;
  height: 16px;
}

.month-year {
  color: #ffffff;
  font-weight: 600;
  font-size: 1.1rem;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  padding: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  font-weight: 500;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.calendar-date {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ffffff;
  font-size: 0.9rem;
}

.calendar-date:hover {
  background: rgba(255, 255, 255, 0.1);
}

.calendar-date.other-month {
  color: rgba(255, 255, 255, 0.3);
}

.calendar-date.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.calendar-date.today {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
  font-weight: 600;
}

.calendar-date.selected.today {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.picker-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  gap: 0.5rem;
}

.today-btn,
.close-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.today-btn {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.today-btn:hover {
  background: rgba(0, 255, 136, 0.3);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}
</style>
