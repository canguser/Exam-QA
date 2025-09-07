import Vue from 'vue'
import Router from 'vue-router'
import HomePage from "@/components/HomePage";
import DoExamPage from "@/components/exam/DoExamPage";
import CategoryPage from "@/components/CategoryPage";

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'HomePage',
            component: HomePage
        },
        {
            path: '/category/:category',
            name: 'CategoryPage',
            component: CategoryPage,
            props: true
        },
        {
            path: '/exam',
            name: 'DoExamPage',
            component: DoExamPage,
            props: true
        }
    ]
})
