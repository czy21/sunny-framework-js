import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import {ElMessage} from "element-plus";
import {userRouter} from 'vue-router'

export enum Method {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

export interface RequestOption {
    config?: AxiosRequestConfig;
    errorCallBack?: (error: any) => void;
}

export interface HttpClientOption {
    baseURL?: string
    router?: any
    handleResponse?: (response: AxiosResponse<any>) => void
}

export class HttpClient {

    private service: AxiosInstance
    private readonly router: any
    private readonly handleResponse: (response: AxiosResponse<any>) => void

    constructor({
                    baseURL = import.meta.env.VITE_BASE_API,
                    router = undefined,
                    handleResponse = () => {
                    }
                }: HttpClientOption = {}) {
        this.service = axios.create({
            baseURL,
            withCredentials: true,
        });
        this.router = router
        this.handleResponse = handleResponse
        this.setupInterceptors();
    }

    private setupInterceptors() {
        const router = this.router
        this.service.interceptors.request.use(
            (config: any) => config,
            (error: any) => Promise.reject(error)
        );

        this.service.interceptors.response.use(
            (response: AxiosResponse<any>) => {
                const {code, message} = response.data;
                if (code === -1) {
                    ElMessage({
                        type: "error",
                        message,
                        duration: 3000,
                    });
                }
                this.handleResponse?.(response)
                return response;
            },

            (error: any) => {
                const status = error.response?.status;

                switch (status) {
                    case 401:
                        const redirect = router.currentRoute.value.fullPath;
                        window.location.href = router.resolve({path: '/login', query: {redirect}}).href;
                        break;
                    case 500:
                    case 502:
                        ElMessage({
                            type: "error",
                            message: "服务器异常",
                            duration: 3000,
                        });
                        break;

                    case 504:
                        ElMessage({
                            type: "error",
                            message: "网络超时",
                            duration: 3000,
                        });
                        break;
                }
                return Promise.reject(error);
            }
        );
    }

    /** 通用请求 */
    private request<T>(
        method: Method,
        url: string,
        params?: any,
        option?: RequestOption
    ): Promise<T> {
        const {config, errorCallBack} = option || {};

        return new Promise((resolve, reject) => {
            this.service({
                method,
                url,
                data: method === Method.POST || method === Method.PUT ? params : null,
                params: method === Method.GET || method === Method.DELETE ? params : null,
                ...config,
            })
                .then((res: any) => resolve(res as unknown as T))
                .catch((error: any) => {
                    errorCallBack && errorCallBack(error);
                    reject(error);
                });
        });
    }

    get<T>(url: string, params?: any, option?: RequestOption) {
        return this.request<T>(Method.GET, url, params, option);
    }

    post<T>(url: string, params?: any, option?: RequestOption) {
        return this.request<T>(Method.POST, url, params, option);
    }

    put<T>(url: string, params?: any, option?: RequestOption) {
        return this.request<T>(Method.PUT, url, params, option);
    }

    delete<T>(url: string, params?: any, option?: RequestOption) {
        return this.request<T>(Method.DELETE, url, params, option);
    }

    checkVersion() {
        const versionKey = "version";
        const versionObj = JSON.parse((localStorage.getItem(versionKey) || '{}') as string);

        this.get<any>("version.json", {date: Date.now()}, {config: {baseURL: "/"}})
            .then((res) => {
                if (res.data?.buildDate !== versionObj.buildDate) {
                    localStorage.setItem(versionKey, JSON.stringify(res.data));
                    window.location.reload();
                }
            })
            .catch(() => {
            });
    }
}