import Dexie from "dexie";

const dexieDB = new Dexie('_qa_db');
dexieDB.version(1).stores({
    config: 'key, value, createDate, modifyDate',
    question: 'hashCode, describe, type, createDate, modifyDate',
    bank: 'hashCode, title, *questions, createDate, modifyDate',
    historyRecord: 'relatedQuestion, rightTimes, errorTimes, maxTime, minTime, totalTime, createDate, modifyDate'
});
dexieDB.version(2).stores({
    bank: 'hashCode, title, *questions, category, createDate, modifyDate',
});
dexieDB.version(3).stores({
    question: 'hashCode, describe, type, createDate, modifyDate, analysis',
});
dexieDB.version(4).stores({
    slashedQuestion: 'questionHashCode, bankHashCode, slashDate, reason, createDate, modifyDate'
});
dexieDB.version(5).stores({
    questionBankMapping: '++id, libId, questionId, order, createDate, modifyDate'
});
dexieDB.version(6).stores({
    starredQuestion: 'questionHashCode, bankHashCode, starDate, createDate, modifyDate'
});
const configDB = dexieDB['config'];
const questionDB = dexieDB['question'];
const bankDB = dexieDB['bank'];
const historyRecordDB = dexieDB['historyRecord'];
const slashedQuestionDB = dexieDB['slashedQuestion'];
const questionBankMappingDB = dexieDB['questionBankMapping'];
const starredQuestionDB = dexieDB['starredQuestion'];

export {dexieDB, configDB, questionDB, bankDB, historyRecordDB, slashedQuestionDB, questionBankMappingDB, starredQuestionDB};