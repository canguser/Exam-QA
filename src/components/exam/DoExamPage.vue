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
                        <div class="question-header">
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
                                            <div class="option-text" v-html="option.describe"></div>
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
                                            <div class="option-text" v-html="option.describe"></div>
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
                            <div class="analysis-content" v-html="questionsInfo[questionNum].analysis || '暂无解析'"></div>
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
import utils from '../../utils';
import {historyRecordDao, bankDao} from '../../dao'

Vue.use(Row).use(Col);
// 全局注册
Vue.use(Dialog);
Vue.use(Checkbox).use(CheckboxGroup);
Vue.use(RadioGroup);
Vue.use(Radio);
Vue.use(Cell).use(CellGroup);

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
            panStartScrollTop: null // 记录滑动开始时的scrollTop
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
}
</style>