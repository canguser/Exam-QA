import Vue from 'vue'
import axios from 'axios'
import jsonp from 'jsonp'
import Utils from '../utils'
import AlloyFinger from 'alloyfinger'
import AlloyFingerPlugin from 'alloyfinger/vue/alloy_finger_vue'

Vue.use(AlloyFingerPlugin,{
    AlloyFinger
});

Vue.prototype.$http = axios;
Vue.prototype.$http.jsonp = jsonp;

if (!Object.fromEntries) {
    Object.fromEntries = Utils.fromEntries;
}

if (!Array.prototype.flat) {
    try {
        Object.defineProperty(Array.prototype, 'flat', {
            value: function (deep) {
                return Utils.flat(this, deep);
            },
            enumerable: false
        })
    } catch (e) {
        Array.prototype.flat = function (deep) {
            return Utils.flat(this, deep);
        }
    }
}