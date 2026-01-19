
/**
 * ระบบจัดการงานชุมนุม โรงเรียนหนองบัวแดงวิทยา
 * แก้ไขส่วนการเช็คชื่อให้บันทึกทับ และการส่งงานให้บันทึกลงชีท
 */

var IMAGE_FOLDER_ID = '16Se1gaJcjlEzv0CFwdt7lq44qor12xft'; 

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var results = {};
  
  function getSheetData(sheetName, mappingFn) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    return values.slice(1)
      .filter(function(row) { return row[0] !== ""; })
      .map(mappingFn);
  }

  results.students = getSheetData('Students', function(row) {
    return { id: row[0].toString().trim(), name: row[1], level: row[2], room: row[3] };
  });
  
  results.announcements = getSheetData('Announcements', function(row) {
    return { 
      id: row[0].toString(), 
      title: row[1], 
      content: row[2], 
      imageUrl: row[3], 
      isPinned: row[4] === true || row[4] === 'true', 
      isHidden: row[5] === true || row[5] === 'true', 
      createdAt: row[6] 
    };
  });
  
  results.assignments = getSheetData('Assignments', function(row) {
    return { id: row[0].toString(), title: row[1], description: row[2], dueDate: row[3] };
  });

  results.submissions = getSheetData('Submissions', function(row) {
    return { 
      id: row[0].toString(), 
      assignmentId: row[1].toString(), 
      studentId: row[2].toString().trim(), 
      type: row[3], 
      content: row[4], 
      evaluation: row[5], 
      submittedAt: row[6] 
    };
  });

  results.attendance = getSheetData('Attendance', function(row) {
    var dateVal = row[0];
    var formattedDate = "";
    if (dateVal instanceof Date) {
      formattedDate = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      formattedDate = String(dateVal).split('T')[0].trim();
    }
    return { 
      date: formattedDate, 
      studentId: row[1].toString().trim(), 
      status: row[2] 
    };
  });

  return ContentService.createTextOutput(JSON.stringify(results))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mode = e.parameter.mode;
  
  function saveBase64ToDrive(base64Data, fileName) {
    if (!base64Data || !base64Data.includes('base64,')) return base64Data;
    try {
      var folder = DriveApp.getFolderById(IMAGE_FOLDER_ID);
      var parts = base64Data.split(',');
      var contentType = parts[0].split(':')[1].split(';')[0];
      var decodedData = Utilities.base64Decode(parts[1]);
      var blob = Utilities.newBlob(decodedData, contentType, fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return "https://lh3.googleusercontent.com/d/" + file.getId();
    } catch (err) {
      return "Error: " + err.message;
    }
  }

  try {
    if (mode === 'attendance') {
      var sheet = ss.getSheetByName('Attendance') || ss.insertSheet('Attendance');
      if (sheet.getLastRow() === 0) sheet.appendRow(['Date', 'StudentID', 'Status']);
      
      var targetDate = String(e.parameter.date).trim();
      var records = JSON.parse(e.parameter.records);
      var values = sheet.getDataRange().getValues();
      var existingRowsMap = {};
      
      for (var i = 1; i < values.length; i++) {
        var rowDate = values[i][0];
        var formattedRowDate = (rowDate instanceof Date) ? 
          Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd") : 
          String(rowDate).split('T')[0].trim();
        var key = formattedRowDate + "_" + String(values[i][1]).trim();
        existingRowsMap[key] = i + 1;
      }
      
      records.forEach(function(record) {
        var key = targetDate + "_" + String(record.studentId).trim();
        if (existingRowsMap[key]) {
          sheet.getRange(existingRowsMap[key], 3).setValue(record.status);
        } else {
          sheet.appendRow(["'" + targetDate, String(record.studentId).trim(), record.status]);
        }
      });
    }
    else if (mode === 'submission') {
      var sheet = ss.getSheetByName('Submissions') || ss.insertSheet('Submissions');
      if (sheet.getLastRow() === 0) sheet.appendRow(['ID', 'AssignmentID', 'StudentID', 'Type', 'Content', 'Evaluation', 'SubmittedAt']);
      
      var id = e.parameter.id;
      var content = e.parameter.content;
      if (e.parameter.type === 'image' || e.parameter.type === 'file') {
        content = saveBase64ToDrive(e.parameter.content, "sub_" + id + "_" + e.parameter.studentId);
      }
      
      var data = [id, e.parameter.assignmentId, String(e.parameter.studentId).trim(), e.parameter.type, content, "", e.parameter.submittedAt];
      sheet.appendRow(data);
    }
    else if (mode === 'registration') {
      var sheet = ss.getSheetByName('Students') || ss.insertSheet('Students');
      if (sheet.getLastRow() === 0) sheet.appendRow(['ID', 'Name', 'Level', 'Room']);
      var id = String(e.parameter.id).trim();
      var data = [id, e.parameter.name, e.parameter.level, Number(e.parameter.room)];
      var ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1)).getValues().flat().map(function(val) { return String(val).trim(); });
      var rowIndex = ids.indexOf(id);
      if (rowIndex !== -1) sheet.getRange(rowIndex + 1, 1, 1, 4).setValues([data]); 
      else sheet.appendRow(data);
    }
    else if (mode === 'delete_student') {
      var sheet = ss.getSheetByName('Students');
      if (sheet) {
        var ids = sheet.getRange(1, 1, sheet.getLastRow()).getValues().flat().map(function(val) { return String(val).trim(); });
        var rowIndex = ids.indexOf(String(e.parameter.id).trim());
        if (rowIndex !== -1) sheet.deleteRow(rowIndex + 1);
      }
    }
    else if (mode === 'announcement') {
      var sheet = ss.getSheetByName('Announcements') || ss.insertSheet('Announcements');
      if (sheet.getLastRow() === 0) sheet.appendRow(['ID', 'Title', 'Content', 'ImageURL', 'IsPinned', 'IsHidden', 'CreatedAt']);
      var imageUrl = saveBase64ToDrive(e.parameter.imageUrl, "ann_" + e.parameter.id);
      var data = [e.parameter.id, e.parameter.title, e.parameter.content, imageUrl, e.parameter.isPinned === 'true', e.parameter.isHidden === 'true', e.parameter.createdAt];
      var ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1)).getValues().flat().map(String);
      var rowIndex = ids.indexOf(String(e.parameter.id));
      if (rowIndex !== -1) sheet.getRange(rowIndex + 1, 1, 1, 7).setValues([data]);
      else sheet.appendRow(data);
    }
    else if (mode === 'assignment') {
      var sheet = ss.getSheetByName('Assignments') || ss.insertSheet('Assignments');
      if (sheet.getLastRow() === 0) sheet.appendRow(['ID', 'Title', 'Description', 'DueDate']);
      var data = [e.parameter.id, e.parameter.title, e.parameter.description, e.parameter.dueDate];
      var ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1)).getValues().flat().map(String);
      var rowIndex = ids.indexOf(String(e.parameter.id));
      if (rowIndex !== -1) sheet.getRange(rowIndex + 1, 1, 1, 4).setValues([data]);
      else sheet.appendRow(data);
    }
    else if (mode === 'evaluate') {
      var sheet = ss.getSheetByName('Submissions');
      if (sheet) {
        var ids = sheet.getRange(1, 1, sheet.getLastRow()).getValues().flat().map(String);
        var rowIndex = ids.indexOf(String(e.parameter.id));
        if (rowIndex !== -1) sheet.getRange(rowIndex + 1, 6).setValue(e.parameter.status);
      }
    }

    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
