let showingEast = localStorage.getItem("inEastF");

let standingsTable = document.getElementById("standings");
let weekScheduleTable = document.getElementById("weekScheduleTable");
let weekScheduleHeader = document.getElementById("weekScheduleHeader");
let nextOpponent = document.getElementById("nextOpponent");
let userScheduleTable = document.getElementById("userScheduleTable");
let userScheduleHeader = document.getElementById("userScheduleHeader");
let seasonTeamSelect = document.getElementById("seasonTeamSelect");
let quickPlayTeamSelect = document.getElementById("quickPlayTeamSelect");
let selectTeamName;

//To exit from the team selector
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        seasonTeamSelect.style.display = "none";
        quickPlayTeamSelect.style.display = "none";
        document.getElementById("showInstructionsButton").style.display = "inline";
    }
});

//Setup the Standings
let eastStats;
let westStats;
if (localStorage.getItem("eastStandingsF") === null){
    //Create an 8x2 array of 0's
    eastStats = Array(8).fill().map(() => Array(2).fill(0));
    westStats = Array(8).fill().map(() => Array(2).fill(0));
}
else{
    eastStats = JSON.parse(localStorage.getItem("eastStandingsF"));
    westStats = JSON.parse(localStorage.getItem("westStandingsF"));
    eastStats.forEach(team => {
        team.shift();
    });
    westStats.forEach(team => {
        team.shift();
    });
    //Log the most recent scores
    if(localStorage.getItem("resultF") !== null){
        let result = JSON.parse(localStorage.getItem("resultF"));
        let teams = JSON.parse(localStorage.getItem("eastStandingsF"));
        let inEast = false;
        teams.every(team => {
            if(result[0][0] == team[0]){
                inEast = true;
            }
        });
        if(inEast){
            eastStats[result[0]][result[1]]++;
            eastStats[result[3]][result[4]]++;
        }
        else{
            westStats[result[0]][result[1]]++;
            westStats[result[3]][result[4]]++;
        }
    }

}

//Setup the teams
let eastHeaderStats = ["", "Team Name", "Wins", "Losses"];
let coloradoStats = ["Colorado Jaguars", eastStats[0][0], eastStats[0][1], "COL", 78];
let dallasStats = ["Dallas Pickles", eastStats[1][0], eastStats[1][1], "DAL", 84];
let floridaStats = ["Florida Fridge Raiders", eastStats[2][0], eastStats[2][1], "FFR", 97];
let hawaiiStats = ["Hawaii Volcanoes", eastStats[3][0], eastStats[3][1], "HAW", 93];
let idahoStats = ["Idaho Idiots", eastStats[4][0], eastStats[4][1], "IDA", 83];
let mauiStats = ["Maui Morans", eastStats[5][0], eastStats[5][1], "MAU", 87];
let miamiStats = ["Miami Sharks", eastStats[6][0], eastStats[6][1], "MIA", 90];
let pennsylvaniaStats = ["Pennsylvania Pencats", eastStats[7][0], eastStats[7][1], "PEN", 74];
let eastAllStats = [coloradoStats, dallasStats, floridaStats, hawaiiStats, idahoStats, mauiStats, miamiStats, pennsylvaniaStats];

//Setup the teams
let westHeaderStats = ["", "Team Name", "Wins", "Losses"];
let alabamaStats = ["Alabama Fire", westStats[0][0], westStats[0][1], "ALA", 96];
let atlanticStats = ["Atlantic Ocean Tarpons", westStats[1][0], westStats[1][1], "AOT", 88];
let georgiaStats = ["Georgia Hawks", westStats[2][0], westStats[2][1], "GEO", 87];
let maineStats = ["Maine Lions", westStats[3][0], westStats[3][1], "MAI", 76];
let newOrleansStats = ["New Orleans Condiments", westStats[5][0], westStats[5][1], "NOC", 89];
let northCarolinaStats = ["North Carolina Cougars", westStats[4][0], westStats[4][1], "NCC", 79];
let ohioStats = ["Ohio Generals", westStats[6][0], westStats[6][1], "OHI", 95];
let youngstownStats = ["Youngstown Yams", westStats[7][0], westStats[7][1], "YAM", 74];
let westAllStats = [alabamaStats, atlanticStats, georgiaStats, maineStats, newOrleansStats, northCarolinaStats, ohioStats, youngstownStats];
let leagueAllStats = [alabamaStats, atlanticStats, coloradoStats, dallasStats, floridaStats, georgiaStats, hawaiiStats, idahoStats, maineStats, mauiStats, miamiStats, newOrleansStats, northCarolinaStats, ohioStats, pennsylvaniaStats, youngstownStats]

let userTeam;
//Find what team is the user's
if (localStorage.getItem("userTeamF") === null){
    userTeam = eastAllStats[0];
    localStorage.setItem("userTeamF", JSON.stringify(eastAllStats[0]));
}
else{
    userTeam = JSON.parse(localStorage.getItem("userTeamF"));
}
//Setup the schedule
let eastSchedule;
let westSchedule;
if (localStorage.getItem("eastScheduleF") === null){
    eastSchedule = generateMatchSchedule(eastAllStats.slice());
    westSchedule = generateMatchSchedule(westAllStats.slice());
    localStorage.setItem("eastScheduleF", JSON.stringify(eastSchedule));
    localStorage.setItem("westScheduleF", JSON.stringify(westSchedule));
}
else{
    eastSchedule = JSON.parse(localStorage.getItem("eastScheduleF"));
    westSchedule = JSON.parse(localStorage.getItem("westScheduleF"));
}
//Find what week it is
let currentWeek;
if (localStorage.getItem("currentWeekF") === null || localStorage.getItem("currentWeekF") == 0){
    currentWeek = 0;
}
else{
    currentWeek = (localStorage.getItem("currentWeekF"));
    //Calculate what happened in the previous week of games
    if(localStorage.getItem("resultF") !== null){
        eastSchedule[currentWeek-1].forEach(game => {
            //If it was a AI vs AI game, randomize who won but take into account team skill
            if(game.awayTeam[0] != userTeam[0] && game.homeTeam[0] != userTeam[0]){
                let homeCPU;
                let awayCPU;
                for(let i = 0; i < allStats.length; i++){
                    if(game.homeTeam[0] == eastAllStats[i][0]){
                        homeCPU = i;
                    }
                    else if(game.awayTeam[0] == eastAllStats[i][0]){
                        awayCPU = i;
                    }
                }
                let scale = 16; //higher number means more upsets

                let exponent = (eastAllStats[awayCPU][4] - eastAllStats[homeCPU][4]) / scale;
                let homeWinProbability = 1 / (1 + Math.pow(10, exponent));

                let randomValue = Math.random();

                if (randomValue < homeWinProbability) {
                    // Home team wins
                    eastAllStats[homeCPU][1]++;
                    eastAllStats[awayCPU][2]++;
                }
                else {
                    // Away team wins
                    eastAllStats[awayCPU][1]++;
                    eastAllStats[homeCPU][2]++;
                }
            }
            else if(game.homeTeam[0] == userTeam[0]){
                game.homeScore = JSON.parse(localStorage.getItem("resultF"))[2];
                game.awayScore = JSON.parse(localStorage.getItem("resultF"))[5];
            }
            else{
                game.homeScore = JSON.parse(localStorage.getItem("resultF"))[5];
                game.awayScore = JSON.parse(localStorage.getItem("resultF"))[2];
            }
        });
        westSchedule[currentWeek-1].forEach(game => {
            //If it was a AI vs AI game, randomize who won but take into account team skill
            if(game.awayTeam[0] != userTeam[0] && game.homeTeam[0] != userTeam[0]){
                let homeCPU;
                let awayCPU;
                for(let i = 0; i < allStats.length; i++){
                    if(game.homeTeam[0] == westAllStats[i][0]){
                        homeCPU = i;
                    }
                    else if(game.awayTeam[0] == westAllStats[i][0]){
                        awayCPU = i;
                    }
                }
                let scale = 16; //higher number means more upsets

                let exponent = (westAllStats[awayCPU][4] - westAllStats[homeCPU][4]) / scale;
                let homeWinProbability = 1 / (1 + Math.pow(10, exponent));

                let randomValue = Math.random();

                if (randomValue < homeWinProbability) {
                    // Home team wins
                    westAllStats[homeCPU][1]++;
                    westAllStats[awayCPU][2]++;
                }
                else {
                    // Away team wins
                    westAllStats[awayCPU][1]++;
                    westAllStats[homeCPU][2]++;
                }
            }
            else if(game.homeTeam[0] == userTeam[0]){
                game.homeScore = JSON.parse(localStorage.getItem("resultF"))[2];
                game.awayScore = JSON.parse(localStorage.getItem("resultF"))[5];
            }
            else{
                game.homeScore = JSON.parse(localStorage.getItem("resultF"))[5];
                game.awayScore = JSON.parse(localStorage.getItem("resultF"))[2];
            }
        });
        localStorage.removeItem("resultF");
        localStorage.setItem("eastScheduleF", JSON.stringify(eastSchedule));
        localStorage.setItem("westScheduleF", JSON.stringify(westSchedule));
    }
    else{
        eastAllStats = JSON.parse(localStorage.getItem("eastStandingsF"));
        westAllStats = JSON.parse(localStorage.getItem("westStandingsF"));
    }
}
localStorage.setItem("eastStandingsF", JSON.stringify(eastAllStats));
localStorage.setItem("westStandingsF", JSON.stringify(westAllStats));

let userScheduleNumRows = 7;
//https://codepal.ai/code-generator/query/lEK7VGTk/javascript-function-automatic-match-schedule
function generateMatchSchedule(teams) {
    // Generate the match schedule
    let matchSchedule = [];
    //Play each time 4 times
    for(let i = 0; i < 4; i++){
        // Shuffle the teams array to randomize the matches
        const shuffledTeams = shuffleArray(teams);
        //Play every other team in this round
        for (let j = 0; j < shuffledTeams.length - 1; j++) {
            const roundMatches = [];
            //Create the mathces
            for (let k = 0; k < shuffledTeams.length / 2; k++) {
                //Figure out home and away
                if(j%2 == 0){
                    const match = {
                        homeTeam: shuffledTeams[k],
                        awayTeam: shuffledTeams[shuffledTeams.length - 1 - k],
                        homeScore: "No Score",
                        awayScore: "No Score"
                    };
                    roundMatches.push(match);
                }
                else{
                    const match = {
                        homeTeam: shuffledTeams[shuffledTeams.length - 1 - k],
                        awayTeam: shuffledTeams[k],
                        homeScore: "No Score",
                        awayScore: "No Score"
                    };
                    roundMatches.push(match);
                }
            }
            matchSchedule.push(roundMatches);

            // Rotate the teams array for the next round
            shuffledTeams.splice(1, 0, shuffledTeams.pop());
        }
        matchSchedule = shuffleArray(matchSchedule)
    }
    return matchSchedule;
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function displayWeekSchedule(){
    //If the season is over
    // if(currentWeek >= 28){
    //     let sortedAllStats = allStats.slice();
    //     //Sort the teams based on points
    //     sortedAllStats.sort((a, b) => {
    //         if (a[1] === b[1]) {
    //             return a[0].localeCompare(b[0]);
    //         }
    //         return b[1] - a[1];
    //     });
    //     for(let i = 0; i < sortedAllStats.length; i++){
    //         if(sortedAllStats[i][0] == userTeam[0]){
    //             //Display the finishing place
    //             if(i == 0){
    //                 document.getElementById("nextOpponent").innerHTML = "You Finished " + (i+1) + "st place";
    //             }
    //             else if(i == 0){
    //                 document.getElementById("nextOpponent").innerHTML = "You Finished " + (i+1) + "nd place";
    //             }
    //             else if(i == 0){
    //                 document.getElementById("nextOpponent").innerHTML = "You Finished " + (i+1) + "rd place";
    //             }
    //             else{
    //                 document.getElementById("nextOpponent").innerHTML = "You Finished " + (i+1) + "th place";
    //             }
    //             //reset the local storage entries
    //             document.getElementById("linkNext").onclick = function() {
    //                 localStorage.removeItem("resultF");
    //                 localStorage.removeItem("scheduleF");
    //                 localStorage.removeItem("currentWeekF");
    //                 localStorage.removeItem("standingsF");
    //                 localStorage.removeItem("gameTypeF");
    //                 localStorage.removeItem("userTeamF");
    //                 document.location.href = "index.html";
    //             };
    //         }
    //     }
    //     return;
    // }
    //If the season is still going on
    if(showingEast){
        weekScheduleHeader.innerHTML = `Game ${parseInt(currentWeek)+1} Schedule`;
        for(let i = 0; i < eastSchedule[currentWeek].length; i++){
            let row = document.createElement("tr");
            let game = document.createElement("td");
            //if the user controls the home team
            if(eastSchedule[currentWeek][i].homeTeam[0] == userTeam[0]){
                game.innerHTML = eastSchedule[currentWeek][i].homeTeam[0].bold() + " Vs. " + eastSchedule[currentWeek][i].awayTeam[0];
                nextOpponent.innerHTML = "Next Game is Against The " + eastSchedule[currentWeek][i].awayTeam[0];
                document.getElementById("linkNext").innerHTML = "&#x25B6";
            }
            //if the user controls the away team
            else if(eastSchedule[currentWeek][i].awayTeam[0] == userTeam[0]){
                game.innerHTML = eastSchedule[currentWeek][i].homeTeam[0] + " Vs. " + eastSchedule[currentWeek][i].awayTeam[0].bold();
                nextOpponent.innerHTML = "Next Game is Against The " + eastSchedule[currentWeek][i].homeTeam[0];
                document.getElementById("linkNext").innerHTML = "&#x25B6";
            }
            else{
                game.innerHTML = eastSchedule[currentWeek][i].homeTeam[0] + " Vs. " + eastSchedule[currentWeek][i].awayTeam[0];
            }
            row.appendChild(game)
            weekScheduleTable.appendChild(row)
        }
    }
    else{
        weekScheduleHeader.innerHTML = `Game ${parseInt(currentWeek)+1} Schedule`;
        for(let i = 0; i < westSchedule[currentWeek].length; i++){
            let row = document.createElement("tr");
            let game = document.createElement("td");
            //if the user controls the home team
            if(westSchedule[currentWeek][i].homeTeam[0] == userTeam[0]){
                game.innerHTML = westSchedule[currentWeek][i].homeTeam[0].bold() + " Vs. " + westSchedule[currentWeek][i].awayTeam[0];
                nextOpponent.innerHTML = "Next Game is Against The " + westSchedule[currentWeek][i].awayTeam[0];
                document.getElementById("linkNext").innerHTML = "&#x25B6";
            }
            //if the user controls the away team
            else if(westSchedule[currentWeek][i].awayTeam[0] == userTeam[0]){
                game.innerHTML = westSchedule[currentWeek][i].homeTeam[0] + " Vs. " + westSchedule[currentWeek][i].awayTeam[0].bold();
                nextOpponent.innerHTML = "Next Game is Against The " + westSchedule[currentWeek][i].homeTeam[0];
                document.getElementById("linkNext").innerHTML = "&#x25B6";
            }
            else{
                game.innerHTML = westSchedule[currentWeek][i].homeTeam[0] + " Vs. " + westSchedule[currentWeek][i].awayTeam[0];
            }
            row.appendChild(game)
            weekScheduleTable.appendChild(row)
        }
    }
}
function displayUserSchedule(){
    userScheduleHeader.innerHTML = `${userTeam[0]} Schedule`;
    //For the amount of rows on the desired schedule
    for(let i = 0; i < userScheduleNumRows; i++){
        let row = document.createElement("tr");
        //Cells in each row
        for(let j = 0; j < Math.ceil(eastSchedule.length/userScheduleNumRows); j++){
            //Each Game
            if(i*Math.ceil(eastSchedule.length/userScheduleNumRows)+j < eastSchedule.length){
                let game;
                //Bold the game if its the next one
                if(i*Math.ceil(eastSchedule.length/userScheduleNumRows)+j == currentWeek){
                    game = document.createElement("th");
                }
                else{
                    game = document.createElement("td");
                }
                //Check through each game that week for your team
                for(let k = 0; k < eastAllStats.length/2; k++){
                    //You were the home team
                    if(eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeTeam[0] == userTeam[0]){
                        //Game hasn't happened
                        if(eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeScore == "No Score"){
                            game.innerHTML = "Game " + (i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j+1) +" vs " + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].awayTeam[3];
                        }
                        //Display the score
                        else{
                            game.innerHTML = eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeTeam[3] + " " + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeScore + "-" + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].awayScore + " " + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].awayTeam[3];
                        } 
                    }//You were the away team
                    else if(eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].awayTeam[0] == userTeam[0]){
                        //Game hasn't happened
                        if(eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeScore == "No Score"){
                            game.innerHTML = "Game " + (i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j+1) +" @ " + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeTeam[3]; 
                        }
                        //Display the score
                        else{
                            game.innerHTML = eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeTeam[3] + " " + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].homeScore + "-" + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].awayScore + " " + eastSchedule[i*Math.ceil(eastSchedule.length/userScheduleNumRows) + j][k].awayTeam[3];
                        }
                    }
                }
                row.appendChild(game);
            }
        }
        userScheduleTable.appendChild(row);
    }
}
function displayStandings(){
    //Sort the standings by points and then alphabetical
    let sortedAllStats
    if(showingEast){
        sortedAllStats = eastAllStats.slice();
    }
    else{
        sortedAllStats = westAllStats.slice();
    }
    sortedAllStats.sort((a, b) => {
        if (a[1] === b[1]) {
            return a[0].localeCompare(b[0]);
        }
        return b[1] - a[1];
    });
    //Headers
    let row = document.createElement("tr");
    for(let i = 0; i < eastHeaderStats.length; i++){
        let header = document.createElement("th");
        header.innerHTML = eastHeaderStats[i];
        row.appendChild(header);
    }
    //Display the stats
    standingsTable.appendChild(row);
    for(let i = 0; i < sortedAllStats.length; i++){
        row = document.createElement("tr");
        let position = document.createElement("th");
        position.innerHTML = i+1;
        row.appendChild(position);
        for(let j = 0; j < 3; j++){
            let value;
            if(sortedAllStats[i][0] == userTeam[0]){
                value = document.createElement("th");
            }
            else{
                value = document.createElement("td");
            }
            value.innerHTML = sortedAllStats[i][j];
            row.appendChild(value);
        }
        standingsTable.appendChild(row);
    }
}
function pickSeasonTeam(){
    //If the season hasn't started yet --> pick your team
    if(localStorage.getItem("currentWeekF") !== null && localStorage.getItem("currentWeekF") != 0){
        localStorage.setItem("gameTypeF", "season");
        document.location.href="standings.html";
    }
    //Else --> You get your previous team
    else{
        seasonTeamSelect.style.display = "block";
        quickPlayTeamSelect.style.display = "none";
        selectTeamName = document.getElementById("seasonTeamNameSelect");
        selectTeamName.innerHTML = userTeam[0];
        localStorage.setItem("gameTypeF", "season");
    }
    document.getElementById("showInstructionsButton").style.display = "none";
}
function pickQuickPlayTeam(){
    seasonTeamSelect.style.display = "none";
    quickPlayTeamSelect.style.display = "block";
    selectTeamName = document.getElementById("QPTeamNameSelect");
    selectTeamName.innerHTML = userTeam[0];
    localStorage.setItem("gameTypeF", "quickPlay");
    document.getElementById("showInstructionsButton").style.display = "none";
}
function scrollRightTeams(){
    let index = leagueAllStats.indexOf(userTeam)+1;
    if(index > leagueAllStats.length-1){
        index-=leagueAllStats.length
    }
    selectTeamName.innerHTML = leagueAllStats[index][0];
    userTeam = leagueAllStats[index];
    inEast = false;
    eastAllStats.every(team => {
        if(userTeam[0] == team[0]){
            inEast = true;
        }
    });
    if(inEast){
        localStorage.setItem("inEastF", true);
    }
    else{
        localStorage.setItem("inEastF", false);
    }
    localStorage.setItem("userTeamF", JSON.stringify(leagueAllStats[index]));
}
function scrollLeftTeams(){
    let index = leagueAllStats.indexOf(userTeam)-1;
    if(index < 0){
        index+=leagueAllStats.length
    }
    selectTeamName.innerHTML = leagueAllStats[index][0];
    userTeam = leagueAllStats[index];
    inEast = false;
    eastAllStats.every(team => {
        if(userTeam[0] == team[0]){
            inEast = true;
        }
    });
    if(inEast){
        localStorage.setItem("inEastF", true);
    }
    else{
        localStorage.setItem("inEastF", false);
    }
    localStorage.setItem("userTeam", JSON.stringify(leagueAllStats[index]));
}
function goToGame(){
    localStorage.removeItem("resultF");
    localStorage.setItem("scheduleF", JSON.stringify(schedule));
    localStorage.setItem("currentWeekF", parseInt(currentWeek));
    localStorage.setItem("standingsF", JSON.stringify(allStats));
    localStorage.setItem("gameTypeF", "season");
    document.location.href = "game.html";
}
function showInstructions(){
    document.getElementById("instructions").style.display = "block";
}
function hideInstructions(){
    document.getElementById("instructions").style.display = "none";
}