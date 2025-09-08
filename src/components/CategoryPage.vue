<template>
    <div class="category-page">
        <van-nav-bar
            :title="categoryTitle"
            fixed
            left-arrow
            @click-left="handleBack"
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
            <div class="exam-options">
                <div class="popup-header">
                    <div class="header-info">
                        <h3>选择答题模式</h3>
                        <p class="exam-title">{{ currentExam.title }}</p>
                    </div>
                    <van-icon name="cross" @click="isShowOption = false" class="close-icon" />
                </div>
                <div class="option-grid">
                    <div class="option-item" 
                         :class="{ disabled: getUndoneCounts() === 0 }"
                         @click="getUndoneCounts() > 0 && doExam(optionInfo.hashCode, false, true)">
                        <div class="option-icon new">
                            <van-icon name="edit" />
                        </div>
                        <div class="option-info">
                            <span class="option-title">未做题</span>
                            <span class="option-count">{{ getUndoneCounts() }}题</span>
                        </div>
                    </div>
                    <div class="option-item primary" 
                         :class="{ disabled: getTotalCounts() === 0 }"
                         @click="getTotalCounts() > 0 && doExam(optionInfo.hashCode)">
                        <div class="option-icon">
                            <van-icon name="replay" />
                        </div>
                        <div class="option-info">
                            <span class="option-title">重新测试</span>
                            <span class="option-count">{{ getTotalCounts() }}题</span>
                        </div>
                    </div>
                    <div class="option-item warning" 
                         :class="{ disabled: getErrorCounts() === 0 }"
                         @click="getErrorCounts() > 0 && doExam(optionInfo.hashCode, true)">
                        <div class="option-icon">
                            <van-icon name="question-o" />
                        </div>
                        <div class="option-info">
                            <span class="option-title">复习错题</span>
                            <span class="option-count">{{ getErrorCounts() }}题</span>
                        </div>
                    </div>
                    <div class="option-item danger" @click="clearHistory(optionInfo.hashCode)">
                        <div class="option-icon">
                            <van-icon name="delete-o" />
                        </div>
                        <div class="option-info">
                            <span class="option-title">清空记录</span>
                            <span class="option-count">重置</span>
                        </div>
                    </div>
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
            },
            currentExam: {},
            historyRecords: []
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
        // 处理返回操作
        handleBack() {
            // 使用全局返回管理器
            if (window.GlobalBackManager) {
                window.GlobalBackManager.goBack();
            } else {
                // 降级处理：如果全局返回管理器不存在，使用原有逻辑
                this.$router.back();
            }
        },
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
        
        async showOption(exam) {
            if (exam.hasHistoryError) {
                this.optionInfo.hashCode = exam.hashCode;
                this.currentExam = exam;
                
                // 加载历史记录用于计算题目数量
                try {
                    const records = await historyRecordDao.queryMany(exam.questions || []);
                    this.historyRecords = records;
                } catch (error) {
                    console.error('加载历史记录失败:', error);
                    this.historyRecords = [];
                }
                
                this.isShowOption = true;
            } else {
                this.doExam(exam.hashCode);
            }
        },
        
        // 获取总题目数量
        getTotalCounts() {
            return this.currentExam.questions ? this.currentExam.questions.length : 0;
        },
        
        // 获取错题数量
        getErrorCounts() {
            if (!this.currentExam.questions || !this.historyRecords.length) return 0;
            return this.historyRecords.filter(record => record.errorTimes > 0).length;
        },
        
        // 获取未做题数量
        getUndoneCounts() {
            if (!this.currentExam.questions || !this.historyRecords.length) {
                return this.getTotalCounts();
            }
            const doneQuestions = this.historyRecords.filter(record => 
                (record.errorTimes || 0) + (record.rightTimes || 0) > 0
            ).length;
            return this.getTotalCounts() - doneQuestions;
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
    padding: 66px 16px 20px 16px; /* 46px (导航栏) + 20px (顶部间距) */
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
    max-width: 380px;
    margin: 16px auto;
    padding: 20px;
    border-radius: var(--border-radius-lg);
    background: var(--bg-card);
}

.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-light);
}

.header-info h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.exam-title {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: normal;
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

.option-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.option-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 12px;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: center;
    min-height: 80px;
    justify-content: center;
}

.option-item:active {
    transform: scale(0.95);
}

.option-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}

.option-item.disabled .option-icon {
    background: var(--text-light);
}

.option-item.disabled .option-title,
.option-item.disabled .option-count {
    color: var(--text-light);
}

.option-item.primary {
    background: var(--bg-overlay);
    border-color: var(--primary-color);
}

.option-item.warning {
    background: rgba(255, 152, 0, 0.1);
    border-color: var(--warning-color);
}

.option-item.danger {
    background: rgba(244, 67, 54, 0.1);
    border-color: var(--error-color);
}

.option-item.new {
    background: rgba(76, 175, 80, 0.1);
    border-color: var(--success-color);
}

.option-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    background: var(--primary-color);
    color: var(--text-white);
}

.option-item.warning .option-icon {
    background: var(--warning-color);
}

.option-item.danger .option-icon {
    background: var(--error-color);
}

.option-item.new .option-icon {
    background: var(--success-color);
}

.option-icon .van-icon {
    font-size: 16px;
}

.option-info {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.option-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 2px;
    line-height: 1.2;
}

.option-count {
    font-size: 12px;
    color: var(--text-secondary);
    font-weight: 500;
}

/* 移动端优化 */
@media (max-width: 480px) {
    .exam-options {
        width: 95vw;
        margin: 12px auto;
        padding: 16px;
    }
    
    .popup-header {
        margin-bottom: 12px;
        padding-bottom: 10px;
    }
    
    .header-info h3 {
        font-size: 16px;
    }
    
    .exam-title {
        font-size: 13px;
    }
    
    .option-grid {
        gap: 8px;
    }
    
    .option-item {
        padding: 12px 8px;
        min-height: 70px;
    }
    
    .option-icon {
        width: 28px;
        height: 28px;
        margin-bottom: 6px;
    }
    
    .option-icon .van-icon {
        font-size: 14px;
    }
    
    .option-title {
        font-size: 13px;
    }
    
    .option-count {
        font-size: 11px;
    }
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
