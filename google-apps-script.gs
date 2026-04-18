/**
 * IPL Prediction Contest - Google Sheet to Supabase Sync
 *
 * This script syncs match results and predictions from the Google Sheet to Supabase.
 * It runs every 5 minutes automatically and can be triggered manually via the "IPL Sync" menu.
 */

/**
 * Main sync function - reads from sheet and posts to API
 */
function syncAll() {
  try {
    // Get config from Script Properties
    const scriptProperties = PropertiesService.getScriptProperties();
    const apiUrl = scriptProperties.getProperty('SYNC_API_URL');
    const apiKey = scriptProperties.getProperty('SYNC_API_KEY');

    if (!apiUrl || !apiKey) {
      showToast('Error', 'SYNC_API_URL or SYNC_API_KEY not configured in Script Properties');
      return;
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Read matches from "Matches" tab
    const matchesData = readMatches(spreadsheet);

    // Read predictions from "Predictions" tab
    const predictionsData = readPredictions(spreadsheet);

    // Read trivia points from "Trivia_Points" tab
    const triviaPointsData = readTriviaPoints(spreadsheet);

    // Read pre-tournament predictions + actuals from "Pre_Tournament_Points" tab
    const preTournamentData = readPreTournamentPoints(spreadsheet);

    // Build payload
    const payload = {
      matches: matchesData,
      predictions: predictionsData,
      trivia_points: triviaPointsData,
      pre_tournament_predictions: preTournamentData.predictions,
      pre_tournament_actuals: preTournamentData.actuals
    };

    // POST to API
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
      const result = JSON.parse(responseText);
      const summary = result.summary;

      let message = `Sync complete!\n\n`;
      message += `Matches: ${summary.matches.updated} updated\n`;
      message += `Predictions: ${summary.predictions.upserted} upserted\n`;
      message += `Jokers: ${summary.jokers.upserted} upserted\n`;
      message += `Trivia Points: ${summary.trivia_points.upserted} upserted`;
      if (summary.pre_tournament) {
        message += `\nPre-Tournament: ${summary.pre_tournament.predictions_upserted} predictions, ${summary.pre_tournament.actuals_updated} actuals`;
      }

      if (result.errors && result.errors.length > 0) {
        message += `\n\nWarnings:\n`;
        result.errors.slice(0, 3).forEach(err => {
          message += `• ${err}\n`;
        });
      }

      showToast('Sync complete', message);
      Logger.log('Sync successful: ' + JSON.stringify(result));
    } else {
      showToast('Sync failed', `HTTP ${responseCode}\n${responseText.substring(0, 200)}`);
      Logger.log('Sync failed: ' + responseText);
    }
  } catch (error) {
    showToast('Error', error.toString());
    Logger.log('Error: ' + error.toString());
  }
}

/**
 * Read matches from the "Matches" tab
 * Columns: A=Match ID, E=Match Type, F=Underdog Team, G=Winner
 * Match Type can be "Normal" or "Power" (power matches get is_power_match=true)
 */
function readMatches(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('Matches');
    if (!sheet) {
      Logger.log('Matches sheet not found');
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; // No data rows

    // Get all data at once
    const data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

    const matches = [];
    data.forEach((row, index) => {
      const matchId = row[0];
      const matchType = row[4];      // Column E
      const underdogTeam = row[5];   // Column F
      const winner = row[6];         // Column G

      // Only include rows with a winner
      if (winner && winner.toString().trim() !== '') {
        matches.push({
          id: matchId,
          match_type: matchType || '',
          is_power_match: matchType && matchType.toString().toLowerCase().includes('power'),
          underdog_team: underdogTeam || null,
          winner: winner
        });
      }
    });

    return matches;
  } catch (error) {
    Logger.log('Error reading matches: ' + error.toString());
    return [];
  }
}

/**
 * Read predictions from the "Predictions" tab
 * Columns: A=Player, B=Match ID, C=Prediction, D=Joker (can be TRUE, YES, true, 1, or empty)
 */
function readPredictions(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('Predictions');
    if (!sheet) {
      Logger.log('Predictions sheet not found');
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; // No data rows

    // Get all data at once
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

    const predictions = [];
    data.forEach((row) => {
      const player = row[0];
      const matchId = row[1];
      const prediction = row[2];
      const joker = row[3];

      // Only include rows with a prediction
      if (prediction && prediction.toString().trim() !== '') {
        const jokerStr = joker.toString().toUpperCase().trim();
        predictions.push({
          player: player,
          match_id: matchId,
          prediction: prediction,
          joker: joker === true || joker === 1 || jokerStr === 'TRUE' || jokerStr === 'YES'
        });
      }
    });

    return predictions;
  } catch (error) {
    Logger.log('Error reading predictions: ' + error.toString());
    return [];
  }
}

/**
 * Add menu to sheet when it opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('IPL Sync')
    .addItem('Sync All Now', 'syncAll')
    .addToUi();
}

/**
 * Set up the automatic 5-minute trigger
 * Call this function once to create the trigger
 */
function setupTrigger() {
  try {
    // Remove existing triggers for syncAll to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'syncAll') {
        ScriptApp.deleteTrigger(trigger);
      }
    });

    // Create new 5-minute trigger
    ScriptApp.newTrigger('syncAll')
      .timeBased()
      .everyMinutes(5)
      .create();

    Logger.log('5-minute trigger created successfully');
    showToast('Success', 'Auto-sync trigger created (every 5 minutes)');
  } catch (error) {
    Logger.log('Error setting up trigger: ' + error.toString());
    showToast('Error', error.toString());
  }
}

/**
 * Read trivia points from the "Trivia_Points" tab
 * Columns: A=Player, B=Trivia ID, C=Prediction, D=Correct Answer, E=Correct Check, F=Points Earned
 */
function readTriviaPoints(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('Trivia_Points');
    if (!sheet) {
      Logger.log('Trivia_Points sheet not found');
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; // No data rows

    // Get all data at once (6 columns: A-F)
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

    const trivaPoints = [];
    data.forEach((row, idx) => {
      const player = row[0];
      const triviaId = row[1];
      const prediction = row[2];
      const correctAnswer = row[3];
      const correctCheck = row[4];
      const pointsEarned = row[5];

      // Only include rows with a player and trivia ID
      if (player && player.toString().trim() !== '' && triviaId) {
        trivaPoints.push({
          player: player,
          trivia_id: triviaId,
          prediction: prediction || '',
          correct_answer: correctAnswer || '',
          correct_check: correctCheck === 1 || correctCheck === true ? 1 : 0,
          points_earned: parseInt(pointsEarned) || 0
        });
        Logger.log(`Row ${idx + 2}: Loaded ${player} - Trivia ${triviaId} - Points: ${pointsEarned}`);
      }
    });

    Logger.log(`Loaded ${trivaPoints.length} trivia point records`);
    return trivaPoints;
  } catch (error) {
    Logger.log('Error reading trivia points: ' + error.toString());
    return [];
  }
}

/**
 * Read pre-tournament predictions + actuals from the "Pre_Tournament_Points" tab.
 *
 * Sheet column layout (1-indexed):
 *   A  Players              <- player display name (e.g. "Kishore")
 *   B  Winner Prediction    <- player's pick for IPL Champion
 *   C  Orange cap           <- player's pick for Orange Cap winner
 *   D  Purple cap           <- player's pick for Purple Cap winner
 *   E  Play off - Top 4     <- player's 4 playoff teams (CSV)
 *   F  Top team             <- player's pick for table topper
 *   G  Prediction Champion  <- player's pick for who wins the prediction contest
 *   H  Actual Winner        <- ADMIN: actual IPL champion
 *   I  Orange cap Winner    <- ADMIN: actual orange cap
 *   J  Purple cap Winner    <- ADMIN: actual purple cap
 *   K  Play off Teams       <- ADMIN: actual top-4 (CSV)
 *   L  Actual Top team      <- ADMIN: actual table topper
 *   M  Actual Champion      <- ADMIN: actual contest winner
 *
 * The H-M columns are the same on every row (admin fills row 2). We read them
 * from row 2.
 */
function readPreTournamentPoints(spreadsheet) {
  const empty = { predictions: [], actuals: null };
  try {
    const sheet = spreadsheet.getSheetByName('Pre_Tournament_Points');
    if (!sheet) {
      Logger.log('Pre_Tournament_Points sheet not found - skipping');
      return empty;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return empty;

    // Read all 13 columns (A-M) for all data rows
    const data = sheet.getRange(2, 1, lastRow - 1, 13).getValues();

    const predictions = [];
    let actuals = null;

    data.forEach(function (row, idx) {
      const player = row[0];
      const championPred = row[1];
      const orangePred = row[2];
      const purplePred = row[3];
      const playoffPred = row[4];
      const topTeamPred = row[5];
      const contestPred = row[6];

      const championAct = row[7];
      const orangeAct = row[8];
      const purpleAct = row[9];
      const playoffAct = row[10];
      const topTeamAct = row[11];
      const contestAct = row[12];

      // Capture actuals from the first row that has any actual value set.
      // (Admin should put them on row 2; this is robust to phased reveals.)
      if (actuals === null) {
        const anyActual =
          (championAct && championAct.toString().trim() !== '') ||
          (orangeAct && orangeAct.toString().trim() !== '') ||
          (purpleAct && purpleAct.toString().trim() !== '') ||
          (playoffAct && playoffAct.toString().trim() !== '') ||
          (topTeamAct && topTeamAct.toString().trim() !== '') ||
          (contestAct && contestAct.toString().trim() !== '');
        if (anyActual || idx === 0) {
          actuals = {
            champion: cellToTextOrNull(championAct),
            orange_cap: cellToTextOrNull(orangeAct),
            purple_cap: cellToTextOrNull(purpleAct),
            playoff_teams: cellToTextOrNull(playoffAct),
            table_topper: cellToTextOrNull(topTeamAct),
            contest_winner: cellToTextOrNull(contestAct)
          };
        }
      }

      // Skip rows with no player name
      if (!player || player.toString().trim() === '') return;

      // Skip player rows where every prediction column is blank
      const hasAnyPrediction =
        (championPred && championPred.toString().trim() !== '') ||
        (orangePred && orangePred.toString().trim() !== '') ||
        (purplePred && purplePred.toString().trim() !== '') ||
        (playoffPred && playoffPred.toString().trim() !== '') ||
        (topTeamPred && topTeamPred.toString().trim() !== '') ||
        (contestPred && contestPred.toString().trim() !== '');
      if (!hasAnyPrediction) return;

      predictions.push({
        player: player.toString().trim(),
        champion: cellToTextOrNull(championPred),
        orange_cap: cellToTextOrNull(orangePred),
        purple_cap: cellToTextOrNull(purplePred),
        playoff_teams: cellToTextOrNull(playoffPred),
        table_topper: cellToTextOrNull(topTeamPred),
        contest_winner: cellToTextOrNull(contestPred)
      });
    });

    Logger.log('Loaded ' + predictions.length + ' pre-tournament predictions; actuals=' + (actuals ? 'set' : 'none'));
    return { predictions: predictions, actuals: actuals };
  } catch (error) {
    Logger.log('Error reading pre-tournament points: ' + error.toString());
    return empty;
  }
}

/**
 * Helper: convert a sheet cell value to a trimmed string, or null if empty.
 */
function cellToTextOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = value.toString().trim();
  return s === '' ? null : s;
}

/**
 * Show a toast notification
 */
function showToast(title, message) {
  SpreadsheetApp.getUi().alert(title + '\n\n' + message);
}
