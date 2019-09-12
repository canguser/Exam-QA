import {dexieDB, configDB, questionDB, bankDB, historyRecordDB} from '../db';

class BaseDao {
    constructor(db, defaultEntry) {
        this.db = db;
        this.defaultEntry = defaultEntry || {};
    }

    async upsert(records) {
        if (records instanceof Array) {
            return this.db.bulkPut(records.map(r => ({...this.defaultEntry, ...r})));
        }
        return this.db.put({...this.defaultEntry, ...records});
    }

    async query(field) {
        return this.db.where(field);
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
}

const configDao = new ConfigDao();
const questionDao = new QuestionDao();
const bankDao = new BankDao();
const historyRecordDao = new HistoryRecordDao();

export {configDao, questionDao, bankDao, historyRecordDao}