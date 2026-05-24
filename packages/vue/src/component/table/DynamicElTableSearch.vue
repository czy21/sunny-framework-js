<template>
  <el-form ref="formRef" :model="formData" @submit.prevent="handleSubmit">
    <el-row :gutter="10">
      <el-col v-for="item in option.items" :span="item.span ?? option.span">
        <el-form-item :label="item.name" :prop="item.prop">
          <el-input v-if="item.type === 'input'" v-model="formData[item.prop]"
                    :disabled="item.disabled" :placeholder="item.placeholder" clearable @[item.remote?'input':null]="handleInput"/>
          <el-select v-else-if="item.type === 'select'"
                     v-model="formData[item.prop]" :disabled="item.disabled" :placeholder="item.placeholder??''" clearable>
            <el-option v-for="opt in item.options" :label="opt.label" :value="opt.value"></el-option>
          </el-select>
          <el-date-picker v-else-if="item.type === 'date'"
                          type="date" v-model="formData[item.prop]" :value-format="item.valueFormat??item.format" :format="item.format" clearable
                          :shortcuts="item.shortcuts" @calendar-calendar-change="(val)=>dateCalendarChange(item,val)"
          />
          <el-date-picker v-else-if="item.type === 'datetimerange'"
                          type="datetimerange" v-model="formData[item.prop]" :value-format="item.valueFormat??item.format" :format="item.format" clearable
                          :shortcuts="item.shortcuts" @calendar-change="(val)=>dateCalendarChange(item,val)"
                          start-placeholder="开始时间" end-placeholder="结束时间"
          />
          <slot :name="item.prop" :=item v-else/>
        </el-form-item>
      </el-col>
      <el-form-item v-if="option.actionType === 'col' && (option.submitShow || option.cancelShow)">
        <el-button v-if="option.submitShow" type="primary" :icon="Search" @click="handleSubmit">{{ option.submitText }}</el-button>
        <el-button v-if="option.cancelShow" :icon="Refresh" @click="handleCancel">{{ option.cancelText }}</el-button>
      </el-form-item>
    </el-row>
    <el-form-item v-if="option.actionType === 'row' && (option.submitShow || option.cancelShow)">
      <el-button v-if="option.submitShow" type="primary" :icon="Search" @click="handleSubmit">{{ option.submitText }}</el-button>
      <el-button v-if="option.cancelShow" :icon="Refresh" @click="handleCancel">{{ option.cancelText }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import type {FormInstance} from 'element-plus'
import {Refresh, Search} from '@element-plus/icons-vue';
import {computed, ref, nextTick} from 'vue';
import dayjs from 'dayjs'
import {DynamicFormOption} from '../form/DynamicFormType.ts';
import _ from 'lodash'

const props = defineProps<{
  option: DynamicFormOption;
  formData: Record<string, any>;
}>();

const option = computed(() => ({
  submitShow: true,
  submitText: "搜索",
  cancelShow: true,
  cancelText: "重置",
  actionType: 'col',
  debounceWait: 300,
  debounceMaxWait: 1000,
  span: 4,
  items: [],
  ...props.option
}))

const formData: Record<string, any> = computed(() => props.formData);

const emit = defineEmits<{
  'search': []
  'reset': []
}>()

const formRef = ref<FormInstance>()

const dateCalendarChange = (item, val) => {

  const format = item.valueFormat ?? item.format

  if (!val || val.length !== 2) return
  if (!val[1]) return

  const end = new Date(val[1])
  end.setHours(23, 59, 59)

  nextTick(() => formData.value[item.prop] = [dayjs(val[0]).format(format), dayjs(end).format(format)])

}

const handleSubmit = () => {
  emit('search')
}

const handleCancel = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
  handleSubmit()
}

const handleInput = _.debounce(handleSubmit, option.value.debounceWait, {'maxWait': option.value.debounceMaxWait})

defineExpose({
  formRef
})

</script>