<template>
    <div ref="root" class="exam-root" v-finger:swipe="swipe" @touchstart="onTouchStart">
        <van-nav-bar
            :title="examInfo.title"
            fixed
            left-arrow
            right-text="目录"
            @click-left="handleBack"
            @click-right="showAcButtons = !showAcButtons"
            class="exam-nav-bar"
        ></van-nav-bar>
        <transition name="fade">
            <div class="ac-qn-backdrop" v-show="showAcButtons" @click.stop="showAcButtons = false">
                <div class="exam-p-around-small ac-qn theme-card" @click.stop>
                    <div class="qn-header">
                        <h3>题目导航</h3>
                        <span class="qn-progress">{{ questionNum + 1 }} / {{ totalNum }}</span>
                    </div>
                    <van-row class="question-nav-grid">
                        <van-col span="4" v-for="(question,i) in questionsInfo" :key="i">
                            <div class="exam-circle exam-done theme-button" @click="turnTo(i)"
                                 :class="getQuestionNavClass(question, i)">
                                {{ i + 1 }}
                            </div>
                        </van-col>
                    </van-row>
                </div>
            </div>
        </transition>
        <div class="question-container">
            <transition :name="transitionName" mode="out-in">
                <div class="loading-item" v-if="!questionsInfo[questionNum]">
                    <div class="question-card theme-card">
                        <div class="question-header">
                            <div class="question-title">加载中...</div>
                            <div class="question-desc">正在加载题目数据</div>
                        </div>
                    </div>
                </div>
                <div class="question-item" 
                     :key="questionNum" v-else>
                    <div class="question-card theme-card">
                        <div class="question-header" @click="handleImageClick">
                            <div class="question-title" v-for="t in getQuestionTitle(questionsInfo[questionNum])" v-html="t">
                            </div>
                            <div class="question-desc">{{ getQuestionDesc(questionsInfo[questionNum]) }}</div>
                        </div>
                        <div v-if="questionsInfo[questionNum].isMulti" class="options-container">
                            <van-checkbox-group v-model="questionsInfo[questionNum].answer.multi.apis" @click.stop>
                                <div class="option-list">
                                    <div v-for="(option, oi) in questionsInfo[questionNum].answerOptions"
                                              class="option-item theme-card"
                                              @click="toggleAnswer(questionNum, option.api)"
                                              :key="oi"
                                              :class="{'option-selected': questionsInfo[questionNum].answer.multi.apis.includes(option.api), 'option-correct': option.isRight&&(isShowResult||(questionsInfo[questionNum].answer.isChecked&&isPractice)), 'option-incorrect': !option.isRight&&(isShowResult||(!option.isRight&&questionsInfo[questionNum].answer.isAnswered&&isPractice)) && questionsInfo[questionNum].answer.multi.apis.includes(option.api)}">
                                        <div class="option-content">
                                            <div class="option-label">{{ letterIndex[oi] }}</div>
                                            <div class="option-text" v-html="option.describe" @click="handleImageClick"></div>
                                            <van-checkbox :name="option.api" :checked-color="getOptionColor(questionsInfo[questionNum],option)" class="option-checkbox"></van-checkbox>
                                        </div>
                                    </div>
                                </div>
                            </van-checkbox-group>
                        </div>
                        <div v-if="!questionsInfo[questionNum].isMulti" class="options-container">
                            <van-radio-group v-model="questionsInfo[questionNum].answer.single.api">
                                <div class="option-list">
                                    <div v-for="(option, oi) in questionsInfo[questionNum].answerOptions"
                                              class="option-item theme-card"
                                              @click="setAnswer(questionNum, [option.api])"
                                              :key="oi"
                                              :class="{'option-selected': questionsInfo[questionNum].answer.single.api === option.api, 'option-correct': option.isRight&&(isShowResult||(questionsInfo[questionNum].answer.isChecked&&isPractice)), 'option-incorrect': !option.isRight&&(isShowResult||(!option.isRight&&questionsInfo[questionNum].answer.isAnswered&&isPractice)) && questionsInfo[questionNum].answer.single.api === option.api}">
                                        <div class="option-content">
                                            <div class="option-label">{{ letterIndex[oi] }}</div>
                                            <div class="option-text" v-html="option.describe" @click="handleImageClick"></div>
                                            <van-radio :name="option.api" :checked-color="getOptionColor(questionsInfo[questionNum],option)" class="option-radio"></van-radio>
                                        </div>
                                    </div>
                                </div>
                            </van-radio-group>
                        </div>
                        <div class="question-analysis" 
                             v-if="isShowResult || !(isPractice&&!questionsInfo[questionNum].answer.isChecked)">
                            <div class="analysis-header">
                                <van-icon name="info-o" />
                                <span>题目解析</span>
                            </div>
                            <div class="analysis-content" v-html="questionsInfo[questionNum].analysis || '暂无解析'" @click="handleImageClick"></div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
        <div class="ac-buttons theme-card" v-if="questionsInfo[questionNum]">
            <div class="button-row">
                <van-button 
                    round 
                    v-if="questionNum>0" 
                    @click="turnTo(questionNum-1)"
                    class="nav-button theme-button">
                    <van-icon name="arrow-left" />
                    上一题
                </van-button>
                <van-button 
                    type="info" 
                    round 
                    v-if="questionNum<totalNum-1" 
                    @click="turnTo(questionNum+1)"
                    class="nav-button theme-button">
                    下一题
                    <van-icon name="arrow" />
                </van-button>
            </div>
            <div class="button-row">
                <van-button 
                    type="warning" 
                    round 
                    block
                    v-if="isPractice&&!questionsInfo[questionNum].answer.isChecked"
                    @click="checkResult(questionNum)"
                    class="action-button theme-button">
                    <van-icon name="eye-o" />
                    检查答案
                </van-button>
                <van-button 
                    type="primary" 
                    round 
                    block
                    v-if="!hasSubmit" 
                    @click="confirmSubmit"
                    class="submit-button theme-button pulse">
                    <van-icon name="success" />
                    提交答案
                </van-button>
            </div>
        </div>

        <!-- 图片预览弹窗 -->
        <div v-if="showImagePreview" class="image-preview-overlay" @click="handleBackgroundClick">
            <!-- 顶部控制栏 -->
            <div class="image-preview-controls-bar" @click.stop>
                <van-icon name="minus" class="control-icon" @click="zoomOut" />
                <span class="zoom-text">{{ Math.round(zoomLevel * 100) }}%</span>
                <van-icon name="plus" class="control-icon" @click="zoomIn" />
                <van-icon name="replay" class="control-icon" @click="resetZoom" title="重置" />
                <van-icon name="cross" class="control-icon close-icon" @click="closeImagePreview" />
            </div>
            
            <!-- 图片容器 -->
            <div 
                class="image-preview-content" 
                ref="imageContainer"
                @click="handleContainerClick"
                @dblclick="handleDoubleClick"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseLeave"
                @touchstart="handleImageTouchStart"
                @touchmove="handleImageTouchMove"
                @touchend="handleImageTouchEnd"
                @wheel="handleWheel"
            >
                <img 
                    :src="previewImageSrc" 
                    :alt="previewImageAlt" 
                    class="preview-image"
                    ref="previewImage"
                    :style="imageStyle"
                    @load="onImageLoad"
                    @dragstart.prevent
                    @dblclick.stop="handlePreviewImageDoubleClick"
                />
            </div>
        </div>

    </div>
</template>

<script>
import Vue from 'vue';
import {NavBar} from 'vant';
import {Panel} from 'vant';
import {Button} from 'vant';
import {Cell, CellGroup} from 'vant';
import {RadioGroup, Radio} from 'vant';
import {Checkbox, CheckboxGroup} from 'vant';
import {Dialog} from 'vant';
import {Row, Col} from 'vant';
import {Icon} from 'vant';
import utils from '../../utils';
import {historyRecordDao, bankDao} from '../../dao'

Vue.use(Row).use(Col);
// 全局注册
Vue.use(Dialog);
Vue.use(Checkbox).use(CheckboxGroup);
Vue.use(RadioGroup);
Vue.use(Radio);
Vue.use(Cell).use(CellGroup);
Vue.use(Icon);

const defaultQuestionInfo = {
    required: true,
    score: 1,
    usingScore: false,
    type: 'option', // text, number
    describe: 'Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?Do you love me?',
    answerOptions: [
        {api: 'A', describe: 'Yes', isRight: true},
        {api: 'B', describe: 'No'}
    ]
};

const defaultExamInfo = {
    title: '试题测试',
    questions: [defaultQuestionInfo]
};

Vue.use(NavBar).use(Panel).use(Button);

export default {
    name: "DoExamPage",
    data() {
        return {
            answers: [],
            questionNum: 0,
            isShowResult: false,
            letterIndex: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'],
            examInfo: {},
            hasSubmit: false,
            examHashCode: 0,
            historyExams: [],
            showAcButtons: false,
            backInterceptor: null, // 返回拦截器
            transitionName: 'question-slide-right',
            previousQuestionNum: 0,
            panStartScrollTop: null, // 记录滑动开始时的scrollTop
            showImagePreview: false, // 是否显示图片预览
            previewImageSrc: '', // 预览图片地址
            previewImageAlt: '', // 预览图片描述
            
            // 图片缩放和拖拽相关
            zoomLevel: 1, // 缩放级别
            translateX: 0, // X轴位移
            translateY: 0, // Y轴位移
            initialDistance: 0, // 双指初始距离
            initialZoom: 1, // 初始缩放级别
            lastTouchX: 0, // 上次触摸X坐标
            lastTouchY: 0, // 上次触摸Y坐标
            isDragging: false, // 是否正在拖拽
            isZooming: false, // 是否正在缩放
            imageNaturalWidth: 0, // 图片原始宽度
            imageNaturalHeight: 0, // 图片原始高度
            containerWidth: 0, // 容器宽度
            containerHeight: 0, // 容器高度
            
            // 鼠标拖动相关
            isMouseDragging: false, // 是否正在鼠标拖拽
            mouseStartX: 0, // 鼠标开始X坐标
            mouseStartY: 0, // 鼠标开始Y坐标
            lastClickTime: 0, // 上次点击时间（用于检测双击）
            doubleClickDelay: 300, // 双击检测延迟（毫秒）
            
            // 触摸双击检测相关
            lastTouchTime: 0, // 上次触摸时间
            lastTouchX: 0, // 上次触摸X坐标
            lastTouchY: 0, // 上次触摸Y坐标
            doubleTapDelay: 300, // 双击检测延迟（毫秒）
            doubleTapDistance: 50, // 双击位置允许的最大距离差（像素）
            touchMoved: false, // 是否有明显的触摸移动
        }
    },
    computed: {
        totalNum() {
            return this.questions.length;
        },
        questions() {
            return (this.examInfo.questions || []).filter(
                q => {
                    return this.isReviewError ? this.historyErrorHashCodes.includes(q.hashCode) : (this.neverDo ? (!this.doneHashCodes.includes(q.hashCode)) : true)
                }
            ).map((q, i) => ({...q, active: i === this.questionNum}));
        },
        questionsInfo() {
            return this.questions.map(
                (q, i) => {
                    if (!this.answers[i]) {
                        this.answers[i] = {results: [{}], single: {}, multi: {apis: []}}
                    }
                    return {
                        ...q,
                        answer: this.answers[i] || {},
                        orderNum: i + 1,
                        isMulti: q.answerOptions.filter(opt => opt.isRight).length > 1
                    }
                }
            )
        },
        historyErrorHashCodes() {
            return this.historyExams.filter(exam => exam.errorTimes > 0).map(exam => exam.hashCode);
        },
        doneHashCodes(){
            return this.historyExams.filter(exam => exam.errorTimes + exam.rightTimes > 0).map(exam => exam.hashCode);
        },
        
        // 图片样式计算
        imageStyle() {
            let cursor = 'zoom-in';
            if (this.zoomLevel > 1) {
                cursor = this.isDragging || this.isMouseDragging ? 'grabbing' : 'grab';
            }
            
            return {
                transform: `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoomLevel})`,
                transformOrigin: 'center center',
                transition: this.isDragging || this.isZooming || this.isMouseDragging ? 'none' : 'transform 0.3s ease',
                cursor: cursor,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
            };
        }
    },
    methods: {
        handleBack() {
            // 使用全局返回管理器
            if (window.GlobalBackManager) {
                window.GlobalBackManager.goBack();
            } else {
                // 降级处理：如果全局返回管理器不存在，使用原有逻辑
                this.originalHandleBack();
            }
        },
        
        // 原有的返回处理逻辑（保留作为降级方案）
        originalHandleBack() {
            // 检查是否需要确认退出
            if (this.shouldConfirmExit()) {
                Dialog.confirm({
                    title: '确认退出',
                    message: '当次答题没有保存，是否确认退出？',
                    confirmButtonText: '确认退出',
                    cancelButtonText: '继续答题',
                    confirmButtonColor: 'var(--warning-color)',
                    className: 'custom-warning-dialog',
                    closeOnClickOverlay: true
                }).then(() => {
                    this.$router.back();
                }).catch(() => {
                    // 用户取消，不执行任何操作
                });
            } else {
                // 直接返回
                this.$router.back();
            }
        },
        
        // 判断是否需要确认退出
        shouldConfirmExit() {
            // 如果已经提交答案，不需要确认
            if (this.hasSubmit) {
                return false;
            }
            
            // 检查是否至少答了一题
            const answeredCount = this.questionsInfo.filter(q => this.isQuestionAnswered(q)).length;
            return answeredCount > 0;
        },
        
        // 获取题目导航的样式类
        getQuestionNavClass(question, index) {
            let classes = {};
            
            // 当前题目
            classes['exam-current'] = this.questionNum === index;
            
            // 如果是结果显示模式或练习模式且已检查
            if (this.isShowResult || (question.answer.isChecked && this.isPractice)) {
                if (question.answer.isPass) {
                    classes['exam-right'] = true; // 绿色 - 检查后正确
                } else if (question.answer.isMistake) {
                    classes['exam-error'] = true; // 红色 - 检查后错误
                }
            } else {
                // 未检查状态，根据是否作答显示颜色
                if (this.isQuestionAnswered(question)) {
                    classes['exam-answered'] = true; // 蓝色 - 未检查但已作答
                }
                // 未作答保持默认颜色（不添加特殊class）
            }
            
            return classes;
        },
        
        // 注册返回拦截器
        registerBackInterceptor() {
            if (window.GlobalBackManager) {
                // 创建拦截器函数
                this.backInterceptor = () => {
                    // 如果图片预览弹窗打开，优先关闭弹窗
                    if (this.showImagePreview) {
                        this.closeImagePreview();
                        return true; // 拦截返回操作
                    }
                    
                    // 检查是否需要确认退出
                    if (this.shouldConfirmExit()) {
                        // 显示确认弹窗
                        Dialog.confirm({
                            title: '确认退出',
                            message: '当次答题没有保存，是否确认退出？',
                            confirmButtonText: '确认退出',
                            cancelButtonText: '继续答题',
                            confirmButtonColor: 'var(--warning-color)',
                            className: 'custom-warning-dialog',
                            closeOnClickOverlay: true
                        }).then(() => {
                            // 用户确认退出，移除拦截器并返回
                            this.unregisterBackInterceptor();
                            this.$router.back();
                        }).catch(() => {
                            // 用户取消，不执行任何操作
                        });
                        return true; // 拦截返回操作
                    }
                    return false; // 不拦截，继续正常返回流程
                };
                
                // 注册拦截器
                window.GlobalBackManager.addInterceptor(this.backInterceptor);
                console.log('答题页面返回拦截器已注册');
            }
        },
        
        // 移除返回拦截器
        unregisterBackInterceptor() {
            if (window.GlobalBackManager && this.backInterceptor) {
                window.GlobalBackManager.removeInterceptor(this.backInterceptor);
                this.backInterceptor = null;
                console.log('答题页面返回拦截器已移除');
            }
        },
        
        // 检查题目是否已答题
        isQuestionAnswered(question) {
            if (!question || !question.answer) return false;
            
            if (question.isMulti) {
                // 多选题：检查是否选择了至少一个选项
                return question.answer.multi && question.answer.multi.apis && question.answer.multi.apis.length > 0;
            } else {
                // 单选题：检查是否选择了选项
                return question.answer.single && question.answer.single.api;
            }
        },
        getQuestionTitle(question) {
            if (!question || !question.describe) {
                return [`(${this.questionNum + 1}/${this.totalNum})`, '加载中...'];
            }
            return [`(${this.questionNum + 1}/${this.totalNum})`, question.describe].join(' ').split('\n');
        },
        getQuestionDesc(question) {
            if (!question) {
                return '加载中...';
            }
            let result = '';
            if (!question.required) {
                result += '（可选）'
            }
            if (question.type === 'option') {
                if (question.isMulti) {
                    result += '多选题'
                } else {
                    result += '单选题'
                }
            }
            let errorExam = this.historyExams.find(exam => exam.hashCode === question.hashCode);
            if (errorExam) {
                if (this.isReviewError) {
                    if (errorExam.errorTimes) {
                        result += ` (做错次数: ${errorExam.errorTimes})`;
                    }
                }
                const totalTimes = errorExam.errorTimes + errorExam.rightTimes;
                if (totalTimes > 0) {
                    result += `（历史正确率：${(errorExam.rightTimes / totalTimes * 100).toFixed(0)}%）`;
                }
            }
            return result
        },
        /**
         * @param i
         * @param api {Array}
         */
        setAnswer(i, api) {
            this.answers = [...this.answers].map((answer, ai) => {
                if (ai === i) {
                    answer.results = api.map(a => ({api: a}));
                    answer.single.api = api[0];
                    answer.multi.apis = api;
                }
                return answer;
            });
        },
        toggleAnswer(i, api) {
            let apis = this.answers[i].multi.apis;
            if (apis.includes(api)) {
                apis = apis.filter(a => a !== api);
            } else {
                apis.push(api);
                apis = [...apis];
            }
            this.setAnswer(i, apis);
        },
        checkResult(i) {
            this.answers = [...this.answers].map((answer, ai) => {
                if (i !== ai && i != null) {
                    return answer;
                }
                console.log([...this.questions], ai)
                let question = this.questions[ai];
                if (!question) {
                    return answer;
                }
                let rightAnswers = question.answerOptions.filter(option => option.isRight).map(option => option.api);
                answer.results.forEach(res => {
                    res.isMistake = !rightAnswers.includes(res.api);
                });
                answer.isAnswered = answer.results.filter(res => res.api).length > 0;
                if (!answer.isChecked && answer.isAnswered) {
                    answer.isMistake = answer.results.length !== rightAnswers.length || !!answer.results.find(res => res.isMistake);
                    answer.isPass = answer.isAnswered && !answer.isMistake;
                    answer.isChecked = true;
                }
                return answer;
            })
        },
        turnTo(i) {
            const root = this.$refs.root;
            if (root) {
                root.scrollTop = 0;
            }
            
            // 设置过渡动画方向
            if (i > this.questionNum) {
                this.transitionName = 'question-slide-left';
            } else {
                this.transitionName = 'question-slide-right';
            }
            
            this.previousQuestionNum = this.questionNum;
            this.questionNum = i;
        },
        confirmSubmit() {
            // 计算答题状态
            const answeredNum = this.questionsInfo.filter(q => this.isQuestionAnswered(q)).length;
            const totalNum = this.totalNum;
            const progressRate = Math.round((answeredNum / totalNum) * 100);
            
            // 简化的弹窗内容
            const messageContent = `
                <div class="submit-dialog-content">
                    <div class="stats-row">
                        <span class="stat-text">已答 <strong class="primary">${answeredNum}</strong></span>
                        <span class="stat-text">未答 <strong class="secondary">${totalNum - answeredNum}</strong></span>
                        <span class="stat-text">完成 <strong class="success">${progressRate}%</strong></span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressRate}%;"></div>
                    </div>
                </div>
            `;

            Dialog.confirm({
                title: '📋 提交答案',
                message: messageContent,
                confirmButtonText: '确认提交',
                cancelButtonText: '继续答题',
                confirmButtonColor: 'var(--primary-color)',
                className: 'custom-submit-dialog',
                closeOnClickOverlay: true
            }).then(() => {
                this.submit();
            }).catch(e => {
                console.log(e);
            });
        },
        submit() {
            this.checkResult();
            let answeredNum = this.questionsInfo.filter(q => this.isQuestionAnswered(q)).length;
            if (answeredNum < this.totalNum && this.requireAllDone) {
                const unfinishedContent = `
                    <div class="simple-dialog-content">
                        <div class="simple-message">
                            还有 <strong class="warning">${this.totalNum - answeredNum}</strong> 道题未答完
                        </div>
                    </div>
                `;
                Dialog.alert({
                    title: '提醒',
                    message: unfinishedContent,
                    confirmButtonText: '继续答题',
                    className: 'custom-warning-dialog',
                    closeOnClickOverlay: true
                });
                return;
            }
            let rightNum = this.questionsInfo.filter(q => q.answer.isPass).length;
            let wrongNum = this.questionsInfo.filter(q => q.answer.isMistake).length;
            let rightRate = Math.round((rightNum / this.totalNum) * 100);
            
            // 录入错误信息
            let checkedQuestion = this.questionsInfo.filter(q => q.answer.isChecked);
            checkedQuestion.forEach(question => {
                historyRecordDao.queryByHashCode(question.hashCode).then(
                    codeInfo => {
                        if (!codeInfo) {
                            codeInfo = {relatedQuestion: question.hashCode, errorTimes: 0};
                        }
                        if (question.answer.isPass) {
                            if (isNaN(codeInfo.rightTimes)){
                                codeInfo.rightTimes = 0;
                            }
                            codeInfo.rightTimes++;
                        } else {
                            if (isNaN(codeInfo.errorTimes)){
                                codeInfo.errorTimes = 0;
                            }
                            codeInfo.errorTimes++;
                        }
                        console.log(codeInfo)
                        historyRecordDao.upsert(codeInfo)
                            .then(() => {
                                console.log('做题信息已保存');
                            });
                    }
                );
            });

            // 显示答题结果
            this.isShowResult = true;
            
            // 根据正确率显示不同的emoji和评价
            let emoji = '';
            let evaluation = '';
            let dialogClass = '';
            
            if (rightRate >= 90) {
                emoji = '🎉';
                evaluation = '太棒了！';
                dialogClass = 'custom-success-dialog';
            } else if (rightRate >= 80) {
                emoji = '👏';
                evaluation = '很好！';
                dialogClass = 'custom-success-dialog';
            } else if (rightRate >= 70) {
                emoji = '👍';
                evaluation = '不错！';
                dialogClass = 'custom-warning-dialog';
            } else if (rightRate >= 60) {
                emoji = '💪';
                evaluation = '继续努力！';
                dialogClass = 'custom-warning-dialog';
            } else {
                emoji = '📚';
                evaluation = '多多练习！';
                dialogClass = 'custom-error-dialog';
            }
            
            const resultContent = `
                <div class="result-dialog-content">
                    <div class="result-score ${rightRate >= 70 ? 'success' : rightRate >= 60 ? 'warning' : 'error'}">${rightRate}%</div>
                    <div class="result-summary">正确 ${rightNum}/${this.totalNum} 题</div>
                </div>
            `;
            
            Dialog.alert({
                title: '📊 答题结果',
                message: resultContent,
                confirmButtonText: '确定',
                className: dialogClass,
                closeOnClickOverlay: true
            });
            this.hasSubmit = true;
        },
        adaptExamConfig() {
            let examInfo = {...defaultExamInfo, ...this.examConfig};
            examInfo.questions = examInfo.questions.map(q => ({
                ...defaultQuestionInfo, ...q, hashCode: q.hashCode,
                answerOptions: !q.answerOptions ? [] : q.answerOptions.map(a => ({
                    ...a,
                    api: utils.getHashCode(a) + ''
                }))
            })).filter(q => {
                if (!q.describe || q.answerOptions.length === 0) {
                    console.log('错误的题目(无描述或无答案).', q);
                    return false;
                }
                // 去掉无正确答案的问题
                const checkNoAnswer = utils.groupArray(q.answerOptions, 'isRight');
                if (checkNoAnswer.length === 1 && !checkNoAnswer[0][0].isRight) {
                    console.log('错误的题目（无正确答案）.', q);
                    return false;
                }
                // 去掉问题中重复的答案
                const checkDuplicate = utils.groupArray(q.answerOptions, 'describe');
                const resultAnswers = checkDuplicate.map(checks => {
                    if (checks.length > 1) {
                        const result = {...checks[0]};
                        if (utils.groupArray(checks, 'isRight').length !== checks.length) {
                            result.invalid = true;
                        }
                        return result;
                    }
                    return checks[0];
                });
                // 去掉答案中有重复描述且对错不一的问题
                if (resultAnswers.find(r => r.invalid)) {
                    console.log('错误的题目（答案中有重复描述且对错不一）.', q);
                    return false;
                }
                q.answerOptions = utils.randomSort(resultAnswers);
                return true;
            });
            examInfo.questions = utils.randomSort(examInfo.questions);

            this.examInfo = examInfo;
            this.examHashCode = this.examConfig.hashCode;
            this.loadHistoryExamInfo();
        },
        getOptionColor(question, option) {
            if (this.isShowResult || (this.isPractice && question.answer.isChecked)) {
                return question.answer.results.map(res => res.api).includes(option.api) && option.isRight ? '#44af11' : '#cd0000'
            }
            return '#1989fa';
        },
        loadHistoryExamInfo() {
            historyRecordDao.queryMany(this.examConfig.questions.map(q => q.hashCode))
                .then(records => {
                    // console.log(records.map(r => r.relatedQuestion));
                    this.historyExams = records.map(r => ({...r, hashCode: r.relatedQuestion}));
                    // console.log(this.historyExams);
                });
            // const errorMapKey = 'errorMap_' + this.examHashCode;
            // let errorMap = utils.storage.getItem(errorMapKey);
            // if (errorMap) {
            //     this.historyExams = Object.entries(errorMap).map(([key, value]) => ({hashCode: key, ...value}));
            // }
        },
        onTouchStart: function (evt) {
            // 在触摸开始时记录scrollTop
            const root = this.$refs.root
            if (root) {
                this.panStartScrollTop = root.scrollTop
                console.log('touch开始，scrollTop:', this.panStartScrollTop)
            }
        },
        swipe: function (evt) {
            switch (evt.direction) {
                case 'Left':
                    if (this.questionNum < this.totalNum - 1) {
                        this.turnTo(this.questionNum + 1);
                    }
                    break;
                case 'Right':
                    if (this.questionNum > 0) {
                        this.turnTo(this.questionNum - 1);
                    }
                    break;
                case 'Up':
                    this.showAcButtons = false
                    break;
                case 'Down':
                    // 需要同时检查滑动开始和结束时的scrollTop都小于等于5
                    const root = this.$refs.root
                    if (root) {
                        const currentScrollTop = root.scrollTop
                        console.log('swipe Down触发，开始scrollTop:', this.panStartScrollTop, '结束scrollTop:', currentScrollTop)
                        
                        // 只有当滑动开始时和结束时的scrollTop都小于等于5时才显示目录
                        if (this.panStartScrollTop !== null && 
                            this.panStartScrollTop <= 5 && 
                            currentScrollTop <= 5) {
                            console.log('满足条件，显示目录弹窗')
                            this.showAcButtons = true
                        } else {
                            console.log('不满足条件，不显示目录弹窗')
                        }
                    }
                    break
                default:
            }
        },
        
        // 处理图片点击事件
        handleImageClick(event) {
            // 检查点击的是否是图片
            if (event.target.tagName.toLowerCase() === 'img') {
                // 只有在真正点击图片时才阻止事件冒泡
                event.stopPropagation();
                
                this.showImagePreview = true;
                this.previewImageSrc = event.target.src;
                this.previewImageAlt = event.target.alt || '图片';
                
                // 为了更好的用户体验，添加轻微的震动反馈
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // 添加键盘监听
                document.addEventListener('keydown', this.handleKeyDown);
                
                // 确保控制栏位置正确适配沉浸式状态栏
                this.$nextTick(() => {
                    this.adjustImagePreviewControlsPosition();
                    
                    // 调试DOM元素和事件绑定
                    console.log('图片预览打开后DOM检查:');
                    const overlay = this.$el.querySelector('.image-preview-overlay');
                    const container = this.$el.querySelector('.image-preview-content');
                    const img = this.$el.querySelector('.preview-image');
                    
                    console.log('overlay元素:', overlay);
                    console.log('container元素:', container);
                    console.log('img元素:', img);
                    
                    if (container) {
                        console.log('container计算样式:', window.getComputedStyle(container));
                        console.log('container位置信息:', container.getBoundingClientRect());
                    }
                    
                    if (img) {
                        console.log('img计算样式:', window.getComputedStyle(img));
                        console.log('img位置信息:', img.getBoundingClientRect());
                    }
                });
            }
            // 如果不是图片，不阻止事件冒泡，让选项正常被选中
        },
        
        // 调整图片预览控制栏位置以适配沉浸式状态栏
        adjustImagePreviewControlsPosition() {
            const controlsBar = this.$el.querySelector('.image-preview-controls-bar');
            if (controlsBar) {
                let topOffset = 20; // 默认顶部间距
                
                // 获取沉浸式状态栏高度
                let immersedHeight = 0;
                
                // 优先从全局变量获取
                if (window.app && window.app.immersed) {
                    immersedHeight = window.app.immersed;
                } else {
                    // 从CSS变量获取
                    const cssImmersedHeight = getComputedStyle(document.documentElement)
                        .getPropertyValue('--immersed-height').trim();
                    if (cssImmersedHeight) {
                        immersedHeight = parseFloat(cssImmersedHeight.replace('px', '')) || 0;
                    }
                }
                
                // 在移动端使用更小的间距
                if (window.innerWidth <= 768) {
                    topOffset = 10;
                }
                
                // 计算最终位置
                const finalTop = topOffset + immersedHeight;
                controlsBar.style.top = `${finalTop}px`;
                
            }
        },
        
        // 键盘事件处理
        handleKeyDown(event) {
            if (event.key === 'Escape' && this.showImagePreview) {
                this.closeImagePreview();
            }
        },
        
        // 关闭图片预览
        closeImagePreview() {
            this.showImagePreview = false;
            this.previewImageSrc = '';
            this.previewImageAlt = '';
            
            // 重置缩放和位移
            this.resetImageTransform();
            
            // 移除键盘监听
            document.removeEventListener('keydown', this.handleKeyDown);
        },
        
        // 重置图片变换
        resetImageTransform() {
            this.zoomLevel = 1;
            this.translateX = 0;
            this.translateY = 0;
            this.isDragging = false;
            this.isZooming = false;
            this.isMouseDragging = false;
            this.mouseStartX = 0;
            this.mouseStartY = 0;
            this.lastClickTime = 0;
            this.lastTouchTime = 0;
            this.lastTouchX = 0;
            this.lastTouchY = 0;
            this.touchMoved = false;
        },
        
        // 图片加载完成
        onImageLoad() {
            if (this.$refs.previewImage) {
                this.imageNaturalWidth = this.$refs.previewImage.naturalWidth;
                this.imageNaturalHeight = this.$refs.previewImage.naturalHeight;
                
                if (this.$refs.imageContainer) {
                    this.containerWidth = this.$refs.imageContainer.clientWidth;
                    this.containerHeight = this.$refs.imageContainer.clientHeight;
                }
            }
        },
        
        // 放大
        zoomIn() {
            this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
            this.constrainImagePosition();
        },
        
        // 缩小
        zoomOut() {
            this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
            this.constrainImagePosition();
        },
        
        // 重置缩放
        resetZoom() {
            this.zoomLevel = 1;
            this.translateX = 0;
            this.translateY = 0;
        },
        
        // 鼠标滚轮缩放
        handleWheel(event) {
            event.preventDefault();
            
            const delta = event.deltaY;
            const zoomFactor = delta > 0 ? 0.9 : 1.1;
            const newZoom = Math.min(Math.max(this.zoomLevel * zoomFactor, 0.1), 5);
            
            // 计算缩放中心点
            const rect = this.$refs.imageContainer.getBoundingClientRect();
            const centerX = event.clientX - rect.left - rect.width / 2;
            const centerY = event.clientY - rect.top - rect.height / 2;
            
            // 调整位移以保持缩放中心点
            const zoomChange = newZoom / this.zoomLevel;
            this.translateX = this.translateX + centerX * (1 - zoomChange);
            this.translateY = this.translateY + centerY * (1 - zoomChange);
            
            this.zoomLevel = newZoom;
            this.constrainImagePosition();
        },
        
        // 图片预览专用的滑动处理，阻止传播到根元素
        handleImageSwipe(evt) {
            // 阻止事件传播，防止触发题目切换
            evt.preventDefault && evt.preventDefault();
            evt.stopPropagation && evt.stopPropagation();
            
            // 在图片预览中，左右滑动用于移动图片而不是切换题目
            if (this.zoomLevel > 1) {
                // 当图片被放大时，滑动移动图片
                switch (evt.direction) {
                    case 'Left':
                        this.translateX -= 50;
                        break;
                    case 'Right':
                        this.translateX += 50;
                        break;
                    case 'Up':
                        this.translateY += 50;
                        break;
                    case 'Down':
                        this.translateY -= 50;
                        break;
                }
                this.constrainImagePosition();
            }
            // 如果图片没有放大（zoomLevel = 1），则忽略滑动，不进行任何操作
        },

        // 图片触摸开始 - 专门处理图片预览的触摸事件
        handleImageTouchStart(event) {
            
            event.preventDefault();
            event.stopPropagation(); // 阻止事件冒泡到根元素
            
            if (event.touches.length === 1) {
                const currentTime = Date.now();
                const touch = event.touches[0];
                
                // 检测双击
                const timeDiff = currentTime - this.lastTouchTime;
                const distanceX = Math.abs(touch.clientX - this.lastTouchX);
                const distanceY = Math.abs(touch.clientY - this.lastTouchY);
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                
                
                if (timeDiff < this.doubleTapDelay && distance < this.doubleTapDistance) {
                    // 双击检测成功
                    this.handleTouchDoubleTap(event);
                    return; // 不继续处理拖拽
                }
                
                // 记录此次触摸信息
                this.lastTouchTime = currentTime;
                this.lastTouchX = touch.clientX;
                this.lastTouchY = touch.clientY;
                this.touchMoved = false;
                
                // 立即开始拖拽准备，不延迟
                this.isDragging = true;
                this.lastTouchX = touch.clientX;
                this.lastTouchY = touch.clientY;
                
                
                // 添加拖拽样式
                if (this.$refs.imageContainer) {
                    this.$refs.imageContainer.classList.add('dragging');
                }
                
            } else if (event.touches.length === 2) {
                // 双指缩放
                this.isZooming = true;
                this.isDragging = false;
                
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                this.initialDistance = this.getDistance(touch1, touch2);
                this.initialZoom = this.zoomLevel;
                
                
                // 移除拖拽样式
                if (this.$refs.imageContainer) {
                    this.$refs.imageContainer.classList.remove('dragging');
                }
            }
        },
        
        
        // 处理触摸双击
        handleTouchDoubleTap(event) {
            
            if (this.zoomLevel === 1) {
                // 如果当前是原始大小，放大到2倍
                this.zoomToPoint(2, event.touches[0]);
            } else {
                // 如果已经放大，重置到原始大小
                this.resetZoom();
            }
        },
        
        // 图片触摸移动 - 专门处理图片预览的触摸事件
        handleImageTouchMove(event) {
            event.preventDefault();
            event.stopPropagation(); // 阻止事件冒泡到根元素
            
            if (event.touches.length === 1 && this.isDragging) {
                // 单指拖拽
                const deltaX = event.touches[0].clientX - this.lastTouchX;
                const deltaY = event.touches[0].clientY - this.lastTouchY;
                
                // 检查移动距离，如果超过阈值则标记为移动
                const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (moveDistance > 5) { // 移动超过5像素才算真正移动
                    this.touchMoved = true;
                }
                
                
                this.translateX += deltaX;
                this.translateY += deltaY;
                
                this.lastTouchX = event.touches[0].clientX;
                this.lastTouchY = event.touches[0].clientY;
                
                this.constrainImagePosition();
            } else if (event.touches.length === 2 && this.isZooming) {
                // 双指缩放
                this.touchMoved = true; // 缩放时也标记为移动
                
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                const currentDistance = this.getDistance(touch1, touch2);
                const scaleChange = currentDistance / this.initialDistance;
                
                
                this.zoomLevel = Math.min(Math.max(this.initialZoom * scaleChange, 0.1), 5);
                this.constrainImagePosition();
            }
        },
        
        // 图片触摸结束 - 专门处理图片预览的触摸事件
        handleImageTouchEnd(event) {
            
            event.preventDefault();
            event.stopPropagation(); // 阻止事件冒泡到根元素
            
            if (event.touches.length < 2) {
                this.isZooming = false;
            }
            
            if (event.touches.length === 0) {
                // 检查是否是单击背景关闭
                const isBackgroundClick = this.checkBackgroundClick(event);
                
                if (isBackgroundClick) {
                    this.closeImagePreview();
                    return;
                }
                
                this.isDragging = false;
                
                // 移除拖拽样式
                if (this.$refs.imageContainer) {
                    this.$refs.imageContainer.classList.remove('dragging');
                }
            }
        },
        
        // 检查是否是背景点击
        checkBackgroundClick(event) {
            
            // 如果有明显移动，不算单击
            if (this.touchMoved) {
                return false;
            }
            
            // 如果点击的是图片，不关闭
            if (event.target.tagName === 'IMG') {
                return false;
            }
            
            // 如果点击的是容器或背景层
            if (event.target.classList.contains('image-preview-content') || 
                event.target.classList.contains('image-preview-overlay')) {
                return true;
            }
            
            return false;
        },
        
        // 计算两点间距离
        getDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        // 约束图片位置，防止拖出边界
        constrainImagePosition() {
            if (!this.$refs.previewImage || !this.$refs.imageContainer) return;
            
            const img = this.$refs.previewImage;
            const container = this.$refs.imageContainer;
            
            // 获取图片和容器的实际尺寸
            const imgRect = img.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // 计算缩放后的图片尺寸
            const scaledWidth = img.offsetWidth * this.zoomLevel;
            const scaledHeight = img.offsetHeight * this.zoomLevel;
            
            
            // 如果图片比容器小，允许在容器范围内自由移动
            // 如果图片比容器大，限制在合理范围内
            let maxTranslateX, maxTranslateY;
            
            if (scaledWidth <= containerRect.width) {
                // 图片宽度小于容器，允许在容器范围内移动
                maxTranslateX = (containerRect.width - scaledWidth) / 2;
            } else {
                // 图片宽度大于容器，限制不超出边界
                maxTranslateX = (scaledWidth - containerRect.width) / 2;
            }
            
            if (scaledHeight <= containerRect.height) {
                // 图片高度小于容器，允许在容器范围内移动
                maxTranslateY = (containerRect.height - scaledHeight) / 2;
            } else {
                // 图片高度大于容器，限制不超出边界
                maxTranslateY = (scaledHeight - containerRect.height) / 2;
            }
            
            // 约束位移范围
            const oldTranslateX = this.translateX;
            const oldTranslateY = this.translateY;
            
            this.translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, this.translateX));
            this.translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, this.translateY));
            
        },
        
        // 处理单击背景退出
        handleBackgroundClick(event) {
            
            // 只有点击overlay背景层或容器空白区域才关闭
            if (event.target.classList.contains('image-preview-overlay') || 
                event.target.classList.contains('image-preview-content')) {
                this.closeImagePreview();
            }
        },
        
        // 处理容器点击事件
        handleContainerClick(event) {
            // 容器点击不阻止传播，让背景点击处理
        },
        
        // 处理预览图片单击事件
        handlePreviewImageClick(event) {
            event.stopPropagation();
            // 图片单击不做任何操作，防止关闭预览
        },
        
        // 处理预览图片双击事件
        handlePreviewImageDoubleClick(event) {
            
            event.stopPropagation();
            event.preventDefault();
            
            if (this.zoomLevel === 1) {
                // 如果当前是原始大小，放大到2倍
                this.zoomToPoint(2, event);
            } else {
                // 如果已经放大，重置到原始大小
                this.resetZoom();
            }
        },
        
        // 处理容器双击事件
        handleDoubleClick(event) {
            
            event.stopPropagation();
            event.preventDefault();
            
            // 只有当双击的不是图片本身时才处理容器双击
            if (event.target !== this.$refs.previewImage) {
                this.handlePreviewImageDoubleClick(event);
            }
        },
        
        // 缩放到指定点
        zoomToPoint(newZoom, eventOrTouch) {
            if (!this.$refs.imageContainer) return;
            
            const container = this.$refs.imageContainer;
            const rect = container.getBoundingClientRect();
            
            // 支持鼠标事件和触摸事件
            const clientX = eventOrTouch.clientX;
            const clientY = eventOrTouch.clientY;
            
            
            // 计算点击点相对于容器中心的偏移
            const centerX = clientX - rect.left - rect.width / 2;
            const centerY = clientY - rect.top - rect.height / 2;
            
            // 计算缩放前后的位置调整
            const zoomChange = newZoom / this.zoomLevel;
            
            // 调整位移以保持点击点在缩放中心
            this.translateX = this.translateX - centerX * (zoomChange - 1);
            this.translateY = this.translateY - centerY * (zoomChange - 1);
            
            this.zoomLevel = newZoom;
            this.constrainImagePosition();
        },
        
        // 鼠标按下事件
        handleMouseDown(event) {
            console.log('=== 鼠标按下事件触发 ===', { 
                button: event.button,
                clientX: event.clientX,
                clientY: event.clientY,
                target: event.target.tagName
            });
            
            if (event.button !== 0) return; // 只处理左键
            
            event.preventDefault();
            event.stopPropagation();
            
            this.isMouseDragging = true;
            this.mouseStartX = event.clientX;
            this.mouseStartY = event.clientY;
            
            console.log('开始拖拽状态:', { 
                isMouseDragging: this.isMouseDragging, 
                startX: this.mouseStartX, 
                startY: this.mouseStartY 
            });
            
            // 添加拖拽样式
            if (this.$refs.imageContainer) {
                this.$refs.imageContainer.classList.add('dragging');
            }
        },
        
        // 鼠标移动事件
        handleMouseMove(event) {
            if (!this.isMouseDragging) {
                return;
            }
            
            event.preventDefault();
            event.stopPropagation();
            
            const deltaX = event.clientX - this.mouseStartX;
            const deltaY = event.clientY - this.mouseStartY;
            
            console.log('=== 鼠标移动事件触发 ===', { 
                isMouseDragging: this.isMouseDragging,
                deltaX, 
                deltaY, 
                currentTranslateX: this.translateX, 
                currentTranslateY: this.translateY,
                zoomLevel: this.zoomLevel
            });
            
            // 简化拖动逻辑：任何时候都允许拖动
            this.translateX += deltaX;
            this.translateY += deltaY;
            
            console.log('拖动后位置:', { 
                newTranslateX: this.translateX, 
                newTranslateY: this.translateY 
            });
            
            this.constrainImagePosition();
            
            this.mouseStartX = event.clientX;
            this.mouseStartY = event.clientY;
        },
        
        // 鼠标松开事件
        handleMouseUp(event) {
            if (!this.isMouseDragging) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            this.isMouseDragging = false;
            
            // 移除拖拽样式
            if (this.$refs.imageContainer) {
                this.$refs.imageContainer.classList.remove('dragging');
            }
        },
        
        // 鼠标离开事件
        handleMouseLeave(event) {
            if (this.isMouseDragging) {
                this.handleMouseUp(event);
            }
        }
    },
    props: {
        examConfig: {
            type: Object,
            default() {
                return defaultExamInfo;
            }
        },
        isReviewError: {
            type: Boolean,
            default: false
        },
        neverDo: {
            type: Boolean,
            default: false
        },
        isNew: {
            type: Boolean,
            default: false
        },
        requireAllDone: {
            type: Boolean,
            default: false
        },
        isPractice: {
            type: Boolean,
            default: true
        }
    },
    watch: {
        examConfig() {
            this.adaptExamConfig();
        }
    },
    mounted() {
        this.adaptExamConfig();
        console.log('开始答题');
        try {
            plus.device.setWakelock(true);
            console.log('打开屏幕常亮');
        } catch (e) {
            // ignore
        }
        // 注册返回拦截器
        this.registerBackInterceptor();
        
    },
    destroyed() {
        console.log('结束答题');
        try {
            plus.device.setWakelock(false);
            console.log('关闭屏幕常亮');
        } catch (e) {
            // ignore
        }
        // 移除返回拦截器
        this.unregisterBackInterceptor();
        
        // 清理键盘监听器
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}
</script>

<style scoped>
.exam-root {
    overflow-x: hidden;
    top: 0;
    bottom: 0;
    background: var(--bg-primary);
    min-height: 100vh;
}

/* 导航栏美化 */
.exam-nav-bar {
    background: var(--primary-gradient) !important;
    box-shadow: var(--shadow-md);
}

/* 题目导航弹窗 */
.ac-qn-backdrop {
    position: fixed;
    top: 46px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

.ac-qn {
    z-index: 1001;
    background: var(--bg-card);
    border-radius: var(--border-radius-lg);
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    animation: popIn 0.3s ease-out;
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: scale(0.8) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.qn-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-light);
}

.qn-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

.qn-progress {
    font-size: 14px;
    color: var(--primary-color);
    font-weight: 500;
    background: var(--bg-secondary);
    padding: 4px 8px;
    border-radius: var(--border-radius-sm);
}

.question-nav-grid {
    gap: 8px;
}

.exam-circle {
    height: 2.5rem;
    width: 2.5rem;
    border: 2px solid var(--primary-color);
    border-radius: 50%;
    line-height: 2.1rem;
    text-align: center;
    color: var(--primary-color);
    cursor: pointer;
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 14px;
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
}

.exam-circle:active {
    transform: scale(0.9);
}

.exam-circle.exam-error {
    color: var(--error-color);
    border-color: var(--error-color);
    animation: wobble 0.5s ease-in-out;
}

.exam-circle.exam-right {
    color: var(--success-color);
    border-color: var(--success-color);
    position: relative;
}

.exam-circle.exam-right::after {
    content: '✓';
    position: absolute;
    top: 6px;
    left: 6px;
    width: 16px;
    height: 16px;
    background: var(--success-color);
    color: white;
    border-radius: 50%;
    font-size: 10px;
    line-height: 16px;
    text-align: center;
}

.exam-circle.exam-answered {
    color: var(--info-color);
    border-color: var(--info-color);
    position: relative;
}

.exam-circle.exam-answered::after {
    content: '●';
    position: absolute;
    top: 6px;
    left: 6px;
    width: 16px;
    height: 16px;
    background: var(--info-color);
    color: white;
    border-radius: 50%;
    font-size: 8px;
    line-height: 16px;
    text-align: center;
}

.exam-circle.exam-current {
    background: var(--primary-gradient);
    color: var(--text-white);
    border-color: transparent;
    box-shadow: var(--shadow-md);
    transform: scale(1.1);
}

.exam-circle.exam-error.exam-current {
    background: var(--error-color);
    border-color: var(--error-color);
}

.exam-circle.exam-right.exam-current {
    background: var(--success-color);
    border-color: var(--success-color);
}

.exam-circle.exam-answered.exam-current {
    background: var(--info-color);
    border-color: var(--info-color);
}

/* 题目容器 */
.question-container {
    position: relative;
    width: 100%;
    min-height: calc(100vh - 180px);
    padding-bottom: 120px;
    padding-top: 60px;
    padding-left: 16px;
    padding-right: 16px;
}

.question-item {
    width: 100%;
    padding: 0 8px;
}

.question-card {
    background: var(--bg-card);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    animation: questionSlideIn 0.5s ease-out;
}

@keyframes questionSlideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 题目头部 */
.question-header {
    padding: 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-light);
}

.question-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.6;
    margin-bottom: 8px;
    word-break: break-word;
    white-space: break-spaces;
}

.question-desc {
    font-size: 12px;
    color: var(--text-secondary);
    background: var(--bg-card);
    padding: 6px 12px;
    border-radius: var(--border-radius-sm);
    display: inline-block;
}

/* 选项容器 */
.options-container {
    padding: 16px;
}

.option-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.option-item {
    border: 2px solid var(--border-light);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-normal);
    cursor: pointer;
    overflow: hidden;
    position: relative;
}

.option-item:active {
    transform: scale(0.98);
}

.option-item.option-selected {
    border-color: var(--primary-color);
    background: var(--bg-overlay);
    box-shadow: var(--shadow-sm);
}

.option-item.option-correct {
    border-color: var(--success-color);
    background: rgba(76, 175, 80, 0.1);
}

.option-item.option-incorrect {
    border-color: var(--error-color);
    background: rgba(244, 67, 54, 0.1);
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.option-content {
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 12px;
}

.option-label {
    width: 32px;
    height: 32px;
    background: var(--primary-color);
    color: var(--text-white);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
    transition: all var(--transition-fast);
}

.option-correct .option-label {
    background: var(--success-color);
}

.option-incorrect .option-label {
    background: var(--error-color);
}

.option-text {
    flex: 1;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary);
    word-break: break-word;
    white-space: break-spaces;
}

.option-checkbox,
.option-radio {
    flex-shrink: 0;
}

/* 题目解析 */
.question-analysis {
    margin: 16px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: var(--border-radius-md);
    border-left: 4px solid var(--info-color);
    animation: analysisAppear 0.5s ease-out;
}

@keyframes analysisAppear {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.analysis-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--info-color);
    font-size: 14px;
}

.analysis-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
    word-break: break-word;
    white-space: break-spaces;
}

/* 底部按钮区域 */
.ac-buttons {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: var(--bg-card);
    box-shadow: 0 -4px 20px rgba(0, 196, 167, 0.15);
    border-top: 1px solid var(--border-light);
    z-index: 100;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.button-row {
    display: flex;
    gap: 12px;
    margin-bottom: 8px;
}

.button-row:last-child {
    margin-bottom: 0;
}

.nav-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
}

.action-button,
.submit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
    font-size: 16px;
    height: 48px;
    box-shadow: var(--shadow-md);
}

.submit-button {
    background: var(--primary-gradient) !important;
    border: none;
    position: relative;
    overflow: hidden;
}

.submit-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s;
}

.submit-button:active::before {
    left: 100%;
}

/* 全局美化 */
.van-cell {
    border-radius: var(--border-radius-sm) !important;
    margin-bottom: 4px;
    border: 1px solid var(--border-light);
}

.van-checkbox,
.van-radio {
    margin-right: 0 !important;
}

.van-checkbox__icon--checked,
.van-radio__icon--checked {
    background-color: var(--primary-color) !important;
    border-color: var(--primary-color) !important;
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
    transition: all var(--transition-normal);
}

.fade-enter, .fade-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

/* 题目切换动画 - 向左滑动 (下一题) */
.question-slide-left-enter-active,
.question-slide-left-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-slide-left-enter {
    opacity: 0;
    transform: translateX(100px);
}

.question-slide-left-leave-to {
    opacity: 0;
    transform: translateX(-100px);
}

/* 题目切换动画 - 向右滑动 (上一题) */
.question-slide-right-enter-active,
.question-slide-right-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.question-slide-right-enter {
    opacity: 0;
    transform: translateX(-100px);
}

.question-slide-right-leave-to {
    opacity: 0;
    transform: translateX(100px);
}

.question-item {
    padding: 0 4px;
    margin: 10px 0 50px 0;
}

/* 图片预览弹窗样式 */
.image-preview-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 2000;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* 顶部控制栏 */
.image-preview-controls-bar {
    position: fixed;
    top: calc(20px + var(--immersed-height, 0px));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 12px 20px;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    z-index: 2001;
    animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

.control-icon {
    font-size: 20px;
    color: #333;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: all var(--transition-fast);
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
}

.control-icon:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
}

.control-icon:active {
    transform: scale(0.95);
}

.close-icon {
    color: #ff4757;
    font-size: 22px;
}

.close-icon:hover {
    background: rgba(255, 71, 87, 0.1);
}

.zoom-text {
    font-size: 14px;
    color: #333;
    font-weight: 600;
    min-width: 50px;
    text-align: center;
    background: rgba(0, 0, 0, 0.05);
    padding: 6px 12px;
    border-radius: 20px;
    border: none;
}

/* 图片容器 - 全屏无边框 */
.image-preview-content {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    touch-action: none; /* 禁用默认触摸行为 */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.preview-image {
    max-width: none; /* 移除宽度限制 */
    max-height: none; /* 移除高度限制 */
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 0; /* 无边框 */
    box-shadow: none; /* 无阴影 */
}

/* 当图片被缩放时的拖拽光标 */
.image-preview-content.dragging {
    cursor: grabbing !important;
}

.image-preview-content.dragging .preview-image {
    cursor: grabbing !important;
}

/* 图片预览拖拽优化 */
.image-preview-content {
    /* 防止图片在拖拽时被选中 */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    
    /* 防止长按时出现上下文菜单 */
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
}

.preview-image {
    /* 防止图片拖拽时出现虚影 */
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    
    /* 提高拖拽性能 */
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}

/* 为图片添加点击提示样式 */
.question-title img,
.option-text img,
.analysis-content img {
    cursor: pointer;
    border-radius: var(--border-radius-sm);
    transition: all var(--transition-fast);
    border: 2px solid transparent;
}

.question-title img:hover,
.option-text img:hover,
.analysis-content img:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(0, 196, 167, 0.3);
    transform: scale(1.02);
}

.question-title img:active,
.option-text img:active,
.analysis-content img:active {
    transform: scale(0.98);
}

/* 响应式设计 */
@media (max-width: 768px) {
    .question-container {
        padding-left: 8px;
        padding-right: 8px;
    }
    
    .question-item {
        padding: 0 4px;
    }
    
    .exam-circle {
        height: 2rem;
        width: 2rem;
        line-height: 1.6rem;
        font-size: 12px;
    }
    
    .option-content {
        padding: 12px;
    }
    
    .option-label {
        width: 28px;
        height: 28px;
        font-size: 12px;
    }
    
    /* 移动端控制栏优化 */
    .image-preview-controls-bar {
        top: calc(10px + var(--immersed-height, 0px));
        padding: 8px 16px;
        gap: 12px;
        border-radius: 40px;
    }
    
    .control-icon {
        font-size: 18px;
        padding: 6px;
        width: 36px;
        height: 36px;
    }
    
    .close-icon {
        font-size: 20px;
    }
    
    .zoom-text {
        font-size: 12px;
        min-width: 45px;
        padding: 4px 8px;
        border-radius: 18px;
    }
    
    /* 移动端触摸优化 */
    .image-preview-content {
        -webkit-overflow-scrolling: touch;
    }
    
    /* 防止移动端双击缩放页面 */
    .image-preview-overlay {
        touch-action: manipulation;
    }
}
</style>