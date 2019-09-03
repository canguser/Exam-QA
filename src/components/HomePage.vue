<template>
    <div>
        <van-nav-bar
                :title="activePage.label"
                fixed
        ></van-nav-bar>
        <div class="is-relation">
            <component :is="activePage.api"></component>
            <p class="text-align-center is-absolute" style="color: #efefef;width: 100%">{{version}}</p>
        </div>
        <van-tabbar v-model="activeTabIndex">
            <van-tabbar-item v-for="(page, i) in pages" :key="i" :icon="page.icon">{{page.label}}</van-tabbar-item>
        </van-tabbar>
    </div>
</template>

<script>
    import Vue from 'vue';
    import {NavBar} from 'vant';
    import {Tabbar, TabbarItem} from 'vant';
    import HomeIndex from "@/components/home-pages/HomeIndex";
    import HelloWorld from "@/components/HelloWorld";
    import config from "@/config";

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
            },
            version() {
                return config.version;
            }
        }
    }
</script>

<style scoped>

</style>