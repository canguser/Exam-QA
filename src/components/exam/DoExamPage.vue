<template>
    <div>
        <van-nav-bar
                :title="examInfo.title"
                fixed
                left-arrow
        ></van-nav-bar>
        <div v-for="(question, i) in questionsInfo" :key="i" v-if="i===questionNum">
            <van-panel :title="getQuestionTitle(question)">
                <div v-if="question.isMulti">
                    <van-checkbox-group v-model="question.answer.multi.apis">
                        <van-cell-group>
                            <van-cell v-for="(option, oi) in question.answerOptions"
                                      clickable @click="toggleAnswer(i, [option.api])"
                                      :key="oi">
                                <template slot="title">
                                    <span :class="{'right-answer':option.isRight&&question.answer.isAnswered,'error-answer':!option.isRight&&question.answer.isAnswered,'custom-title':true}">{{letterIndex[oi]+': '+option.describe}}</span>
                                </template>
                                <van-checkbox slot="right-icon" :name="option.api"></van-checkbox>
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
                                    <span :class="{'right-answer':option.isRight&&question.answer.isAnswered,'error-answer':!option.isRight&&question.answer.isAnswered,'custom-title':true}">{{letterIndex[oi]+': '+option.describe}}</span>
                                </template>
                                <van-radio slot="right-icon" :name="option.api"
                                           :checked-color="question.answer.results.map(res=>res.api).includes(option.api)&&option.isRight?'#44af11':'#cd0000'"></van-radio>
                            </van-cell>
                        </van-cell-group>
                    </van-radio-group>
                </div>
                <div slot="footer">
                    <div class="text-align-right">
                        <van-button size="small" v-if="i>0" @click="turnTo(i-1)">上一题</van-button>
                        <van-button size="small" type="info" v-if="i<totalNum-1" @click="turnTo(i+1)">下一题</van-button>
                        <van-button size="small" type="info" v-if="i===totalNum-1" @click="submit">提交</van-button>
                    </div>
                </div>
            </van-panel>
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
                isShowResult: true,
                letterIndex: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
            }
        },
        computed: {
            totalNum() {
                return this.questions.length;
            },
            questions() {
                return (this.examInfo.questions || []).map((q, i) => ({...q, active: i === this.questionNum}));
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
            }
        },
        methods: {
            getQuestionTitle(question) {
                return [`(${this.questionNum + 1}/${this.totalNum})`, question.describe].join(' ');
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
                if (this.isShowResult) {
                    this.checkResult(i);
                }
            },
            toggleAnswer(i, api) {
                console.log(this.answers[i]);
                let apis = this.answers[i].multi.apis;
                if (apis.includes(api)) {
                    apis = apis.filter(a => a !== api);
                } else {
                    apis.push(api);
                }
                this.setAnswer(i, apis);
            },
            checkResult(i) {
                this.answers = [...this.answers].map((answer, ai) => {
                    if (i !== ai) {
                        return answer;
                    }
                    let question = this.questions[ai];
                    let rightAnswers = question.answerOptions.filter(option => option.isRight).map(option => option.api);
                    answer.results.forEach(res => {
                        res.isMistake = !rightAnswers.includes(res.api);
                    });
                    answer.isAnswered = true;
                    answer.isMistake = !!answer.results.find(res => res.isMistake);
                    answer.isPass = answer.isAnswered && !answer.isMistake;
                    return answer;
                })
            },
            turnTo(i) {
                this.questionNum = i;
            },
            submit() {
                let answeredNum = this.questionsInfo.filter(q => q.answer.isAnswered).length;
                if (answeredNum !== this.totalNum) {
                    alert('题目还没有答完：' + `${answeredNum}/${this.totalNum}`);
                    return;
                }
                let rightNum = this.questionsInfo.filter(q => q.answer.isPass).length;
                let rightRate = (rightNum / this.totalNum) * 100 + '%';
                alert('答题结束，成绩如下：' + `正确：${rightNum}(总共：${this.totalNum})(正确率：${rightRate})`);
            }
        },
        props: {
            examInfo: {
                type: Object,
                default() {
                    return defaultExamInfo;
                }
            }
        },
    }
</script>

<style scoped>
    span.error-answer {
        color: #cd0000;
    }

    span.right-answer {
        color: #44af11;
    }

    span.custom-title {
        word-break: break-all;
    }
</style>