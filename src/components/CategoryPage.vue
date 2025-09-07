<template>
    <div class="category-page">
        <van-nav-bar
            :title="categoryTitle"
            fixed
            left-arrow
            @click-left="$router.back()"
            class="category-nav-bar"
        ></van-nav-bar>
        
        <div class="category-container">
            <div class="category-header">
                <h2 class="gradient-text">{{ categoryName }}</h2>
                <p class="category-desc">共 {{ examList.length }} 个题库</p>
            </div>

            <transition name="slide-up">
                <van-grid :column-num="1" :gutter="12" class="exam-grid" v-if="examList.length > 0">
                    <van-grid-item
                        v-for="(exam, index) in examList"
                        :key="exam.hashCode"
                        clickable
                        @click="showOption(exam)"
                        class="exam-item-card"
                        :style="{ 'animation-delay': (index * 0.05) + 's' }">
                        <div class="exam-card-content">
                            <div class="exam-icon">
                                <van-icon name="notes-o" size="24" :color="exam.hasHistoryError ? 'var(--warning-color)' : 'var(--primary-color)'" />
                            </div>
                            <div class="exam-info">
                                <h3 class="exam-title">{{ exam.title }}</h3>
                                <p class="exam-meta">题目数量: {{ exam.questions ? exam.questions.length : 0 }}</p>
                                <div class="exam-status" v-if="exam.hasHistoryError">
                                    <van-tag type="warning" size="mini">有错题</van-tag>
                                </div>
                            </div>
                            <div class="exam-arrow">
                                <van-icon name="arrow" />
                            </div>
                        </div>
                    </van-grid-item>
                </van-grid>
                
                <div v-else class="empty-state">
                    <div class="empty-icon">
                        <van-icon name="warning-o" size="48" color="var(--text-light)" />
                    </div>
                    <p class="empty-text">该分类下暂无题库</p>
                    <van-button type="primary" round @click="$router.push('/')">
                        返回首页
                    </van-button>
                </div>
            </transition>
        </div>

        <!-- 答题选项弹窗 -->
        <van-popup v-model="isShowOption" position="bottom" round class="option-popup" @click-overlay="isShowOption = false">
            <div class="exam-options theme-card">
                <div class="popup-header">
                    <h3>选择答题模式</h3>
                    <van-icon name="cross" @click="isShowOption = false" class="close-icon" />
                </div>
                <div class="option-buttons">
                    <van-button 
                        size="large" 
                        block 
                        round
                        @click="doExam(optionInfo.hashCode, false, true)"
                        class="theme-button option-button">
                        <van-icon name="edit" />
                        <div class="button-content">
                            <span class="button-title">未做题</span>
                            <span class="button-desc">只答从未做过的题目</span>
                        </div>
                    </van-button>
                    <van-button 
                        type="primary" 
                        size="large" 
                        block 
                        round
                        @click="doExam(optionInfo.hashCode)"
                        class="theme-button option-button">
                        <van-icon name="replay" />
                        <div class="button-content">
                            <span class="button-title">重新测试</span>
                            <span class="button-desc">完整答题测试</span>
                        </div>
                    </van-button>
                    <van-button 
                        type="warning" 
                        size="large" 
                        block 
                        round
                        @click="doExam(optionInfo.hashCode, true)"
                        class="theme-button option-button">
                        <van-icon name="question-o" />
                        <div class="button-content">
                            <span class="button-title">复习错题</span>
                            <span class="button-desc">专门练习错题</span>
                        </div>
                    </van-button>
                    <van-button 
                        type="danger" 
                        size="large" 
                        block 
                        round
                        @click="clearHistory(optionInfo.hashCode)"
                        class="theme-button option-button">
                        <van-icon name="delete-o" />
                        <div class="button-content">
                            <span class="button-title">清空错题</span>
                            <span class="button-desc">清除历史记录</span>
                        </div>
                    </van-button>
                </div>
            </div>
        </van-popup>
    </div>
</template>

<script>
import Vue from 'vue';
import {NavBar} from 'vant';
import {Grid, GridItem} from 'vant';
import {Popup} from 'vant';
import {Button} from 'vant';
import {Dialog} from 'vant';
import {Tag} from 'vant';
import {Icon} from 'vant';
import {questionDao, historyRecordDao, bankDao} from '../dao';

Vue.use(NavBar);
Vue.use(Grid).use(GridItem);
Vue.use(Popup);
Vue.use(Button);
Vue.use(Dialog);
Vue.use(Tag);
Vue.use(Icon);

export default {
    name: "CategoryPage",
    data() {
        return {
            examList: [],
            isShowOption: false,
            optionInfo: {
                hashCode: ''
            }
        }
    },
    computed: {
        categoryName() {
            return this.$route.params.category || 'default';
        },
        categoryTitle() {
            return this.categoryName === 'default' ? '默认分类' : this.categoryName;
        }
    },
    methods: {
        async loadCategoryExams() {
            const category = this.categoryName;
            
            try {
                const banks = await bankDao.query('hashCode').notEqual('').toArray();
                
                // 过滤出当前分类的题库
                const filteredBanks = banks.filter(bank => {
                    const bankCategory = bank.category || 'default';
                    return bankCategory === category;
                });
                
                // 排序
                filteredBanks.sort((a, b) => {
                    return a.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0) - 
                           b.title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
                });
                
                // 获取历史记录
                const promises = filteredBanks.map(bank => {
                    return historyRecordDao.query('relatedQuestion').anyOf(bank.questions).sortBy('createDate')
                        .then(records => {
                            const errorMap = Object.fromEntries(records.map(record => [record.relatedQuestion, {
                                ...record, times: record.errorTimes
                            }]));
                            const hasHistoryError = !!Object.values(errorMap).find(q => q.times > 0);
                            return {...bank, errorMap, hasHistoryError}
                        });
                });
                
                this.examList = await Promise.all(promises);
            } catch (error) {
                console.error('加载分类题库失败:', error);
                this.examList = [];
            }
        },
        
        showOption(exam) {
            if (exam.hasHistoryError) {
                this.optionInfo.hashCode = exam.hashCode;
                this.isShowOption = true;
            } else {
                this.doExam(exam.hashCode);
            }
        },
        
        doExam(hashCode, isReviewError = false, neverDo = false) {
            this.isShowOption = false; // 关闭弹窗
            bankDao.query('hashCode').equals(hashCode).first()
                .then(exam => {
                    return Promise.all([exam, ...exam.questions.map(q => questionDao.query('hashCode').equals(q).first())])
                })
                .then(([exam, ...questions]) => {
                    exam.questions = questions;
                    if (!exam) {
                        Dialog.alert({message: '该题库已失效！'});
                        return;
                    }
                    this.$router.push({
                        name: 'DoExamPage',
                        params: {
                            examConfig: exam,
                            isReviewError,
                            neverDo
                        }
                    })
                });
        },
        
        clearHistory(hashCode) {
            this.isShowOption = false; // 先关闭弹窗
            bankDao.queryByHashCode(hashCode)
                .then(bankDao => {
                    bankDao = bankDao || {};
                    return historyRecordDao.delete(bankDao.questions || []);
                }).then(() => {
                    console.log('remove the history.');
                    this.loadCategoryExams(); // 重新加载数据
                }
            );
        }
    },
    
    async mounted() {
        await this.loadCategoryExams();
    },
    
    // 监听路由参数变化
    watch: {
        '$route.params.category': {
            handler() {
                this.loadCategoryExams();
            },
            immediate: false
        }
    }
}
</script>

<style scoped>
.category-page {
    background: var(--bg-primary);
    min-height: 100vh;
}

.category-nav-bar {
    background: var(--primary-gradient) !important;
    box-shadow: var(--shadow-md);
}

.category-container {
    padding: 20px 16px;
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

.category-header {
    text-align: center;
    margin-bottom: 24px;
    padding: 20px;
    background: var(--bg-card);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-sm);
}

.category-header h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
}

.category-desc {
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
}

/* 考试列表样式 */
.exam-grid .van-grid-item {
    padding: 0 !important;
}

.exam-item-card {
    animation: examItemAppear 0.5s ease-out both;
}

@keyframes examItemAppear {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.exam-card-content {
    display: flex;
    align-items: center;
    padding: 0 16px;
    width: 100%;
}

.exam-icon {
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-sm);
}

.exam-info {
    flex: 1;
    min-width: 0;
}

.exam-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.exam-meta {
    margin: 0 0 4px 0;
    font-size: 12px;
    color: var(--text-secondary);
}

.exam-status {
    margin-top: 4px;
}

.exam-arrow {
    color: var(--text-light);
    margin-left: 8px;
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
}

.empty-icon {
    margin-bottom: 16px;
}

.empty-text {
    margin: 0 0 24px 0;
    font-size: 16px;
    color: var(--text-secondary);
}

/* 弹窗样式 */
.option-popup .van-popup {
    background: transparent;
}

.exam-options {
    width: 90vw;
    max-width: 400px;
    margin: 20px auto;
    padding: 24px;
    border-radius: var(--border-radius-lg);
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

.option-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.option-button {
    display: flex;
    align-items: center;
    padding: 16px !important;
    height: auto !important;
    box-shadow: var(--shadow-sm);
}

.option-button .van-icon {
    margin-right: 12px;
    font-size: 20px;
}

.button-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
}

.button-title {
    font-weight: 600;
    font-size: 16px;
    line-height: 1.2;
}

.button-desc {
    font-size: 12px;
    opacity: 0.8;
    margin-top: 2px;
    line-height: 1.2;
}

.option-button:active {
    transform: scale(0.98);
}

/* 过渡动画 */
.slide-up-enter-active, .slide-up-leave-active {
    transition: all var(--transition-normal);
}

.slide-up-enter, .slide-up-leave-to {
    opacity: 0;
    transform: translateY(30px);
}
</style>
