<template>
    <div>
        <van-nav-bar
                :title="activePage.label"
                fixed
        ></van-nav-bar>
        <div>
            <component :is="activePage.api"></component>
        </div>
        <van-tabbar v-model="activeTabIndex">
            <van-tabbar-item icon="home-o">标签</van-tabbar-item>
            <van-tabbar-item icon="search">标签</van-tabbar-item>
            <van-tabbar-item icon="friends-o">标签</van-tabbar-item>
            <van-tabbar-item icon="setting-o">标签</van-tabbar-item>
        </van-tabbar>
    </div>
</template>

<script>
    import Vue from 'vue';
    import {NavBar} from 'vant';
    import {Tabbar, TabbarItem} from 'vant';
    import HomeIndex from "@/components/home-pages/HomeIndex";
    import HelloWorld from "@/components/HelloWorld";

    Vue.use(NavBar).use(Tabbar).use(TabbarItem);

    export default {
        name: "HomePage",
        data() {
            return {
                activeTabIndex: 0,
                pages: [
                    {title: '主页', label: '主页', api: HomeIndex, icon: 'home-o'},
                    {title: '搜索', label: '搜索', api: HelloWorld, icon: 'search'},
                    {title: '朋友', label: '朋友', api: HomeIndex, icon: 'friends-o'},
                    {title: '设置', label: '设置', api: HomeIndex, icon: 'setting-o'},
                ],
            }
        },
        computed: {
            activePage() {
                return this.pages[this.activeTabIndex] || {};
            }
        }
    }
</script>

<style scoped>

</style>