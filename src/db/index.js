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
const configDB = dexieDB['config'];
const questionDB = dexieDB['question'];
const bankDB = dexieDB['bank'];
const historyRecordDB = dexieDB['historyRecord'];

export {dexieDB, configDB, questionDB, bankDB, historyRecordDB};