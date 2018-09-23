$(document).ready(function() {
    let params = getQueryString();
    let api_params = {
        'handle':   "",
        'from'  :   "1",
        'count' :   "5000",
    };

    // select tag mode
    let tag_mode = params['tag_mode'];
    if (tag_mode === "and") {
        selectAndRadioButton();
    } else {
        selectOrRadioButton();
    }

    if (params['handle']) {
        api_params['handle'] = params['handle'];
    }

    $("#handle").val(params['handle']);

    checked_tags = new Set();
    if (params['tagName']) {
        tags = params['tagName'].split(',');
        tags.forEach(function(tag){
            checked_tags.add(tag);
        });
    }

    showStatus();
    showAllTag(checked_tags);
    showProblems(api_params, checked_tags, tag_mode);
});

function showStatus() {
    let status_id_list      = ["ac", "wa", "nosubmit"];
    let status_name_list    = ["AC", "WA", "NoSubmit"];
    let status_class        = ["accepted", "wronganswer", "nosubmit"]

    let $ul = $("#status-list");
    status_id_list.forEach(function(status_id, index) {
        let $li         = $("<li></li>", {
            id: "status-" + status_id,
            class: "checkbox-item checkbox-item--big " + status_class[index],
        });
        let $label      = $("<label></label>", {
            class: "checkbox-item-label",
        });
        let $checkbox   = $("<input>", {
            type:   "checkbox",
            id:     "status-" + status_id,
            class:  "form-control status checkbox",
            name:   "status",
            value:  status_id,
        });
        $label.text(status_name_list[index]);

        $li.append($label);
        $li.append($checkbox);
        $ul.append($li);
    });
}

function getQueryString() {
    let query_str = decodeURI(window.location.search);
    let retParam = {};

    if (query_str.length > 0) {
        let get_params = query_str.substring(1).split("&");

        get_params.forEach(function(get_param) {
            let param       = get_param.split("=");
            let name        = param[0];
            let value       = param[1];

            retParam[name] = value;
        });
    }

    return retParam;
}

function showAllTag(checked_tags) {
    $.when(
        $.getJSON("./json/problem_tags.json")
    ).done(function(problem_tags_json) {
        let tags        = problem_tags_json['tags'];
        let tag_list    = $("#tag-list");

        tags.forEach(function(tag) {
            let tag_name    = tag.replace(/ /g, "_");
            let $li         = $("<li></li>", {
                class: "checkbox-item checkbox-item--small",
            });
            let $label      = $("<label></label>", {
                class: "checkbox-item-label",
            });
            let $checkbox   = $("<input>", {
                type:   "checkbox",
                id:     "tag-" + tag_name,
                class:  "form-control checkbox",
                name:   "tagName",
                value:  tag_name,
            });

            $label.text(tag);
            $li.append($label);
            $li.append($checkbox);
            tag_list.append($li);
        });

        checkTags(checked_tags);
    });

}

function escapeSelector(str) {
  return str.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, "\\$&");
}

function checkTags(tags) {
    tags.forEach(function(tag) {
        let escapedTag = escapeSelector(tag);
        $("#tag-" + escapedTag).closest(".checkbox-item").addClass("active");
        $("#tag-" + escapedTag).prop("checked", true);
    });
}

function makeTagName(delim) {
    let tag_list = [];

    $(".tag").each(function() {
        if ($(this).is(":checked")) {
            tag_list.push($(this).val());
        }
    });

    return tag_list.join(delim);
}

function getTagMode() {
    if ($("#radio-or-tag").is(":checked")) {
        return $("#radio-or-tag").val();
    } else {
        return $("#radio-and-tag").val();
    }
}

$("#btn-search").on("click", function() {
    let handle      = $("#handle").val();
    let tag_mode    = getTagMode();
    let tag_params  = makeTagName(',');

    window.location.href = window.location.href.split("?")[0] 
        + `?handle=${handle}&tag_mode=${tag_mode}&tagName=${tag_params}`;
})

function getAccepted(submission_json) {
    let accepted = {};

    let submissions = submission_json['result'];
    submissions.forEach(function(submission) {
        let contest_id  = submission['contestId'];
        let index       = submission['problem']['index'];
        let key         = contest_id + index;

        if (submission['verdict'] === "OK") {
            accepted[key] = "OK";
        } else if(accepted[key] !== "OK") {
            accepted[key] = "NG";
        }
    });

    return accepted;
}

function matchTags(tags_params, tags, tag_mode) {

    if (tag_mode === "and") {
        let ok = true;

        if (tags_params.size !== tags.length) {
            return false;
        }

        tags.forEach(function(tag) {
            replaced = tag.replace(/ /g, "_");
            has = tags_params.has(replaced);
            ok = ok && has;
        });

        return ok;
    } else {
        let ok = false;

        tags.forEach(function(tag) {
            replaced = tag.replace(/ /g, "_");
            has = tags_params.has(replaced);
    
            ok = ok || has;
        });

        return ok;
    }
}

function getRows(problems_json, problem_statistics_json, accepted, tags_params, tag_mode) {
    let problem_URL = "http://codeforces.com/problemset/problem/";
    let status_URL  = "http://codeforces.com/problemset/status/";

    let ret = "";
    for (let i = 0;i < problems_json[0].length;i++) {
        let problem = problems_json[0][i];

        let name    = problem.name;
        let id      = problem.contestId;
        let index   = problem.index;
        let solved  = problem_statistics_json[0][i].solvedCount;
        let tags    = problem.tags;
        let color   = "";

        if (tags_params.size > 0 && tags.length == 0) {
            continue;
        }

        let match = matchTags(tags_params, tags, tag_mode);
        console.log(tag_mode);

        if (!match && tags.length > 0) {
            continue;
        }

        if (!accepted[id + index]) {
            color = "";
        } else if (accepted[id + index] == 'OK') {
            color = "class=\"success\"";
        } else if(accepted[id + index] == 'NG') {
            color = "class=\"warning\"";
        }

        ret += "<tr "+color+">"+
        "<td><a href=\""+ problem_URL + id + "/" + index + "\" target=\"_blank\">" + id + "-" + index + "</a></td>" + 
        "<td><a href=\""+ problem_URL + id + "/" + index + "\" target=\"_blank\">" + name + "</a></td>" +  
        "<td><a href=\"" + status_URL + id + "/problem/" + index + "\" target=\"_blank\">" + solved + "</a></td>";
        ret += "<td>";

        if (tags.length === 0) {
            ret += '<ul class="list-inline">';
            ret += "<li>-</li>";
            ret += "<ul>";
        } else {
            ret += '<ul class="list-inline">';
            ret += tags.map(function(tag) {
                return '<li class="problem-tag">' + tag + "</li>";
            }).join("");
            ret += "</ul>";
        }
        ret += "</td></tr>";
    }
    return ret;
}

function showProblems(api_params, tag_params, tag_mode) {
    $.when(
        $.getJSON("./json/problemset_problems.json"),
        $.getJSON("./json/problemset_problemStatistics.json")
    ).done(function(problems_json, problem_statistics_json) {
        let rows = "";
        if (api_params['handle']) {
            $.when(
                $.getJSON("http://codeforces.com/api/user.status", api_params)
            ).done(function(submission_json) {
                let isStatusOk  = submission_json['status'] === "OK";
                let accepted    = isStatusOk ? getAccepted(submission_json) : {};

                rows = getRows(problems_json, problem_statistics_json, accepted, tag_params, tag_mode);
                $("#table-body").append(rows);
            });
        } else {
            rows = getRows(problems_json, problem_statistics_json, {}, tag_params, tag_mode);
            $("#table-body").append(rows);
        }
    });
}

$("#tag-list").on("click", ".checkbox-item", function() {
    if ($(this).hasClass("active")) {
        $(this).removeClass("active");

        $(this).find("input[name=tagName]:checked").prop("checked", false);
    } else {
        $(this).addClass("active");

        $(this).find("input[name=tagName]:not(:checked)").prop("checked", true);
    }
});

$("#status-list").on("click", ".checkbox-item", function() {
    if ($(this).hasClass("active")) {
        $(this).removeClass("active");

        $(this).find("input[name=status]:checked").prop("checked", false);
    } else {
        $(this).addClass("active");

        $(this).find("input[name=status]:not(:checked)").prop("checked", true);
    }
});

$("#or-radio-btn-item").on("click", function() {
    if (!$(this).hasClass("active")) {
        selectOrRadioButton();
    }
});

$("#and-radio-btn-item").on("click", function() {
    if (!$(this).hasClass("active")) {
        selectAndRadioButton();
    }
});

function selectOrRadioButton() {
    $("#or-radio-btn-item").addClass("active");
    $("#or-radio-btn").prop("checked", true);
    $("#and-radio-btn-item").removeClass("active");
    $("#and-radio-btn").prop("checked", false);
}

function selectAndRadioButton() {
    $("#or-radio-btn-item").removeClass("active");
    $("#or-radio-btn").prop("checked", false);
    $("#and-radio-btn-item").addClass("active");
    $("#and-radio-btn").prop("checked", true);
}