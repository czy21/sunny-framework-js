import {util} from '@sunny-framework-js/core'


export const buildRouter = (obj = {} as { router: any, checkVersion?: () => void, views: any, useUserStore: any}) => {

    const LOGIN_PATH = '/login';

    obj.router.beforeEach(async (to, from, next) => {

        if (obj.checkVersion) obj.checkVersion()

        const userStore = obj.useUserStore();
        const isLoggedIn = localStorage.getItem("isLoggedIn") === '1';

        // 2. 登录态校验逻辑优化
        if (!isLoggedIn) {
            if (to.path === LOGIN_PATH) return next();
            return next({
                path: LOGIN_PATH,
                query: {redirect: to.fullPath}
            });
        }

        // 3. 已登录但在登录页，直接跳转首页
        if (to.path === LOGIN_PATH) {
            return next({path: '/'});
        }

        // 4. 动态路由加载优化
        if (!userStore.profile.loaded) {
            try {
                await userStore.getProfile();
                const menus = util.tree.flatten({children: userStore.profile.menus || []});
                menus.filter(t => typeof t.component === 'function' || util.object.isNotEmpty(t.component)).forEach(t => {
                    const extra = t.extra instanceof String ? JSON.parse(t.extra || '{}') : t.extra;
                    obj.router.addRoute('Home', {
                        name: t.code,
                        path: t.path.startsWith('/') ? t.path.slice(1) : t.path,
                        meta: {title: t.name, ...extra?.meta},
                        component: typeof t.component === 'function' ? t.component : obj.views[`/src/view/${t.component}`],
                    })
                });

                obj.router.addRoute({
                    path: '/:pathMatch(.*)*',
                    redirect: '/404'
                });
                
                return next({...to, replace: true});
            } catch (error) {
                console.error("加载用户信息或动态路由失败:", error);
                localStorage.removeItem("isLoggedIn");
                return next(LOGIN_PATH);
            }
        }
        next();
    });
}