<template>
  <el-descriptions :title="props.title" :border="props.border" :column="props.column">
    <el-descriptions-item
      v-for="t in columns"
      :key="t.prop"
      :label="t.name"
      :min-width="t.width || '150px'"
      :span="t.span ?? 1"
      :rowspan="t.rowspan ?? 1"
    >
      <slot :name="t.prop" :="{
        columns: props.columns,
        column: { property: t.prop, params: t },
        row: props.data
      }" v-if="t.custom" />
      <show-item :="{
          columns: props.columns,
          column: { property: t.prop, params: t },
          row: props.data
        }
        " v-else />
    </el-descriptions-item>
  </el-descriptions>
</template>

<script lang="tsx" setup>
import { FunctionalComponent, h, ref ,computed} from "vue"
import DynamicElColumn from "./DynamicElColumn.vue"
import UtcDate from "../utc-date.vue"
import { ElButton, ElDatePicker, ElInput, ElOption, ElSelect, ElTable } from "element-plus";
import { util } from "@sunny-framework-js/core"
import { TableEmits, DictType, TableColumn } from "./DynamicTableType.ts";
import { createShowCell } from "./ShowCell.ts"

export interface DescriptionProps {
  title?: string
  border?: boolean
  columns?: Array<TableColumn>
  column?: number
  data?: object
  dict?: DictType
}

const props = withDefaults(defineProps<DescriptionProps>(), {
  title() {
    return ''
  },
  border() {
    return true
  },
  columns: () => [],
  column: () => 2,
  data: () => { },
  dict() {
    return {}
  }
})

const columns = computed(() => props.columns.filter(t => (typeof t.show === 'function' ? t.show(t, props.data, props.dict) : t.show ?? true)));

const ShowItem: FunctionalComponent<any> = (scope) => {
  let label = scope.row[scope.column.property]
  if (typeof scope.column.params.label === 'function') {
    return scope.column.params.label(scope)
  }
  if (scope.column.params.dictKey && props.dict) {
    const options = props.dict[scope.column.params.dictKey]
    let value = options?.find(t => t.value === scope.row[scope.column.property])?.label
    if (value) {
      label = value
    }
  }
  if (scope.column.params.type === 'index') {
    label = scope.row[scope.column.property] = scope.$index + 1
  }
  if (scope.column.params.type === 'number') {
    label = util.number.toMilliSeparator(label, true, !util.object.isEmpty(scope.column.params.precision) ? scope.column.params.precision : 2)
  }
  if (scope.column.params.timeZone === 'browser') {
    label = util.basic.formatUtc(scope.row[scope.column.property])
  }
  if (scope.column.params.useUtcDate) {
    label = <UtcDate value={scope.row[scope.column.property]} />
  }
  return label
}

</script>
