<template>
  <el-form ref="formRef" label-width="auto" :model="formData" :label-position="option.labelPosition">
    <el-row :gutter="10">
      <el-col v-for="item in formItems" :span="item.span ?? option.span">
        <el-form-item :label="item.name" :prop="item.prop" :rules="item.rules || []" v-if="item.type === 'inputs'">
          <el-input v-for="(v, i) in formData[item.prop]" :key="i" v-model="formData[item.prop][i]" :disabled="getDisabled(item)" style="margin-bottom: 5px;">
            <template #append>
              <el-button @click="delInput(item.prop, i)" :disabled="formData[item.prop].length <= 1" type="danger">
                <el-icon>
                  <Delete/>
                </el-icon>
              </el-button>
            </template>
          </el-input>
          <el-button @click="addInput(item.prop)" type="">
            <el-icon>
              <Plus/>
            </el-icon>
          </el-button>
        </el-form-item>
        <el-form-item :label="item.name" :prop="item.prop" :rules="item.rules || []" v-else>
          <el-input v-if="item.type === 'input'" v-model="formData[item.prop]" :placeholder="item.placeholder??''" clearable :disabled="getDisabled(item)"/>
          <el-input-tag v-if="item.type === 'input-tag'" v-model="formData[item.prop]" :placeholder="item.placeholder??''" clearable :disabled="getDisabled(item)"
                        @keydown="(e:any)=> item.keydownPrevent && e.preventDefault()"
                        collapse-tags collapse-tags-tooltip
                        :max-collapse-tags="item.props?.maxCollapseTags ?? 1"
                        :tag-type="item.props?.tagType ?? 'primary'"
                        @remove-tag="(value:any,index:number)=>handleInputRemoveTag(item,value,index)"
                        @clear="handleInputRemoveTag(item)"
          >
            <template #tag="scope">
              <span>{{ getInputTagLabel(item, scope.value) }}</span>
            </template>
          </el-input-tag>
          <el-input v-else-if="item.type === 'password'" v-model="formData[item.prop]" clearable :disabled="getDisabled(item)"
                    :placeholder="item.placeholder??''"
                    type="password"
          />
          <el-input-number v-else-if="item.type === 'number'" v-model="formData[item.prop]" :disabled="getDisabled(item)"
                           :placeholder="item.placeholder??''"
                           :min="item.min" :max="item.max" controls-position="right" style="width:100%"
          />
          <el-date-picker v-else-if="item.type === 'date'" v-model="formData[item.prop]" clearable :disabled="getDisabled(item)"
                          :value-format="item.valueFormat??item.format" :format="item.format"
                          type="date"
                          :shortcuts="item.shortcuts??[]" @calendar-change="(val)=>dateCalendarChange(item,val)"
          />
          <el-date-picker v-else-if="item.type === 'datetimerange'" v-model="formData[item.prop]" clearable :disabled="getDisabled(item)"
                          :value-format="item.valueFormat??item.format" :format="item.format"
                          type="datetimerange"
                          start-placeholder="开始时间" end-placeholder="结束时间"
          />
          <el-select v-else-if="item.type === 'select'" v-model="formData[item.prop]" clearable :disabled="getDisabled(item)" @change="(value) => handleChange(value, item)"
                     :placeholder="item.placeholder??''">
            <el-option v-for="opt in getOptions(item)" :label="opt.label" :value="opt.value"></el-option>
          </el-select>
          <el-tree-select v-else-if="item.type === 'tree-select'" v-model="formData[item.prop]" :disabled="getDisabled(item)"
                          :data="getOptions(item)" :props="item.props" :placeholder="item.placeholder??''"
                          :check-strictly="item.checkStrictly?? true"
                          :default-expand-all="item.defaultExpandAll??true"
                          :expand-on-click-node="item.expandOnClickNode??true"
          />
          <el-radio-group v-else-if="item.type === 'radio'" v-model="formData[item.prop]" :disabled="getDisabled(item)">
            <el-radio v-for="opt in getOptions(item)" :value="opt.value">{{ opt.label ?? opt.value }}</el-radio>
          </el-radio-group>
          <el-tag v-else-if="item.type === 'tag'" v-for="t in formData[item.prop]" :key="t[item.props['value']]" closable @close="(e:any)=>handleTagClose(e,item,t)" :disabled="getDisabled(item)">
            {{ getTagLabel(item, t) }}
          </el-tag>
          <Cron v-else-if="item.type === 'cron'" v-model="formData[item.prop]" editable :disabled="getDisabled(item)"/>
          <slot :name="item.prop" :=item v-else/>
        </el-form-item>
      </el-col>
      <el-form-item v-if="option.actionType === 'col' && option.submitShow">
        <el-button type="primary" @click="handleSubmit">{{ option.submitText }}</el-button>
        <el-button @click="handleCancel">{{ option.cancelText }}</el-button>
      </el-form-item>
    </el-row>
    <slot name="footer"/>
    <el-form-item v-if="option.actionType === 'row' && option.submitShow">
      <el-button type="primary" @click="handleSubmit">{{ option.submitText }}</el-button>
      <el-button @click="handleCancel">{{ option.cancelText }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import {DynamicFormItem, DynamicFormOption} from './DynamicFormType.ts';
import {computed, ref, watch, nextTick} from 'vue';
import type {FormInstance} from 'element-plus'
import Cron from '../cron/index.vue'
import dayjs from 'dayjs'

const props = withDefaults(
    defineProps<{
      option: DynamicFormOption;
      dict?: Record<string, any[]>
      formData: Record<string, any>;
    }>(),
    {option: {}, dict: {}, formData: {}}
)

const option = computed(() => ({
  submitShow: true,
  submitText: "保存",
  cancelText: "取消",
  actionType: 'row',
  labelPosition: 'right',
  span: 12,
  items: [],
  ...props.option,
}));

const formData: Record<string, any> = computed(() => props.formData);

const formItems = computed(() => props.option.items.filter(t => (typeof t.show === 'function' ? t.show(t, formData.value) : t.show ?? true)));

function addInput(prop: string) {
  if (!Array.isArray(formData.value[prop])) formData.value[prop] = [];
  formData.value[prop].push('');
}

function delInput(prop: string, index: number) {
  if (formData.value[prop].length > 1) {
    formData.value[prop].splice(index, 1);
  }
}

function getDisabled(item: DynamicFormItem) {
  return typeof item.disabled === 'function' ? item.disabled(props.formData) : item.disabled
}

function getOptions(item: DynamicFormItem) {
  return props.dict[item.dictKey] ?? item.options
}

const emit = defineEmits<{
  'submit': []
  'cancel': [],
  'change':[]
}>()

const formRef = ref<FormInstance>()

const handleSubmit = () => {
  emit('submit')
}

const handleCancel = () => {
  emit('cancel');
}

const handleChange = (value: any, item: any) => {
  emit('change', value, item)
}

const dateCalendarChange = (item: DynamicFormItem, val) => {

  const format = item.valueFormat ?? item.format

  if (!val || val.length !== 2) return
  if (!val[1]) return

  const end = new Date(val[1])
  end.setHours(23, 59, 59)

  nextTick(() => formData.value[item.prop] = [dayjs(val[0]).format(format), dayjs(end).format(format)])

}

const getInputTagLabel = (item: DynamicFormItem, val: any) => {
  const label = item.props['label']
  return typeof label === 'function' ? label(val) : val[label]
}

const handleInputRemoveTag = (item: DynamicFormItem, val?:any) => {
  formData.value[item.prop] = formData.value[item.prop] ?? []
  formData.value[item.prop] = formData.value[item.prop].filter(t => item.props.key(t) !== item.props.key(val))
}

const getTagLabel = (item, val) => {
  const label = item.props['label']
  return typeof label === 'function' ? label(val) : val[label]
}

const handleTagClose = (e, item, val) => {
  formData.value[item.prop] = formData.value[item.prop].filter(t => t[item.props['value']] !== val[item.props['value']])
}

props.option.items
    .filter(t => t.type === 'input-tag')
    .forEach(t => {
      watch(
          () => formData.value[t.prop],
          (arrNew, arrOld) => {
            if (!Array.isArray(arrNew)) return;

            const map = new Map();
            arrNew.forEach(v => map.set(t.props.key(v), v));
            const uniqueArr = Array.from(map.values());

            const changed = !arrOld || arrOld.length !== uniqueArr.length || arrOld.some((v, i) => t.props.key(v) !== t.props.key(uniqueArr[i]));

            if (changed) {
              formData.value[t.prop] = uniqueArr;
            }
          },
          {deep: true}
      );
    });

defineExpose({
  formRef
})

</script>