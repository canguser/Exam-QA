<template>
    <div>
        <van-grid>
            <van-grid-item
                    v-for="value in 1"
                    :key="value"
                    icon="notes-o"
                    clickable
                    @click="doExam"
                    text="开始答题"></van-grid-item>
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


    Vue.use(Field).use(Cell).use(CellGroup);
    Vue.use(Button);
    Vue.use(Popup);
    Vue.use(Grid).use(GridItem);
    export default {
        name: "HomeIndex",
        data() {
            return {
                show: false,
                questionLib: ''
            }
        },
        methods: {
            doExam() {
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
            }
        }
    }
</script>

<style scoped>
    .exam-import-box {
        width: 20rem;
        padding: 1rem;
    }
</style>