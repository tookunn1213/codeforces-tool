$(document).ready(function() {
    let params = getQueryString();
    let api_params = {
        'handle' : "",
        'from' : "1",
        'count' : "5000"
    };

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

    showAllTag(checked_tags);
    showProblems(api_params, checked_tags);
});

function getQueryString() {
    let query_str = decodeURI(window.location.search);
    let retParam = {};

    if (query_str.length > 0) {
        let get_params = query_str.substring(1).split("&");

        get_params.forEach(function(get_param) {
            let param = get_param.split("=");
            let name = param[0];
            let value = param[1];
            retParam[name] = value;
        });
    }

    return retParam;
}

function showAllTag(checked_tags) {
    $.when(
        $.getJSON("./json/problem_tags.json")
    ).done(function(problem_tags_json) {
        let tags = problem_tags_json['tags'];
        let tag_list = $("#tag-list");

        tags.forEach(function(tag) {
            let tag_name = tag.replace(/ /g, "_");

            let $li = $("<li></li>", {
                class: "theme-color",
            });
            let $label = $("<label></label>");
            $label.text(tag);
            let $checkbox = $("<input>", {
                type: "checkbox",
                id: "tag-" + tag_name,
                class: "form-control tag",
                name: "tagName",
                value: tag_name,
            });

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
        $("#tag-" + escapedTag).closest("li").addClass("checked");
        $("#tag-" + escapedTag).closest("li").find("label").addClass("checked");
        $("#tag-"+escapedTag).prop("checked", true);
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

$("#btn-search").on("click", function(){
    let handle = $("#handle").val();
    let tag_params = makeTagName(',');
    window.location.href = window.location.href.split("?")[0] 
        + `?handle=${handle}&tagName=${tag_params}`;
})

function getAccepted(submission_json) {
    let accepted = {};

    let submissions = submission_json['result'];
    submissions.forEach(function(submission) {
        let contest_id  = submission['contestId'];
        let index       = submission['problem']['index'];
        let key         = contest_id + index;

        if (submission['verdict'] === "OK") {
            accepted[key] = 'OK';
        } else if(accepted[key] !== "OK") {
            accepted[key] = 'NG';
        }
    });

    return accepted;
}

function getRows(problems_json, problem_statistics_json, accepted, tags_params) {
    let problem_URL = "http://codeforces.com/problemset/problem/";
    let status_URL = "http://codeforces.com/problemset/status/";

    let ret = "";
    for (let i = 0;i < problems_json[0].length;i++) {
        let problem = problems_json[0][i];

        let name = problem.name;
        let id = problem.contestId;
        let index = problem.index;
        let solved = problem_statistics_json[0][i].solvedCount;
        let tags = problem.tags;
        let color = "";

        if (tags_params.size > 0 && tags.length == 0) {
            continue;
        }

        let flag = false;
        for (let j = 0;j < tags.length;j++) {
            replaced_tag = tags[j].replace(/ /g,'_');
            flag |= tags_params.has(replaced_tag);
        }

        if (!flag && tags.length > 0) {
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
        "<td><a href=\""+problem_URL + id +"/"+ index +"\" target=\"_blank\">"+ id + index +"</a></td>" + 
        "<td><a href=\""+problem_URL + id +"/"+ index + "\" target=\"_blank\">"+name +"</a></td>" +  
        "<td>"+"<a href=\""+status_URL + id +"/problem/"+ index +"\" target=\"_blank\">" + solved +"</a></td>";
        ret += "<td>";

        tags.m
        if (tags.length === 0) {
            ret += "<ul>";
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

function showProblems(api_params, tag_params) {
    $.when(
        $.getJSON("./json/problemset_problems.json"),
        $.getJSON("./json/problemset_problemStatistics.json")
    ).done(function(problems_json, problem_statistics_json) {
        let rows = "";
        if (api_params['handle']) {
            $.when(
                $.getJSON("http://codeforces.com/api/user.status", api_params)
            ).done(function(submission_json) {
                let isStatusOk = submission_json['status'] === "OK";
                let accepted = isStatusOk ? getAccepted(submission_json) : {};

                rows = getRows(problems_json, problem_statistics_json, accepted, tag_params);
                $("#table-body").append(rows);
            });
        } else {
            rows = getRows(problems_json, problem_statistics_json, {}, tag_params);
            $("#table-body").append(rows);
        }
    });
}

$("ul#tag-list").on("click", "li",function() {
    if ($(this).hasClass("checked")) {
        $(this).removeClass("checked");

        $(this).find("input[name=tagName]:checked").prop("checked", false);
        $(this).find("label").removeClass("checked");
    } else {
        $(this).addClass("checked");

        $(this).find("input[name=tagName]:not(:checked)").prop("checked", true);
        $(this).find("label").addClass("checked");
    }
});