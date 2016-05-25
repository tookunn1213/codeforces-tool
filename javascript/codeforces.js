$(document).ready(function ()
{
	var params = getQueryStr();
	var next_params = {'handle' : "", 'from' : "1",'count' : "5000"};
	if(params["user"]){
		next_params['handle'] = params["user"];
	}
	$("#user").val(next_params["handle"]);
	showProblems(next_params);
});

function getQueryStr(){
	var queryStr = window.location.search;
	var ret = {};

	if(queryStr.length > 0){
		queryStr = queryStr.substring(1);
		var params = queryStr.split("&");
		for(var i = 0;i < params.length;i++){
			var query = params[i].split("=");
			var paramKey = decodeURIComponent(query[0]);
			var paramValue = decodeURIComponent(query[1]);
			ret[paramKey] = paramValue;
		}
	}
	return ret;
}

$("#user-btn").click(function(){
	var userid = $("#user").val();
	window.location.href = window.location.href.split("?")[0] + "?user=" + userid;
});

function getAccepted(submission_json){
	var accepted = {};
	for(var i = 0;i < submission_json['result'].length;i++){
		var submission = submission_json['result'][i];
		var contestId = submission['contestId'];
		var index = submission['problem']['index'];
		var key = contestId + index;
		if(submission['verdict'] == 'OK'){
			accepted[key] = 'OK';
		}else if(accepted[key] != 'OK'){
			accepted[key] = 'NG';
		}
	}

	return accepted;
}

function getRows(problems_json,problemStatistics_json,accepted){
	var problemURL = "http://codeforces.com/problemset/problem/";
	var statusURL = "http://codeforces.com/problemset/status/";

	var rows = [];
	for(var i = 0;i < problems_json[0].length;i++){
		var problem = problems_json[0][i];

		var name = problem.name;
		var id = problem.contestId;
		var index = problem.index;
		var solved = problemStatistics_json[0][i].solvedCount;
		var color = "";

		if(!accepted[id + index]){
			color = "";
		}
		else if(accepted[id + index] == 'OK'){
			color = "class=\"success\"";
		}else if(accepted[id + index] == 'NG'){
			color = "class=\"warning\"";
		}
		var problemID_col = "<td><a href=\""+problemURL + id +"/"+ index +"\">"+ id + index +"</a></td>";
		var problemName_col = "<td><a href=\""+problemURL + id +"/"+ index + "\">"+name +"</a></td>"; 
		var solvedCount_col = "<td>"+"<a href=\""+statusURL + id +"/problem/"+ index +"\">" + solved +"</a></td>";
		rows.push("<tr "+color+">"+problemID_col + problemName_col + solvedCount_col +"</tr>");
	}
	return rows;
}

function showProblems(params){
	$.when(
		$.getJSON('./json/problemset_problems.json'),
		$.getJSON('./json/problemset_problemStatistics.json')
	).done(function(problems_json,problemStatistics_json){
		if(params['handle']){
			$.when(
				$.getJSON('http://codeforces.com/api/user.status',params)
			).done(function(submission_json){
				var accepted = {};
				if(submission_json['status'] == 'OK'){
					accepted = getAccepted(submission_json);
				}

				var rows = getRows(problems_json,problemStatistics_json,accepted);
				for(var i = 0;i < rows.length;i++){
					$('tbody').prepend(rows[i]);
				}
			});
		}else{
			var rows = getRows(problems_json,problemStatistics_json,{});
			for(var i = 0;i < rows.length;i++){
				$('tbody').prepend(rows[i]);
			}
		}
	});
}