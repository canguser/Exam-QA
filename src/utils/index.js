export default {
    getHashCode(obj) {
        return this.getStrHashCode(this.getMessage(obj).join(''));
    },
    getMessage(_self, deep) {
        deep == null && (deep = 10);
        if (deep <= 0) {
            return '';
        }
        if (!_self || ['string', 'number', 'boolean', 'function'].includes(typeof _self) || _self instanceof Date) {
            return [_self.toString()];
        }
        return Object.keys(_self).map(key => {
            return this.getMessage(_self[key], deep--);
        }).flat(Infinity).filter(r => r != null && r !== '');
    },
    getStrHashCode(str) {
        let hash = 0, i, chr, len;
        if (str.length === 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    },
    storage: {
        getItem(key) {
            let itemStr = localStorage.getItem('__exam_s0_' + key);
            let result = null;
            try {
                result = JSON.parse(itemStr);
            } catch (e) {
                console.log(`No valid item for key [${key}] to get in storage.`);
            }
            return result;
        },
        setItem(key, value) {
            let result = null;
            try {
                result = JSON.stringify(value);
                localStorage.setItem('__exam_s0_' + key, result);
            } catch (e) {
                console.log(`Not valid item for key [${key}] to set.`);
            }
        }
    }
}