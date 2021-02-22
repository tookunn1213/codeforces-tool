"use strict";
function getQueryString() {
    const queryStr = decodeURI(window.location.search);
    let retParam = new Map();
    if (queryStr.length > 0) {
        const getParams = queryStr.substring(1).split("&");
        getParams.forEach(get_param => {
            const param = get_param.split("=");
            const name = param[0];
            const value = param[1];
            retParam.set(name, value);
        });
    }
    return retParam;
}
function selectOrRadioButton() {
    const orRadioButton = document.getElementById('or-radio-btn');
    orRadioButton.checked = true;
}
function selectAndRadioButton() {
    const andRadioButton = document.getElementById('and-radio-btn');
    andRadioButton.checked = true;
}
function showStatus(currentStatus) {
    const statusElements = document.getElementsByName('status');
    statusElements.forEach((status) => {
        if (currentStatus.has(status.value)) {
            status.checked = true;
        }
    });
}
function showAllTag(checkedTags) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
        const json = JSON.parse(xhr.responseText);
        const tags = json['tags'];
        const tagList = document.getElementById('tag-list');
        tags.forEach((tag) => {
            const tagName = tag.replace(/ /g, '_');
            const div = document.createElement('div');
            div.setAttribute('class', 'form-check form-check-inline');
            const label = document.createElement('label');
            label.setAttribute('class', 'form-check-label');
            label.setAttribute('for', 'tag-' + tagName);
            label.innerText = tag;
            const checkbox = document.createElement('input');
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
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
            const problems = JSON.parse(xhr.responseText);
            resolve(problems);
        };
        xhr.onerror = () => {
            reject();
        };
        xhr.open('GET', './json/problemset_problems.json');
        xhr.send();
    });
}
function fetchProblemStatistics() {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
            const statistics = JSON.parse(xhr.responseText);
            resolve(statistics);
        };
        xhr.onerror = () => {
            reject();
        };
        xhr.open('GET', './json/problemset_problemStatistics.json');
        xhr.send();
    });
}
function fetchAccepted(handle) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
            resolve(JSON.parse(xhr.responseText));
        };
        xhr.onerror = () => {
            reject();
        };
        xhr.open('GET', 'http://codeforces.com/api/user.status?handle=' + handle);
        xhr.send();
    });
}
function getAccepted(json) {
    const accepted = new Map();
    const submissions = json['result'];
    submissions.forEach((submission) => {
        const id = submission.contestId + submission.problem.index;
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
    if (tagMode === 'and') {
        let ok = true;
        if (tagParams.size !== tags.length) {
            return false;
        }
        tags.forEach((tag) => {
            const replaced = tag.replace(/ /g, '_');
            ok = ok && tagParams.has(replaced);
        });
        return ok;
    }
    else {
        let ok = false;
        tags.forEach((tag) => {
            const replaced = tag.replace(/ /g, '_');
            ok = ok || tagParams.has(replaced);
        });
        return ok;
    }
}
function getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode) {
    const problemURL = "http://codeforces.com/problemset/problem/";
    const statusURL = "http://codeforces.com/problemset/status/";
    const trList = [];
    problems.forEach((problem, i) => {
        const name = problem.name;
        const id = problem.contestId;
        const index = problem.index;
        const solved = statistics[i].solvedCount;
        const tags = problem.tags;
        if (tagParams.size > 0 && tags.length === 0) {
            return;
        }
        const matched = matchTags(tagParams, tags, tagMode);
        if (!matched && tags.length > 0) {
            return;
        }
        let color = '';
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
        const tr = document.createElement('tr');
        tr.setAttribute('class', color);
        const td1 = document.createElement('td');
        const a1 = document.createElement('a');
        a1.setAttribute('href', problemURL + id + '/' + index);
        a1.setAttribute('target', '_blank');
        a1.innerText = id + '-' + index;
        td1.append(a1);
        const td2 = document.createElement('td');
        const a2 = document.createElement('a');
        a2.setAttribute('href', problemURL + id + '/' + index);
        a2.setAttribute('target', '_blank');
        a2.innerText = name;
        td2.append(a2);
        const td3 = document.createElement('td');
        const a3 = document.createElement('a');
        a3.setAttribute('href', statusURL + id + '/problem' + index);
        a3.setAttribute('target', '_blank');
        a3.innerText = solved.toString();
        td3.append(a3);
        const td4 = document.createElement('td');
        const ul = document.createElement('ul');
        ul.setAttribute('class', 'list-inline');
        if (tags.length === 0) {
            const li = document.createElement('li');
            li.innerText = '-';
            ul.append(li);
        }
        else {
            const liList = tags.map((tag) => {
                const li = document.createElement('li');
                li.setAttribute('class', 'problem-tag');
                li.innerText = tag;
                return li;
            });
            ul.append(...liList);
        }
        td4.append(ul);
        tr.append(td1, td2, td3, td4);
        trList.push(tr);
    });
    return trList;
}
function showProblems(apiParams, checkedStatus, tagParams, tagMode) {
    let problems = [];
    let statistics = [];
    Promise.resolve().then(() => {
        return fetchProblems();
    }).then((fetchedProblems) => {
        problems = fetchedProblems;
        return fetchProblemStatistics();
    }).then((fetchedStatistics) => {
        statistics = fetchedStatistics;
        return Promise.resolve();
    }).then(() => {
        let accepted = new Map();
        if (apiParams.handle) {
            Promise.resolve().then(() => {
                return fetchAccepted(apiParams.handle);
            }).then((fetchedAccepted) => {
                const ok = fetchedAccepted['status'] === 'OK';
                accepted = ok ? getAccepted(fetchedAccepted) : new Map();
                return Promise.resolve();
            }).then(() => {
                const trList = getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode);
                const tableBody = document.getElementById('table-body');
                tableBody.append(...trList);
            });
        }
        else {
            const trList = getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode);
            const tableBody = document.getElementById('table-body');
            tableBody.append(...trList);
        }
    });
}
function escapeSelector(str) {
    return str.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, "\\$&");
}
function checkTags(tags) {
    tags.forEach((tag) => {
        const escapedTag = escapeSelector(tag);
        const tagElement = document.getElementById('tag-' + escapedTag);
        tagElement.checked = true;
    });
}
function init() {
    var _a, _b, _c, _d, _e;
    let params = getQueryString();
    let apiParams = {
        handle: "",
        from: "1",
        count: "5000"
    };
    let tagMode = (_a = params.get('tag_mode')) !== null && _a !== void 0 ? _a : '';
    if (tagMode === "and") {
        selectAndRadioButton();
    }
    else {
        selectOrRadioButton();
    }
    if (params.has('handle')) {
        apiParams.handle = (_b = params.get('handle')) !== null && _b !== void 0 ? _b : '';
    }
    const handleElement = document.getElementById('handle');
    handleElement.value = (_c = params.get('handle')) !== null && _c !== void 0 ? _c : '';
    const checkedTags = new Set();
    if (params.has('tagName')) {
        const tagName = (_d = params.get('tagName')) !== null && _d !== void 0 ? _d : '';
        tagName.split(',')
            .forEach((tag) => {
            checkedTags.add(tag);
        });
    }
    const checkedStatus = new Set(((_e = params.get('status')) !== null && _e !== void 0 ? _e : '').split(','));
    showStatus(checkedStatus);
    showAllTag(checkedTags);
    showProblems(apiParams, checkedStatus, checkedTags, tagMode);
}
function getTagMode() {
    const radioOrTag = document.getElementById('or-radio-btn');
    if (radioOrTag.checked) {
        return radioOrTag.value;
    }
    else {
        const radioAndTag = document.getElementById('and-radio-btn');
        return radioAndTag.value;
    }
}
function makeTagName() {
    const tagList = [];
    const tagElements = document.getElementsByClassName('tag');
    for (const element of tagElements) {
        if (element.checked) {
            tagList.push(element.value);
        }
    }
    return tagList.join(',');
}
function getStatus() {
    const elements = document.getElementsByName('status');
    const status = [];
    elements.forEach((element) => {
        if (element.checked) {
            status.push(element.value);
        }
    });
    return status.join(',');
}
init();
const searchButton = document.getElementById('search-btn');
searchButton.onclick = () => {
    const handle = document.getElementById('handle').value;
    const tagMode = getTagMode();
    const tagParams = makeTagName();
    const status = getStatus();
    window.location.href = window.location.href.split('?')[0] + `?handle=${handle}&tag_mode=${tagMode}&tagName=${tagParams}&status=${status}`;
};
