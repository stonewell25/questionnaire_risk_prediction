/**
 * Google Apps Script for Risk Evaluation Survey
 * 
 * 使用方法:
 * 1. Google Spreadsheetを新規作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このコードをコピー&ペースト
 * 4. 「デプロイ」>「新しいデプロイ」を選択
 * 5. 種類: 「ウェブアプリ」を選択
 * 6. アクセスできるユーザー: 「全員」を選択
 * 7. デプロイして生成されたURLをHTMLファイルのSPREADSHEET_ENDPOINTに設定
 */

// スプレッドシートの設定
const COVERAGE_SHEET_NAME = 'Coverage評価';
const VALIDITY_SHEET_NAME = 'Validity評価';
const PARTICIPANTS_SHEET_NAME = '参加者';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 参加者シートに記録
    saveParticipant(ss, data.participant);
    
    // Coverage評価を記録
    saveCoverageResults(ss, data.participant.name, data.coverage);
    
    // Validity評価を記録
    saveValidityResults(ss, data.participant.name, data.validity);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'データが正常に保存されました'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'OK',
    message: 'Risk Evaluation Survey API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

function saveParticipant(ss, participant) {
  let sheet = ss.getSheetByName(PARTICIPANTS_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(PARTICIPANTS_SHEET_NAME);
    sheet.appendRow(['名前', 'メール', '開始時刻', '終了時刻', '所要時間（分）']);
  }
  
  const startTime = new Date(participant.startTime);
  const endTime = new Date(participant.endTime);
  const duration = Math.round((endTime - startTime) / 60000);
  
  sheet.appendRow([
    participant.name,
    participant.email || '',
    participant.startTime,
    participant.endTime,
    duration
  ]);
}

function saveCoverageResults(ss, participantName, coverageData) {
  let sheet = ss.getSheetByName(COVERAGE_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(COVERAGE_SHEET_NAME);
    sheet.appendRow([
      '参加者名', 
      '画像ID', 
      '部屋', 
      'リスク説明', 
      'リスクレベル',
      '記録日時'
    ]);
    
    // ヘッダーのスタイル設定
    const headerRange = sheet.getRange(1, 1, 1, 6);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
  }
  
  const timestamp = new Date().toISOString();
  
  coverageData.forEach(item => {
    sheet.appendRow([
      participantName,
      item.imageId,
      item.room,
      item.description,
      item.riskLevel,
      timestamp
    ]);
  });
}

function saveValidityResults(ss, participantName, validityData) {
  let sheet = ss.getSheetByName(VALIDITY_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(VALIDITY_SHEET_NAME);
    sheet.appendRow([
      '参加者名',
      '画像ID',
      '部屋',
      'エージェントID',
      'リスク判断',
      '同意度（1-4）',
      '熟慮度（1-4）',
      '記録日時'
    ]);
    
    // ヘッダーのスタイル設定
    const headerRange = sheet.getRange(1, 1, 1, 8);
    headerRange.setBackground('#34a853');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
  }
  
  const timestamp = new Date().toISOString();
  
  validityData.forEach(item => {
    sheet.appendRow([
      participantName,
      item.imageId,
      item.room,
      item.agentId,
      item.judge,
      item.agreeRating || '',
      item.thoughtRating || '',
      timestamp
    ]);
  });
}

// テスト用関数
function testSaveData() {
  const testData = {
    participant: {
      name: 'テスト太郎',
      email: 'test@example.com',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    },
    coverage: [
      {
        imageId: '01',
        room: 'Kitchen',
        description: 'テストリスク説明',
        riskLevel: '緊急重大'
      }
    ],
    validity: [
      {
        imageId: '00',
        room: 'Kitchen',
        agentId: 'A',
        judge: '潜在軽微',
        agreeRating: 3,
        thoughtRating: 4
      }
    ]
  };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  saveParticipant(ss, testData.participant);
  saveCoverageResults(ss, testData.participant.name, testData.coverage);
  saveValidityResults(ss, testData.participant.name, testData.validity);
  
  Logger.log('テストデータを保存しました');
}

// 初期設定関数 - シートを作成
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 参加者シート
  let participantsSheet = ss.getSheetByName(PARTICIPANTS_SHEET_NAME);
  if (!participantsSheet) {
    participantsSheet = ss.insertSheet(PARTICIPANTS_SHEET_NAME);
    participantsSheet.appendRow(['名前', 'メール', '開始時刻', '終了時刻', '所要時間（分）']);
    participantsSheet.getRange(1, 1, 1, 5).setBackground('#9c27b0').setFontColor('#ffffff').setFontWeight('bold');
  }
  
  // Coverageシート
  let coverageSheet = ss.getSheetByName(COVERAGE_SHEET_NAME);
  if (!coverageSheet) {
    coverageSheet = ss.insertSheet(COVERAGE_SHEET_NAME);
    coverageSheet.appendRow(['参加者名', '画像ID', '部屋', 'リスク説明', 'リスクレベル', '記録日時']);
    coverageSheet.getRange(1, 1, 1, 6).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  }
  
  // Validityシート
  let validitySheet = ss.getSheetByName(VALIDITY_SHEET_NAME);
  if (!validitySheet) {
    validitySheet = ss.insertSheet(VALIDITY_SHEET_NAME);
    validitySheet.appendRow(['参加者名', '画像ID', '部屋', 'エージェントID', 'リスク判断', '同意度（1-4）', '熟慮度（1-4）', '記録日時']);
    validitySheet.getRange(1, 1, 1, 8).setBackground('#34a853').setFontColor('#ffffff').setFontWeight('bold');
  }
  
  Logger.log('シートのセットアップが完了しました');
}

