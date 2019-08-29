import Vue from 'vue'
import Router from 'vue-router'
import HomePage from "@/components/HomePage";
import DoExamPage from "@/components/exam/DoExamPage";

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'HomePage',
            component: HomePage
        },
        {
            path: '/exam',
            name: 'DoExamPage',
            component: DoExamPage,
            props: true
        }
    ]
})
