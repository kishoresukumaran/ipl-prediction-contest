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

    // Read trivia from "Sunday_Trivia" tab
    const triviaData = readTrivia(spreadsheet);

    // Read trivia predictions from "Trivia_Predictions" tab
    const triviaPredictionsData = readTriviaPredictions(spreadsheet);

    // Build payload
    const payload = {
      matches: matchesData,
      predictions: predictionsData,
      trivia: triviaData,
      trivia_predictions: triviaPredictionsData
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
      message += `Jokers: ${summary.jokers.upserted} upserted`;

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
 * Columns: A=Player, B=Match ID, C=Prediction, D=Joker (boolean)
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
        predictions.push({
          player: player,
          match_id: matchId,
          prediction: prediction,
          joker: joker === true || joker === 'TRUE' || joker === 1
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
 * Read trivia from the "Sunday_Trivia" tab
 * Columns: A=Trivia ID, B=Date, C=Question, D=Correct Answer
 */
function readTrivia(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('Sunday_Trivia');
    if (!sheet) {
      Logger.log('Sunday_Trivia sheet not found');
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; // No data rows

    // Get all data at once
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

    const trivia = [];
    data.forEach((row) => {
      const triviaId = row[0];
      const date = row[1];
      const question = row[2];
      const correctAnswer = row[3];

      // Only include rows with a correct answer
      if (correctAnswer && correctAnswer.toString().trim() !== '') {
        trivia.push({
          id: triviaId,
          date: date,
          question: question,
          correct_answer: correctAnswer
        });
      }
    });

    return trivia;
  } catch (error) {
    Logger.log('Error reading trivia: ' + error.toString());
    return [];
  }
}

/**
 * Read trivia predictions from the "Trivia_Predictions" tab
 * Columns: A=Player, B=Trivia ID, C=Prediction
 * Ignores columns D (Entered By) and E (Validated By)
 */
function readTriviaPredictions(spreadsheet) {
  try {
    const sheet = spreadsheet.getSheetByName('Trivia_Predictions');
    if (!sheet) {
      Logger.log('Trivia_Predictions sheet not found');
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; // No data rows

    // Get all data at once
    const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

    const triviaPredictions = [];
    data.forEach((row) => {
      const player = row[0];
      const triviaId = row[1];
      const prediction = row[2];

      // Only include rows with a prediction
      if (prediction && prediction.toString().trim() !== '') {
        triviaPredictions.push({
          player: player,
          trivia_id: triviaId,
          prediction: prediction
        });
      }
    });

    return triviaPredictions;
  } catch (error) {
    Logger.log('Error reading trivia predictions: ' + error.toString());
    return [];
  }
}

/**
 * Show a toast notification
 */
function showToast(title, message) {
  SpreadsheetApp.getUi().alert(title + '\n\n' + message);
}
