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
                <div v-if="isFromOnline" style="max-height: 300px;overflow-y: auto;">
                    <van-checkbox-group v-model="onlineSelects">
                        <van-cell-group>
                            <van-cell v-for="(lib, oi) in onlineLibs"
                                      clickable
                                      @click="selectLib(lib)"
                                      :key="oi">
                                <template slot="title">
                                    <span>{{lib.title}}</span>
                                </template>
                                <van-checkbox slot="right-icon" :name="lib.hashCode"></van-checkbox>
                            </van-cell>
                        </van-cell-group>
                    </van-checkbox-group>
                </div>
                <div v-if="!isFromOnline">
                    <van-cell-group>
                        <van-field
                                v-model="questionLib"
                                label="题库"
                                type="textarea"
                                placeholder="请输入题库"
                                rows="10"></van-field>
                    </van-cell-group>
                </div>
                <div>
                    <van-button type="info" size="small" block @click="importLib">导入题库</van-button>
                </div>
                <div class="exam-m-top-small">
                    <van-button type="primary" size="small" block @click="importFromExist">获取在线题库</van-button>
                </div>
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
    import config from "@/config";
    import {Checkbox, CheckboxGroup} from 'vant';

    Vue.use(Dialog);
    Vue.use(Field).use(Cell).use(CellGroup);
    Vue.use(Button);
    Vue.use(Popup);
    Vue.use(Grid).use(GridItem);
    Vue.use(Checkbox).use(CheckboxGroup);

    const exists = [
        '/lib/exam-lib/app-builder-01',
        '/lib/exam-lib/app-builder-02',
        '/lib/exam-lib/app-builder-03',
        '/lib/exam-lib/app-builder-04',
        '/lib/exam-lib/app-builder-05',
        '/lib/exam-lib/app-builder-06',
        '/lib/exam-lib/app-builder-07',
        '/lib/exam-lib/app-builder-08',
        '/lib/exam-lib/app-builder-09',
        '/lib/exam-lib/app-builder-10',
        '/lib/exam-lib/app-builder-11',
    ];
    export default {
        name: "HomeIndex",
        data() {
            return {
                isShowImporter: false,
                isShowOption: false,
                isFromOnline: false,
                onlineLibs: [],
                onlineSelects: [],
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
                // console.log(exam.hashCode);
                if (exam.hasHistoryError) {
                    this.optionInfo.hashCode = exam.hashCode;
                    this.isShowOption = true;
                } else {
                    this.doExam(exam.hashCode);
                }
            },
            selectLib(lib) {
                this.onlineSelects.includes(lib.hashCode) ? (this.onlineSelects = this.onlineSelects.filter(s => s !== lib.hashCode)) : (this.onlineSelects = [...this.onlineSelects, lib.hashCode])
                this.questionLib = JSON.stringify(this.selectedLibs);
            },
            showImporter() {
                this.isShowImporter = true;
                this.isFromOnline = false;
            },
            importFromExist() {
                this.isFromOnline = true;
                this.fetchOnlineLib().then(res => {
                    this.onlineLibs = res.filter(r => r.data).map(r => ({
                        ...r.data, hashCode: utils.getHashCode(r.data)
                    }));
                }).catch(e => {
                    alert('获取失败，请尝试自行录入');
                    this.isShowImporter = false;
                })
            },
            fetchOnlineLib() {
                const promises = exists.map(exist => this.$http.get(config.domain + exist + '.json'));
                return Promise.all(promises);
            },
            importLib() {
                try {
                    let lib = JSON.parse(this.questionLib);
                    if (lib instanceof Array) {
                        lib.forEach(l => {
                            this.importSingleLib(l);
                        })
                    } else {
                        this.importSingleLib(lib);
                    }
                } catch (e) {
                    alert(`题库格式错误：${e.getMessage()}`)
                }
                this.initExamList();
                this.isShowImporter = false;
            },
            importSingleLib(lib) {
                if (!lib.questions || lib.questions.length === 0) {
                    return false;
                }
                const examHashCode = utils.getHashCode(lib);
                utils.storage.setItem(examHashCode, lib);
                let examList = utils.storage.getItem('exam_list') || [];
                examList.map(e => e.hashCode).includes(examHashCode) || (examList.push({
                    hashCode: examHashCode,
                    title: lib.title
                }));
                utils.storage.setItem('exam_list', examList);
                return true;
            },
            initExamList() {
                this.examList = (utils.storage.getItem('exam_list') || []).map(exam => {
                    const errorKey = 'errorMap_' + exam.hashCode;
                    let errorMap = utils.storage.getItem(errorKey);
                    if (!errorMap) {
                        errorMap = {};
                    }
                    const hasHistoryError = !!Object.values(errorMap).find(q => q.times > 0);
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