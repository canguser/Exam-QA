<template>
    <div id="app">
        <transition :name="direction">
            <router-view class="appView"/>
        </transition>
    </div>
</template>

<script>
    export default {
        name: 'App',
        data: () => ({
            direction: "slide-right"
        }),
        watch: {
            $route(to, from) {
                const toDepth = to.path.split("/").length;
                const fromDepth = from.path.split("/").length;
                if (to.path === "/") {
                    this.direction = "slide-right";
                } else if (from.path === "/") {
                    this.direction = "slide-left";
                } else {
                    this.direction = toDepth < fromDepth ? "slide-right" : "slide-left";
                }
            }
        }
    }
</script>

<style>
    #app {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: var(--text-primary);
        padding-top: 46px;
        background: var(--bg-primary);
        min-height: 100vh;
    }

    * {
        box-sizing: border-box;
    }

    .appView {
        position: absolute;
        width: 100%;
        transition: all var(--transition-normal);
        left: 0;
        background: var(--bg-primary);
        min-height: calc(100vh - 60px);
    }

    .slide-left-enter {
        left: 100%;
        opacity: 0.8;
        transform: scale(0.95);
    }

    .slide-left-leave-active {
        left: -50%;
        opacity: 0.5;
        transform: scale(1.05);
    }

    .slide-right-enter {
        left: -50%;
        z-index: 20;
        opacity: 0.8;
        transform: scale(0.95);
    }

    .slide-right-leave-active {
        left: 100%;
        z-index: 20;
        opacity: 0.5;
        transform: scale(1.05);
    }

    p {
        margin: 0;
        color: var(--text-secondary);
    }

    /* 美化导航栏 */
    .van-nav-bar {
        background: var(--primary-gradient) !important;
        box-shadow: var(--shadow-md);
    }

    .van-nav-bar__title {
        color: var(--text-white) !important;
        font-weight: 600;
    }

    .van-nav-bar__arrow,
    .van-nav-bar__text {
        color: var(--text-white) !important;
    }

    /* 美化标签栏 */
    .van-tabbar {
        background: var(--bg-card) !important;
        box-shadow: 0 -2px 12px rgba(0, 196, 167, 0.1);
        border-top: 1px solid var(--border-light);
    }

    .van-tabbar-item--active {
        color: var(--primary-color) !important;
    }

    .van-tabbar-item--active .van-icon {
        color: var(--primary-color) !important;
    }
</style>
