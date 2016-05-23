$(document).ready(function ()
{
	showProblems();
});

function showProblems(){

	var problemURL = "http://codeforces.com/problemset/problem/";
	var statusURL = "http://codeforces.com/problemset/status/";

	$.getJSON('./json/problemset_problems.json',function(problems_json){
		var problems = []
		for(var i = 0;i < problems_json.length;i++){
			problems.push(problems_json[i]);
		}

		$.getJSON("./json/problemset_problemStatistics.json",function(problemStatistics_json){
		for(var i = 0;i < problems.length;i++){
			var name = problems[i].name;
			var id = problems[i].contestId;
			var index = problems[i].index;
			var solved = problemStatistics_json[i].solvedCount;

			var problemID_col = "<td><a href=\""+problemURL + id +"/"+ index +"\">"+ id + index +"</a></td>";
			var problemName_col = "<td><a href=\""+problemURL + id +"/"+ index + "\">"+name +"</a></td>"; 
			var solvedCount_col = "<td>"+"<a href=\""+statusURL + id +"/problem/"+ index +"\">" + solved +"</a></td>";
			$('tbody').prepend("<tr>"+problemID_col + problemName_col + solvedCount_col +"</tr>");
		}
		});
	});
}