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
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #2c3e50;
        margin-top: 60px;
    }

    * {
        box-sizing: border-box;
    }

    .appView {
        position: absolute;
        width: 100%;
        transition: left .3s ease-out;
        left: 0;
    }

    .slide-left-enter {
        /*transform: translate(100%, 0);*/
        left: 100%;
    }

    .slide-left-leave-active {
        /*transform: translate(-50%, 0);*/
        left: -50%;
    }

    .slide-right-enter {
        /*transform: translate(-50%, 0);*/
        left: -50%;
        z-index: 20;
    }

    .slide-right-leave-active {
        /*transform: translate(100%, 0);*/
        left: 100%;
        z-index: 20;
    }

    p {
        margin: 0;
    }
</style>
