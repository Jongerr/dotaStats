const https = require('https');
const args = require('minimist')(process.argv.slice(2));
const fetch = require('node-fetch');
const testing = false;


async function getResultsFromRequest(args) {
    let result = {};
    let reqURL = buildRequestURL(args);

    console.log(reqURL);

    let response = await fetch(reqURL);
    let matchData = await response.json();

    let totalGames = matchData.length;
    let wins = matchData.reduce(function(totalWins, match) {
        if(match.player_slot < 5 && match.radiant_win === true) { return totalWins + 1; }
        else if(match.player_slot > 5 && match.radiant_win === false) { return totalWins + 1; }
        else { return totalWins; }
    }, 0);

    let losses = totalGames - wins;
    let winLossRatio = wins / totalGames;
    winLossRatio = winLossRatio.toPrecision(3);

    console.log('Main Account:', args._[0]);
    console.log('Included Accounts:', args._.slice(1));
    console.log('Total Matches Found:', totalGames);
    console.log('Total Wins:', wins);
    console.log('Total Losses:', losses);
    console.log('Win Loss Ratio:', winLossRatio);

    console.log(matchData.slice(0, 20));

    return matchData;
}

function buildRequestURL(cmdLineArgs) {
    let options = buildOptions(cmdLineArgs);
    let url = 'https://api.opendota.com/api/players/' + options.accountID + '/matches';
    let keys = Object.keys(options);
    if(keys.length > 1) {
        url += '?';
        keys.splice(keys.indexOf('accountID'), 1);
        url += renderOptionsString(options, keys);
    }
    return url;
}

function buildOptions(cmdLineArgs) {
    console.log(cmdLineArgs._);
    let accountID = cmdLineArgs._[0];
    let included_account_id = cmdLineArgs._.slice(1);
    let limit = cmdLineArgs.l;
    let win = cmdLineArgs.w;
    let options = {accountID: accountID};
    if(included_account_id.length > 0) { options.included_account_id = included_account_id; }
    if(limit !== undefined) { options.limit = limit; }
    if(win !== undefined) { options.win = win ? 1 : 0; }
    return options;
}

function renderOptionsString(optionsObj, desiredKeys) {
    let options = desiredKeys.map(function(key) {
        if(key === 'included_account_id') {
            return renderIncludedPlayersOption(optionsObj[key]);
        }
        return key + '=' + optionsObj[key];
    });
    return options.join('&');
}

function renderIncludedPlayersOption(includedPlayers) {
    let includedOptions = includedPlayers.map(function(player) {
        return 'included_account_id[]=' + player;
    });
    return includedOptions.join('&');
}

const options = {
    host: 'api.opendota.com',
    path: '/api/players/77133004/matches'
}

function areEqaulArrays(arr1, arr2) {
    if(arr1.length !== arr2.length) { return false; }
    arr1.sort();
    arr2.sort();
    return arr1.every(function(elem, i) {
        return elem === arr2[i];
    });
}

function assertArraysEqual(actual, expected, testName) {
    if(areEqaulArrays(actual, expected)) {
        console.log('Passed [' + testName + ']');
    } else {
        console.log('Failed [' + testName + '] Expected [' + expected +
                    '] but got [' + actual + ']');
    }
}

function assertObjectsEqual(actual, expected, testName) {
    actual = JSON.stringify(actual);
    expected = JSON.stringify(expected);
    if(actual === expected) {
        console.log('Passed [' + testName + ']');
    } else {
        console.log('Failed [' + testName + '] Expected ' + expected + ' but got ' +
                    actual);
    }
}

function assertEqual(actual, expected, testName) {
    if(actual === expected) {
        console.log('Passed [' + testName + ']');
    } else {
        console.log('Failed [' + testName + '] Expected "' + expected + '" but got "'
        + actual + '"');
    }
}

if(testing) {

    let testArgs = {
        _: [123456],
        l: 200,
        w: true
    };

    let reqURL = buildRequestURL(testArgs);
    let expectedURL = 'https://api.opendota.com/api/players/123456/matches?limit=200&win=1';
    assertEqual(reqURL, expectedURL, 'should return a url string formatted with options');

    let output = buildOptions(testArgs);
    let expected = { accountID: 123456, limit: 200, win: 1 };
    assertObjectsEqual(output, expected, 'should return a formatted options object');

    let includedPlayers = renderIncludedPlayersOption([1234, 5678, 9101112]);
    let expectedOptions = 'included_account_id[]=1234&included_account_id[]=5678&included_account_id[]=9101112';
    assertEqual(includedPlayers, expectedOptions, 'should render a query string from an array of account id\'s');

    let optionsString = renderOptionsString({accountID: 789456123, included_account_id: [1234, 5678], limit: 15, win: 0, a: 'yes', b: 'no'},
                                            ['included_account_id', 'limit', 'win', 'b']);
    let expectedString = 'included_account_id[]=1234&included_account_id[]=5678&limit=15&win=0&b=no';
    assertEqual(optionsString, expectedString, 'should render an options string with only the desired keys');

} else {

    console.log(Promise.resolve(getResultsFromRequest(args)));

}
