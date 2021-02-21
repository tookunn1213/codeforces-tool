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
    const orRadioButtonItem = document.getElementById('or-radio-btn-item');
    const orRadioButton = document.getElementById('or-radio-btn');
    if (orRadioButtonItem && orRadioButton) {
        orRadioButtonItem.classList.add('active');
        if (!orRadioButton.hasAttribute('checked')) {
            orRadioButton.setAttribute('checked', 'checked');
        }
    }
    const andRadioButtonItem = document.getElementById('and-radio-btn-item');
    const andRadioButton = document.getElementById('and-radio-btn');
    if (andRadioButtonItem && andRadioButton) {
        andRadioButtonItem.classList.remove('active');
        if (andRadioButton.hasAttribute('checked')) {
            andRadioButton.removeAttribute('checked');
        }
    }
}
function selectAndRadioButton() {
    const orRadioButtonItem = document.getElementById('or-radio-btn-item');
    const orRadioButton = document.getElementById('or-radio-btn');
    if (orRadioButtonItem !== null && orRadioButton !== null) {
        orRadioButtonItem.classList.remove('active');
        if (orRadioButton.hasAttribute('checked')) {
            orRadioButton.removeAttribute('checked');
        }
    }
    const andRadioButtonItem = document.getElementById('and-radio-btn-item');
    const andRadioButton = document.getElementById('and-radio-btn');
    if (andRadioButtonItem !== null && andRadioButton !== null) {
        andRadioButtonItem.classList.add('active');
        if (!andRadioButton.hasAttribute('checked')) {
            andRadioButton.setAttribute('checked', 'checked');
        }
    }
}
function showStatus() {
    const statusIdList = ['ac', 'wa', 'nosubmit'];
    const statusNameList = ['AC', 'WA', 'NoSubmit'];
    const statusClass = ['accepted', 'wronganswer', 'nosubmit'];
    const statusListElement = document.getElementById('status-list');
    if (statusListElement) {
        statusIdList.forEach((statusId, index) => {
            const li = document.createElement('li');
            li.setAttribute('id', 'status-' + statusId);
            li.setAttribute('class', 'checkbox-item checkbox-item--big ' + statusClass[index]);
            const label = document.createElement('label');
            label.setAttribute('class', 'checkbox-item-label');
            const checkbox = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('status', 'status-' + statusId);
            checkbox.setAttribute('class', 'form-control checkbox checkbox');
            checkbox.setAttribute('name', 'status');
            checkbox.value = statusId;
            label.innerText = statusNameList[index];
            li.append(label, checkbox);
            statusListElement.append(li);
        });
    }
}
function showAllTag(checkedTags) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
            const json = JSON.parse(xhr.responseText);
            const tags = json['tags'];
            const tagList = document.getElementById('tag-list');
            if (tagList) {
                tags.forEach((tag) => {
                    const tagName = tag.replace(/ /g, '_');
                    const li = document.createElement('li');
                    li.setAttribute('class', 'checkbox-item checkbox-item--small');
                    const label = document.createElement('label');
                    label.setAttribute('class', 'checkbox-item-label');
                    const checkbox = document.createElement('input');
                    checkbox.setAttribute('type', 'checkbox');
                    checkbox.setAttribute('id', 'tag-' + tagName);
                    checkbox.setAttribute('class', 'tag form-control checkbox');
                    checkbox.setAttribute('name', 'tagName');
                    checkbox.value = tagName;
                    label.innerText = tag;
                    li.append(label, checkbox);
                    tagList.append(li);
                });
                checkTags(checkedTags);
                resolve(null);
            }
            reject();
        };
        xhr.open('GET', './json/problem_tags.json');
        xhr.send();
    });
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
function getRows(problems, statistics, accepted, tagParams, tagMode) {
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
function showProblems(apiParams, tagParams, tagMode) {
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
                const trList = getRows(problems, statistics, accepted, tagParams, tagMode);
                const tableBody = document.getElementById('table-body');
                if (tableBody !== null) {
                    tableBody.append(...trList);
                }
            });
        }
        else {
            const trList = getRows(problems, statistics, accepted, tagParams, tagMode);
            const tableBody = document.getElementById('table-body');
            if (tableBody !== null) {
                tableBody.append(...trList);
            }
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
        if (tagElement === null) {
            return;
        }
        const checkBoxItem = tagElement.closest('.checkbox-item');
        checkBoxItem === null || checkBoxItem === void 0 ? void 0 : checkBoxItem.classList.add('active');
        tagElement.setAttribute('checked', 'checked');
    });
}
function init() {
    var _a, _b, _c, _d;
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
        (_d = params.get('tagName')) !== null && _d !== void 0 ? _d : ''
            .split(',')
            .forEach((tag) => {
            checkedTags.add(tag);
        });
    }
    showStatus();
    Promise.resolve().then(() => {
        return showAllTag(checkedTags);
    }).then(() => {
        setOnClickToTagList();
    });
    showProblems(apiParams, checkedTags, tagMode);
}
function setOnClickToTagList() {
    var _a;
    const tagListItem = (_a = document.getElementById('tag-list')) === null || _a === void 0 ? void 0 : _a.getElementsByClassName('checkbox-item');
    if (tagListItem) {
        for (const item of tagListItem) {
            item.onclick = () => {
                if (item.classList.contains('active')) {
                    item.classList.remove('active');
                    const tagList = item.querySelectorAll('input[name=tagName]:checked');
                    tagList.forEach((element) => {
                        element.removeAttribute('checked');
                    });
                }
                else {
                    item.classList.add('active');
                    const tagList = item.querySelectorAll('input[name=tagName]:not(:checked)');
                    tagList.forEach((element) => {
                        element.setAttribute('checked', 'checked');
                    });
                }
            };
        }
    }
}
function setOnClickToStatusList() {
    var _a;
    const statusListItem = (_a = document.getElementById('status-list')) === null || _a === void 0 ? void 0 : _a.getElementsByClassName('checkbox-item');
    if (statusListItem) {
        for (const item of statusListItem) {
            item.onclick = () => {
                if (item.classList.contains('active')) {
                    item.classList.remove('active');
                    const statusList = item.querySelectorAll('input[name=status]:checked');
                    statusList.forEach((element) => {
                        element.removeAttribute('checked');
                    });
                }
                else {
                    item.classList.add('active');
                    const statusList = item.querySelectorAll('input[name=status]:not(:checked)');
                    statusList.forEach((element) => {
                        element.setAttribute('checked', 'checked');
                    });
                }
            };
        }
    }
}
init();
setOnClickToStatusList();
const orRadioButtonItem = document.getElementById('or-radio-btn-item');
if (orRadioButtonItem !== null) {
    orRadioButtonItem.onclick = () => {
        if (!orRadioButtonItem.classList.contains('active')) {
            selectOrRadioButton();
        }
    };
}
const andRadioButtonItem = document.getElementById('and-radio-btn-item');
if (andRadioButtonItem !== null) {
    andRadioButtonItem.onclick = () => {
        if (!andRadioButtonItem.classList.contains('active')) {
            selectAndRadioButton();
        }
    };
}
function getTagMode() {
    const radioOrTag = document.getElementById('or-radio-btn');
    if (radioOrTag && radioOrTag.hasAttribute('checked') && radioOrTag.getAttribute('checked') === 'checked') {
        return radioOrTag.value;
    }
    else {
        const radioAndTag = document.getElementById('and-radio-btn');
        return radioAndTag.value;
    }
}
function makeTagName(delimiter) {
    const tagList = [];
    const tagElements = document.getElementsByClassName('tag');
    for (const element of tagElements) {
        if (element.hasAttribute('checked') && element.getAttribute('checked')) {
            tagList.push(element.value);
        }
    }
    return tagList.join(delimiter);
}
const searchButton = document.getElementById('btn-search');
searchButton.onclick = () => {
    const handle = document.getElementById('handle').value;
    const tagMode = getTagMode();
    const tagParams = makeTagName(',');
    window.location.href = window.location.href.split('?')[0] + `?handle=${handle}&tag_mode=${tagMode}&tagName=${tagParams}`;
};
