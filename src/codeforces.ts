function getQueryString(): Map<string, string> {
    const queryStr: string = decodeURI(window.location.search);
    let retParam: Map<string, string> = new Map<string, string>();

    if (queryStr.length > 0) {
        const getParams: string[] = queryStr.substring(1).split("&");

        getParams.forEach(get_param => {
            const param: string[] = get_param.split("=");
            const name: string = param[0];
            const value: string = param[1];

            retParam.set(name, value);
        });
    }

    return retParam;
}

function selectOrRadioButton() {

    const orRadioButtonItem: HTMLElement | null = document.getElementById('or-radio-btn-item');
    const orRadioButton: HTMLElement | null = document.getElementById('or-radio-btn');

    if (orRadioButtonItem && orRadioButton) {
        orRadioButtonItem.classList.add('active');

        if (!orRadioButton.hasAttribute('checked')) {
            orRadioButton.setAttribute('checked', 'checked');
        }
    }

    const andRadioButtonItem: HTMLElement | null = document.getElementById('and-radio-btn-item');
    const andRadioButton: HTMLElement | null = document.getElementById('and-radio-btn');

    if (andRadioButtonItem && andRadioButton) {
        andRadioButtonItem.classList.remove('active');

        if (andRadioButton.hasAttribute('checked')) {
            andRadioButton.removeAttribute('checked');
        }
    }
}

function selectAndRadioButton() {
    const orRadioButtonItem: HTMLElement | null = document.getElementById('or-radio-btn-item');
    const orRadioButton: HTMLElement | null = document.getElementById('or-radio-btn');

    if (orRadioButtonItem !== null && orRadioButton !== null) {
        orRadioButtonItem.classList.remove('active');

        if (orRadioButton.hasAttribute('checked')) {
            orRadioButton.removeAttribute('checked');
        }
    }

    const andRadioButtonItem: HTMLElement | null = document.getElementById('and-radio-btn-item');
    const andRadioButton: HTMLElement | null = document.getElementById('and-radio-btn');

    if (andRadioButtonItem !== null && andRadioButton !== null) {
        andRadioButtonItem.classList.add('active');
        if (!andRadioButton.hasAttribute('checked')) {
            andRadioButton.setAttribute('checked', 'checked');
        }
    }
}

function showStatus(currentStatus: Set<string>) {
    const statusIdList: string[] = ['ac', 'wa', 'nosubmit'];
    const statusNameList: string[] = ['AC', 'WA', 'NoSubmit'];
    const statusClass = ['accepted', 'wronganswer', 'nosubmit'];

    const statusListElement: HTMLElement | null = document.getElementById('status-list');

    if (statusListElement) {
        statusIdList.forEach((statusId: string, index: number) => {
            const li: HTMLLIElement = document.createElement('li');
            li.setAttribute('id', 'status-' + statusId);
            
            const checked: boolean = currentStatus.has(statusId);

            const active:string = checked ? ' active' : '';
            li.setAttribute('class', `checkbox-item checkbox-item--big  ${active} ${statusClass[index]}`);

            const label: HTMLLabelElement = document.createElement('label');
            label.setAttribute('class', 'checkbox-item-label');

            const checkbox: HTMLInputElement = document.createElement('input');
            checkbox.setAttribute('type', 'checkbox');
            checkbox.setAttribute('status', 'status-' + statusId);
            checkbox.setAttribute('class', 'form-control checkbox checkbox');
            checkbox.setAttribute('name', 'status');
            checkbox.value = statusId;

            if (checked) {
                checkbox.setAttribute('checked', 'checked');
            }

            label.innerText = statusNameList[index];

            li.append(label, checkbox);
            statusListElement.append(li);
        });
    }
}

function showAllTag(checkedTags: Set<string>) {
    return new Promise((resolve, reject) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        xhr.onload = () => {
            const json: any = JSON.parse(xhr.responseText);
            const tags: string[] = json['tags'];
            const tagList: HTMLElement | null = document.getElementById('tag-list');

            if (tagList) {
                tags.forEach((tag: string) => {
                    const tagName = tag.replace(/ /g, '_');

                    const li: HTMLLIElement = document.createElement('li');
                    li.setAttribute('class', 'checkbox-item checkbox-item--small');

                    const label: HTMLLabelElement = document.createElement('label');
                    label.setAttribute('class', 'checkbox-item-label');

                    const checkbox: HTMLInputElement = document.createElement('input');
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

interface Problem {
    contestId: number,
    index: string,
    name: string,
    type: string,
    points: number,
    tags: string[],
}

function fetchProblems() {
    return new Promise((resolve, reject) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        xhr.onload = () => {
            const problems: Problem[] = JSON.parse(xhr.responseText);
            resolve(problems);
        };

        xhr.onerror = () => {
            reject();
        }

        xhr.open('GET', './json/problemset_problems.json');
        xhr.send();
    });
}

interface ProblemStatistics {
    contestId: number,
    index: string,
    solvedCount: number,
}

function fetchProblemStatistics() {
    return new Promise((resolve, reject) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        xhr.onload = () => {
            const statistics: ProblemStatistics = JSON.parse(xhr.responseText);
            resolve(statistics);
        };

        xhr.onerror = () => {
            reject();
        }

        xhr.open('GET', './json/problemset_problemStatistics.json');
        xhr.send();
    });
}

function fetchAccepted(handle: string) {
    return new Promise((resolve, reject) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        xhr.onload = () => {
            resolve(JSON.parse(xhr.responseText));
        };

        xhr.onerror = () => {
            reject();
        }

        xhr.open('GET', 'http://codeforces.com/api/user.status?handle=' + handle);
        xhr.send();
    });
}

interface InnerProblem {
    contestId: number,
    index: string,
    name: string,
    type: string,
    rating: number,
    tags: string[],
}

interface InnerMember {
    handle: string,
}

interface InnerAuthor {
    contestId: number,
    members: InnerMember[],
    participantType: string,
    ghost: boolean,
    startTimeSeconds: number,
}

interface Submission {
    id: number,
    contestId: number,
    creationTimeSeconds: number,
    relativeTimeSeconds: number,
    problem: InnerProblem,
    author: InnerAuthor,
    programmingLanguage: string,
    verdict: string,
    testset: string,
    passedTestCount: number,
    timeConsumedMillis: number,
    memoryConsumedBytes: number,
}

function getAccepted(json: any): Map<string, string> {
    const accepted: Map<string, string> = new Map<string, string>();

    const submissions: Submission[] = json['result'] as Submission[];

    submissions.forEach((submission: Submission) => {
        const id: string = submission.contestId + submission.problem.index;

        if (submission.verdict === 'OK') {
            accepted.set(id, 'OK');
        }
    });

    return accepted;
}

function matchTags(tagParams: Set<string>, tags: string[], tagMode: string) {
    if (tagMode === 'and') {
        let ok = true;

        if (tagParams.size !== tags.length) {
            return false;
        }

        tags.forEach((tag: string) => {
            const replaced: string = tag.replace(/ /g, '_');
            ok = ok && tagParams.has(replaced);
        });

        return ok;
    } else {
        let ok: boolean = false;

        tags.forEach((tag) => {
            const replaced: string = tag.replace(/ /g, '_');
            ok = ok || tagParams.has(replaced);
        });

        return ok;
    }
}

function getRows(problems: Problem[], statistics: ProblemStatistics[], accepted: Map<string, string>, tagParams: Set<string>, tagMode: string): HTMLTableRowElement[] {
    const problemURL = "http://codeforces.com/problemset/problem/";
    const statusURL = "http://codeforces.com/problemset/status/";

    const trList: HTMLTableRowElement[] = [];

    problems.forEach((problem: Problem, i: number) => {
        const name: string = problem.name;
        const id: number = problem.contestId;
        const index: string = problem.index;
        const solved: number = statistics[i].solvedCount;
        const tags: string[] = problem.tags;

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
        } else if (accepted.get(id + index) === 'OK') {
            color = 'success';
        } else if (accepted.get(id + index) === 'NG') {
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

        const td4: HTMLTableDataCellElement = document.createElement('td');

        const ul: HTMLUListElement = document.createElement('ul');
        ul.setAttribute('class', 'list-inline');
        if (tags.length === 0) {
            const li: HTMLLIElement = document.createElement('li');
            li.innerText = '-';
            ul.append(li);
        } else {
            const liList: HTMLLIElement[] = tags.map((tag: string): HTMLLIElement => {
                const li: HTMLLIElement = document.createElement('li');
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

function showProblems(apiParams: APIParam, tagParams: Set<string>, tagMode: string) {

    let problems: Problem[] = [];
    let statistics: ProblemStatistics[] = [];
    Promise.resolve().then(() => {
        return fetchProblems();
    }).then((fetchedProblems: any) => {
        problems = fetchedProblems;

        return fetchProblemStatistics();
    }).then((fetchedStatistics: any) => {
        statistics = fetchedStatistics;

        return Promise.resolve();
    }).then(() => {
        let accepted: Map<string, string> = new Map();
        if (apiParams.handle) {
            Promise.resolve().then(() => {
                return fetchAccepted(apiParams.handle);
            }).then((fetchedAccepted: any) => {
                const ok = fetchedAccepted['status'] === 'OK';
                accepted = ok ? getAccepted(fetchedAccepted) : new Map();

                return Promise.resolve();
            }).then(() => {
                const trList: HTMLTableRowElement[] = getRows(problems, statistics, accepted, tagParams, tagMode)

                const tableBody: HTMLElement | null = document.getElementById('table-body');

                if (tableBody !== null) {
                    tableBody.append(...trList);
                }
            });
        } else {
            const trList: HTMLTableRowElement[] = getRows(problems, statistics, accepted, tagParams, tagMode)

            const tableBody: HTMLElement | null = document.getElementById('table-body');

            if (tableBody !== null) {
                tableBody.append(...trList);
            }
        }
    });
}

function escapeSelector(str: string): string {
    return str.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, "\\$&");
}

function checkTags(tags: Set<string>) {
    tags.forEach((tag: string) => {
        const escapedTag: string = escapeSelector(tag);
        const tagElement: HTMLElement | null = document.getElementById('tag-' + escapedTag);

        if (tagElement === null) {
            return;
        }

        const checkBoxItem: HTMLElement | null = tagElement.closest('.checkbox-item');
        checkBoxItem?.classList
            .add('active');
        tagElement.setAttribute('checked', 'checked');
    });
}

interface APIParam {
    handle: string,
    from: string,
    count: string
}

function init() {
    let params: Map<string, string> = getQueryString();
    let apiParams: APIParam = {
        handle: "",
        from: "1",
        count: "5000"
    };

    let tagMode: string = params.get('tag_mode') ?? '';

    if (tagMode === "and") {
        selectAndRadioButton();
    } else {
        selectOrRadioButton();
    }

    if (params.has('handle')) {
        apiParams.handle = params.get('handle') ?? '';
    }

    const handleElement: HTMLInputElement = document.getElementById('handle') as HTMLInputElement;
    handleElement.value = params.get('handle') ?? '';

    const checkedTags: Set<string> = new Set<string>();
    if (params.has('tagName')) {
        params.get('tagName') ?? ''
            .split(',')
            .forEach((tag: string) => {
                checkedTags.add(tag);
            });
    }

    const checkedStatus: Set<string> = new Set<string>((params.get('status')?? '').split(','));
    showStatus(checkedStatus);
    Promise.resolve().then(() => {
        return showAllTag(checkedTags);
    }).then(() => {
        setOnClickToTagList();
    });
    showProblems(apiParams, checkedTags, tagMode);
}

function setOnClickToTagList() {
    const tagListItem: HTMLCollectionOf<HTMLElement> | undefined = document.getElementById('tag-list')
        ?.getElementsByClassName('checkbox-item') as HTMLCollectionOf<HTMLElement>;

    if (tagListItem) {
        for (const item of tagListItem) {
            item.onclick = () => {
                if (item.classList.contains('active')) {
                    item.classList.remove('active');

                    const tagList: NodeListOf<HTMLElement> = item.querySelectorAll('input[name=tagName]:checked') as NodeListOf<HTMLElement>;
                    tagList.forEach((element: HTMLElement) => {
                        element.removeAttribute('checked');
                    });
                } else {
                    item.classList.add('active');

                    const tagList: NodeListOf<HTMLElement> = item.querySelectorAll('input[name=tagName]:not(:checked)') as NodeListOf<HTMLElement>;
                    tagList.forEach((element: HTMLElement) => {
                        element.setAttribute('checked', 'checked');
                    });
                }
            }
        }
    }
}

function setOnClickToStatusList() {
    const statusListItem: HTMLCollectionOf<HTMLElement> | undefined = document.getElementById('status-list')
        ?.getElementsByClassName('checkbox-item') as HTMLCollectionOf<HTMLElement>;

    if (statusListItem) {
        for (const item of statusListItem) {
            item.onclick = () => {
                if (item.classList.contains('active')) {
                    item.classList.remove('active');

                    const statusList: NodeListOf<HTMLElement> = item.querySelectorAll('input[name=status]:checked') as NodeListOf<HTMLElement>;
                    statusList.forEach((element: HTMLElement) => {
                        element.removeAttribute('checked');
                    });
                } else {
                    item.classList.add('active');

                    const statusList: NodeListOf<HTMLElement> = item.querySelectorAll('input[name=status]:not(:checked)') as NodeListOf<HTMLElement>;
                    statusList.forEach((element: HTMLElement) => {
                        element.setAttribute('checked', 'checked');
                    });
                }
            }
        }
    }
}

function getTagMode(): string {
    const radioOrTag: HTMLInputElement = document.getElementById('or-radio-btn') as HTMLInputElement;

    if (radioOrTag && radioOrTag.hasAttribute('checked') && radioOrTag.getAttribute('checked') === 'checked') {
        return radioOrTag.value;
    } else {
        const radioAndTag: HTMLInputElement = document.getElementById('and-radio-btn') as HTMLInputElement;
        return radioAndTag.value;
    }
}

function makeTagName(delimiter: string): string {
    const tagList: string[] = [];

    const tagElements: HTMLCollectionOf<HTMLInputElement> = document.getElementsByClassName('tag') as HTMLCollectionOf<HTMLInputElement>;

    for (const element of tagElements) {
        if (element.hasAttribute('checked') && element.getAttribute('checked')) {
            tagList.push(element.value);
        }
    }

    return tagList.join(delimiter);
}

function getStatus(): string[] {
    const elements: NodeListOf<HTMLInputElement> = document.getElementsByName('status') as NodeListOf<HTMLInputElement>;

    const status: string[] = [];
    elements.forEach((element) => {
        if (element.getAttribute('checked') === 'checked') {
            status.push(element.value);
        }
    });

    return status;
}

init();
setOnClickToStatusList();

const orRadioButtonItem: HTMLElement | null = document.getElementById('or-radio-btn-item');

if (orRadioButtonItem !== null) {
    orRadioButtonItem.onclick = () => {
        if (!orRadioButtonItem.classList.contains('active')) {
            selectOrRadioButton();
        }
    };
}

const andRadioButtonItem: HTMLElement | null = document.getElementById('and-radio-btn-item');

if (andRadioButtonItem !== null) {
    andRadioButtonItem.onclick = () => {
        if (!andRadioButtonItem.classList.contains('active')) {
            selectAndRadioButton();
        }
    };
}

const searchButton: HTMLButtonElement = document.getElementById('btn-search') as HTMLButtonElement;

searchButton.onclick = () => {
    const handle = (document.getElementById('handle') as HTMLInputElement).value;
    const tagMode = getTagMode();
    const tagParams = makeTagName(',');
    const status = getStatus().join(',');

    window.location.href = window.location.href.split('?')[0] + `?handle=${handle}&tag_mode=${tagMode}&tagName=${tagParams}&status=${status}`;
};