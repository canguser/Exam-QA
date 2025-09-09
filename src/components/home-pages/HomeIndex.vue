<template>
    <div class="home-index">
        <div class="welcome-section">
            <div class="welcome-card theme-card">
                <div class="welcome-content">
                    <h2 class="gradient-text welcome-title">欢迎使用答题神器</h2>
                    <p>智能题库管理，轻松备考复习</p>
                </div>
            </div>
        </div>

        <transition name="slide-up" mode="out-in">
            <van-grid :column-num="2" :gutter="16" class="category-grid">
            <van-grid-item
                    icon="plus"
                clickable
                    @click="showImporter"
                    class="grid-item-enhanced import-item">
                    <div slot="text" class="grid-text">
                        <span class="grid-title">开始答题</span>
                        <span class="grid-subtitle">导入题库</span>
                    </div>
            </van-grid-item>
            <van-grid-item
                    v-for="(category, index) in categories"
                :key="category"
                icon="notes-o"
                clickable
                    @click="goToCategory(category)"
                    class="grid-item-enhanced category-item"
                    :style="{ 'animation-delay': (index * 0.1) + 's' }">
                    <div slot="text" class="grid-text">
                        <span class="grid-title">{{ category }}</span>
                        <span class="grid-subtitle">题库分类</span>
                    </div>
            </van-grid-item>
        </van-grid>

        </transition>
        <van-popup v-model="isShowImporter" class="import-popup" round @click-overlay="isShowImporter = false">
            <div class="exam-import-box theme-card">
                <div class="popup-header">
                    <h3>导入题库</h3>
                    <van-icon name="cross" @click="isShowImporter = false" class="close-icon" />
                </div>
                
                <div v-if="isFromOnline" class="online-libs-container">
                    <div v-if="loadingOnlineLibs" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>{{ loadingProgress }}</p>
                        <div v-if="totalLibsCount > 0" class="progress-bar">
                            <div class="progress-fill" :style="{ width: `${(loadedLibsCount / totalLibsCount) * 100}%` }"></div>
                        </div>
                    </div>
                    <div v-else-if="loadingError" class="loading-container error-state">
                        <van-icon name="warning-o" size="32" color="var(--error-color)" />
                        <p class="error-message">{{ loadingError }}</p>
                        <van-button type="primary" size="small" round @click="retryLoadOnlineLibs">
                            重试加载
                        </van-button>
                    </div>
                    <div v-else-if="!onlineLibs || onlineLibs.length === 0" class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>准备加载题库...</p>
                    </div>
                    <van-checkbox-group v-model="onlineSelects" v-else>
                        <van-cell-group class="lib-cell-group">
                            <van-cell v-for="(lib, oi) in onlineLibs"
                                      clickable
                                      @click="selectLib(lib)"
                                      :key="oi"
                                      class="lib-cell">
                                <template slot="title">
                                    <div class="lib-info">
                                        <span class="lib-title">{{ lib.title }}</span>
                                        <span class="lib-category">{{ lib.category || 'default' }}</span>
                                    </div>
                                </template>
                                <van-checkbox slot="right-icon" :name="lib.hashCode"></van-checkbox>
                            </van-cell>
                        </van-cell-group>
                    </van-checkbox-group>
                </div>
                
                <div v-if="!isFromOnline" class="manual-import">
                    <van-cell-group class="import-field-group">
                        <van-field
                            v-model="questionLib"
                            label="题库内容"
                            type="textarea"
                            placeholder="请输入JSON格式的题库数据"
                            rows="8"
                            class="import-field"></van-field>
                    </van-cell-group>
                </div>
                
                <div class="popup-actions">
                    <van-button 
                        type="info" 
                        size="large" 
                        block 
                        round
                        @click="importLib"
                        class="theme-button action-button">
                        <van-icon name="plus" />
                        导入题库
                    </van-button>
                    <van-button 
                        type="primary" 
                        size="large" 
                        block 
                        round
                        @click="importFromExist"
                        class="theme-button action-button">
                        <van-icon name="cloud-o" />
                        获取在线题库
                    </van-button>
                </div>
            </div>
        </van-popup>
    </div>
</template>

<script>
import Vue from 'vue';
import {Grid, GridItem} from 'vant';
import {Popup} from 'vant';
import {Button} from 'vant';
import {Field} from 'vant';
import {Cell, CellGroup} from 'vant';
import utils from '../../utils';
import {questionDao, historyRecordDao, bankDao, configDao} from '../../dao';
import {Dialog} from 'vant';
import config from "@/config";
import {Checkbox, CheckboxGroup} from 'vant';
import { Loading } from 'vant';
import { Tag } from 'vant';
import { Icon } from 'vant';

Vue.use(Loading);
Vue.use(Dialog);
Vue.use(Field).use(Cell).use(CellGroup);
Vue.use(Button);
Vue.use(Popup);
Vue.use(Grid).use(GridItem);
Vue.use(Checkbox).use(CheckboxGroup);
Vue.use(Tag);
Vue.use(Icon);

const existsMap = 'https://unpkg.com/@palerock/exam-qa@latest/lib-json';
export default {
    name: "HomeIndex",
    data() {
        return {
            isShowImporter: false,
            isFromOnline: false,
            onlineLibs: [],
            onlineSelects: [],
            questionLib: '',
            categories: [],
            loadingOnlineLibs: false,
            loadingProgress: '准备加载题库...',
            totalLibsCount: 0,
            loadedLibsCount: 0,
            loadingError: null
        }
    },
    computed: {
        selectedLibs() {
            let res = this.onlineLibs.filter(lib => this.onlineSelects.includes(lib.hashCode)).map(lib => ({...lib}));
            res.forEach(r => {
                delete r.hashCode;
            });
            return res;
        }
    },
    methods: {
        goToCategory(category) {
            this.$router.push({
                name: 'CategoryPage',
                params: { category }
            });
        },
        selectLib(lib) {
            this.onlineSelects.includes(lib.hashCode) ? (this.onlineSelects = this.onlineSelects.filter(s => s !== lib.hashCode)) : (this.onlineSelects = [...this.onlineSelects, lib.hashCode])
            this.questionLib = JSON.stringify(this.selectedLibs);
        },
        showImporter() {
            this.isShowImporter = true;
            this.isFromOnline = false;
        },
        async importFromExist() {
            this.isFromOnline = true;
            this.loadingError = null;
            await this.loadOnlineLibs();
        },
        
        async loadOnlineLibs() {
            this.loadingOnlineLibs = true;
            this.loadingProgress = '正在获取题库列表...';
            this.totalLibsCount = 0;
            this.loadedLibsCount = 0;
            
            try {
                const res = await this.fetchOnlineLib();
                this.onlineLibs = res.filter(r => r && r.data).map(r => ({
                    ...r.data, hashCode: r.data.hashCode || utils.getHashCode(r.data.title + r.data.category)
                }));
                this.loadingProgress = `成功加载 ${this.onlineLibs.length} 个题库`;
                this.loadingError = null;
            } catch (e) {
                console.error('获取在线题库失败:', e);
                this.loadingError = '加载失败，请检查网络连接后重试';
                this.loadingProgress = '';
            } finally {
                this.loadingOnlineLibs = false;
            }
        },
        
        retryLoadOnlineLibs() {
            this.loadOnlineLibs();
        },
        async fetchOnlineLib() {
            try {
                // 获取题库映射文件
                this.loadingProgress = '正在获取题库列表...';
                const maps = (await this.$http.get(existsMap + "/map.json")).data || []
                
                if (maps.length === 0) {
                    this.loadingProgress = '未找到可用题库';
                    return [];
                }
                
                this.totalLibsCount = maps.length;
                this.loadedLibsCount = 0;
                this.loadingProgress = `准备并发加载 ${maps.length} 个题库...`;
                
                // 使用Promise.all并发加载所有题库文件，大幅提升加载速度
                const promises = maps.map((map, index) => {
                    return this.$http.get(existsMap + "/" + map)
                        .then(result => {
                            this.loadedLibsCount++;
                            this.loadingProgress = `正在并发加载题库 (${this.loadedLibsCount}/${this.totalLibsCount})`;
                            return result;
                        })
                        .catch(error => {
                            this.loadedLibsCount++;
                            console.warn(`加载题库 ${map} 失败:`, error);
                            this.loadingProgress = `正在并发加载题库 (${this.loadedLibsCount}/${this.totalLibsCount}) - 部分失败`;
                            return null; // 某个题库加载失败时不影响其他题库
                        });
                });
                
                const libs = await Promise.all(promises);
                
                // 过滤掉加载失败的题库
                const validLibs = libs.filter(lib => lib !== null);
                this.loadingProgress = `加载完成! 成功: ${validLibs.length}, 失败: ${maps.length - validLibs.length}`;
                
                return validLibs;
            } catch (error) {
                console.error('获取在线题库列表失败:', error);
                this.loadingProgress = '加载失败，请重试';
                throw error;
            }
        },
        async importLib() {
            try {
                let lib = JSON.parse(this.questionLib);
                let importCount = 0;
                
                if (lib instanceof Array) {
                    const results = await Promise.all(lib.map(async l => {
                        return await this.importSingleLib(l);
                    }));
                    importCount = results.filter(r => r).length;
                } else {
                    const result = await this.importSingleLib(lib);
                    importCount = result ? 1 : 0;
                }
                
                // 显示导入成功提示
                if (importCount > 0) {
                    this.$toast.success(`成功导入 ${importCount} 个题库！`);
                } else {
                    this.$toast.fail('未找到有效的题库数据');
                }
                
            } catch (e) {
                console.error('导入题库失败:', e);
                this.$toast.fail(`题库格式错误：${utils.getMessage(e)}`);
            }
            
            await this.initCategories(); // 刷新分类列表
            this.isShowImporter = false;
            this.questionLib = '';
        },
        async importSingleLib(lib) {
            if (!lib.questions || lib.questions.length === 0) {
                return false;
            }
            lib.questions.forEach(q=>{
                q.hashCode = q.hashCode || utils.getHashCode(q)
            })
            const bank = {
                ...lib,
                questions: lib.questions.map(q=>q.hashCode)
            }
            bank.hashCode = lib.hashCode || utils.getHashCode(bank)
            await questionDao.upsert(lib.questions)
                .then(()=>{
                    return bankDao.upsert([bank]);
                })
            return true;
        },
        async initCategories() {
            await bankDao.query('hashCode').notEqual('').toArray().then(banks => {
                banks = banks.map(b => {
                    b.category = b.category || 'default'
                    return b
                })
                this.categories = banks.reduce((ac, item) => {
                    if (!ac.includes(item.category)) {
                        ac.push(item.category)
                    }
                    return ac
                }, [])
            })
        },
    },
    mounted() {
        this.initCategories();
        // configDao.query('key').equals('hasSync').first()
        //     .then(hasSync => {
        //         hasSync = !!hasSync;
        //         if (!hasSync) {
        //             this.syncDataToIndexDB();
        //         }
        //     });
    }
}
</script>

<style scoped>
.home-index {
    padding: 0;
    animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 欢迎区域 */
.welcome-section {
    margin-bottom: 24px;
}

.welcome-card {
    padding: 36px 28px;
    text-align: center;
    background: linear-gradient(135deg, #00c4a7 0%, #26a69a 50%, #4dd0e1 100%);
    color: var(--text-white);
    border: none;
    border-radius: var(--border-radius-lg);
    box-shadow: 
        0 12px 32px rgba(0, 196, 167, 0.2),
        0 4px 16px rgba(0, 196, 167, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
}

.welcome-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, 0.1) 50%, 
        transparent 100%);
    animation: cardShimmer 3s ease-in-out infinite;
    z-index: 1;
}

.welcome-content {
    position: relative;
    z-index: 2;
}

@keyframes cardShimmer {
    0% {
        left: -100%;
    }
    50% {
        left: 100%;
    }
    100% {
        left: 100%;
    }
}

/* 基础h2样式被.welcome-title覆盖 */

.welcome-title {
    font-size: 32px !important;
    font-weight: 800 !important;
    letter-spacing: 0.8px;
    color: #ffffff !important;
    animation: titleBounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
    margin: 0 0 12px 0 !important;
    line-height: 1.2;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}


.welcome-content p {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: rgba(248, 255, 254, 0.85);
    letter-spacing: 0.3px;
    animation: fadeInUp 0.8s ease-out 0.3s both;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 0.95;
        transform: translateY(0);
    }
}

@keyframes titleBounceIn {
    0% {
        opacity: 0;
        transform: scale(0.3) translateY(-50px);
    }
    40% {
        opacity: 0.8;
        transform: scale(1.1) translateY(-10px);
    }
    70% {
        opacity: 1;
        transform: scale(0.95) translateY(5px);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

/* 网格样式 */
.category-grid {
    animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.grid-item-enhanced {
    transition: all var(--transition-normal);
    animation: gridItemAppear 0.6s ease-out both;
}

@keyframes gridItemAppear {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.grid-item-enhanced:active {
    transform: scale(0.95);
}

.import-item .van-grid-item__content {
    background: var(--primary-gradient) !important;
    color: var(--text-white) !important;
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-md);
}

.import-item .van-icon {
    color: var(--text-white) !important;
}

.category-item .van-grid-item__content {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-normal);
}

.category-item .van-grid-item__content:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.grid-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.grid-title {
    font-weight: 600;
    font-size: 14px;
    text-align: center;;
}

.grid-subtitle {
    font-size: 12px;
    opacity: 0.7;
}


/* 弹窗样式 */
.import-popup .van-popup {
    background: transparent;
}

.exam-import-box {
    width: 90vw;
    max-width: 400px;
    margin: 20px auto;
    padding: 24px;
    border-radius: var(--border-radius-lg);
    border: none;
    box-shadow: none;
}

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-light);
}

.popup-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.close-icon {
    font-size: 18px;
    color: var(--text-light);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--border-radius-sm);
    transition: all var(--transition-fast);
}

.close-icon:active {
    background: var(--bg-secondary);
    color: var(--text-secondary);
}

/* 在线题库 */
.online-libs-container {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 20px;
}

.loading-container {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary);
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-sm);
    margin-top: 16px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--primary-gradient);
    border-radius: var(--border-radius-sm);
    transition: width 0.3s ease;
}

.loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--bg-secondary);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 12px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.error-state {
    padding: 40px 20px;
}

.error-message {
    color: var(--error-color);
    font-size: 14px;
    margin: 12px 0 16px 0;
}

.lib-cell-group .van-cell {
    border-radius: var(--border-radius-sm);
    margin-bottom: 8px;
    border: 1px solid var(--border-light);
    transition: all var(--transition-fast);
}

.lib-cell:active {
    background: var(--bg-secondary);
    transform: scale(0.98);
}

.lib-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.lib-title {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-primary);
}

.lib-category {
    font-size: 12px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: var(--border-radius-sm);
    display: inline-block;
    width: fit-content;
}

/* 手动导入 */
.manual-import {
    margin-bottom: 20px;
}

.import-field-group .van-cell {
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-light);
}

.import-field .van-field__control {
    font-size: 12px;
    line-height: 1.4;
}

/* 弹窗按钮 */
.popup-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
}

.action-button:active {
    transform: scale(0.98);
}


/* 全局按钮美化 */
.van-button {
    border-radius: var(--border-radius-md) !important;
    font-weight: 500;
    transition: all var(--transition-fast) !important;
}

.van-button--primary {
    background: var(--primary-color) !important;
    border-color: var(--primary-color) !important;
}

.van-button--info {
    background: var(--info-color) !important;
    border-color: var(--info-color) !important;
}

.van-button--warning {
    background: var(--warning-color) !important;
    border-color: var(--warning-color) !important;
}

.van-button--danger {
    background: var(--error-color) !important;
    border-color: var(--error-color) !important;
}

/* 标签美化 */
.van-tag--warning {
    background: var(--warning-color) !important;
    color: var(--text-white) !important;
    border-radius: var(--border-radius-sm) !important;
}
</style>