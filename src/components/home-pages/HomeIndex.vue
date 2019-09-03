<template>
    <div>
        <van-grid>
            <van-grid-item
                    icon="notes-o"
                    clickable
                    @click="showImporter">
                <div slot="text" class="van-grid-item__text text-align-center">开始答题（导入）</div>
            </van-grid-item>
            <van-grid-item
                    v-for="exam in examList"
                    :key="exam.hashCode"
                    icon="notes-o"
                    clickable
                    @click="showOption(exam)">
                <div slot="text" class="van-grid-item__text text-align-center">{{exam.title}}</div>
            </van-grid-item>
        </van-grid>
        <van-popup v-model="isShowImporter">
            <div class="exam-import-box">
                <van-cell-group>
                    <van-field
                            v-model="questionLib"
                            label="题库"
                            type="textarea"
                            placeholder="请输入题库"
                            rows="10"></van-field>
                </van-cell-group>
                <van-button type="info" size="small" block @click="importLib">导入题库</van-button>
            </div>
        </van-popup>
        <van-popup v-model="isShowOption" position="bottom">
            <div class="">
                <van-button type="primary" block @click="doExam(optionInfo.hashCode)">重新测试
                </van-button>
                <van-button type="info" block @click="doExam(optionInfo.hashCode,true)">复习错题
                </van-button>
                <van-button type="danger" block @click="clearHistory(optionInfo.hashCode)">清空错题
                </van-button>
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
    import {Dialog} from 'vant';

    Vue.use(Dialog);
    Vue.use(Field).use(Cell).use(CellGroup);
    Vue.use(Button);
    Vue.use(Popup);
    Vue.use(Grid).use(GridItem);
    export default {
        name: "HomeIndex",
        data() {
            return {
                isShowImporter: false,
                isShowOption: false,
                questionLib: '',
                examList: [],
                optionInfo: {
                    canReviewError: true,
                    canDoExam: true,
                    canClear: true,
                    hashCode: ''
                }
            }
        },
        methods: {
            doExam(hashCode, isReviewError = false) {
                let exam = utils.storage.getItem(hashCode);
                if (!exam) {
                    Dialog.alert({message: '该题库已失效！'});
                    return;
                }
                this.$router.push({
                    name: 'DoExamPage',
                    params: {
                        examConfig: exam,
                        isReviewError
                    }
                })
            },
            clearHistory(hashCode) {
                const errorKey = 'errorMap_' + hashCode;
                utils.storage.removeItem(errorKey);
                this.isShowOption = false;
                this.initExamList();
            },
            showOption(exam) {
                if (exam.hasHistoryError) {
                    this.optionInfo.hashCode = exam.hashCode;
                    this.isShowOption = true;
                } else {
                    this.doExam(exam.hashCode);
                }
            },
            showImporter() {
                this.isShowImporter = true;
            },
            importLib() {
                try {
                    let lib = JSON.parse(this.questionLib);
                    this.$router.push({
                        name: 'DoExamPage',
                        params: {
                            examConfig: lib,
                            isNew: true
                        }
                    })
                } catch (e) {
                    alert('题库格式错误')
                }
            },
            initExamList() {
                this.examList = (utils.storage.getItem('exam_list') || []).map(exam => {
                    const errorKey = 'errorMap_' + exam.hashCode;
                    let errorMap = utils.storage.getItem(errorKey);
                    if (!errorMap) {
                        errorMap = {};
                    }
                    const hasHistoryError = Object.keys(errorMap).length > 0;
                    return {...exam, errorMap, hasHistoryError}
                })
            }
        },
        mounted() {
            this.initExamList();
        }
    }
</script>

<style scoped>
    .exam-import-box {
        width: 20rem;
        padding: 1rem;
    }
</style>