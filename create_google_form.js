/**
 * Google Form自動生成スクリプト（自動データ抽出版）
 * 
 * 使い方:
 * 1. Google Drive にフォルダを作成し、以下の構成でファイルをアップロード:
 *    📁 RiskEvaluation/
 *    ├── 📁 images/
 *    │   ├── 0.jpg
 *    │   ├── 1.jpg
 *    │   ├── 2.jpg
 *    │   └── ...
 *    └── 📄 extracted_risk_assessments_by_id.json
 * 
 * 2. Google Apps Script (https://script.google.com) にアクセス
 * 3. 新しいプロジェクトを作成し、このコードをすべてコピー&ペースト
 * 4. CONFIG セクションの FOLDER_ID を作成したフォルダのIDに変更
 * 5. createRiskEvaluationForm() 関数を実行
 * 6. 生成されたフォームのURLがログに表示されます
 * 
 * フォルダIDの取得方法:
 *   Google DriveでフォルダをURLを見ると:
 *   https://drive.google.com/drive/folders/XXXXXXXXXXXXX
 *   この XXXXXXXXXXXXX がフォルダIDです
 */

// ============================================
// 設定（ここを変更してください）
// ============================================
const CONFIG = {
  // Google DriveのフォルダID（必須：変更してください）
  FOLDER_ID: 'YOUR_FOLDER_ID_HERE',
  
  // 画像フォルダ名（フォルダ内のサブフォルダ名）
  IMAGES_FOLDER_NAME: 'images',
  
  // JSONファイル名
  JSON_FILE_NAME: 'extracted_risk_assessments_by_id.json',
  
  // フォームのタイトル
  FORM_TITLE: 'リスク予測評価アンケート',
  
  // フォームの説明
  FORM_DESCRIPTION: '家庭内事故リスク予測システムの評価にご協力ください。\n\n各画像について、複数のエージェント（AI）によるリスク評価理由が表示されます。\nそれぞれの評価に対して、同意度と熟慮度を5段階で回答してください。'
};

// ============================================
// エージェント設定（必要に応じて変更可能）
// ============================================

// 対象のエージェントキー（JSONに含まれるキー）
const AGENT_KEYS = [
  'Semantic_state',
  'Semantic_state_RiskScore', 
  'Semantic_state_RiskScore_Persona_01',
  'Semantic_state_RiskScore_Persona_02',
  'Semantic_state_RiskScore_Persona_03',
  'Semantic_state_RiskScore_Persona_04',
  'Semantic_state_RiskScore_Persona_05',
  'Semantic_state_Stickler',
  'Semantic_state_Persona_01',
  'Semantic_state_Persona_02',
  'Semantic_state_Persona_03',
  'Semantic_state_Persona_04',
  'Semantic_state_Persona_05',
  'VLM'
];

// 匿名化されたエージェント名（フォーム表示用）
const AGENT_DISPLAY_NAMES = {
  'Semantic_state': 'Agent A',
  'Semantic_state_RiskScore': 'Agent B',
  'Semantic_state_RiskScore_Persona_01': 'Agent C',
  'Semantic_state_RiskScore_Persona_02': 'Agent D',
  'Semantic_state_RiskScore_Persona_03': 'Agent E',
  'Semantic_state_RiskScore_Persona_04': 'Agent F',
  'Semantic_state_RiskScore_Persona_05': 'Agent G',
  'Semantic_state_Stickler': 'Agent H',
  'Semantic_state_Persona_01': 'Agent I',
  'Semantic_state_Persona_02': 'Agent J',
  'Semantic_state_Persona_03': 'Agent K',
  'Semantic_state_Persona_04': 'Agent L',
  'Semantic_state_Persona_05': 'Agent M',
  'VLM': 'Agent N'
};

// 5段階評価の選択肢
const AGREE_CHOICES = [
  "1 - 強く否定する",
  "2 - やや否定する", 
  "3 - どちらともいえない",
  "4 - 一部同意する",
  "5 - 強く同意する"
];

const THOUGHT_CHOICES = [
  "1 - 非常に浅い",
  "2 - やや浅い",
  "3 - どちらともいえない",
  "4 - やや深い",
  "5 - 非常に深い"
];

// ============================================
// メイン関数
// ============================================

/**
 * メイン関数：Google Formを作成する
 */
function createRiskEvaluationForm() {
  Logger.log('=== リスク評価フォーム生成開始 ===');
  
  // 1. フォルダからデータを読み込む
  Logger.log('1. データを読み込み中...');
  const data = loadDataFromFolder();
  
  if (!data.riskData || Object.keys(data.riskData).length === 0) {
    Logger.log('エラー: リスク評価データが見つかりませんでした');
    return null;
  }
  
  Logger.log(`   - ${Object.keys(data.riskData).length} 件の画像データを読み込みました`);
  Logger.log(`   - ${Object.keys(data.imageUrls).length} 件の画像URLを取得しました`);
  
  // 2. フォームを作成
  Logger.log('2. フォームを作成中...');
  const form = FormApp.create(CONFIG.FORM_TITLE);
  form.setDescription(CONFIG.FORM_DESCRIPTION);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  form.setLimitOneResponsePerUser(false);
  
  // 3. セクション1: 参加者情報
  Logger.log('3. 参加者情報セクションを追加中...');
  form.addPageBreakItem()
    .setTitle('参加者情報');
  
  form.addTextItem()
    .setTitle('お名前')
    .setRequired(true);
  
  form.addTextItem()
    .setTitle('メールアドレス（任意）')
    .setRequired(false);
  
  // 4. 画像ごとにセクションを作成
  Logger.log('4. 画像評価セクションを追加中...');
  const imageIds = Object.keys(data.riskData).sort((a, b) => parseInt(a) - parseInt(b));
  
  for (const imageId of imageIds) {
    Logger.log(`   - 画像 ${imageId} のセクションを作成中...`);
    
    const imageUrl = data.imageUrls[imageId] || '（画像URLが見つかりません）';
    
    // 新しいセクション（ページ）を追加
    form.addPageBreakItem()
      .setTitle(`画像 ${imageId} の評価`)
      .setHelpText(`以下の画像について、各エージェントのリスク評価を読み、同意度と熟慮度を評価してください。\n\n🖼️ 画像URL: ${imageUrl}\n（※上記URLをクリックして別タブで画像を確認してください）`);
    
    const imageData = data.riskData[imageId];
    
    // JSONに含まれるエージェントのみを処理
    const availableAgents = Object.keys(imageData).filter(key => 
      AGENT_KEYS.includes(key) || key.startsWith('Semantic_state') || key === 'VLM'
    );
    
    let agentCount = 0;
    for (const agentKey of availableAgents) {
      const agentData = imageData[agentKey];
      if (!agentData) continue;
      
      // リスク理由を取得（updated_reason_01があればそちらを優先）
      const reason = agentData.updated_reason_01 || agentData.risk_reason;
      const judge = agentData.updated_judge_01 || agentData.risk_judge;
      
      if (!reason) continue;
      
      // 表示名を取得（定義されていなければ元のキー名を使用）
      const displayName = AGENT_DISPLAY_NAMES[agentKey] || `Agent (${agentKey})`;
      
      // セクション区切り（視覚的な区切り）
      form.addSectionHeaderItem()
        .setTitle(`${displayName} の評価`)
        .setHelpText(`【判断】${judge}\n\n【理由】${reason}`);
      
      // 同意度の質問
      form.addMultipleChoiceItem()
        .setTitle(`[画像${imageId}] ${displayName} - 同意度`)
        .setHelpText('この評価にどの程度同意しますか？')
        .setChoiceValues(AGREE_CHOICES)
        .setRequired(true);
      
      // 熟慮度の質問
      form.addMultipleChoiceItem()
        .setTitle(`[画像${imageId}] ${displayName} - 熟慮度`)
        .setHelpText('この評価はよく考えられていると思いますか？')
        .setChoiceValues(THOUGHT_CHOICES)
        .setRequired(true);
      
      agentCount++;
    }
    
    Logger.log(`     -> ${agentCount} 件のエージェント評価を追加`);
  }
  
  // 5. 完了メッセージ
  form.setConfirmationMessage('ご回答ありがとうございました！\n\nあなたの評価は研究データとして大切に使用させていただきます。');
  
  // 6. 結果を出力
  Logger.log('=== フォーム生成完了 ===');
  Logger.log('');
  Logger.log('📝 編集用URL: ' + form.getEditUrl());
  Logger.log('📋 回答用URL: ' + form.getPublishedUrl());
  Logger.log('');
  Logger.log('次のステップ:');
  Logger.log('1. 上記の回答用URLを参加者に共有してください');
  Logger.log('2. linkFormToSpreadsheet() を実行すると、回答がスプレッドシートに自動保存されます');
  
  return form;
}

/**
 * フォルダからデータを読み込む
 */
function loadDataFromFolder() {
  const result = {
    riskData: {},
    imageUrls: {}
  };
  
  try {
    // メインフォルダを取得
    const mainFolder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    Logger.log(`   フォルダ「${mainFolder.getName()}」を開きました`);
    
    // JSONファイルを読み込む
    const jsonFiles = mainFolder.getFilesByName(CONFIG.JSON_FILE_NAME);
    if (jsonFiles.hasNext()) {
      const jsonFile = jsonFiles.next();
      const jsonContent = jsonFile.getBlob().getDataAsString();
      result.riskData = JSON.parse(jsonContent);
      Logger.log(`   JSONファイル「${CONFIG.JSON_FILE_NAME}」を読み込みました`);
    } else {
      Logger.log(`   警告: JSONファイル「${CONFIG.JSON_FILE_NAME}」が見つかりません`);
    }
    
    // 画像フォルダを取得
    const imageFolders = mainFolder.getFoldersByName(CONFIG.IMAGES_FOLDER_NAME);
    if (imageFolders.hasNext()) {
      const imageFolder = imageFolders.next();
      const imageFiles = imageFolder.getFiles();
      
      while (imageFiles.hasNext()) {
        const imageFile = imageFiles.next();
        const fileName = imageFile.getName();
        
        // ファイル名から画像IDを抽出（例: "0.jpg" -> "0"）
        const match = fileName.match(/^(\d+)\.(jpg|jpeg|png|gif|webp)$/i);
        if (match) {
          const imageId = match[1];
          
          // 画像を公開してURLを取得
          imageFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          const fileId = imageFile.getId();
          result.imageUrls[imageId] = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }
      Logger.log(`   画像フォルダ「${CONFIG.IMAGES_FOLDER_NAME}」から画像を読み込みました`);
    } else {
      Logger.log(`   警告: 画像フォルダ「${CONFIG.IMAGES_FOLDER_NAME}」が見つかりません`);
      
      // 代替: メインフォルダ内の画像を直接探す
      const files = mainFolder.getFiles();
      while (files.hasNext()) {
        const file = files.next();
        const fileName = file.getName();
        const match = fileName.match(/^(\d+)\.(jpg|jpeg|png|gif|webp)$/i);
        if (match) {
          const imageId = match[1];
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          const fileId = file.getId();
          result.imageUrls[imageId] = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }
    }
    
  } catch (error) {
    Logger.log(`エラー: ${error.message}`);
    Logger.log('フォルダIDが正しく設定されているか確認してください');
  }
  
  return result;
}

/**
 * フォームの回答をスプレッドシートにリンクする
 */
function linkFormToSpreadsheet() {
  // 最新のフォームを取得（名前で検索）
  const files = DriveApp.getFilesByName(CONFIG.FORM_TITLE);
  
  if (!files.hasNext()) {
    Logger.log('フォームが見つかりませんでした。先に createRiskEvaluationForm() を実行してください。');
    return;
  }
  
  const formFile = files.next();
  const form = FormApp.openById(formFile.getId());
  
  // スプレッドシートを作成してリンク
  const ss = SpreadsheetApp.create(CONFIG.FORM_TITLE + ' - 回答');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  
  Logger.log('スプレッドシートを作成しました: ' + ss.getUrl());
  Logger.log('フォームの回答は自動的にこのスプレッドシートに保存されます');
}

/**
 * 回答データを見やすい形式に整形してスプレッドシートに出力
 */
function formatAndExportResponses() {
  // フォームを取得
  const files = DriveApp.getFilesByName(CONFIG.FORM_TITLE);
  if (!files.hasNext()) {
    Logger.log('フォームが見つかりませんでした');
    return;
  }
  
  const formFile = files.next();
  const form = FormApp.openById(formFile.getId());
  const responses = form.getResponses();
  
  if (responses.length === 0) {
    Logger.log('回答がまだありません');
    return;
  }
  
  // 新しいスプレッドシートを作成
  const ss = SpreadsheetApp.create(CONFIG.FORM_TITLE + ' - 整形済み回答 (' + new Date().toLocaleDateString() + ')');
  const sheet = ss.getActiveSheet();
  sheet.setName('評価サマリー');
  
  // ヘッダーを作成
  const headers = ['参加者名', '回答日時', '画像ID', 'エージェント', '同意度', '熟慮度'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // データを整形して出力
  const data = [];
  
  for (const response of responses) {
    const itemResponses = response.getItemResponses();
    const timestamp = response.getTimestamp();
    let participantName = '';
    
    // 参加者名を取得
    for (const item of itemResponses) {
      if (item.getItem().getTitle() === 'お名前') {
        participantName = item.getResponse();
        break;
      }
    }
    
    // 評価データを抽出
    for (const item of itemResponses) {
      const title = item.getItem().getTitle();
      const answer = item.getResponse();
      
      // [画像X] Agent Y - 同意度/熟慮度 の形式をパース
      const agreeMatch = title.match(/\[画像(\d+)\] (.+) - 同意度/);
      const thoughtMatch = title.match(/\[画像(\d+)\] (.+) - 熟慮度/);
      
      if (agreeMatch) {
        const imageId = agreeMatch[1];
        const agent = agreeMatch[2];
        const numMatch = answer.match(/^(\d+)/);
        const rating = numMatch ? parseInt(numMatch[1]) : answer;
        
        // 同じ画像・エージェントの熟慮度を探す
        let thoughtRating = '';
        for (const item2 of itemResponses) {
          const title2 = item2.getItem().getTitle();
          if (title2 === `[画像${imageId}] ${agent} - 熟慮度`) {
            const answer2 = item2.getResponse();
            const numMatch2 = answer2.match(/^(\d+)/);
            thoughtRating = numMatch2 ? parseInt(numMatch2[1]) : answer2;
            break;
          }
        }
        
        data.push([participantName, timestamp, imageId, agent, rating, thoughtRating]);
      }
    }
  }
  
  // データを書き込み
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  // 列幅を自動調整
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
  
  // ピボットテーブル用のシートを作成
  createPivotSheet(ss, data);
  
  Logger.log('整形済み回答を出力しました: ' + ss.getUrl());
  return ss;
}

/**
 * ピボットテーブル風のサマリーシートを作成
 */
function createPivotSheet(ss, data) {
  const pivotSheet = ss.insertSheet('参加者別サマリー');
  
  // 参加者ごとにグループ化
  const byParticipant = {};
  for (const row of data) {
    const [name, timestamp, imageId, agent, agree, thought] = row;
    if (!byParticipant[name]) {
      byParticipant[name] = { timestamp: timestamp, ratings: {} };
    }
    if (!byParticipant[name].ratings[imageId]) {
      byParticipant[name].ratings[imageId] = {};
    }
    byParticipant[name].ratings[imageId][agent] = { agree, thought };
  }
  
  // 全エージェントのリストを取得
  const allAgents = new Set();
  for (const participant of Object.values(byParticipant)) {
    for (const imageRatings of Object.values(participant.ratings)) {
      for (const agent of Object.keys(imageRatings)) {
        allAgents.add(agent);
      }
    }
  }
  const agentList = Array.from(allAgents).sort();
  
  // 全画像IDのリストを取得
  const allImageIds = new Set();
  for (const participant of Object.values(byParticipant)) {
    for (const imageId of Object.keys(participant.ratings)) {
      allImageIds.add(imageId);
    }
  }
  const imageIdList = Array.from(allImageIds).sort((a, b) => parseInt(a) - parseInt(b));
  
  // ヘッダー行を作成
  const headers = ['参加者名', '回答日時'];
  for (const imageId of imageIdList) {
    for (const agent of agentList) {
      headers.push(`画像${imageId}_${agent}_同意度`);
      headers.push(`画像${imageId}_${agent}_熟慮度`);
    }
  }
  
  pivotSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  pivotSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  pivotSheet.getRange(1, 1, 1, headers.length).setBackground('#34a853');
  pivotSheet.getRange(1, 1, 1, headers.length).setFontColor('white');
  
  // データ行を作成
  const rows = [];
  for (const [name, participant] of Object.entries(byParticipant)) {
    const row = [name, participant.timestamp];
    for (const imageId of imageIdList) {
      for (const agent of agentList) {
        const rating = participant.ratings[imageId]?.[agent];
        row.push(rating?.agree || '');
        row.push(rating?.thought || '');
      }
    }
    rows.push(row);
  }
  
  if (rows.length > 0) {
    pivotSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  // 最初の2列を固定
  pivotSheet.setFrozenColumns(2);
  pivotSheet.setFrozenRows(1);
}

/**
 * テスト用：フォルダの内容を確認する
 */
function testFolderAccess() {
  Logger.log('=== フォルダアクセステスト ===');
  
  try {
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    Logger.log(`フォルダ名: ${folder.getName()}`);
    
    // ファイル一覧
    Logger.log('\nファイル一覧:');
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      Logger.log(`  📄 ${file.getName()} (${file.getMimeType()})`);
    }
    
    // サブフォルダ一覧
    Logger.log('\nサブフォルダ一覧:');
    const folders = folder.getFolders();
    while (folders.hasNext()) {
      const subFolder = folders.next();
      Logger.log(`  📁 ${subFolder.getName()}/`);
      
      // サブフォルダ内のファイル
      const subFiles = subFolder.getFiles();
      while (subFiles.hasNext()) {
        const subFile = subFiles.next();
        Logger.log(`      📄 ${subFile.getName()}`);
      }
    }
    
    Logger.log('\n✅ フォルダアクセス成功！');
    
  } catch (error) {
    Logger.log(`❌ エラー: ${error.message}`);
    Logger.log('\n確認事項:');
    Logger.log('1. CONFIG.FOLDER_ID が正しく設定されていますか？');
    Logger.log('2. フォルダへのアクセス権限がありますか？');
  }
}

/**
 * ヘルプ：使い方を表示
 */
function showHelp() {
  Logger.log(`
╔══════════════════════════════════════════════════════════════╗
║           リスク評価フォーム生成ツール - 使い方              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1. 準備                                                     ║
║     - Google Driveにフォルダを作成                          ║
║     - 画像ファイル（0.jpg, 1.jpg, ...）をアップロード       ║
║     - JSONファイルをアップロード                             ║
║                                                              ║
║  2. 設定                                                     ║
║     - CONFIG.FOLDER_ID にフォルダIDを設定                   ║
║     - フォルダIDはURLの末尾の文字列です                      ║
║       例: drive.google.com/drive/folders/ABC123...          ║
║           → FOLDER_ID = 'ABC123...'                         ║
║                                                              ║
║  3. 実行                                                     ║
║     - testFolderAccess()   : フォルダ確認テスト             ║
║     - createRiskEvaluationForm() : フォーム生成             ║
║     - linkFormToSpreadsheet() : 回答をシートにリンク        ║
║     - formatAndExportResponses() : 回答を整形して出力       ║
║                                                              ║
║  📁 推奨フォルダ構成:                                        ║
║     RiskEvaluation/                                          ║
║     ├── images/                                              ║
║     │   ├── 0.jpg                                            ║
║     │   ├── 1.jpg                                            ║
║     │   └── ...                                              ║
║     └── extracted_risk_assessments_by_id.json               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}
