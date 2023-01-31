const nodeUtils = {
    getEveryTextNode: rootNode => {
        let root = rootNode;
        if (typeof rootNode === 'string') {
            root = document.querySelector(rootNode);
        }
        if (!root || !root.childNodes) {
            return [];
        }
        return [...root.childNodes].map(
            node => {
                const value = (node.nodeValue || '').trim();
                if (node.nodeName === '#text' && value) {
                    return node;
                }
                return this.getEveryTextNode(node)
            }
        ).flat(Infinity);
    },

    getNodeStyle: (node, cssList = []) => {
        let n = node;
        if (typeof node === 'string') {
            n = document.querySelector(node);
        }
        const nodeStyleMap = getComputedStyle(n.nodeName === '#text' ? n.parentElement : n);
        return Object.fromEntries(
            cssList.map(css => [css, nodeStyleMap[css]])
        )
    },

    parseEveryLineText: (selector, cssList = ['color']) => {
        return this.getEveryTextNode(selector).map(node => (
            {...this.getNodeStyle(node, cssList), value: node.nodeValue.trim()}
        ))
    }
};

const letterOrder = Object.fromEntries([...'abcdefghijklmnopqrstuvwxyz'].map((letter, i) => [letter, i]));

const textList = nodeUtils.parseEveryLineText('.post-content', ['color']);

const flagMap = {
    isQuestion: (textInfo) => textInfo.color === 'rgb(255, 0, 0)',
    isRightAnswer: (textInfo) => textInfo.color = 'rgb(0, rgb(255, 0, 0), 0)',
    isAnswer: (textInfo) => /^[a-zA-Z][.)]\s*[A-Z].*$/.test(textInfo.value)
};

textList.forEach(textInfo => {
    Object.entries(flagMap).forEach(([flag, is]) => {
        textInfo[flag] = is(textInfo);
    });
});

let questionList = [];

let tempQuestion = {};

for (let i = 0; i <= textList.length; i++) {
    const textInfo = textList[i];
    const lastText = textList[i - 1];
    const nextText = textList[i + 1];
    if (textInfo.isQuestion && !(lastText || {}).isQuestion) {
        tempQuestion = {
            hasQuestion: true,
            describe: [textInfo.value]
        }
    } else if (textInfo.isQuestion && (lastText || {}).isQuestion) {
        tempQuestion.describe.push(textInfo.value);
    } else if (!textInfo.isQuestion && tempQuestion.hasQuestion) {
        const answerList = tempQuestion.answerOptions || [];
        if (textInfo.isAnswer) {

        } else {

        }
    }
    if (tempQuestion.done) {
        questionList.push(tempQuestion);
    }
}


(() => {
})();
