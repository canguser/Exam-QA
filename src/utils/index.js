export default {
    getHashCode(obj) {
        return this.getStrHashCode(this.getMessage(obj).concat(this.getPropertyNames(obj)).join(''));
    },
    getPropertyNames(_self, deep = 10) {
        if (deep <= 0) {
            return '';
        }
        if (!_self || ['string', 'number', 'boolean', 'function'].includes(typeof _self) || _self instanceof Date) {
            return '';
        }
        return this.flat(
            Object.entries(_self).map(([key, value]) => [key, this.getPropertyNames(value, deep--)])
        ).filter(r => r != null && r !== '')
    },
    getMessage(_self, deep) {
        deep == null && (deep = 10);
        if (deep <= 0) {
            return '';
        }
        if (!_self || ['string', 'number', 'boolean', 'function'].includes(typeof _self) || _self instanceof Date) {
            return [_self != null ? _self.toString() : ''];
        }
        return this.flat(
            Object.keys(_self).map(key => {
                return this.getMessage(_self[key], deep--);
            })
        ).filter(r => r != null && r !== '');
    },
    getStrHashCode(str) {
        let hash = 0, i, chr, len;
        if (str.length === 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash + '';
    },
    flat(arr, deep = Infinity) {
        let ret = [];
        let dirty = false;
        arr.forEach(item => {
            if (Array.isArray(item)) {
                dirty = true;
                ret.push(...item)
            } else {
                ret.push(item)
            }
        });
        return dirty && deep > 0 ? this.flat(ret, deep--) : ret
    },
    fromEntries(arr) {
        let result = {};
        arr.forEach(a => {
            if (a instanceof Array) {
                result[a[0]] = a[1];
            }
        });
        return result;
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
        },
        removeItem(key) {
            localStorage.removeItem('__exam_s0_' + key);
        },
    },
    groupArray(arr, groupedBy) {
        let array = arr.map(a => ({hashCode: this.getHashCode(a), item: a}));
        if (!(groupedBy instanceof Array)) {
            groupedBy = [groupedBy];
        }
        let checkedArr = array.map(a => ({
            hashCode: a.hashCode,
            checkItem: Object.fromEntries(
                groupedBy.map(groupBy => [groupBy, (a.item || {})[groupBy]])
            )
        })).map(a => ({...a, checkedHashCode: this.getHashCode(a.checkItem)}));
        let checkedMap = {};
        checkedArr.forEach(a => {
            let hashArr = checkedMap[a.checkedHashCode];
            if (!hashArr) {
                hashArr = [];
            }
            hashArr.push(array.find(arr => arr.hashCode === a.hashCode).item);
            checkedMap[a.checkedHashCode] = hashArr;
        });
        return Object.values(checkedMap);
    },
    duplicateRemoval(arr) {
        let array = arr.map(a => ({item: a}));
        let grouped = this.groupArray(array, 'item');
        return grouped.map(g => g[0].item);
    },
    randomSort(arr) {
        return arr.sort(() => {
            return Math.random() - 0.5;
        })
    }
}