var api = new SenseApi();
var players;
var matches = new Array();
var K = 32;

$(document).ready(init);

/**
 * Starts the show by checking if we can re-use our session or if we have to log
 * in again.
 */
function init() {
	
	// handle login events
	$("input#password").keypress(onPasswordKeypress);
	$("input#submit_password").click(SubmitPasswordHandler);
	
	// check for stored session ID
	var sessionId = sessionStorage.sessionId;
	if (undefined != sessionId && "undefined" != sessionId) {
		// let the SenseApi object know what the stored session ID is
		api.SetSessionId(sessionId);

		// put session ID in a cookie so it gets sent with each request
		document.cookie = "X-SESSION_ID=" + sessionId + "; path=/";

		// see if the session ID actually works
		if (getPlayerList() && getMatchList()) {
			LoadFrontPage();			
		} else {
			// seems like the session ID is not right anymore
			api.SetSessionId(null);
			document.cookie = "X-SESSION_ID=null; expires=-1; path=/";
			$("p#error").html("");
		}
	}
};

/**
 * Handles keypress events from the password input field. Submits the form if
 * the enter key was pressed.
 * 
 * @param event
 *            Keypress event
 */
function onPasswordKeypress(event) {
	if (13 == event.which) {
		// enter key was pressed
		SubmitPasswordHandler();
	}
};

/**
 * Stores the session ID in the session storage
 */
function storeSessionId() {
	sessionStorage.sessionId = api.session_id;
};

/**
 * @returns The session ID, if it exists in the session storage
 */
function getSessionId() {
	return sessionStorage.sessionId;
}

function SubmitPasswordHandler () {
	password = $("input#password").val();
	pwd_hash = calcMD5(password);
	
	if(api.AuthenticateSessionId("sense-foosball", pwd_hash)) {
		storeSessionId();
		getPlayerList();
		getMatchList();
		LoadFrontPage();
		$("p#error").html("");
	}
	else {
		$("p#error").html("Wrong password!");
	}
	
}

/**
 * Tries to get the list of players from CommonSense
 * 
 * @returns true if the request succeeded
 */
function getPlayerList() {
	var sensorId = 171759;
	var params = {
		"last" : 1
	};
	if (api.SensorDataGet(sensorId, params)) {
		players = JSON.parse(JSON.parse(api.resp_data).data[0].value);
		console.log(players);
		return true;
	} else {
		$("p#error").html("Cannot get player list!");
		return false;
	}
}

/**
 * Tries to get the list of matches from CommonSense
 * 
 * @returns true if the request succeeded
 */
function getMatchList() {
	var sensorId = 171760;
	var params = {
		"sort" : "DESC"
	};
	if (api.SensorDataGet(sensorId, params)) {
		matches = JSON.parse(api.resp_data).data;
		console.log(matches);
		return true;
	} else {
		$("p#error").html("Cannot get match history!");
		return false;
	}
}

function LoadFrontPage () {
	$("div#interaction").html("<form><input type='button' id='1v1' value='1 V 1'></input></form>   <form><input type='button' id='2v2' value='2 V 2'></input></form>");
	$("div#interaction").append(GetPlayerRankingHtml());
	$("div#interaction").append(GetMatchHistoryHtml());

//	var html_string = " "+
//		"<table>"+
//			"<tr>"+
//				"<td><form><input type='button' id='1v1' value='1 V 1'></input></form></td>"+
//				"<td rowspan=2>"+GetPlayerRankingString+"

	$("input#1v1").click(Load1v1Div);
	$("input#2v2").click(Load2v2Div);
}

function GetPlayerRankingHtml () {
	var html_string = "<table cellpadding=5><tr><th>Player Name</th><th>Rating</th></tr>";
	
	players = players.sort(players_sort);
	
	for (var i=0; i<players.length; i++) {
		html_string += "<tr><td>"+players[i].name+"</td><td>"+players[i].rating+"</td></tr>";
	}
	
	html_string += "</table>";
	
	return html_string;
}

function GetMatchHistoryHtml () {
	var html_string = "<table cellpadding=5><tr><th>Date</th><th>Team 1</th><th>Team 2</th><th>Score</th></tr>";
	
	for(var i=0; i<matches.length; i++) {
		var date = new Date(parseInt(matches[i].date)*1000);
		var m = JSON.parse(matches[i].value);
		console.log(m);
		html_string += "<tr><td>"+date.toDateString()+"</td><td>"+m.team1.join(", ")+"</td><td>"+m.team2.join(", ")+"</td><td>"+m.score+"</td></tr>";
	}

	html_string += "</table>";
		
	return html_string;
}

function players_sort (a, b) {
	if (a.rating > b. rating) 
		return -1;
	else if (a.rating < b.rating)
		return 1;
	else
		return 0;
}

function Load1v1Div () {
	$("div#interaction").html("<table><tr><td>Player 1</td><td><input type='text' id='team1_score'></input></td><td>Player 2</td><td><input type='text' id='team2_score'></input></td></tr><tr><td colspan=2>"+getPlayerDropbox('player1')+"</td><td colspan=2>"+getPlayerDropbox('player2')+"</td></tr></table><form><input type='button' id='submit1v1' value='submit'></input></form>		");
	$("input#submit1v1").click(Submit1v1Handler);
}

function Load2v2Div () {
	$("div#interaction").html("<table><tr><td>Team 1</td><td><input type='text' id='team1_score'></input></td><td>Team 2</td><td><input type='text' id='team2_score'></input></td></tr><tr><td>Player 1</td><td>Player 2</td><td>Player 3</td><td>Player 4</td></tr><tr><td>"+getPlayerDropbox('player1')+"</td><td>"+getPlayerDropbox('player2')+"</td><td>"+getPlayerDropbox('player3')+"</td><td>"+getPlayerDropbox('player4')+"</td></tr></table><form><input type='button' id='submit2v2' value='submit'></input></form>		");
	$("input#submit2v2").click(Submit2v2Handler);

}

function Submit1v1Handler () {
	var p1 = $("select#player1").val();
	var p2 = $("select#player2").val();
	
	if (p1 == p2) {
		alert("Select two different players!");
		return;
	}
	
	var score_t1 = parseInt($("input#team1_score").val());
	var score_t2 = parseInt($("input#team2_score").val());
	
	console.log(players[p1].name+" vs "+players[p2].name+": "+score_t1+"-"+score_t2);
	m = {"team1":[players[p1].name], "team2":[players[p2].name], "score":+score_t1+"-"+score_t2};
	console.log(m);

	var QA = Math.pow(10, players[p1].rating/400);
	var QB = Math.pow(10, players[p2].rating/400);
	var EA = QA/(QA+QB);
	var EB = QA/(QA+QB);
	var SA = (score_t1 > score_t2) ? 1 : 0;
	var SB = 1 - SA;
	var RA = players[p1].rating + K * (SA - EA);
	console.log("QA: "+QA+" EA: "+EA+" SA: "+SA+" RA: "+RA);
	var RB = players[p2].rating + K * (SB - EB);
	console.log("QB: "+QB+" EB: "+EB+" SB: "+SB+" RB: "+RB);
	
	players[p1].rating = RA;
	players[p2].rating = RB;
	
	SubmitMatch(m);
	SubmitNewRatings();
}

function Submit2v2Handler () {
	var p1 = $("select#player1").val();
	var p2 = $("select#player2").val();
	var p3 = $("select#player3").val();
	var p4 = $("select#player4").val();

	if (p1 == p2 || p1 == p3 || p1 == p4 || p2 == p3 || p2 == p4 || p3 == p4) {
		alert("Select four different players!");
		return;
	}

	var t1 = (players[p1].rating+players[p2].rating)/2;
	var t2 = (players[p3].rating+players[p4].rating)/2;

	var score_t1 = parseInt($("input#team1_score").val());
	var score_t2 = parseInt($("input#team2_score").val());
	
	console.log(players[p1].name+" vs "+players[p2].name+": "+score_t1+"-"+score_t2);

	m = {"team1":[players[p1].name, players[p2].name], "team2":[players[p3].name, players[p4].name], "score":+score_t1+"-"+score_t2};
	console.log(m);
	
	var QA = Math.pow(10, t1/400);
	var QB = Math.pow(10, t2/400);
	var EA = QA/(QA+QB);
	var EB = QA/(QA+QB);
	var SA = (score_t1 > score_t2) ? 1 : 0;
	var SB = 1 - SA;
	var mod_team1 = K * (SA - EA);
	var mod_team2 = K * (SB - EB);

	console.log("QA: "+QA+" EA: "+EA+" SA: "+SA+" mod_team1: "+mod_team1);
	console.log("QB: "+QB+" EB: "+EB+" SB: "+SB+" mod_team2: "+mod_team2);
	
		
	players[p1].rating += mod_team1/2;
	players[p2].rating += mod_team1/2;
	players[p3].rating += mod_team2/2;
	players[p4].rating += mod_team2/2;
	
	console.log(players);
	SubmitMatch(m);
	SubmitNewRatings();
}

function SubmitNewRatings () {
	if (api.SensorDataPost(171759, {"data":[{"value":players}]}))
		LoadFrontPage();
	else 
		alert("Submitting new rankings failed!");
}

function SubmitMatch(m) {
	if (api.SensorDataPost(171760, {"data":[{"value":m}]}))
		return;
	else
		alert("Submitting match failed!");
}

function getPlayerDropbox (id) {
	var dropbox_string = "<select id='"+id+"'>";
	
	for (var i=0; i<players.length; i++) {
		dropbox_string += "<option value='"+i+"'>"+players[i].name+"</option>";		
	}
	
	dropbox_string += "</select>";
	
	return dropbox_string;
}