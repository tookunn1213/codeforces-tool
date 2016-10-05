$(document).ready(function ()
{
	var params = getQueryStr();
	var next_params = {'handle' : "", 'from' : "1",'count' : "5000"};
	if(params["handle"]){
		next_params['handle'] = params["handle"];
	}
	$("#handle").val(params["handle"]);
	$("#problemIDorder").val(params["problemIDorder"]);
	$("#solvedorder").val(params["solvedorder"]);
	showProblems(next_params);
});

function getQueryStr(){
	var queryStr = window.location.search;
	var ret = {};

	if(queryStr.length > 0){
		queryStr = queryStr.substring(1);
		var params = queryStr.split("&");
		var len = params.length;
		for(var i = 0;i < len;i++){
			var query = params[i].split("=");
			var paramKey = decodeURIComponent(query[0]);
			var paramValue = decodeURIComponent(query[1]);
			ret[paramKey] = paramValue;
		}
	}
	return ret;
}

$("#handle-btn").click(function(){
	var handle = $("#handle").val();
	var problemID_order = $("#problemIDorder").val();
	var solved_order = $("#solvedorder").val();
	window.location.href = window.location.href.split("?")[0] 
		+ "?handle=" + handle 
		+ "&problemIDorder=" + problemID_order 
		+ "&solvedorder=" + solved_order;
});

function getAccepted(submission_json){
	var accepted = {};
	var len = submission_json['result'].length;
	for(var i = 0;i < len;i++){
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
	var len = problems_json[0].length;
	var ret = "";
	for(var i = 0;i < len;i++){
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
		ret += "<tr "+color+">"+
		"<td><a href=\""+problemURL + id +"/"+ index +"\"target=\"_blank\">"+ id + index +"</a></td>" + 
		"<td><a href=\""+problemURL + id +"/"+ index + "\"target=\"_blank\">"+name +"</a></td>" +  
		"<td>"+"<a href=\""+statusURL + id +"/problem/"+ index +"\"target=\"_blank\">" + solved +"</a></td>" + "</tr>";
	}
	return ret;
}

 /*function orderSort(rows){

 	var problemID_order = $('#problemIDorder').val();
 	//var solved_order = $('#solvedorder').val();

 	if(problemID_order == "asc"){
 		
 	}else if(problemID_order == "desc"){

 	}

 	return rows;
 }*/

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
				//rows = orderSort(rows);
				$('#table-body').append(rows);
			});
		}else{
			var rows = getRows(problems_json,problemStatistics_json,{});
			$('#table-body').append(rows);
		}
	});
}