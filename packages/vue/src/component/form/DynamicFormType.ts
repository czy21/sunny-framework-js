import type {FormItemRule} from 'element-plus'

export interface DynamicFormOption {
    labelPosition?: "top" | "bottom" | "left" | "right";
    submitShow?: boolean
    submitText?: string
    cancelShow?: boolean
    cancelText?: string
    actionType?: string
    debounceWait?: number
    debounceMaxWait?: number
    span?: string
    items: DynamicFormItem[]
}

export interface DynamicFormItem {
    prop: string
    name: string
    type: string
    placeholder?: string
    checkStrictly?: boolean
    defaultExpandAll?: boolean
    expandOnClickNode?: boolean
    disabled?: boolean | ((record?: any) => boolean)
    dictKey?: string
    options?: DynamicFormItemOption[]
    props?: DynamicFormItemProps
    format?: string
    valueFormat?: string
    shortcuts?: any[]
    rules?: FormItemRule[]
    keydownPrevent?: boolean
    remote?: boolean
    remoteMethod?: ((value: any, item: DynamicFormItem, formData: any, dict: any) => void)
}

export interface DynamicFormItemOption {
    label: string | ((record?: any) => string)
    value: any
}

export interface DynamicFormItemProps {
    key: ((record?: any) => string)
    label: string
    value: any
}