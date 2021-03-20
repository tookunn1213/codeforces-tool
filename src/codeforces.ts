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
    const orRadioButton: HTMLInputElement = document.getElementById('or-radio-btn') as HTMLInputElement;
    orRadioButton.checked = true;
}

function selectAndRadioButton() {
    const andRadioButton: HTMLInputElement = document.getElementById('and-radio-btn') as HTMLInputElement;
    andRadioButton.checked = true;
}

function showStatus(currentStatus: Set<string>) {
    const statusElements: NodeListOf<HTMLInputElement> = document.getElementsByName('status') as NodeListOf<HTMLInputElement>;

    statusElements.forEach((status: HTMLInputElement) => {
        if (currentStatus.has(status.value)) {
            status.checked = true;
        }
    });
}

function showAllTag(checkedTags: Set<string>) {
    const xhr: XMLHttpRequest = new XMLHttpRequest();

    xhr.onload = () => {
        const json: any = JSON.parse(xhr.responseText);
        const tags: string[] = json['tags'];
        const tagList: HTMLDivElement = document.getElementById('tag-list') as HTMLDivElement;

        tags.forEach((tag: string) => {
            const tagName = tag.replace(/ /g, '_');

            const div: HTMLDivElement = document.createElement('div');
            div.setAttribute('class', 'form-check form-check-inline');

            const label: HTMLLabelElement = document.createElement('label');
            label.setAttribute('class', 'form-check-label');
            label.setAttribute('for', 'tag-' + tagName);
            label.innerText = tag;

            const checkbox: HTMLInputElement = document.createElement('input');
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

interface Problem {
    contestId: number,
    index: string,
    name: string,
    type: string,
    points: number,
    tags: string[],
}

function fetchProblems(): Promise<any> {
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

function fetchProblemStatistics(): Promise<any> {
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

function fetchAccepted(handle: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        xhr.onload = () => {
            resolve(JSON.parse(xhr.responseText));
        };

        xhr.onerror = () => {
            reject();
        }

        xhr.open('GET', 'https://codeforces.com/api/user.status?handle=' + handle);
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
        } else if (accepted.get(id) !== 'OK') {
            accepted.set(id, 'NG');
        }
    });

    return accepted;
}

function matchTags(tagParams: Set<string>, tags: string[], tagMode: string) {
    if (tagParams.size === 0 && tags.length === 0) {
        return true;
    }

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

function getRows(problems: Problem[], statistics: ProblemStatistics[], accepted: Map<string, string>, checkedStatus: Set<string>, tagParams: Set<string>, tagMode: string): HTMLTableRowElement[] {
    const problemURL = "https://codeforces.com/problemset/problem/";
    const statusURL = "https://codeforces.com/problemset/status/";

    const trList: HTMLTableRowElement[] = [];

    problems.forEach((problem: Problem, i: number) => {
        const name: string = problem.name;
        const id: number = problem.contestId;
        const index: string = problem.index;
        const solved: number = statistics[i].solvedCount;
        const tags: string[] = problem.tags;

        if (!matchTags(tagParams, tags, tagMode)) {
            return;
        }

        let color: string = '';
        if (!accepted.has(id + index)) {
            color = '';
        } else if (accepted.get(id + index) === 'OK') {
            color = 'success';
        } else if (accepted.get(id + index) === 'NG') {
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

        const tr: HTMLTableRowElement = document.createElement('tr');
        tr.setAttribute('class', color);

        const td1: HTMLTableDataCellElement = document.createElement('td');
        const a1: HTMLAnchorElement = document.createElement('a');
        a1.setAttribute('href', problemURL + id + '/' + index);
        a1.setAttribute('target', '_blank');
        a1.innerText = id + '-' + index;
        td1.append(a1);

        const td2: HTMLTableDataCellElement = document.createElement('td');
        const a2: HTMLAnchorElement = document.createElement('a');
        a2.setAttribute('href', problemURL + id + '/' + index);
        a2.setAttribute('target', '_blank');
        a2.innerText = name;
        td2.append(a2);

        const td3: HTMLTableDataCellElement = document.createElement('td');
        const a3: HTMLAnchorElement = document.createElement('a');
        a3.setAttribute('href', statusURL + id + '/problem/' + index);
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

function showProblems(apiParams: APIParam, checkedStatus: Set<string>, tagParams: Set<string>, tagMode: string) {

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
            Promise.resolve().then((): Promise<any> => {
                return fetchAccepted(apiParams.handle);
            }).then((fetchedAccepted: any): Promise<any> => {
                const ok: boolean = fetchedAccepted['status'] === 'OK';
                accepted = ok ? getAccepted(fetchedAccepted) : new Map();

                return Promise.resolve();
            }).then(() => {
                const trList: HTMLTableRowElement[] = getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode)
                const tableBody: HTMLTableSectionElement= document.getElementById('table-body') as HTMLTableSectionElement;
                tableBody.append(...trList);
            });
        } else {
            const trList: HTMLTableRowElement[] = getRows(problems, statistics, accepted, checkedStatus, tagParams, tagMode)
            const tableBody: HTMLTableSectionElement = document.getElementById('table-body') as HTMLTableSectionElement;
            tableBody.append(...trList);
        }
    });
}

function checkTags(tags: Set<string>) {
    tags.forEach((tag: string) => {
        const tagElement: HTMLInputElement = document.getElementById('tag-' + tag) as HTMLInputElement;
        tagElement.checked = true;
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

    const checkedTags: Set<string> = getCheckedTags(params.get('tagName')?? '');
    const checkedStatus: Set<string> = new Set<string>((params.get('status') ?? '').split(','));

    showStatus(checkedStatus);
    showAllTag(checkedTags);
    showProblems(apiParams, checkedStatus, checkedTags, tagMode);
}

function getCheckedTags(tagName: string): Set<string> {
    const tags: Set<string> = new Set();
    if (tagName.length > 0) {
        tagName.split(',')
            .forEach((tag: string) => {
                tags.add(tag);
            });
    }

    return tags;
}

function getTagMode(): string {
    const radioOrTag: HTMLInputElement = document.getElementById('or-radio-btn') as HTMLInputElement;

    if (radioOrTag.checked) {
        return radioOrTag.value;
    } else {
        const radioAndTag: HTMLInputElement = document.getElementById('and-radio-btn') as HTMLInputElement;
        return radioAndTag.value;
    }
}

function makeTagName(): string {
    const tagList: string[] = [];
    const tagElements: HTMLCollectionOf<HTMLInputElement> = document.getElementsByClassName('tag') as HTMLCollectionOf<HTMLInputElement>;

    for (let i = 0; i < tagElements.length; i++) {
        let element = tagElements.item(i);
        if (element?.checked) {
            tagList.push(element.value);
        }
    }

    return tagList.join(',');
}

function getStatus(): string {
    const elements: NodeListOf<HTMLInputElement> = document.getElementsByName('status') as NodeListOf<HTMLInputElement>;
    const status: string[] = [];

    elements.forEach((element) => {
        if (element.checked) {
            status.push(element.value);
        }
    });

    return status.join(',');
}

init();

const searchButton: HTMLButtonElement = document.getElementById('search-btn') as HTMLButtonElement;

searchButton.onclick = () => {
    const handle: string = (document.getElementById('handle') as HTMLInputElement).value;
    const tagMode: string = getTagMode();
    const tagParams: string = makeTagName();
    const status: string = getStatus();

    window.location.href = encodeURI(window.location.href.split('?')[0] + `?handle=${handle}&tag_mode=${tagMode}&tagName=${tagParams}&status=${status}`);
};