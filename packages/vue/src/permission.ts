import {util} from '@sunny-framework-js/core'


export const buildRouter = (
    obj = {} as { router: any, checkVersion?: () => void, views: any, useUserStore: any },
    login = { mode: 'modal'} as { mode: 'route' | 'modal' }
) => {

    const LOGIN_PATH = '/login';

    obj.router.beforeEach(async (to, from, next) => {
        if (obj.checkVersion) obj.checkVersion();

        const userStore = obj.useUserStore();

        if (login.mode === 'route' && to.path === LOGIN_PATH) return next();
        if (userStore.loaded) return next();

        try {

            await userStore.getProfile();

            userStore.loaded = true

            const menus = util.tree.flatten({children: userStore.profile.menus || []}).filter((t:any) => typeof t.component === 'function' || util.object.isNotEmpty(t.component));

            menus.forEach(t => {
                let extraMeta = {};
                try {
                    const extra = typeof t.extra === 'string' ? JSON.parse(t.extra || '{}') : t.extra;
                    extraMeta = extra?.meta || {};
                } catch (e) {
                    console.error(`resolve menu extra ${t.code} error`, e);
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
            return next({...to, replace: true});
        } catch (e) {
            if (login.mode === 'route') return next({path: LOGIN_PATH, query: {redirect: to.fullPath}});
            return next()
        }
    });

    obj.router.beforeResolve(async (to) => {
        if (to.matched.length === 0) {
            return {
                path: '/404',
                replace: true
            }
        }
        return true
    })
}