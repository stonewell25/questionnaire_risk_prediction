function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Participant Info Sheet
    let sheetParticipant = ss.getSheetByName("Participants");
    if (!sheetParticipant) {
      sheetParticipant = ss.insertSheet("Participants");
      sheetParticipant.appendRow(["Name", "Email", "StartTime", "EndTime", "Language", "Timestamp"]);
    }
    
    sheetParticipant.appendRow([
      data.participant.name,
      data.participant.email,
      data.participant.startTime,
      data.participant.endTime,
      data.participant.language || 'ja', // Default to ja if missing
      new Date()
    ]);
    
    // 2. Validity Sheet
    let sheetValidity = ss.getSheetByName("Validity");
    if (!sheetValidity) {
      sheetValidity = ss.insertSheet("Validity");
      sheetValidity.appendRow(["Participant", "ImageID", "Room", "AgentID", "Judge", "AgreeRating", "ThoughtRating", "Language"]);
    }
    
    if (data.validity && data.validity.length > 0) {
      const validityRows = data.validity.map(v => [
        data.participant.name,
        v.imageId,
        v.room,
        v.agentId,
        v.judge,
        v.agreeRating,
        v.thoughtRating,
        data.participant.language || 'ja'
      ]);
      // Batch append
      if (validityRows.length > 0) {
        sheetValidity.getRange(sheetValidity.getLastRow() + 1, 1, validityRows.length, validityRows[0].length).setValues(validityRows);
      }
    }
    
    // 3. Task Planning Sheet
    let sheetTask = ss.getSheetByName("TaskPlanning");
    if (!sheetTask) {
      sheetTask = ss.insertSheet("TaskPlanning");
      sheetTask.appendRow(["Participant", "ImageID", "RiskPredictionID", "Room", "AgentID", "ValidityRating", "FeasibilityRating", "Language"]);
    }
    
    if (data.taskPlanning && data.taskPlanning.length > 0) {
      const taskRows = data.taskPlanning.map(t => [
        data.participant.name,
        t.imageId,
        t.riskPredictionId,
        t.room,
        t.agentId,
        t.validityRating,
        t.feasibilityRating,
        data.participant.language || 'ja'
      ]);
      // Batch append
      if (taskRows.length > 0) {
        sheetTask.getRange(sheetTask.getLastRow() + 1, 1, taskRows.length, taskRows[0].length).setValues(taskRows);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ "success": true, "participant": data.participant.name }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "success": false, "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("GET request received. Use POST to submit data.");
}
