/**
 * GOOGLE APPS SCRIPT PRO UKLÁDÁNÍ A NAČÍTÁNÍ MODELŮ
 */
const SECRET_PIN = "tygr";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.pin !== SECRET_PIN) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Neplatný PIN" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = data.sheetName || "Projekty_2026";
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(["Timestamp", "Student", "ColorMode", "PaletteId", "ParamsJSON"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
    }
    sheet.appendRow([
      new Date().toISOString(),
      data.student || "Návštěva",
      data.colorMode || 3,
      data.paletteId || "p3_1",
      JSON.stringify(data.params || {})
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "ok", sheet: sheetName }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "loadSheet";

  if (action === "listStudents") {
    const sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : "Seznam_Deti";
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ students: [] }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    const values = sheet.getDataRange().getValues();
    const students = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i][0]) students.push(values[i][0].toString().trim());
    }
    return ContentService.createTextOutput(JSON.stringify({ students }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  const sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : ss.getSheets()[0].getName();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ sheet: sheetName, items: [] }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  const rows = sheet.getDataRange().getValues();
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    try {
      items.push({
        timestamp: rows[i][0],
        student: rows[i][1],
        colorMode: rows[i][2],
        paletteId: rows[i][3],
        params: JSON.parse(rows[i][4] || "{}")
      });
    } catch (err) {}
  }
  items.reverse();
  return ContentService.createTextOutput(JSON.stringify({ sheet: sheetName, items: items }))
                       .setMimeType(ContentService.MimeType.JSON);
}