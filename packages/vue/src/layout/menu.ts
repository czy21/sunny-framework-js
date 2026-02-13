export interface MenuModel {
    code: string
    name: string
    path: string
    component: string | Function
    type?: string
    sort?: number
    icon?: string
    extra?: object
    children?: MenuModel[]
}