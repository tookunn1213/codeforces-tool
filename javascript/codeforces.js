$(document).ready(function()
{
	var params = getQueryStr();
	var next_params = {'handle' : "", 'from' : "1",'count' : "5000"};
	if(params["handle"]){
		next_params['handle'] = params["handle"];
	}

	$("#handle").val(params["handle"]);

	selected_tags = new Set();
	if(params['tagName']){
		tags = params['tagName'].split(',');
		for(var i = 0;i < tags.length;i++){
			selected_tags.add(tags[i]);
		}
	}

	showAllTag(selected_tags);
	showProblems(next_params,selected_tags);
});

function showAllTag(selected_tags) {
	$.when(
		$.getJSON('./json/problem_tags.json')
	).done(function (problem_tags_json){
		var tags = problem_tags_json['tags'];
		var tag_list = $('#tag-list');

		var len = tags.length;
		for(var i = 0;i < len;i++){
			tag_name = tags[i].replace(/ /g,'_');
			var node = "<li><input type=\"checkbox\" id=\"tag-"
			+ tag_name
			+ "\" class=\"form-control tag\" name=\"tagName\" value=\"" + tag_name +"\">" 
			+ "<label for=\"tag-"+tag_name + "\">"
			+ tags[i]
			+ "</label></li>"
			tag_list.append(node);
		}

		checkTags(selected_tags);
	});

}
function escapeSelectorStr(val){
  return val.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, "\\$&");
}
function checkTags(tags) {
	tags.forEach(function (current,index,array) {
		console.log($("#tag-"+escapeSelectorStr(current)));
		$("#tag-"+escapeSelectorStr(current)).prop('checked', true);
	});
}

function getQueryStr(){
	var query_str = window.location.search;
	var ret = {};

	if(query_str.length > 0){
		query_str = query_str.substring(1);
		var params = query_str.split("&");
		var len = params.length;
		for(var i = 0;i < len;i++){
			var query = params[i].split("=");
			var param_name = decodeURIComponent(query[0]);
			var param_value = decodeURIComponent(query[1]);
			ret[param_name] = param_value;
		}
	}
	return ret;
}

function joinCheckedTags(delimiter){
	var tag_param = "";
	var tag_list = [];

	$('.tag').each(function (index){
		if($(this).is(':checked')){
			tag_list.push($(this).val());
		}
	});

	return tag_list.join(delimiter);
}

$("#handle-btn").click(function(){
	var handle = $("#handle").val();
	var tag_params = joinCheckedTags(',');
	window.location.href = window.location.href.split("?")[0] 
		+ "?handle=" + handle 
		+ "&tagName=" + tag_params;
});

$("#tag-check-btn").click(function(){
	$('input:checkbox').prop('checked',true);
});

$("#tag-nocheck-btn").click(function(){
	$('input:checkbox').prop('checked',false);
});

function getAccepted(submission_json){
	var accepted = {};
	var len = submission_json['result'].length;
	for(var i = 0;i < len;i++){
		var submission = submission_json['result'][i];
		var contest_id = submission['contestId'];
		var index = submission['problem']['index'];
		var key = contest_id + index;
		
		if(submission['verdict'] == 'OK'){
			accepted[key] = 'OK';
		}else if(accepted[key] != 'OK'){
			accepted[key] = 'NG';
		}
	}

	return accepted;
}

function getRows(problems_json,problem_statistics_json,accepted,tags_params){
	var problem_URL = "http://codeforces.com/problemset/problem/";
	var status_URL = "http://codeforces.com/problemset/status/";

	var rows = [];
	var len = problems_json[0].length;
	var ret = "";
	for(var i = 0;i < len;i++){
		var problem = problems_json[0][i];

		var name = problem.name;
		var id = problem.contestId;
		var index = problem.index;
		var solved = problem_statistics_json[0][i].solvedCount;
		var tag = problem.tags;
		var color = "";

		if(tags_params.size > 0 && tag.length == 0)continue;

		var flag = false;
		for(var j = 0;j < tag.length;j++){
			replaced_tag = tag[j].replace(/ /g,'_');
			flag |= tags_params.has(replaced_tag);
		}

		if(!flag && tag.length > 0)continue;

		if(!accepted[id + index]){
			color = "";
		}else if(accepted[id + index] == 'OK'){
			color = "class=\"success\"";
		}else if(accepted[id + index] == 'NG'){
			color = "class=\"warning\"";
		}

		ret += "<tr "+color+">"+
		"<td><a href=\""+problem_URL + id +"/"+ index +"\" target=\"_blank\">"+ id + index +"</a></td>" + 
		"<td><a href=\""+problem_URL + id +"/"+ index + "\" target=\"_blank\">"+name +"</a></td>" +  
		"<td>"+"<a href=\""+status_URL + id +"/problem/"+ index +"\" target=\"_blank\">" + solved +"</a></td>";
		ret += "<td>";
		for(var j = 0;j < tag.length;j++){
			if(j == 0)ret += tag[j];
			else ret += "<br>" + tag[j];
		}
		if(tag.length == 0){
			ret += "-";
		}
		ret += "</td></tr>";
	}
	return ret;
}

function showProblems(params,tag_params){
	$.when(
		$.getJSON('./json/problemset_problems.json'),
		$.getJSON('./json/problemset_problemStatistics.json')
	).done(function (problems_json,problem_statistics_json){
		var rows = "";
		if(params['handle']){
			$.when(
				$.getJSON('http://codeforces.com/api/user.status',params)
			).done(function (submission_json){
				var accepted = {};
				if(submission_json['status'] == 'OK'){
					accepted = getAccepted(submission_json);
				}

				rows = getRows(problems_json,problem_statistics_json,accepted,tag_params);
				$('#table-body').append(rows);
			});
		}else{
			rows = getRows(problems_json,problem_statistics_json,{},tag_params);
			$('#table-body').append(rows);
		}
	});
}