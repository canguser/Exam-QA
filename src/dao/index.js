import {dexieDB, configDB, questionDB, bankDB, historyRecordDB} from '../db';

class BaseDao {
    constructor(db, defaultEntry) {
        this.db = db;
        this.defaultEntry = defaultEntry || {};
        this.db.hook('creating', (primKey, obj) => {
            obj.createDate = Date.now();
            obj.modifyDate = Date.now();
        });
        this.db.hook('updating', (changed, key, origin) => {
            changed['modifiedDate'] = Date.now();
            if (!origin['createdDate']) {
                changed['createdDate'] = Date.now();
            }
            console.log({...changed});
            return changed;
        })
    }

    async upsert(records) {
        if (records instanceof Array) {
            return this.db.bulkPut(records.map(r => ({...this.defaultEntry, ...r})));
        }
        return this.db.put({...this.defaultEntry, ...records});
    }

    query(field) {
        return this.db.where(field);
    }

    queryByHashCode(hashCode) {
        return this.query('hashCode').equals(hashCode).first();
    }

    async delete(keys) {
        if (keys instanceof Array) {
            return this.db.bulkDelete(keys);
        }
        return this.db.delete(keys);
    }
}


class ConfigDao extends BaseDao {
    constructor() {
        super(configDB, {value: null});
    }
}

class QuestionDao extends BaseDao {
    constructor() {
        super(questionDB, {
            describe: '',
            type: 'picklist'
        });
    }
}

class BankDao extends BaseDao {
    constructor() {
        super(bankDB, {
            title: '',
            questions: []
        });
    }
}

class HistoryRecordDao extends BaseDao {
    constructor() {
        super(historyRecordDB, {
            rightTimes: 0, errorTimes: 0, maxTime: 0, minTime: 0, totalTime: 0
        });
    }

    queryByHashCode(hashCode) {
        return this.query('relatedQuestion').equals(hashCode).first();
    }

    queryMany(hashCodeList) {
        return this.query('relatedQuestion').anyOf(hashCodeList).toArray();
    }
}

const configDao = new ConfigDao();
const questionDao = new QuestionDao();
const bankDao = new BankDao();
const historyRecordDao = new HistoryRecordDao();

export {configDao, questionDao, bankDao, historyRecordDao}