/**
 * =========================================================================
 * FinFlow – Google Apps Script Backend (Code.gs)
 * =========================================================================
 *
 * INSTRUCTIONS:
 * 1. Open https://script.google.com and create a new project named "FinFlow API".
 * 2. Replace all contents of Code.gs with this entire file.
 * 3. Change SECRET_KEY below to a secure passphrase of your choice.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Execute as: "Me (your email)".
 * 7. Who has access: "Anyone" (required so your local FinFlow client can fetch).
 * 8. Click "Deploy", copy the Web App URL, and paste it into FinFlow Settings!
 * =========================================================================
 */

// 🔒 YOUR SECRET PASSPHRASE – Change this to something secure!
const SECRET_KEY = "CHANGE_THIS_TO_YOUR_SECRET_KEY";

// Tab schema definitions with required headers
const TAB_HEADERS = {
  Transactions: ["id", "date", "type", "amount", "category", "notes", "source"],
  Income: ["id", "month", "source", "amount", "date", "notes"],
  Investments: ["id", "date", "fundName", "type", "amount", "units", "currentValue", "category", "notes"],
  EmergencyFund: ["id", "date", "type", "amount", "notes"],
  Budgets: ["id", "month", "expectedIncome", "allocations"],
  Config: ["key", "value"]
};

/**
 * Handle HTTP POST requests from FinFlow
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ error: "Missing POST request body" }, 400);
    }

    const payload = JSON.parse(e.postData.contents);

    // 1. Secret Key validation
    if (!payload.secretKey || payload.secretKey !== SECRET_KEY) {
      return jsonResponse({ error: "Unauthorized: Invalid Secret Key" }, 401);
    }

    const action = payload.action;

    // Ping check (connection test)
    if (action === "ping") {
      return jsonResponse({ success: true, message: "FinFlow Google Apps Script Connected Successfully!" });
    }

    // Create a new Year spreadsheet
    if (action === "createYearSpreadsheet") {
      const year = payload.year || new Date().getFullYear();
      const newSheet = SpreadsheetApp.create("FinFlow " + year);
      const newId = newSheet.getId();
      ensureAllTabs(newSheet);
      return jsonResponse({ success: true, spreadsheetId: newId, name: "FinFlow " + year });
    }

    // For data actions, spreadsheetId is required
    const spreadsheetId = payload.spreadsheetId;
    if (!spreadsheetId) {
      return jsonResponse({ error: "Missing spreadsheetId in payload" }, 400);
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);
    ensureAllTabs(ss);

    // Handle distinct actions
    switch (action) {
      case "getAll": {
        const tab = payload.tab;
        const rows = getTabObjects(ss, tab);
        return jsonResponse({ success: true, data: rows });
      }

      case "add": {
        const tab = payload.tab;
        const item = payload.item;
        appendTabRow(ss, tab, item);
        return jsonResponse({ success: true });
      }

      case "update": {
        const tab = payload.tab;
        const id = payload.id;
        const updates = payload.updates;
        updateTabRow(ss, tab, id, updates);
        return jsonResponse({ success: true });
      }

      case "delete": {
        const tab = payload.tab;
        const id = payload.id;
        deleteTabRow(ss, tab, id);
        return jsonResponse({ success: true });
      }

      case "syncTransactions":
      case "syncIncome":
      case "syncInvestments":
      case "syncEmergencyFund":
      case "syncBudgets": {
        const tabName = action.replace("sync", "");
        const actualTab = tabName === "EmergencyFund" ? "EmergencyFund" : tabName;
        overwriteTabData(ss, actualTab, payload.data || []);
        return jsonResponse({ success: true, count: (payload.data || []).length });
      }

      case "getConfig": {
        const configObj = readConfigTab(ss);
        return jsonResponse({ success: true, data: configObj });
      }

      case "setConfig": {
        writeConfigTab(ss, payload.data || {});
        return jsonResponse({ success: true });
      }

      case "bulkImport": {
        if (payload.transactions) overwriteTabData(ss, "Transactions", payload.transactions);
        if (payload.income) overwriteTabData(ss, "Income", payload.income);
        if (payload.investments) overwriteTabData(ss, "Investments", payload.investments);
        if (payload.emergencyFund) overwriteTabData(ss, "EmergencyFund", payload.emergencyFund);
        if (payload.budgets) overwriteTabData(ss, "Budgets", payload.budgets);
        if (payload.config) writeConfigTab(ss, payload.config);
        return jsonResponse({ success: true, message: "Bulk import completed" });
      }

      default:
        return jsonResponse({ error: "Unknown action: " + action }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.toString(), stack: err.stack }, 500);
  }
}

/**
 * Handle HTTP GET for browser test
 */
function doGet(e) {
  return jsonResponse({
    status: "ok",
    service: "FinFlow Google Sheets Backend",
    timestamp: new Date().toISOString()
  });
}

/**
 * Format JSON output
 */
function jsonResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ensure all standard tabs exist with styled headers
 */
function ensureAllTabs(ss) {
  Object.keys(TAB_HEADERS).forEach(function(tabName) {
    let sheet = ss.getSheetByName(tabName);
    const headers = TAB_HEADERS[tabName];

    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeaderRow(sheet, headers.length);
    } else if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeaderRow(sheet, headers.length);
    }
  });

  // Remove default "Sheet1" if custom tabs exist
  const sheet1 = ss.getSheetByName("Sheet1");
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch (e) {}
  }
}

function styleHeaderRow(sheet, numCols) {
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground("#4f46e5");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/**
 * Overwrite an entire tab's data rows
 */
function overwriteTabData(ss, tabName, items) {
  const sheet = ss.getSheetByName(tabName);
  const headers = TAB_HEADERS[tabName];
  if (!sheet || !headers) return;

  // Clear existing data rows (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }

  if (!items || items.length === 0) return;

  const rows = items.map(function(item) {
    return headers.map(function(key) {
      const val = item[key];
      if (typeof val === "object" && val !== null) {
        return JSON.stringify(val);
      }
      return val !== undefined && val !== null ? val : "";
    });
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

/**
 * Append a single item row to tab
 */
function appendTabRow(ss, tabName, item) {
  const sheet = ss.getSheetByName(tabName);
  const headers = TAB_HEADERS[tabName];
  if (!sheet || !headers || !item) return;

  const row = headers.map(function(key) {
    const val = item[key];
    if (typeof val === "object" && val !== null) {
      return JSON.stringify(val);
    }
    return val !== undefined && val !== null ? val : "";
  });
  sheet.appendRow(row);
}

/**
 * Update row matching id in tab
 */
function updateTabRow(ss, tabName, id, updates) {
  const sheet = ss.getSheetByName(tabName);
  const headers = TAB_HEADERS[tabName];
  if (!sheet || !headers || !id) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idColValues.length; i++) {
    if (String(idColValues[i][0]) === String(id)) {
      const rowNum = i + 2;
      const currentValues = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];
      headers.forEach(function(header, idx) {
        if (updates[header] !== undefined) {
          const val = updates[header];
          currentValues[idx] = typeof val === "object" && val !== null ? JSON.stringify(val) : val;
        }
      });
      sheet.getRange(rowNum, 1, 1, headers.length).setValues([currentValues]);
      break;
    }
  }
}

/**
 * Delete row matching id in tab
 */
function deleteTabRow(ss, tabName, id) {
  const sheet = ss.getSheetByName(tabName);
  if (!sheet || !id) return;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const idColValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < idColValues.length; i++) {
    if (String(idColValues[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

/**
 * Read all rows from a tab as JavaScript objects
 */
function getTabObjects(ss, tabName) {
  const sheet = ss.getSheetByName(tabName);
  const headers = TAB_HEADERS[tabName];
  if (!sheet || !headers) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function(row) {
    const obj = {};
    headers.forEach(function(header, idx) {
      let val = row[idx];
      // Auto-parse serialized JSON (e.g. budget allocations)
      if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
        try { val = JSON.parse(val); } catch (e) {}
      }
      obj[header] = val;
    });
    return obj;
  });
}

/**
 * Read Config tab key-value pairs
 */
function readConfigTab(ss) {
  const sheet = ss.getSheetByName("Config");
  if (!sheet) return {};
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const config = {};
  values.forEach(function(r) {
    const k = r[0];
    let v = r[1];
    if (typeof v === "string" && (v.startsWith("[") || v.startsWith("{"))) {
      try { v = JSON.parse(v); } catch (e) {}
    }
    config[k] = v;
  });
  return config;
}

/**
 * Write Config tab key-value pairs
 */
function writeConfigTab(ss, configObj) {
  const sheet = ss.getSheetByName("Config");
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
  }

  const entries = Object.keys(configObj).map(function(k) {
    const val = configObj[k];
    const strVal = typeof val === "object" ? JSON.stringify(val) : val;
    return [k, strVal];
  });

  if (entries.length > 0) {
    sheet.getRange(2, 1, entries.length, 2).setValues(entries);
  }
}
