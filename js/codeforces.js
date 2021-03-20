"use strict";
function getQueryString() {
    var queryStr = decodeURI(window.location.search);
    var retParam = new Map();
    if (queryStr.length > 0) {
        var getParams = queryStr.substring(1).split("&");
        getParams.forEach(function (get_param) {
            var param = get_param.split("=");
            var name = param[0];
            var value = param[1];
            retParam.set(name, value);
        });
    }
    return retParam;
}
function selectOrRadioButton() {
    var orRadioButton = document.getElementById('or-radio-btn');
    orRadioButton.checked = true;
}
function selectAndRadioButton() {
    var andRadioButton = document.getElementById('and-radio-btn');
    andRadioButton.checked = true;
}
function showStatus(currentStatus) {
    var statusElements = document.getElementsByName('status');
    statusElements.forEach(function (status) {
        if (currentStatus.has(status.value)) {
            status.checked = true;
        }
    });
}
function showAllTag(checkedTags) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        var tags = json['tags'];
        var tagList = document.getElementById('tag-list');
        tags.forEach(function (tag) {
            var tagName = tag.replace(/ /g, '_');
            var div = document.createElement('div');
            div.setAttribute('class', 'form-check form-check-inline');
            var label = document.createElement('label');
            label.setAttribute('class', 'form-check-label');
            label.setAttribute('for', 'tag-' + tagName);
            label.innerText = tag;
            var checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('id', 'tag-' + tagName);
            checkbox.setAttribute('class', 'tag form-check-input');
            checkbox.setAttribute('name', 'tagName');
            checkbox.value = tagName;
            div.append(checkbox, label);
            tagList.append(div);
        });
        checkTags(checkedTags);
    };
    xhr.open('GET', './json/problem_tags.json');
    xhr.send();
}
function fetchProblems() {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            var problems = JSON.parse(xhr.responseText);
            resolve(problems);
        };
        xhr.onerror = function () {
            reject();
        };
        xhr.open('GET', './json/problemset_problems.json');
        xhr.send();
    });
}
function fetchProblemStatistics() {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            var statistics = JSON.parse(xhr.responseText);
            resolve(statistics);
        };
        xhr.onerror = function () {
            reject();
        };
        xhr.open('GET', './json/problemset_problemStatistics.json');
        xhr.send();
    });
}
function fetchAccepted(handle) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(JSON.parse(xhr.responseText));
        };
        xhr.onerror = function () {
            reject();
        };
        xhr.open('GET', 'https://codeforces.com/api/user.status?handle=' + handle);
        xhr.send();
    });
}
function getAccepted(json) {
    var accepted = new Map();
    var submissions = json['result'];
    submissions.forEach(function (submission) {
        var id = submission.contestId + submission.problem.index;
        if (submission.verdict === 'OK') {
            accepted.set(id, 'OK');
        }
        else if (accepted.get(id) !== 'OK') {
            accepted.set(id, 'NG');
        }
    });
    return accepted;
}
function matchTags(tagParams, tags, tagMode) {
    if (tagParams.size === 0 && tags.length === 0) {
        return true;
    }
    if (tagMode === 'and') {
        var ok_1 = true;
        if (tagParams.size !== tags.length) {
            return false;
        }
        tags.forEach(function (tag) {
            var replaced = tag.replace(/ /g, '_');
            ok_1 = ok_1 && tagParams.has(replaced);
        });
        return ok_1;
    }
    else {
        var ok_2 = false;
        tags.forEach(function (tag) {
            var replaced = tag.replace(/ /g, '_');
            ok_2 = ok_2 || tagParams.has(replaced);
        });
        return ok_2;
    }
}
function getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode) {
    var problemURL = "https://codeforces.com/problemset/problem/";
    var statusURL = "https://codeforces.com/problemset/status/";
    var trList = [];
    problems.forEach(function (problem, i) {
        var name = problem.name;
        var id = problem.contestId;
        var index = problem.index;
        var solved = statistics[i].solvedCount;
        var tags = problem.tags;
        if (!matchTags(tagParams, tags, tagMode)) {
            return;
        }
        var color = '';
        if (!accepted.has(id + index)) {
            color = '';
        }
        else if (accepted.get(id + index) === 'OK') {
            color = 'success';
        }
        else if (accepted.get(id + index) === 'NG') {
            color = 'warning';
        }
        if (accepted.get(id + index) === 'OK' && !checkedStatus.has('ac')) {
            return;
        }
        if (accepted.get(id + index) === 'NG' && !checkedStatus.has('wa')) {
            return;
        }
        if (!accepted.has(id + index) && !checkedStatus.has('nosubmit')) {
            return;
        }
        var tr = document.createElement('tr');
        tr.setAttribute('class', color);
        var td1 = document.createElement('td');
        var a1 = document.createElement('a');
        a1.setAttribute('href', problemURL + id + '/' + index);
        a1.setAttribute('target', '_blank');
        a1.innerText = id + '-' + index;
        td1.append(a1);
        var td2 = document.createElement('td');
        var a2 = document.createElement('a');
        a2.setAttribute('href', problemURL + id + '/' + index);
        a2.setAttribute('target', '_blank');
        a2.innerText = name;
        td2.append(a2);
        var td3 = document.createElement('td');
        var a3 = document.createElement('a');
        a3.setAttribute('href', statusURL + id + '/problem/' + index);
        a3.setAttribute('target', '_blank');
        a3.innerText = solved.toString();
        td3.append(a3);
        var td4 = document.createElement('td');
        var ul = document.createElement('ul');
        ul.setAttribute('class', 'list-inline');
        if (tags.length === 0) {
            var li = document.createElement('li');
            li.innerText = '-';
            ul.append(li);
        }
        else {
            var liList = tags.map(function (tag) {
                var li = document.createElement('li');
                li.setAttribute('class', 'problem-tag');
                li.innerText = tag;
                return li;
            });
            ul.append.apply(ul, liList);
        }
        td4.append(ul);
        tr.append(td1, td2, td3, td4);
        trList.push(tr);
    });
    return trList;
}
function showProblems(apiParams, checkedStatus, tagParams, tagMode) {
    var problems = [];
    var statistics = [];
    Promise.resolve().then(function () {
        return fetchProblems();
    }).then(function (fetchedProblems) {
        problems = fetchedProblems;
        return fetchProblemStatistics();
    }).then(function (fetchedStatistics) {
        statistics = fetchedStatistics;
        return Promise.resolve();
    }).then(function () {
        var accepted = new Map();
        if (apiParams.handle) {
            Promise.resolve().then(function () {
                return fetchAccepted(apiParams.handle);
            }).then(function (fetchedAccepted) {
                var ok = fetchedAccepted['status'] === 'OK';
                accepted = ok ? getAccepted(fetchedAccepted) : new Map();
                return Promise.resolve();
            }).then(function () {
                var trList = getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode);
                var tableBody = document.getElementById('table-body');
                tableBody.append.apply(tableBody, trList);
            });
        }
        else {
            var trList = getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode);
            var tableBody = document.getElementById('table-body');
            tableBody.append.apply(tableBody, trList);
        }
    });
}
function checkTags(tags) {
    tags.forEach(function (tag) {
        var tagElement = document.getElementById('tag-' + tag);
        tagElement.checked = true;
    });
}
function init() {
    var _a, _b, _c, _d, _e;
    var params = getQueryString();
    var apiParams = {
        handle: "",
        from: "1",
        count: "5000"
    };
    var tagMode = (_a = params.get('tag_mode')) !== null && _a !== void 0 ? _a : '';
    if (tagMode === "and") {
        selectAndRadioButton();
    }
    else {
        selectOrRadioButton();
    }
    if (params.has('handle')) {
        apiParams.handle = (_b = params.get('handle')) !== null && _b !== void 0 ? _b : '';
    }
    var handleElement = document.getElementById('handle');
    handleElement.value = (_c = params.get('handle')) !== null && _c !== void 0 ? _c : '';
    var checkedTags = getCheckedTags((_d = params.get('tagName')) !== null && _d !== void 0 ? _d : '');
    var checkedStatus = new Set(((_e = params.get('status')) !== null && _e !== void 0 ? _e : '').split(','));
    showStatus(checkedStatus);
    showAllTag(checkedTags);
    showProblems(apiParams, checkedStatus, checkedTags, tagMode);
}
function getCheckedTags(tagName) {
    var tags = new Set();
    if (tagName.length > 0) {
        tagName.split(',')
            .forEach(function (tag) {
            tags.add(tag);
        });
    }
    return tags;
}
function getTagMode() {
    var radioOrTag = document.getElementById('or-radio-btn');
    if (radioOrTag.checked) {
        return radioOrTag.value;
    }
    else {
        var radioAndTag = document.getElementById('and-radio-btn');
        return radioAndTag.value;
    }
}
function makeTagName() {
    var tagList = [];
    var tagElements = document.getElementsByClassName('tag');
    for (var i = 0; i < tagElements.length; i++) {
        var element = tagElements.item(i);
        if (element === null || element === void 0 ? void 0 : element.checked) {
            tagList.push(element.value);
        }
    }
    return tagList.join(',');
}
function getStatus() {
    var elements = document.getElementsByName('status');
    var status = [];
    elements.forEach(function (element) {
        if (element.checked) {
            status.push(element.value);
        }
    });
    return status.join(',');
}
init();
var searchButton = document.getElementById('search-btn');
searchButton.onclick = function () {
    var handle = document.getElementById('handle').value;
    var tagMode = getTagMode();
    var tagParams = makeTagName();
    var status = getStatus();
    window.location.href = encodeURI(window.location.href.split('?')[0] + ("?handle=" + handle + "&tag_mode=" + tagMode + "&tagName=" + tagParams + "&status=" + status));
};
