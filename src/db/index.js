import Dexie from "dexie";

const dexieDB = new Dexie('_qa_db');
dexieDB.version(1).stores({
    config: 'key, value',
    question: 'hashCode, describe, type',
    bank: 'hashCode, title, *questions',
    historyRecord: 'relatedQuestion, rightTimes, errorTimes, maxTime, minTime, totalTime'
});
const configDB = dexieDB['config'];
const questionDB = dexieDB['question'];
const bankDB = dexieDB['bank'];
const historyRecordDB = dexieDB['historyRecord'];

export {dexieDB, configDB, questionDB, bankDB, historyRecordDB};