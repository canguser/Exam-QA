<template>
    <div>
        <van-grid>
            <van-grid-item
                    v-for="value in 4"
                    :key="value"
                    icon="photo-o"
                    text="文字"></van-grid-item>
        </van-grid>
    </div>
</template>

<script>
    import Vue from 'vue';
    import { Grid, GridItem } from 'vant';

    Vue.use(Grid).use(GridItem);
    export default {
        name: "HomeIndex"
    }
</script>

<style scoped>

</style>