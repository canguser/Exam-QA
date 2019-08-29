<template>
    <div>
        <van-grid>
            <van-grid-item
                    v-for="value in 4"
                    :key="value"
                    icon="notes-o"
                    clickable
                    @click="doExam"
                    text="文字"></van-grid-item>
        </van-grid>
    </div>
</template>

<script>
    import Vue from 'vue';
    import {Grid, GridItem} from 'vant';

    Vue.use(Grid).use(GridItem);
    export default {
        name: "HomeIndex",
        methods: {
            doExam() {
                this.$router.push({
                    name: 'DoExamPage',
                    params: {
                        examInfo: {
                            questions:[
                                {
                                    describe: 'Do you like me?',
                                    answerOptions: [
                                        {api: 'A', describe: 'Yes', isRight: true},
                                        {api: 'B', describe: 'No'}
                                    ]
                                },
                                {
                                    describe: 'Do you hate me?',
                                    answerOptions: [
                                        {api: 'A', describe: 'Yes'},
                                        {api: 'B', describe: 'No', isRight: true}
                                    ]
                                },
                                {
                                    describe: 'Which one is right for me?',
                                    answerOptions: [
                                        {api: 'A', describe: 'My hometown is DeYang', isRight: true},
                                        {api: 'B', describe: 'My age is 18 year old', isRight: true},
                                        {api: 'C', describe: 'I am a girl'},
                                        {api: 'D', describe: 'I am not smart'}
                                    ]
                                },
                                {
                                    describe: 'Do you want me?',
                                    answerOptions: [
                                        {api: 'A', describe: 'Yes', isRight: true},
                                        {api: 'B', describe: 'No'}
                                    ]
                                }
                            ]
                        }
                    }
                })
            }
        }
    }
</script>

<style scoped>

</style>