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
                    @click="doExam(exam.hashCode)">
                <div slot="text" class="van-grid-item__text text-align-center">{{exam.title}}</div>
            </van-grid-item>
        </van-grid>
        <van-popup v-model="show">
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
                show: false,
                questionLib: '',
                examList: []
            }
        },
        methods: {
            doExam(hashCode) {
                let exam = utils.storage.getItem(hashCode);
                if (!exam) {
                    Dialog.alert({message: '该题库已失效！'});
                    return;
                }
                this.$router.push({
                    name: 'DoExamPage',
                    params: {
                        examConfig: exam
                    }
                })
            },
            showImporter() {
                this.show = true;
            },
            importLib() {
                try {
                    let lib = JSON.parse(this.questionLib);
                    this.$router.push({
                        name: 'DoExamPage',
                        params: {
                            examConfig: lib
                        }
                    })
                } catch (e) {
                    alert('题库格式错误')
                }
            },
            initExamList() {
                this.examList = utils.storage.getItem('exam_list') || [];
            }
        },
        created() {
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