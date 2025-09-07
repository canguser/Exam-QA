<template>
    <div class="home-page">
        <van-nav-bar
                :title="activePage.label"
                fixed
        ></van-nav-bar>
        <div class="is-relation page-container">
            <transition name="fade" mode="out-in">
                <component :is="activePage.api" :key="activeTabIndex"></component>
            </transition>
            <p class="version-text text-align-center is-absolute">{{version}}</p>
        </div>
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
                    {title: '主页', label: 'Home', api: HomeIndex, icon: 'home-o'},
                    // {title: '搜索', label: '搜索', api: HelloWorld, icon: 'search'},
                    // {title: '朋友', label: '朋友', api: HomeIndex, icon: 'friends-o'},
                    // {title: '设置', label: '设置', api: HomeIndex, icon: 'setting-o'},
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
.home-page {
    background: var(--bg-primary);
}

.page-container {
    padding: 20px;
    padding-bottom: 80px;
    min-height: calc(100vh - 140px);
}

.version-text {
    bottom: 80px;
    color: var(--text-light);
    font-size: 12px;
    opacity: 0.6;
    pointer-events: none;
    width: calc(100% - 40px);
}

.custom-tabbar {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

/* 页面切换动画 */
.fade-enter-active, .fade-leave-active {
    transition: all var(--transition-normal);
}

.fade-enter, .fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}
</style>