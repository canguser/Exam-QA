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
            direction: "slide-right",
            lastBackPressTime: 0, // 上次按返回键的时间
            backPressInterval: 2000, // 双击返回键的时间间隔（毫秒）
            immersed: 20, // 沉浸式状态栏高度，默认值
            navHeight: 46, // 导航栏高度
            isImmersed: false // 是否为沉浸式状态栏
        }),
        mounted() {
            // H5 plus事件处理
            this.initPlusReady();
            // 初始化全局返回管理
            this.initGlobalBackManager();
        },
        beforeDestroy() {
            // 移除返回键监听
            this.removeBackButtonListener();
            // 清理动态注入的样式
            this.cleanupImmersiveStyles();
            // 清理全局返回管理器
            this.cleanupGlobalBackManager();
        },
        methods: {
            // 初始化全局返回管理器
            initGlobalBackManager() {
                // 创建全局返回管理器
                window.GlobalBackManager = {
                    // 返回拦截器列表
                    interceptors: [],
                    
                    // 添加返回拦截器
                    addInterceptor: (interceptor) => {
                        this.addBackInterceptor(interceptor);
                    },
                    
                    // 移除返回拦截器
                    removeInterceptor: (interceptor) => {
                        this.removeBackInterceptor(interceptor);
                    },
                    
                    // 执行返回操作
                    goBack: () => {
                        this.handleGlobalBack();
                    }
                };
                
                // 在Vue原型上添加全局返回方法，方便组件调用
                this.$root.globalBack = () => {
                    this.handleGlobalBack();
                };
                
                console.log('全局返回管理器初始化完成');
            },
            
            // 添加返回拦截器
            addBackInterceptor(interceptor) {
                if (typeof interceptor === 'function') {
                    window.GlobalBackManager.interceptors.push(interceptor);
                }
            },
            
            // 移除返回拦截器
            removeBackInterceptor(interceptor) {
                const index = window.GlobalBackManager.interceptors.indexOf(interceptor);
                if (index > -1) {
                    window.GlobalBackManager.interceptors.splice(index, 1);
                }
            },
            
            // 处理全局返回逻辑
            async handleGlobalBack() {
                // 按照后进先出的顺序执行拦截器
                const interceptors = [...window.GlobalBackManager.interceptors].reverse();
                
                for (let interceptor of interceptors) {
                    try {
                        // 拦截器返回 true 表示拦截返回操作，false 表示继续
                        const shouldIntercept = await interceptor();
                        if (shouldIntercept) {
                            console.log('返回操作被拦截');
                            return; // 被拦截，停止执行
                        }
                    } catch (error) {
                        console.error('返回拦截器执行错误:', error);
                    }
                }
                
                // 没有被拦截，执行默认返回逻辑
                this.executeDefaultBack();
            },
            
            // 执行默认返回逻辑
            executeDefaultBack() {
                const currentPath = this.$route.path;
                
                // 如果当前在首页，实现双击退出功能
                if (currentPath === '/') {
                    this.handleHomePageBack();
                    return;
                }
                
                // 检查是否有弹窗需要关闭
                if (this.hasOpenDialog()) {
                    this.closeTopDialog();
                    return;
                }
                
                // 否则返回上一页
                this.$router.back();
            },
            initPlusReady() {
                // H5 plus事件处理
                const plusReady = () => {
                    // plus准备完成后初始化功能
                    this.setupImmersiveStatusBar();
                    this.addBackButtonListener();
                };
                
                if (window.plus) {
                    plusReady();
                } else {
                    document.addEventListener('plusready', plusReady, false);
                }
                
                // 在非plus环境下也尝试检测沉浸式状态栏
                this.detectImmersiveMode();
            },
            detectImmersiveMode() {
                // 获取状态栏高度，参考你提供的代码
                this.immersed = 20; // 默认高度
                var ms = (/Html5Plus\/.+\s\(.*(Immersed\/(\d+\.?\d*).*)\)/gi).exec(navigator.userAgent);
                if (ms && ms.length >= 3) { 
                    // 当前环境为沉浸式状态栏模式
                    this.immersed = parseFloat(ms[2]); // 获取状态栏的高度
                    this.isImmersed = true;
                    console.log('检测到沉浸式状态栏，高度:', this.immersed);
                } else {
                    this.isImmersed = false;
                    this.immersed = 0; // 非沉浸式模式不需要额外高度
                    console.log('非沉浸式状态栏模式');
                }
                // this.isImmersed = true;
                // this.immersed = 46;
                
                // 设置全局变量供其他地方使用
                window.app = window.app || {};
                window.app.immersed = this.immersed;
                window.app.navHeight = this.navHeight;
                window.app.isImmersed = this.isImmersed;
                
                // 应用沉浸式样式
                this.applyImmersiveStyles();
            },
            setupImmersiveStatusBar() {
                // 如果在 plus 环境中，可以进行更精确的设置
                if (typeof plus !== 'undefined') {
                    try {
                        // 获取更精确的状态栏高度
                        const statusBarHeight = plus.navigator.getStatusBarHeight();
                        if (statusBarHeight > 0) {
                            this.immersed = statusBarHeight;
                            this.isImmersed = true;
                            
                            // 更新全局变量
                            window.app = window.app || {};
                            window.app.immersed = this.immersed;
                            window.app.navHeight = this.navHeight;
                            window.app.isImmersed = this.isImmersed;
                        }
                        
                        // 重新应用样式
                        this.applyImmersiveStyles();
                        
                        console.log('沉浸式状态栏设置完成，高度:', this.immersed);
                    } catch (error) {
                        console.warn('设置沉浸式状态栏失败:', error);
                    }
                }
            },
            applyImmersiveStyles() {
                // 只有在沉浸式模式下才注入样式
                if (this.isImmersed && this.immersed > 0) {
                    this.injectImmersiveStyles();
                }
            },
            injectImmersiveStyles() {
                // 移除已存在的沉浸式样式
                const existingStyle = document.getElementById('immersive-style');
                if (existingStyle) {
                    existingStyle.remove();
                }
                
                // 注册沉浸状态栏style，参考你提供的代码结构
                var styleEle = document.createElement('style');
                styleEle.id = 'immersive-style';
                styleEle.innerHTML = 
                    // 适配 Vant 导航栏组件 - 增加padding使导航栏延伸到状态栏
                    '.van-nav-bar { padding-top: ' + this.immersed + 'px !important; height: ' + (this.navHeight + this.immersed) + 'px !important; }' +
                    
                    // 确保导航栏背景渐变完全覆盖状态栏区域
                    '.van-nav-bar::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: ' + this.immersed + 'px; background: var(--primary-gradient); z-index: -1; }' +
                    
                    // 调整导航栏标题和按钮位置，确保在状态栏下方正确显示
                    '.van-nav-bar__title { margin-top: 0 !important; }' +
                    '.van-nav-bar__left, .van-nav-bar__right { margin-top: 0 !important; }' +
                    
                    // 调整应用主体容器，重置之前的padding然后只设置必要的top值
                    '#app { padding-top: ' + (this.navHeight + this.immersed) + 'px !important; }' +
                    
                    // 调整页面视图容器的最小高度
                    '.appView { min-height: calc(100vh - ' + (this.navHeight + this.immersed) + 'px) !important; }' +
                    
                    // 适配各页面容器的padding，确保内容不被状态栏遮挡
                    '.question-container { padding-top: ' + (this.immersed + 60) + 'px !important; }' +
                    '.page-container { padding-top: ' + (this.immersed + 60) + 'px !important; }' +
                    '.category-container { padding-top: ' + (this.immersed + 60) + 'px !important; }' +
                    
                    // 为固定定位的导航栏确保正确定位
                    '.van-nav-bar[class*="fixed"] { position: fixed !important; top: 0 !important; z-index: 1000 !important; }' +
                    
                    // 添加一个辅助类来标识沉浸式模式
                    'body { --immersed-height: ' + this.immersed + 'px; --nav-total-height: ' + (this.navHeight + this.immersed) + 'px; }' +
                    'body.immersive-mode #app { /* 为沉浸式模式提供额外样式钩子 */ }';
                
                document.head.appendChild(styleEle);
                
                // 添加沉浸式模式标识类到body
                document.body.classList.add('immersive-mode');
                
                console.log('沉浸式样式已注入');
            },
            cleanupImmersiveStyles() {
                // 移除动态注入的样式
                const existingStyle = document.getElementById('immersive-style');
                if (existingStyle) {
                    existingStyle.remove();
                }
                
                // 移除沉浸式模式标识类
                document.body.classList.remove('immersive-mode');
                
                // 清理CSS变量
                document.documentElement.style.removeProperty('--immersed-height');
                document.documentElement.style.removeProperty('--nav-total-height');
                
                // 清理全局变量
                if (window.app) {
                    delete window.app.immersed;
                    delete window.app.navHeight;
                    delete window.app.isImmersed;
                }
            },
            
            // 清理全局返回管理器
            cleanupGlobalBackManager() {
                if (window.GlobalBackManager) {
                    // 清空拦截器
                    window.GlobalBackManager.interceptors = [];
                    // 删除全局对象
                    delete window.GlobalBackManager;
                }
                
                // 清理Vue原型上的方法
                if (this.$root.globalBack) {
                    delete this.$root.globalBack;
                }
                
                console.log('全局返回管理器已清理');
            },
            addBackButtonListener() {
                // 检查是否在uniapp环境中
                if (typeof plus !== 'undefined') {
                    plus.key.addEventListener("backbutton", this.onBackButton, false);
                }
            },
            removeBackButtonListener() {
                if (typeof plus !== 'undefined') {
                    plus.key.removeEventListener("backbutton", this.onBackButton);
                }
            },
            onBackButton() {
                // 使用全局返回管理器处理返回逻辑
                this.handleGlobalBack();
            },
            handleHomePageBack() {
                const currentTime = new Date().getTime();
                
                // 如果距离上次按返回键的时间小于设定间隔，则退出应用
                if (currentTime - this.lastBackPressTime < this.backPressInterval) {
                    plus.runtime.quit();
                    return;
                }
                
                // 记录本次按键时间
                this.lastBackPressTime = currentTime;
                
                // 显示提示信息
                this.showExitTip();
            },
            showExitTip() {
                // 优先使用 Vant 的 Toast 组件
                if (this.$toast) {
                    this.$toast('再按一次退出应用');
                } else if (typeof this.$Toast !== 'undefined') {
                    this.$Toast('再按一次退出应用');
                } else {
                    // 如果没有 Toast 组件，使用 HTML5+ 原生提示
                    if (typeof plus !== 'undefined' && plus.nativeUI) {
                        plus.nativeUI.toast('再按一次退出应用');
                    } else {
                        // 最后的备选方案，使用 alert
                        alert('再按一次退出应用');
                    }
                }
            },
            hasOpenDialog() {
                // 检查是否有 Vant 的弹窗组件打开
                const dialogs = document.querySelectorAll('.van-overlay, .van-popup, .van-dialog, .van-action-sheet, .van-picker');
                return Array.from(dialogs).some(dialog => {
                    const style = window.getComputedStyle(dialog);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                });
            },
            closeTopDialog() {
                // 尝试关闭最顶层的弹窗
                const dialogs = document.querySelectorAll('.van-overlay, .van-popup .van-popup--center, .van-dialog, .van-action-sheet, .van-picker');
                
                // 查找最后一个可见的弹窗并关闭
                for (let i = dialogs.length - 1; i >= 0; i--) {
                    const dialog = dialogs[i];
                    const style = window.getComputedStyle(dialog);
                    if (style.display !== 'none' && style.visibility !== 'hidden') {
                        // 尝试触发关闭按钮点击
                        const closeBtn = dialog.querySelector('.van-popup__close-icon, .van-dialog__confirm, .van-picker__cancel');
                        if (closeBtn) {
                            closeBtn.click();
                            return;
                        }
                        
                        // 如果没有找到关闭按钮，尝试点击遮罩层关闭
                        if (dialog.classList.contains('van-overlay')) {
                            dialog.click();
                            return;
                        }
                        
                        // 最后尝试手动隐藏
                        dialog.style.display = 'none';
                        return;
                    }
                }
            }
        },
        watch: {
            $route(to, from) {
                // 定义页面层级：数字越大表示层级越深
                const getPageLevel = (path) => {
                    if (path === '/') return 1;           // 主页：第1层
                    if (path.startsWith('/category/')) return 2;  // 分类页：第2层
                    if (path === '/exam') return 3;       // 答题页：第3层
                    return 1; // 默认层级
                };
                
                const toLevel = getPageLevel(to.path);
                const fromLevel = getPageLevel(from.path);
                
                // 向下钻取（层级增加）：从右往左滑动
                // 向上返回（层级减少）：从左往右滑动
                if (toLevel > fromLevel) {
                    this.direction = "slide-left";   // 进入下级页面
                } else if (toLevel < fromLevel) {
                    this.direction = "slide-right";  // 返回上级页面
                } else {
                    // 同级之间的切换，保持从右往左
                    this.direction = "slide-left";
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
        left: 0;
        top: 0;
        background: var(--bg-primary);
        min-height: calc(100vh - 60px);
        overflow-x: hidden;
        will-change: left, opacity;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        padding-top: 0;
    }

    /* 向左滑动动画 - 进入下级页面 */
    .slide-left-enter-active {
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        z-index: 10;
    }

    .slide-left-leave-active {
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        z-index: 5;
    }

    .slide-left-enter {
        left: 100%;
        opacity: 0;
    }

    .slide-left-enter-to {
        left: 0;
        opacity: 1;
    }

    .slide-left-leave {
        left: 0;
        opacity: 1;
    }

    .slide-left-leave-to {
        left: -25%;
        opacity: 0.4;
    }

    /* 向右滑动动画 - 返回上级页面 */
    .slide-right-enter-active {
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        z-index: 5;
    }

    .slide-right-leave-active {
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        z-index: 10;
    }

    .slide-right-enter {
        left: -25%;
        opacity: 0.4;
    }

    .slide-right-enter-to {
        left: 0;
        opacity: 1;
    }

    .slide-right-leave {
        left: 0;
        opacity: 1;
    }

    .slide-right-leave-to {
        left: 100%;
        opacity: 0;
    }

    /* 防止动画过程中的闪烁 */
    .slide-left-enter-active .appView,
    .slide-left-leave-active .appView,
    .slide-right-enter-active .appView,
    .slide-right-leave-active .appView {
        pointer-events: none;
    }


    p {
        margin: 0;
        color: var(--text-secondary);
    }

    /* 沉浸式模式基础样式 */
    .immersive-mode {
        position: relative; /* 为沉浸式模式提供定位上下文 */
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

    img {
        width: 100%;
    }
</style>
