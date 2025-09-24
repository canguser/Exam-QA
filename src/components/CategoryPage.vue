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
                        <div class="exam-card-content"
                             :class="{ 'long-pressing': longPressTimer && examToDelete && examToDelete.hashCode === exam.hashCode }"
                             @mousedown="onMouseDown(exam, $event)"
                             @mouseup="onMouseUp"
                             @mouseleave="onMouseUp"
                             @touchstart.passive="onTouchStart(exam, $event)"
                             @touchend.passive="onTouchEnd"
                             @touchcancel.passive="onTouchEnd">
                            <div class="exam-icon">
                                <van-icon name="notes-o" size="24" :color="exam.hasHistoryError ? 'var(--warning-color)' : 'var(--primary-color)'" />
                            </div>
                            <div class="exam-info">
                                <h3 class="exam-title">{{ exam.title }}</h3>
                                <p class="exam-meta">
                                    题目数量: {{ exam.questions ? exam.questions.length : 0 }}
                                    <span v-if="exam.slashedCount > 0" class="slash-info">
                                        (已斩: {{ exam.slashedCount }})
                                    </span>
                                </p>
                                <div class="exam-status">
                                    <van-tag v-if="exam.hasHistoryError" type="warning" size="mini">有错题</van-tag>
                                    <van-tag v-if="exam.slashRate > 50" type="success" size="mini">已斩过半</van-tag>
                                    <van-tag v-if="exam.slashRate === 100" type="primary" size="mini">全部已斩</van-tag>
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
                
                <!-- 答题设置选项 -->
                <div class="exam-settings">
                    <div class="settings-header">
                        <van-icon name="setting-o" class="settings-icon" />
                        <span class="settings-title">答题设置</span>
                    </div>
                    <div class="settings-options">
                        <div class="setting-item" @click="toggleSetting('keepQuestionOrder')">
                            <van-checkbox 
                                v-model="examSettings.keepQuestionOrder" 
                                class="setting-checkbox"
                                @click.stop>
                            </van-checkbox>
                            <div class="setting-content">
                                <span class="setting-label">保持答题顺序</span>
                                <span class="setting-desc">按原始顺序显示题目，不打乱</span>
                            </div>
                        </div>
                        
                        <div class="setting-item" @click="toggleSetting('keepOptionOrder')">
                            <van-checkbox 
                                v-model="examSettings.keepOptionOrder" 
                                class="setting-checkbox"
                                @click.stop>
                            </van-checkbox>
                            <div class="setting-content">
                                <span class="setting-label">保持选项顺序</span>
                                <span class="setting-desc">按原始顺序显示选项，不打乱</span>
                            </div>
                        </div>
                        
                        <div class="setting-item" @click="toggleSetting('showRealIndex')">
                            <van-checkbox 
                                v-model="examSettings.showRealIndex" 
                                class="setting-checkbox"
                                @click.stop>
                            </van-checkbox>
                            <div class="setting-content">
                                <span class="setting-label">显示题目真实序号</span>
                                <span class="setting-desc">在当前序号后额外显示原始题库序号</span>
                            </div>
                        </div>
                        
                        <div class="setting-item" @click="toggleSetting('includeSlashedQuestions')">
                            <van-checkbox 
                                v-model="examSettings.includeSlashedQuestions" 
                                class="setting-checkbox"
                                @click.stop>
                            </van-checkbox>
                            <div class="setting-content">
                                <span class="setting-label">包含已斩题目</span>
                                <span class="setting-desc">答题时包含已标记为完全掌握的题目</span>
                            </div>
                        </div>
                        
                        <!-- 题目数量限制设置 -->
                        <div class="setting-item limit-setting" @click="toggleSetting('enableQuestionLimit')">
                            <van-checkbox 
                                v-model="examSettings.enableQuestionLimit" 
                                class="setting-checkbox"
                                @click.stop>
                            </van-checkbox>
                            <div class="setting-content full-width">
                                <div class="limit-header">
                                    <span class="setting-label">题目数量限制</span>
                                </div>
                                <span class="setting-desc">限制答题时显示的题目数量</span>
                                <div class="limit-input-container" v-if="examSettings.enableQuestionLimit">
                                    <span class="limit-label">最多显示</span>
                                    <van-field 
                                        v-model.number="examSettings.questionLimit"
                                        type="number"
                                        :min="1"
                                        :max="999"
                                        placeholder="50"
                                        class="limit-input"
                                        @click.stop />
                                    <span class="limit-text">题</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
                    <div class="option-item starred" 
                         :class="{ disabled: getStarredCounts() === 0 }"
                         @click="getStarredCounts() > 0 && doStarredExam(optionInfo.hashCode)">
                        <div class="option-icon">
                            <van-icon name="star" />
                        </div>
                        <div class="option-info">
                            <span class="option-title">星标题目</span>
                            <span class="option-count">{{ getStarredCounts() }}题</span>
                        </div>
                    </div>
                    <div class="option-item info" @click="openSlashManager(optionInfo.hashCode)">
                        <div class="option-icon">
                            <van-icon name="fire-o" />
                        </div>
                        <div class="option-info">
                            <span class="option-title">斩题管理</span>
                            <span class="option-count">⚔️</span>
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

        <!-- 删除确认弹窗 -->
        <van-popup v-model="isShowDeleteConfirm" position="center" round class="delete-confirm-popup" @click-overlay="isShowDeleteConfirm = false">
            <div class="delete-confirm-content">
                <div class="delete-icon">
                    <van-icon name="warning-o" size="48" color="var(--error-color)" />
                </div>
                <h3 class="delete-title">确认删除题库</h3>
                <p class="delete-message">
                    确定要删除题库 <strong>{{ examToDelete && examToDelete.title }}</strong> 吗？
                </p>
                <p class="delete-warning">此操作不可恢复，相关的答题记录也将被删除。</p>
                <div class="delete-actions">
                    <van-button 
                        type="default" 
                        size="large" 
                        @click="isShowDeleteConfirm = false"
                        class="cancel-button">
                        取消
                    </van-button>
                    <van-button 
                        type="danger" 
                        size="large" 
                        @click="confirmDeleteExam"
                        class="confirm-button">
                        确认删除
                    </van-button>
                </div>
            </div>
        </van-popup>

        <!-- 斩题管理弹窗 -->
        <van-popup v-model="showSlashManager" position="bottom" round class="slash-manager-popup" @click-overlay="showSlashManager = false">
            <div class="slash-manager">
                <div class="popup-header">
                    <div class="header-info">
                        <h3>斩题管理</h3>
                        <p class="exam-title">{{ currentExam.title }}</p>
                    </div>
                    <van-icon name="cross" @click="showSlashManager = false" class="close-icon" />
                </div>
                
                <div class="slash-stats">
                    <div class="stat-item">
                        <span class="stat-label">总题目</span>
                        <span class="stat-value">{{ getSlashStats().totalQuestions }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">已斩题目</span>
                        <span class="stat-value slash-count">{{ getSlashStats().slashedCount }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">斩题率</span>
                        <span class="stat-value">{{ getSlashStats().slashRate }}%</span>
                    </div>
                </div>
                
                <div class="slash-actions">
                    <van-button 
                        type="primary" 
                        size="large" 
                        block 
                        round
                        @click="openBatchSlashDialog"
                        class="action-button">
                        <van-icon name="apps-o" />
                        批量斩题
                    </van-button>
                    
                    <van-button 
                        type="warning" 
                        size="large" 
                        block 
                        round
                        @click="resetAllSlashedQuestions"
                        :disabled="getSlashStats().slashedCount === 0"
                        class="action-button">
                        <van-icon name="replay" />
                        重置所有斩题
                    </van-button>
                </div>
            </div>
        </van-popup>

        <!-- 批量斩题弹窗 -->
        <van-popup v-model="showBatchSlashDialog" position="bottom" round class="batch-slash-popup" @click-overlay="showBatchSlashDialog = false">
            <div class="batch-slash-dialog">
                <div class="popup-header">
                    <h3>批量斩题</h3>
                    <van-icon name="cross" @click="showBatchSlashDialog = false" class="close-icon" />
                </div>
                
                <div class="batch-selection-header">
                    <van-button 
                        size="small" 
                        type="info" 
                        round
                        @click="toggleSelectAll"
                        class="select-all-btn">
                        {{ selectedQuestions.length === currentExamQuestions.length ? '反选全部' : '全选' }}
                    </van-button>
                    <span class="selection-count">已选择 {{ selectedQuestions.length }}/{{ currentExamQuestions.length }} 题</span>
                </div>
                
                <div class="batch-question-list">
                    <van-checkbox-group v-model="selectedQuestions">
                        <div 
                            v-for="(question, index) in currentExamQuestions" 
                            :key="question.hashCode"
                            class="batch-question-item"
                            :class="{ 'already-slashed': isQuestionSlashed(question.hashCode) }"
                            @click="toggleQuestionSelection(question.hashCode)">
                            <van-checkbox 
                                :name="question.hashCode"
                                :disabled="isQuestionSlashed(question.hashCode)">
                            </van-checkbox>
                            <div class="question-preview">
                                <span class="question-number">第{{ index + 1 }}题</span>
                                <span class="question-status">
                                    <van-tag v-if="isQuestionSlashed(question.hashCode)" type="success" size="mini">已斩</van-tag>
                                </span>
                            </div>
                        </div>
                    </van-checkbox-group>
                </div>
                
                <div class="batch-actions">
                    <van-button 
                        type="default" 
                        size="large" 
                        @click="showBatchSlashDialog = false"
                        class="cancel-button">
                        取消
                    </van-button>
                    <van-button 
                        type="warning" 
                        size="large" 
                        @click="batchSlashQuestions"
                        :disabled="selectedQuestions.length === 0"
                        class="confirm-button">
                        斩掉 {{ selectedQuestions.length }} 题
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
import {questionDao, historyRecordDao, bankDao, slashedQuestionDao, questionBankMappingDao, starredQuestionDao} from '../dao';

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
            historyRecords: [],
            // 长按删除相关
            longPressTimer: null,
            longPressThreshold: 500, // 长按阈值：500ms
            isLongPressed: false,
            isShowDeleteConfirm: false,
            examToDelete: null,
            
            // 斩题管理相关
            showSlashManager: false,
            showBatchSlashDialog: false,
            selectedQuestions: [],
            currentSlashedQuestions: [],
            currentExamQuestions: [],
            
            // 标星相关
            currentStarredQuestions: [],
            
            // 答题设置
            examSettings: {
                keepQuestionOrder: false,        // 保持答题顺序
                keepOptionOrder: false,          // 保持选项顺序
                showRealIndex: true,             // 显示题目真实序号（默认选中）
                includeSlashedQuestions: false,  // 包含已斩题目（默认false）
                enableQuestionLimit: false,      // 启用题目数量限制（默认false）
                questionLimit: 50               // 题目数量限制（默认50）
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
                
                // 获取历史记录和斩题统计
                const promises = filteredBanks.map(async bank => {
                    // 获取历史记录
                    const records = await historyRecordDao.query('relatedQuestion').anyOf(bank.questions).sortBy('createDate');
                    const errorMap = Object.fromEntries(records.map(record => [record.relatedQuestion, {
                        ...record, times: record.errorTimes
                    }]));
                    const hasHistoryError = !!Object.values(errorMap).find(q => q.times > 0);
                    
                    // 获取斩题统计
                    const slashedQuestions = await slashedQuestionDao.queryByBankHashCode(bank.hashCode);
                    const slashedCount = slashedQuestions.length;
                    const totalQuestions = bank.questions ? bank.questions.length : 0;
                    const slashRate = totalQuestions > 0 ? Math.round((slashedCount / totalQuestions) * 100) : 0;
                    
                    return {
                        ...bank, 
                        errorMap, 
                        hasHistoryError,
                        slashedCount,
                        slashRate,
                        slashedQuestions
                    };
                });
                
                this.examList = await Promise.all(promises);
            } catch (error) {
                console.error('加载分类题库失败:', error);
                this.examList = [];
            }
        },
        
        async showOption(exam) {
            // 如果是长按，不执行默认点击操作
            if (this.isLongPressed) {
                this.isLongPressed = false;
                return;
            }
            
            this.optionInfo.hashCode = exam.hashCode;
            this.currentExam = exam;
            
            try {
                // 加载历史记录用于计算题目数量
                const records = await historyRecordDao.queryMany(exam.questions || []);
                this.historyRecords = records;
                
                // 加载斩题数据用于计算实际可答题数量
                this.currentSlashedQuestions = await slashedQuestionDao.queryByBankHashCode(exam.hashCode);
                
                // 加载标星数据用于计算星标题目数量
                this.currentStarredQuestions = await starredQuestionDao.queryByBankHashCode(exam.hashCode);
            } catch (error) {
                console.error('加载数据失败:', error);
                this.historyRecords = [];
                this.currentSlashedQuestions = [];
                this.currentStarredQuestions = [];
            }
            
            // 默认总是显示选项弹窗，让用户选择答题模式和设置
            this.isShowOption = true;
        },
        
        // 获取总题目数量（根据设置动态计算）
        getTotalCounts() {
            if (!this.currentExam.questions) return 0;
            
            // 如果包含已斩题目，返回全部题目数量
            if (this.examSettings.includeSlashedQuestions) {
                return this.currentExam.questions.length;
            }
            
            // 否则排除已斩题目
            const slashedCount = this.currentSlashedQuestions.length;
            return this.currentExam.questions.length - slashedCount;
        },
        
        // 获取错题数量（根据设置动态计算）
        getErrorCounts() {
            if (!this.currentExam.questions || !this.historyRecords.length) return 0;
            
            // 如果包含已斩题目，返回全部错题数量
            if (this.examSettings.includeSlashedQuestions) {
                return this.historyRecords.filter(record => record.errorTimes > 0).length;
            }
            
            // 否则排除已斩题目的错题记录
            const slashedHashCodes = this.currentSlashedQuestions.map(sq => sq.questionHashCode);
            return this.historyRecords.filter(record => 
                record.errorTimes > 0 && !slashedHashCodes.includes(record.relatedQuestion)
            ).length;
        },
        
        // 获取未做题数量（根据设置动态计算）
        getUndoneCounts() {
            if (!this.currentExam.questions || !this.historyRecords.length) {
                return this.getTotalCounts();
            }
            
            // 如果包含已斩题目，计算全部未做题目
            if (this.examSettings.includeSlashedQuestions) {
                const doneQuestions = this.historyRecords.filter(record => 
                    (record.errorTimes || 0) + (record.rightTimes || 0) > 0
                ).length;
                return this.currentExam.questions.length - doneQuestions;
            }
            
            // 否则排除已斩题目计算未做题目
            const slashedHashCodes = this.currentSlashedQuestions.map(sq => sq.questionHashCode);
            const doneQuestions = this.historyRecords.filter(record => 
                ((record.errorTimes || 0) + (record.rightTimes || 0) > 0) && 
                !slashedHashCodes.includes(record.relatedQuestion)
            ).length;
            return this.getTotalCounts() - doneQuestions;
        },
        
        // 获取星标题目数量
        getStarredCounts() {
            return this.currentStarredQuestions.length;
        },
        
        // 切换答题设置
        toggleSetting(settingKey) {
            this.examSettings[settingKey] = !this.examSettings[settingKey];
        },
        
        doExam(hashCode, isReviewError = false, neverDo = false) {
            this.isShowOption = false; // 关闭弹窗
            
            
            bankDao.query('hashCode').equals(hashCode).first()
                .then(async exam => {
                    if (!exam) {
                        Dialog.alert({message: '该题库已失效！'});
                        return;
                    }
                    
                    // 使用映射表按顺序加载题目
                    const mappings = await questionBankMappingDao.getQuestionsByLibId(hashCode);
                    
                    if (mappings && mappings.length > 0) {
                        // 如果有映射表数据，按order顺序加载题目
                        const questions = [];
                        for (const mapping of mappings) {
                            const question = await questionDao.query('hashCode').equals(mapping.questionId).first();
                            if (question) {
                                questions.push(question);
                            }
                        }
                        exam.questions = questions;
                    } else {
                        // 兼容旧数据：如果没有映射表数据，使用原有逻辑
                        const questions = [];
                        for (const questionHashCode of exam.questions) {
                            const question = await questionDao.query('hashCode').equals(questionHashCode).first();
                            if (question) {
                                questions.push(question);
                            }
                        }
                        exam.questions = questions;
                    }
                    
                    this.$router.push({
                        name: 'DoExamPage',
                        params: {
                            examConfig: exam,
                            isReviewError,
                            neverDo
                        },
                        query: {
                            keepQuestionOrder: this.examSettings.keepQuestionOrder,
                            keepOptionOrder: this.examSettings.keepOptionOrder,
                            showRealIndex: this.examSettings.showRealIndex,
                            includeSlashedQuestions: this.examSettings.includeSlashedQuestions,
                            enableQuestionLimit: this.examSettings.enableQuestionLimit,
                            questionLimit: this.examSettings.questionLimit
                        }
                    })
                });
        },
        
        // 星标模式答题
        doStarredExam(hashCode) {
            this.isShowOption = false; // 关闭弹窗
            
            bankDao.query('hashCode').equals(hashCode).first()
                .then(async exam => {
                    if (!exam) {
                        Dialog.alert({message: '该题库已失效！'});
                        return;
                    }
                    
                    // 使用映射表按顺序加载题目
                    const mappings = await questionBankMappingDao.getQuestionsByLibId(hashCode);
                    
                    if (mappings && mappings.length > 0) {
                        // 如果有映射表数据，按order顺序加载题目
                        const questions = [];
                        for (const mapping of mappings) {
                            const question = await questionDao.queryByHashCode(mapping.questionId);
                            if (question) {
                                questions.push(question);
                            }
                        }
                        exam.questions = questions;
                    } else {
                        // 如果没有映射表，使用原有逻辑
                        const promises = (exam.questions || []).map(hashCode => questionDao.queryByHashCode(hashCode));
                        exam.questions = await Promise.all(promises);
                    }
                    
                    this.$router.push({
                        name: 'DoExamPage',
                        params: {
                            examConfig: exam,
                            isReviewError: false,
                            neverDo: false,
                            isStarredMode: true  // 标记为星标模式
                        },
                        query: {
                            keepQuestionOrder: this.examSettings.keepQuestionOrder,
                            keepOptionOrder: this.examSettings.keepOptionOrder,
                            showRealIndex: this.examSettings.showRealIndex,
                            includeSlashedQuestions: this.examSettings.includeSlashedQuestions,
                            enableQuestionLimit: this.examSettings.enableQuestionLimit,
                            questionLimit: this.examSettings.questionLimit,
                            isStarredMode: true  // 通过query参数传递星标模式标识
                        }
                    })
                });
        },
        
        clearHistory(hashCode) {
            this.isShowOption = false; // 先关闭弹窗
            
            // 第一层确认：基础确认
            Dialog.confirm({
                title: '⚠️ 清空记录确认',
                message: `
                    <div class="clear-history-dialog">
                        <div class="warning-text">即将清空该题库的所有记录，包括：</div>
                        <div class="clear-list">
                            <div class="clear-item">📊 答题历史记录</div>
                            <div class="clear-item">⚔️ 已斩题目记录</div>
                            <div class="clear-item">⭐ 题目标星记录</div>
                        </div>
                        <div class="warning-note">此操作不可恢复，请谨慎操作！</div>
                    </div>
                `,
                confirmButtonText: '继续清空',
                cancelButtonText: '取消',
                confirmButtonColor: 'var(--warning-color)',
                className: 'custom-clear-dialog',
                closeOnClickOverlay: false
            }).then(() => {
                // 第二层确认：最终确认
                Dialog.confirm({
                    title: '🚨 最终确认',
                    message: `
                        <div class="final-confirm-dialog">
                            <div class="danger-text">确定要永久删除该题库的所有记录吗？</div>
                            <div class="consequence-text">包括答题历史、斩题记录、星标记录等</div>
                            <div class="irreversible-text">⚠️ 此操作不可撤销！</div>
                        </div>
                    `,
                    confirmButtonText: '确认删除',
                    cancelButtonText: '再想想',
                    confirmButtonColor: 'var(--error-color)',
                    className: 'custom-danger-dialog',
                    closeOnClickOverlay: false
                }).then(async () => {
                    try {
                        // 显示加载提示
                        this.$toast.loading({
                            message: '正在清空记录...',
                            forbidClick: true,
                            duration: 0
                        });
                        
                        // 获取题库信息
                        const bank = await bankDao.queryByHashCode(hashCode);
                        if (!bank) {
                            this.$toast.fail('题库不存在');
                            return;
                        }
                        
                        const questions = bank.questions || [];
                        
                        // 并行清空所有相关数据
                        await Promise.all([
                            // 清空答题历史记录
                            historyRecordDao.delete(questions),
                            // 清空斩题记录
                            slashedQuestionDao.resetBankSlashedQuestions(hashCode),
                            // 清空星标记录
                            starredQuestionDao.clearByBankHashCode(hashCode)
                        ]);
                        
                        console.log('所有记录已清空');
                        this.$toast.clear();
                        this.$toast.success('记录清空成功！');
                        
                        // 重新加载数据
                        this.loadCategoryExams();
                        
                    } catch (error) {
                        console.error('清空记录失败:', error);
                        this.$toast.clear();
                        this.$toast.fail('清空记录失败，请重试');
                    }
                }).catch(() => {
                    // 用户在最终确认时取消
                    console.log('用户取消了最终确认');
                });
            }).catch(() => {
                // 用户在基础确认时取消
                console.log('用户取消了基础确认');
            });
        },

        // 长按开始
        onTouchStart(exam, event) {
            console.log('Touch start detected for exam:', exam.title);
            
            this.isLongPressed = false;
            // 清除之前的定时器
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
            }
            
            // 立即设置当前选中的题库，用于视觉反馈
            this.examToDelete = exam;
            
            this.longPressTimer = setTimeout(() => {
                console.log('Long press triggered for exam:', exam.title);
                this.isLongPressed = true;
                this.isShowDeleteConfirm = true;
                
                // 添加触觉反馈（如果支持）
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, this.longPressThreshold);
        },

        // 长按结束
        onTouchEnd(event) {
            console.log('Touch end detected');
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
                // 如果没有触发长按，清除选中的题库
                if (!this.isLongPressed) {
                    this.examToDelete = null;
                }
            }
        },

        // 鼠标按下（用于桌面端测试）
        onMouseDown(exam, event) {
            console.log('Mouse down detected for exam:', exam.title);
            this.onTouchStart(exam, event);
        },

        // 鼠标抬起（用于桌面端测试）
        onMouseUp(event) {
            console.log('Mouse up detected');
            this.onTouchEnd(event);
        },

        // 确认删除题库
        async confirmDeleteExam() {
            if (!this.examToDelete) return;

            this.isShowDeleteConfirm = false;
            
            try {
                const examToDelete = this.examToDelete;
                const categoryName = this.categoryName;
                
                // 1. 删除题库相关的历史记录
                await historyRecordDao.delete(examToDelete.questions || []);
                
                // 2. 删除题库
                await bankDao.delete(examToDelete.hashCode);
                
                // 3. 删除题库中的题目
                if (examToDelete.questions && examToDelete.questions.length > 0) {
                    await questionDao.delete(examToDelete.questions);
                }
                
                // 4. 检查当前分类是否还有其他题库
                const remainingBanks = await bankDao.query('hashCode').notEqual('').toArray();
                const categoryBanks = remainingBanks.filter(bank => {
                    const bankCategory = bank.category || 'default';
                    return bankCategory === categoryName;
                });
                
                // 5. 如果当前分类没有题库了，返回首页
                if (categoryBanks.length === 0) {
                    this.$toast.success('题库删除成功，该分类已为空');
                    this.$router.push('/');
                } else {
                    this.$toast.success('题库删除成功');
                    // 重新加载当前分类的题库列表
                    await this.loadCategoryExams();
                }
                
            } catch (error) {
                console.error('删除题库失败:', error);
                this.$toast.fail('删除题库失败，请重试');
            } finally {
                this.examToDelete = null;
            }
        },
        
        // ==================== 斩题管理相关方法 ====================
        
        // 打开斩题管理
        async openSlashManager(hashCode) {
            this.isShowOption = false; // 先关闭答题选项弹窗
            
            try {
                // 获取题库信息
                const exam = await bankDao.queryByHashCode(hashCode);
                if (!exam) {
                    this.$toast.fail('题库不存在');
                    return;
                }
                
                this.currentExam = exam;
                this.optionInfo.hashCode = hashCode;
                
                // 获取题库的所有题目
                const questions = await Promise.all(
                    exam.questions.map(qHashCode => questionDao.queryByHashCode(qHashCode))
                );
                this.currentExamQuestions = questions.filter(q => q); // 过滤掉null值
                
                // 获取已斩题目
                this.currentSlashedQuestions = await slashedQuestionDao.queryByBankHashCode(hashCode);
                
                this.showSlashManager = true;
            } catch (error) {
                console.error('打开斩题管理失败:', error);
                this.$toast.fail('打开斩题管理失败');
            }
        },
        
        // 获取斩题统计
        getSlashStats() {
            const totalQuestions = this.currentExamQuestions.length;
            const slashedCount = this.currentSlashedQuestions.length;
            const slashRate = totalQuestions > 0 ? Math.round((slashedCount / totalQuestions) * 100) : 0;
            
            return {
                totalQuestions,
                slashedCount,
                slashRate
            };
        },
        
        // 检查题目是否已斩
        isQuestionSlashed(questionHashCode) {
            return this.currentSlashedQuestions.some(sq => sq.questionHashCode === questionHashCode);
        },
        
        // 打开批量斩题弹窗
        openBatchSlashDialog() {
            this.selectedQuestions = [];
            this.showBatchSlashDialog = true;
            this.showSlashManager = false;
        },
        
        // 切换题目选择状态
        toggleQuestionSelection(questionHashCode) {
            const index = this.selectedQuestions.indexOf(questionHashCode);
            if (index > -1) {
                this.selectedQuestions.splice(index, 1);
            } else {
                this.selectedQuestions.push(questionHashCode);
            }
        },
        
        // 全选/反选
        toggleSelectAll() {
            const unslashedQuestions = this.currentExamQuestions.filter(q => 
                !this.isQuestionSlashed(q.hashCode)
            );
            
            if (this.selectedQuestions.length === unslashedQuestions.length) {
                // 当前全选，执行反选
                this.selectedQuestions = [];
            } else {
                // 当前未全选，执行全选（只选择未斩的题目）
                this.selectedQuestions = unslashedQuestions.map(q => q.hashCode);
            }
        },
        
        // 批量斩题
        async batchSlashQuestions() {
            if (this.selectedQuestions.length === 0) {
                this.$toast.fail('请先选择要斩的题目');
                return;
            }
            
            Dialog.confirm({
                title: '批量斩题',
                message: `确定要斩掉选中的 ${this.selectedQuestions.length} 道题目吗？`,
                confirmButtonText: '确认斩题',
                cancelButtonText: '取消',
                confirmButtonColor: 'var(--warning-color)',
                className: 'custom-slash-dialog',
                closeOnClickOverlay: true
            }).then(async () => {
                try {
                    await slashedQuestionDao.batchSlashQuestions(
                        this.selectedQuestions, 
                        this.optionInfo.hashCode, 
                        '批量斩题'
                    );
                    
                    // 重新加载斩题数据
                    this.currentSlashedQuestions = await slashedQuestionDao.queryByBankHashCode(this.optionInfo.hashCode);
                    
                    this.$toast.success(`成功斩掉 ${this.selectedQuestions.length} 道题目！`);
                    this.showBatchSlashDialog = false;
                    this.selectedQuestions = [];
                    
                    // 重新加载分类数据以更新统计
                    await this.loadCategoryExams();
                    
                    // 强制更新答题选项的数量显示
                    this.$forceUpdate();
                } catch (error) {
                    console.error('批量斩题失败:', error);
                    this.$toast.fail('批量斩题失败，请重试');
                }
            }).catch(() => {
                // 用户取消
            });
        },
        
        // 重置所有斩题
        async resetAllSlashedQuestions() {
            Dialog.confirm({
                title: '重置斩题',
                message: '确定要重置当前题库的所有斩题状态吗？重置后所有已斩题目将重新出现。',
                confirmButtonText: '确认重置',
                cancelButtonText: '取消',
                confirmButtonColor: 'var(--warning-color)',
                className: 'custom-warning-dialog',
                closeOnClickOverlay: true
            }).then(async () => {
                try {
                    await slashedQuestionDao.resetBankSlashedQuestions(this.optionInfo.hashCode);
                    
                    // 重新加载斩题数据
                    this.currentSlashedQuestions = [];
                    
                    this.$toast.success('斩题状态已重置');
                    
                    // 重新加载分类数据以更新统计
                    await this.loadCategoryExams();
                    
                    // 强制更新答题选项的数量显示
                    this.$forceUpdate();
                } catch (error) {
                    console.error('重置斩题失败:', error);
                    this.$toast.fail('重置失败，请重试');
                }
            }).catch(() => {
                // 用户取消
            });
        }
    },
    
    async mounted() {
        await this.loadCategoryExams();
    },
    
    // 组件销毁时清理定时器
    beforeDestroy() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
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
    overflow: hidden; /* 防止内容溢出网格项 */
}

.exam-grid .van-grid-item__content {
    padding: 0 !important;
    overflow: hidden; /* 防止内容溢出 */
}

.exam-item-card {
    animation: examItemAppear 0.5s ease-out both;
    width: 100%;
    overflow: hidden; /* 防止卡片内容溢出 */
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
    min-width: 0; /* 确保flex子元素可以收缩 */
    transition: all var(--transition-fast);
}

.exam-card-content.long-pressing {
    background: rgba(244, 67, 54, 0.1);
    transform: scale(0.98);
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
    min-width: 0; /* 确保flex子元素可以收缩到0宽度 */
    overflow: hidden; /* 防止内容溢出 */
}

.exam-title {
    margin: 0 0 4px 0;
    font-size: 15px; /* 稍微减小字体 */
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    /* 允许最多2行显示，超出则省略 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2; /* 标准属性 */
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word; /* 允许在任意位置换行 */
    hyphens: auto; /* 自动断词 */
}

.exam-meta {
    margin: 0 0 4px 0;
    font-size: 12px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.exam-status {
    margin-top: 4px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.slash-info {
    color: var(--warning-color);
    font-weight: 500;
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
    margin: 12px auto;
    padding: 16px;
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
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
}

.option-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 6px;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: center;
    min-height: 60px;
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
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
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

.option-item.info {
    background: rgba(25, 137, 250, 0.1);
    border-color: var(--info-color);
}

.option-item.info .option-icon {
    background: var(--info-color);
}

.option-item.starred {
    background: rgba(255, 215, 0, 0.1);
    border-color: #ffd700;
}

.option-item.starred .option-icon {
    background: #ffd700;
}

/* 答题设置样式 */
.exam-settings {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--border-light);
}

.settings-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-light);
}

.settings-icon {
    font-size: 16px;
    color: var(--primary-color);
    margin-right: 8px;
}

.settings-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}

.settings-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.setting-item {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    background: var(--bg-card);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--border-light);
    cursor: pointer;
    transition: all var(--transition-fast);
    min-height: 44px;
}

.setting-item:hover {
    background: var(--bg-hover);
    border-color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.setting-item:active {
    transform: translateY(0);
}

.setting-checkbox {
    margin-right: 8px;
    flex-shrink: 0;
}

.setting-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-left: 10px;
}

.setting-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.3;
}

.setting-desc {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.2;
    opacity: 0.8;
}

/* 题目数量限制设置样式 */
.limit-setting {
    align-items: flex-start !important;
}

.limit-setting .setting-content.full-width {
    margin-left: 10px;
    width: calc(100% - 10px);
}

.limit-header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    margin-bottom: 2px;
}

.limit-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 6px 8px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-light);
}

.limit-label {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
    white-space: nowrap;
}

.limit-input {
    flex: 1;
    min-width: 60px;
}

.limit-input .van-field__control {
    text-align: center;
    font-size: 12px;
}

.limit-text {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
    white-space: nowrap;
}

.option-icon .van-icon {
    font-size: 12px;
}

.option-info {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.option-title {
    font-weight: 600;
    font-size: 12px;
    color: var(--text-primary);
    margin-bottom: 1px;
    line-height: 1.1;
}

.option-count {
    font-size: 10px;
    color: var(--text-secondary);
    font-weight: 500;
    line-height: 1.1;
}

/* 移动端优化 */
@media (max-width: 480px) {
    .exam-options {
        width: 95vw;
        margin: 8px auto;
        padding: 12px;
    }
    
    .popup-header {
        margin-bottom: 10px;
        padding-bottom: 8px;
    }
    
    .exam-settings {
        margin-bottom: 12px;
        padding: 10px;
    }
    
    .settings-header {
        margin-bottom: 8px;
        padding-bottom: 4px;
    }
    
    .settings-options {
        gap: 6px;
    }
    
    .setting-item {
        padding: 6px 8px;
        min-height: 40px;
    }
    
    .header-info h3 {
        font-size: 16px;
    }
    
    .exam-title {
        font-size: 13px;
    }
    
    .option-grid {
        gap: 4px;
    }
    
    .option-item {
        padding: 8px 4px;
        min-height: 52px;
    }
    
    .option-icon {
        width: 20px;
        height: 20px;
        margin-bottom: 3px;
    }
    
    .option-icon .van-icon {
        font-size: 10px;
    }
    
    .option-title {
        font-size: 11px;
    }
    
    .option-count {
        font-size: 9px;
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

/* 删除确认弹窗样式 */
.delete-confirm-popup .van-popup {
    background: transparent;
}

.delete-confirm-content {
    width: 85vw;
    max-width: 320px;
    margin: 16px auto;
    padding: 32px 24px 24px;
    border-radius: var(--border-radius-lg);
    background: var(--bg-card);
    text-align: center;
}

.delete-icon {
    margin-bottom: 20px;
}

.delete-title {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.delete-message {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: var(--text-primary);
    line-height: 1.4;
}

.delete-message strong {
    color: var(--error-color);
    font-weight: 600;
}

.delete-warning {
    margin: 0 0 24px 0;
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
}

.delete-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.cancel-button,
.confirm-button {
    flex: 1;
    border-radius: var(--border-radius-md) !important;
    font-weight: 500;
    transition: all var(--transition-fast) !important;
}

.cancel-button {
    background: var(--bg-secondary) !important;
    border-color: var(--border-light) !important;
    color: var(--text-secondary) !important;
}

.confirm-button {
    background: var(--error-color) !important;
    border-color: var(--error-color) !important;
}

.cancel-button:active,
.confirm-button:active {
    transform: scale(0.95);
}

/* 移动端优化 */
@media (max-width: 480px) {
    .delete-confirm-content {
        width: 90vw;
        padding: 28px 20px 20px;
    }
    
    .delete-title {
        font-size: 16px;
    }
    
    .delete-message {
        font-size: 14px;
    }
    
    .delete-warning {
        font-size: 12px;
    }
    
    .delete-actions {
        gap: 10px;
    }
}

/* 斩题管理弹窗样式 */
.slash-manager-popup .van-popup {
    background: transparent;
}

.slash-manager {
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
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-light);
}

.header-info h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.header-info .exam-title {
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

.slash-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-md);
}

.stat-item {
    text-align: center;
    flex: 1;
}

.stat-label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.stat-value {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.stat-value.slash-count {
    color: var(--warning-color);
}

.slash-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.slash-actions .action-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast) !important;
}

.slash-actions .action-button:active {
    transform: scale(0.98);
}

.slash-actions .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* 批量斩题弹窗样式 */
.batch-slash-popup .van-popup {
    background: transparent;
}

.batch-slash-dialog {
    width: 95vw;
    max-width: 400px;
    margin: 16px auto;
    padding: 20px;
    border-radius: var(--border-radius-lg);
    background: var(--bg-card);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.batch-selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-md);
}

.select-all-btn {
    background: var(--info-color) !important;
    border-color: var(--info-color) !important;
}

.selection-count {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
}

.batch-question-list {
    flex: 1;
    overflow-y: auto;
    max-height: 300px;
    margin-bottom: 16px;
}

.batch-question-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius-sm);
    margin-bottom: 8px;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.batch-question-item:hover {
    background: var(--bg-secondary);
}

.batch-question-item.already-slashed {
    opacity: 0.6;
    background: var(--bg-secondary);
}

.question-preview {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-left: 12px;
}

.question-number {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 500;
}

.question-status {
    display: flex;
    gap: 4px;
}

.batch-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    border-top: 1px solid var(--border-light);
    padding-top: 16px;
}

.cancel-button,
.confirm-button {
    flex: 1;
    border-radius: var(--border-radius-md) !important;
    font-weight: 500;
    transition: all var(--transition-fast) !important;
}

.cancel-button {
    background: var(--bg-secondary) !important;
    border-color: var(--border-light) !important;
    color: var(--text-secondary) !important;
}

.confirm-button {
    background: var(--warning-color) !important;
    border-color: var(--warning-color) !important;
}

.confirm-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.cancel-button:active,
.confirm-button:active {
    transform: scale(0.95);
}

/* 清空记录对话框样式 */
.clear-history-dialog {
    text-align: center;
    padding: 8px 0;
}

.warning-text {
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 16px;
    font-weight: 500;
}

.clear-list {
    background: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    padding: 12px;
    margin-bottom: 16px;
}

.clear-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 0;
    font-size: 13px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-light);
}

.clear-item:last-child {
    border-bottom: none;
}

.warning-note {
    font-size: 12px;
    color: var(--warning-color);
    font-weight: 600;
    background: rgba(255, 193, 7, 0.1);
    padding: 8px 12px;
    border-radius: var(--border-radius-sm);
    border: 1px solid rgba(255, 193, 7, 0.3);
}

/* 最终确认对话框样式 */
.final-confirm-dialog {
    text-align: center;
    padding: 8px 0;
}

.danger-text {
    font-size: 15px;
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 12px;
}

.consequence-text {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 16px;
}

.irreversible-text {
    font-size: 13px;
    color: var(--error-color);
    font-weight: 600;
    background: rgba(244, 67, 54, 0.1);
    padding: 8px 12px;
    border-radius: var(--border-radius-sm);
    border: 1px solid rgba(244, 67, 54, 0.3);
}

/* 自定义对话框主题 */
:global(.custom-clear-dialog) {
    --van-dialog-confirm-button-color: var(--warning-color) !important;
}

:global(.custom-danger-dialog) {
    --van-dialog-confirm-button-color: var(--error-color) !important;
}

:global(.custom-clear-dialog .van-dialog__header),
:global(.custom-danger-dialog .van-dialog__header) {
    padding-bottom: 8px !important;
}

:global(.custom-clear-dialog .van-dialog__message),
:global(.custom-danger-dialog .van-dialog__message) {
    padding: 16px 20px !important;
}
</style>
