<template>
    <div class="exam-root" v-finger:swipe="swipe">
        <van-nav-bar
                :title="examInfo.title"
                fixed
                left-arrow
                @click-left="$router.back()"
        ></van-nav-bar>
        <div class="question-box"
             :style="`width: ${totalNum*100}%;transform:translate(${-questionNum*100/totalNum}%,0)`">
            <div class="question-item" v-for="(question,i) in questionsInfo" :key="question.hashCode">
                <van-panel :title="getQuestionTitle(question)" :desc="getQuestionDesc(question)">
                    <div v-if="question.isMulti">
                        <van-checkbox-group v-model="question.answer.multi.apis">
                            <van-cell-group>
                                <van-cell v-for="(option, oi) in question.answerOptions"
                                          clickable @click="toggleAnswer(i, option.api)"
                                          :key="oi">
                                    <template slot="title">
                                        <span :class="{'right-answer':option.isRight&&isShowResult||(option.isRight&&question.answer.isChecked&&isPractice),'error-answer':!option.isRight&&isShowResult||(!option.isRight&&question.answer.isAnswered&&isPractice),'custom-title':true}">{{letterIndex[oi]+'. '+option.describe}}</span>
                                    </template>
                                    <van-checkbox slot="right-icon" :name="option.api"
                                                  :checked-color="getOptionColor(question,option)"></van-checkbox>
                                </van-cell>
                            </van-cell-group>
                        </van-checkbox-group>
                    </div>
                    <div v-if="!question.isMulti">
                        <van-radio-group v-model="question.answer.single.api">
                            <van-cell-group>
                                <van-cell v-for="(option, oi) in question.answerOptions"
                                          clickable @click="setAnswer(i, [option.api])"
                                          :key="oi">
                                    <template slot="title">
                                        <span :class="{'right-answer':option.isRight&&isShowResult||(option.isRight&&question.answer.isChecked&&isPractice),'error-answer':!option.isRight&&isShowResult||(!option.isRight&&question.answer.isAnswered&&isPractice),'custom-title':true}">{{letterIndex[oi]+'. '+option.describe}}</span>
                                    </template>
                                    <van-radio slot="right-icon" :name="option.api"
                                               :checked-color="getOptionColor(question,option)"></van-radio>
                                </van-cell>
                            </van-cell-group>
                        </van-radio-group>
                    </div>
                    <div slot="footer">
                        <div class="text-align-right">
                            <van-button size="small" v-if="i>0" @click="turnTo(i-1)">上一题</van-button>
                            <van-button size="small" type="info" v-if="i<totalNum-1" @click="turnTo(i+1)">下一题
                            </van-button>
                            <van-button size="small" type="warning" v-if="isPractice&&!question.answer.isChecked"
                                        @click="checkResult(questionNum)">检查该题答案
                            </van-button>
                            <van-button size="small" type="primary" v-if="!hasSubmit" @click="confirmSubmit">提交
                            </van-button>
                        </div>
                    </div>
                </van-panel>
            </div>
        </div>
        <div class="exam-m-top-small">
            <div class="exam-p-around-small">
                <van-row>
                    <van-col span="4" v-for="(question,i) in questionsInfo" :key="i">
                        <div class="exam-circle exam-done" @click="turnTo(i)"
                             :class="{'exam-right':question.answer.isPass&&(isShowResult||(question.answer.isChecked&&isPractice)),'exam-error':question.answer.isMistake&&(isShowResult||(question.answer.isChecked&&isPractice)),'exam-current': questionNum === i}">
                            {{i+1}}
                        </div>
                    </van-col>
                </van-row>
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
                historyExams: []
            }
        },
        computed: {
            totalNum() {
                return this.questions.length;
            },
            questions() {
                return (this.examInfo.questions || []).filter(
                    q => this.isReviewError ? this.historyErrorHashCodes.includes(q.hashCode) : true
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
                            answer: this.answers[i],
                            orderNum: i + 1,
                            isMulti: q.answerOptions.filter(opt => opt.isRight).length > 1
                        }
                    }
                )
            },
            historyErrorHashCodes() {
                return this.historyExams.filter(exam => exam.errorTimes > 0).map(exam => exam.hashCode);
            }
        },
        methods: {
            getQuestionTitle(question) {
                return [`(${this.questionNum + 1}/${this.totalNum})`, question.describe].join(' ');
            },
            getQuestionDesc(question) {
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
                return result;
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
                    let question = this.questions[ai];
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
                this.questionNum = i;
            },
            confirmSubmit() {
                Dialog.confirm({
                    title: '提交答案',
                    message: '确认提交？'
                }).then(() => {
                    this.submit();
                }).catch(e => {
                    console.log(e);
                });
            },
            submit() {
                this.checkResult();
                let answeredNum = this.questionsInfo.filter(q => q.answer.isAnswered).length;
                if (answeredNum < this.totalNum && this.requireAllDone) {
                    Dialog.alert({message: '题目还没有答完：' + `${answeredNum}/${this.totalNum}`});
                    return;
                }
                let rightNum = this.questionsInfo.filter(q => q.answer.isPass).length;
                let rightRate = (rightNum / this.totalNum) * 100 + '%';

                // 录入错误信息
                let checkedQuestion = this.questionsInfo.filter(q => q.answer.isChecked);
                checkedQuestion.forEach(question => {
                    historyRecordDao.queryByHashCode(question.hashCode).then(
                        codeInfo => {
                            if (!codeInfo) {
                                codeInfo = {relatedQuestion: question.hashCode, errorTimes: 0};
                            }
                            if (question.answer.isPass) {
                                codeInfo.rightTimes++;
                            } else {
                                codeInfo.errorTimes++;
                            }
                            historyRecordDao.upsert(codeInfo)
                                .then(() => {
                                    console.log('做题信息已保存');
                                });
                        }
                    );
                });

                // 显示答题结果
                this.isShowResult = true;
                Dialog.alert({message: '答题结束，成绩如下：' + `正确：${rightNum}(总共：${this.totalNum})(正确率：${rightRate})`});
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
        },
        destroyed() {
            console.log('结束答题');
            try {
                plus.device.setWakelock(false);
                console.log('关闭屏幕常亮');
            } catch (e) {
                // ignore
            }
        }
    }
</script>

<style scoped>
    .exam-root {
        overflow-x: hidden;
    }

    span.error-answer {
        color: #cd0000;
    }

    span.right-answer {
        color: #44af11;
    }

    span.custom-title {
        word-break: break-word;
    }

    .exam-circle {
        height: 2rem;
        width: 2rem;
        border: 1px solid #1989fa;
        border-radius: 50%;
        line-height: 2rem;
        text-align: center;
        color: #1989fa;
        cursor: pointer;
        margin-bottom: .5rem;
    }

    .exam-circle.exam-error {
        color: #cd0000;
        border-color: #cd0000;
    }

    .exam-circle.exam-right {
        color: #44af11;
        border-color: #44af11;
    }

    .exam-circle.exam-current {
        background-color: #1989fa;
        color: white;
    }

    .exam-circle.exam-error.exam-current {
        background-color: #cd0000;
        color: white;
    }

    .exam-circle.exam-right.exam-current {
        background-color: #44af11;
        color: white;
    }

    .question-box {
        position: relative;
        width: 100%;
        display: flex;
        transition: transform .35s;
    }

    .question-item {
        width: 100%;
    }

    .question-enter, .question-leave-to {
        opacity: 0;
    }

</style>