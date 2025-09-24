import {dexieDB, configDB, questionDB, bankDB, historyRecordDB, slashedQuestionDB, questionBankMappingDB} from '../db';

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
            type: 'option'
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

class SlashedQuestionDao extends BaseDao {
    constructor() {
        super(slashedQuestionDB, {
            reason: '完全掌握'
        });
    }
    
    // 查询指定题库的已斩题目
    queryByBankHashCode(bankHashCode) {
        return this.query('bankHashCode').equals(bankHashCode).toArray();
    }
    
    // 检查题目是否已被斩
    async isQuestionSlashed(questionHashCode) {
        const record = await this.query('questionHashCode').equals(questionHashCode).first();
        return !!record;
    }
    
    // 斩题操作
    slashQuestion(questionHashCode, bankHashCode, reason = '完全掌握') {
        return this.upsert({
            questionHashCode,
            bankHashCode, 
            slashDate: Date.now(),
            reason
        });
    }
    
    // 取消斩题
    unslashQuestion(questionHashCode) {
        return this.query('questionHashCode').equals(questionHashCode).delete();
    }
    
    // 批量斩题
    batchSlashQuestions(questionHashCodes, bankHashCode, reason = '完全掌握') {
        const records = questionHashCodes.map(questionHashCode => ({
            questionHashCode,
            bankHashCode,
            slashDate: Date.now(),
            reason
        }));
        return this.upsert(records);
    }
    
    // 重置题库所有斩题
    resetBankSlashedQuestions(bankHashCode) {
        return this.query('bankHashCode').equals(bankHashCode).delete();
    }
    
    // 查询多个题目的斩题状态
    queryManySlashStatus(questionHashCodes) {
        return this.query('questionHashCode').anyOf(questionHashCodes).toArray();
    }
}

class QuestionBankMappingDao extends BaseDao {
    constructor() {
        super(questionBankMappingDB, {
            order: 0,
            createDate: Date.now(),
            modifyDate: Date.now()
        });
    }

    // 根据题库ID查询所有题目映射，按order排序
    async getQuestionsByLibId(libId) {
        return this.query('libId').equals(libId).sortBy('order');
    }

    // 批量保存题目映射关系
    async saveMappings(libId, questionIds) {
        // 先删除该题库的所有映射
        await this.db.where('libId').equals(libId).delete();
        
        // 批量插入新的映射关系
        const mappings = questionIds.map((questionId, index) => ({
            libId: libId,
            questionId: questionId,
            order: index, // 使用数组下标作为顺序
            createDate: Date.now(),
            modifyDate: Date.now()
        }));

        return this.db.bulkAdd(mappings);
    }

    // 更新单个题目的顺序
    async updateQuestionOrder(libId, questionId, newOrder) {
        const mapping = await this.db.where({
            libId: libId,
            questionId: questionId
        }).first();

        if (mapping) {
            return this.db.update(mapping.id, {
                order: newOrder,
                modifyDate: Date.now()
            });
        }
    }

    // 删除题库的所有映射
    async deleteMappingsByLibId(libId) {
        return this.db.where('libId').equals(libId).delete();
    }
}

const configDao = new ConfigDao();
const questionDao = new QuestionDao();
const bankDao = new BankDao();
const historyRecordDao = new HistoryRecordDao();
const slashedQuestionDao = new SlashedQuestionDao();
const questionBankMappingDao = new QuestionBankMappingDao();

export {configDao, questionDao, bankDao, historyRecordDao, slashedQuestionDao, questionBankMappingDao}