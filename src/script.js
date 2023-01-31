var ps = $('.entry-content p');
var qps = [];
var title = $('.entry-title').text();
ps.each((i, p) => {
    if ($(p).find('span').length > 0) {
        qps.push(p);
    }
});

var qalst = [];
qps.forEach(p => {
    var spans = $(p).find('span');
    spans.each((i, span) => {
        if ($(span).css('color') === 'rgb(255, 0, 0)') {
            qalst.push({
                isQ: true,
                t: $(span).text()
            });
        } else if ($(span).css('color') === 'rgb(0, 255, 0)') {
            qalst.push({
                isA: true,
                isR: true,
                t: $(span).text()
            });
        } else {
            qalst.push({
                isA: true,
                t: $(span).text()
            });
        }
    });
});

var qares = [];

qalst.forEach((qa, i) => {
    var res = {a: []};
    if (i === 0) {
        res.q = qa.t;
        qares.push(res);
        return;
    }
    var lastOne = qares[qares.length - 1];
    if (qa.isQ) {
        if (qalst[i - 1].isQ) {
            lastOne.q += qa.t;
            return;
        }
        if (qalst[i - 1].isA) {
            res.q = qa.t;
            qares.push(res);
            return;
        }
    }
    if (qa.isA) {
        lastOne.a.push({
            t: qa.t,
            isR: qa.isR
        });
    }
});


var context = $('.entry-content').text();
var splitContents = context.split('\n').filter(c => c.trim());

qares.forEach(qa => {
    var isResolveA = false;
    var couldResolve = false;
    var answers = [];
    splitContents.forEach((c) => {
        if (isResolveA && (/^[A-Z]\.\s?/).test(c)) {
            answers.push(c);
        } else {
            if (isResolveA) {
                isResolveA = false;
            }
        }
        if (qa.q.startsWith(c)) {
            couldResolve = true
        }
        if (qa.q.endsWith(c) && couldResolve) {
            isResolveA = true;
            couldResolve = false;
        }
    });
    qa.allA = answers.map(a => ({
        t: a,
        isR: qa.a.filter(a => a.isR).map(a => a.t).includes(a),
    }));
});

console.log(qares);

var allResults = qares.map(qa => ({
    describe: qa.q, answerOptions: qa.allA.map(a => ({
        isRight: a.isR,
        describe: a.t.trim().replace(/^[A-Z]\.\s?/, '')
    }))
}));

/*var results = qps.map(p => {
    var spans = $(p).find('span');
    var result = {questions: [], rightAnswers: []};
    spans.each((i, span) => {
        if ($(span).css('color') === 'rgb(255, 0, 0)') {
            result.questions.push($(span).text());
        } else if ($(span).css('color') === 'rgb(0, 255, 0)') {
            result.rightAnswers.push($(span).text())
        }
    });
    return result;
});

console.log(results);*/


/*var allResults = qps.map(p => {
    var questionInfo = $(p).text().split('\n');
    var question = '';
    var answersInfo = [];
    var split = 'dafsdfsergafsdfs';
    var infoJoined = questionInfo.join(split);
    for (var result of qares) {
        var joined = result.q;
        if (infoJoined.startsWith(joined)) {
            question = joined.replace(new RegExp(split, 'g'), '');
            var answers = infoJoined.replace(joined, '').split(split);
            answersInfo = answers.filter(answer => answer).map(answer => {
                var splitor = 'plpdlsdsadggkfksodfks';
                var pointAnswer = answer.trim().replace(/^[A-Z]\.\s?/, splitor);
                var answerParts = pointAnswer.split(splitor).filter(part => part);
                return {
                    isRight: result.a.filter(a => a.isR).map(a => a.t).includes(answer),
                    describe: answerParts[0],
                }
            });
        }
    }
    return {
        describe: question, answerOptions: answersInfo
    }

});*/

console.log(allResults);
var resultS = JSON.stringify({questions: allResults, title: 'New ' + title});
console.log(resultS);

var element = $("<textarea></textarea>");
element.text(resultS);
$("body").append(element);
element[0].select();
document.execCommand("Copy");
element.remove();