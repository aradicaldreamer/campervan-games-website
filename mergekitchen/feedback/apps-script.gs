/**
 * Merge Kitchen feedback receiver - a Google Apps Script bound to a Google Sheet.
 *
 * Setup (once, ~5 minutes; see README.md in this folder):
 *   1. Create a Google Sheet (any name). Extensions > Apps Script. Replace the editor's contents
 *      with this file. Save.
 *   2. Deploy > New deployment > type "Web app": Execute as "Me", Who has access "Anyone".
 *      Authorise when asked. Copy the Web app URL (ends in /exec).
 *   3. Paste that URL into data-endpoint on the <form> in index.html and publish the site.
 *   4. Optional: open the URL in a browser - it should answer "Merge Kitchen feedback: ok".
 *
 * Each submission appends one row to the "Feedback" tab (created on first use, with a header
 * row) and, if NOTIFY_EMAIL is set, sends a short email. Re-deploy (Deploy > Manage deployments >
 * edit > new version) after changing anything here - a saved edit is not live until then.
 */

var SHEET_NAME = 'Feedback';
var NOTIFY_EMAIL = 'contact@campervangames.com'; // '' to switch notifications off

var COLUMNS = ['submittedAt', 'rating', 'mode', 'wouldPlay', 'level', 'liked', 'frustrated', 'other',
               'email', 'version', 'platform', 'device', 'page'];

function doGet() {
  return ContentService.createTextOutput('Merge Kitchen feedback: ok');
}

function doPost(e) {
  var data = {};
  try { data = JSON.parse(e.postData.contents || '{}'); } catch (err) { data = {}; }

  var sheet = getSheet_();
  sheet.appendRow(COLUMNS.map(function (c) { return clip_(data[c]); }));

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'Merge Kitchen feedback: ' + (data.rating ? data.rating + '/5' : 'no rating') +
                 (data.mode ? ', ' + data.mode : '') + (data.level ? ', level ' + data.level : ''),
        body: COLUMNS.map(function (c) { return c + ': ' + (clip_(data[c]) || '-'); }).join('\n') +
              '\n\nSheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      });
    } catch (err) {
      // Mail quota or a bad address must not lose the row - it is already in the sheet.
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// A cell holds 50,000 characters; a pasted crash log could exceed that.
function clip_(v) {
  if (v === undefined || v === null) return '';
  var s = String(v);
  return s.length > 20000 ? s.slice(0, 20000) + '...' : s;
}
