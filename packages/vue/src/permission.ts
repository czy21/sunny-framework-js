import {util} from '@sunny-framework-js/core'


export const buildRouter = (obj = {} as { router: any, checkVersion?: () => void, views: any, useUserStore: any }) => {

    const LOGIN_PATH = '/login';

    obj.router.beforeEach(async (to, from, next) => {
        if (obj.checkVersion) obj.checkVersion();

        const userStore = obj.useUserStore();
        if (to.path === LOGIN_PATH || userStore.profile.loaded) return next();

        try {
            await userStore.getProfile();

            const menus = util.tree.flatten({children: userStore.profile.menus || []}).filter((t:any) => typeof t.component === 'function' || util.object.isNotEmpty(t.component));

            menus.forEach(t => {
                let extraMeta = {};
                try {
                    const extra = typeof t.extra === 'string' ? JSON.parse(t.extra || '{}') : t.extra;
                    extraMeta = extra?.meta || {};
                } catch (e) {
                    console.error(`解析菜单 ${t.code} 的 extra 失败`, e);
                }

                const component = typeof t.component === 'function' ? t.component : obj.views[`/src/view/${t.component}`];

                if (component) {
                    obj.router.addRoute('Home', {
                        name: t.code,
                        path: t.path.replace(/^\//, ''),
                        meta: {title: t.name, ...extraMeta},
                        component
                    });
                }
            });
            obj.router.addRoute({path: '/:pathMatch(.*)*', redirect: '/404'});
            return next({...to, replace: true});
        } catch (e) {
            return next({path: LOGIN_PATH, query: {redirect: to.fullPath}});
        }
    });
}