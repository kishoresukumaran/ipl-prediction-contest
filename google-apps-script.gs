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
 * Date format: "MAR, SUN 29" or "APR, SUN 5" (parsed to YYYY-MM-DD)
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
    data.forEach((row, idx) => {
      const triviaId = row[0];
      const dateStr = row[1];
      const question = row[2];
      const correctAnswer = row[3];

      // Include rows with a date and trivia ID (question and answer can be filled in later)
      if (dateStr && dateStr.toString().trim() !== '' && triviaId) {
        // Parse date string like "MAR, SUN 29" to "2024-03-29"
        const formattedDate = parseIPLDate(dateStr);

        // Only push if date parsing was successful
        if (formattedDate) {
          trivia.push({
            id: triviaId,
            date: formattedDate,
            question: question || '',
            correct_answer: correctAnswer || null  // Can be null, will be filled later
          });
          Logger.log(`Row ${idx + 2}: Loaded trivia ${triviaId} for ${formattedDate}`);
        } else {
          Logger.log(`Row ${idx + 2}: Could not parse date "${dateStr}" for trivia ${triviaId}`);
        }
      } else {
        Logger.log(`Row ${idx + 2}: Skipping - missing date. Date="${dateStr}"`);
      }
    });

    Logger.log(`Loaded ${trivia.length} trivia questions`);
    return trivia;
  } catch (error) {
    Logger.log('Error reading trivia: ' + error.toString());
    return [];
  }
}

/**
 * Parse date format "MAR, SUN 29" to "2024-03-29"
 * Also handles Date objects from Google Sheets
 */
function parseIPLDate(dateStr) {
  if (!dateStr) return null;

  let str = dateStr.toString().trim();

  // If it's a Date object (from Google Sheets), convert it properly
  if (dateStr instanceof Date) {
    const dateObj = dateStr;
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1; // getMonth() returns 0-11
    const year = dateObj.getFullYear();

    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
  }

  // Try to parse text format: "MAR, SUN 29" or "MAR SUN 29"
  const match = str.match(/([A-Z]{3}),?\s+(?:SUN|MON|TUE|WED|THU|FRI|SAT)?\s*(\d{1,2})/i);

  if (!match) {
    Logger.log('Could not parse date string: ' + str);
    return null;
  }

  const monthStr = match[1].toUpperCase();
  const day = parseInt(match[2]);

  const months = {
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4,
    'MAY': 5, 'JUN': 6, 'JUL': 7, 'AUG': 8,
    'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
  };

  const month = months[monthStr];
  if (!month) {
    Logger.log('Unknown month: ' + monthStr);
    return null;
  }

  let year = 2024;
  if (month >= 6) year = 2024; // Adjust if needed for 2025

  // Format as YYYY-MM-DD
  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}`;
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
