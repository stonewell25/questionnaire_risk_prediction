# リスク予測評価アンケートシステム

家庭内事故リスク予測システムの評価用アンケートフォームです。

## ファイル構成

```
Riskprediction/
├── risk_evaluation_survey.html  # メインのアンケートフォーム
├── google_apps_script.gs        # Google Spreadsheet連携用スクリプト
├── README_survey.md             # このファイル
├── evaluation_coverage/         # Coverage評価用の画像
│   └── Rooms/
│       └── Kitchen/
│           ├── 01.jpg
│           ├── 02.jpg
│           └── ...
└── evaluation_validity/         # Validity評価用の画像とデータ
    └── Rooms/
        └── Kitchen/
            ├── Semantic_state/
            ├── Semantci_state_Persona/
            ├── Semantic_state_RiskScore/
            ├── Semantic_state_RiskScore_Persona/
            └── Semantic_state_Stickler/
```

## 使い方

### 1. ローカルでの実行

```bash
# Riskpredictionディレクトリに移動
cd /home/akash/Documents/Experiments_thesis/Riskprediction

# 簡易HTTPサーバーを起動（Python 3）
python3 -m http.server 8000

# または Node.js の場合
npx serve .
```

ブラウザで `http://localhost:8001/risk_evaluation_survey.html` を開く

### 2. Google Spreadsheet連携の設定

1. **Google Spreadsheet を作成**
   - Google Driveで新しいSpreadsheetを作成

2. **Apps Script を設定**
   - 「拡張機能」>「Apps Script」を開く
   - `google_apps_script.gs` の内容をコピー&ペースト
   - 保存（Ctrl+S）

3. **デプロイ**
   - 「デプロイ」>「新しいデプロイ」
   - 種類: 「ウェブアプリ」を選択
   - 次のユーザーとして実行: 「自分」
   - アクセスできるユーザー: 「全員」
   - 「デプロイ」をクリック
   - 生成されたURLをコピー

4. **HTMLファイルを更新**
   - `risk_evaluation_survey.html` を開く
   - `SPREADSHEET_ENDPOINT` 変数に生成されたURLを設定

```javascript
const SPREADSHEET_ENDPOINT = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

## アンケートの流れ

### Phase 1: 名前入力
- 参加者の名前（必須）とメールアドレス（任意）を入力

### Phase 2: Coverage（網羅性）評価
- 画像を1枚ずつ表示
- 感じるリスクを自由記述
- 4段階のリスクレベルでラベル付け
  - 緊急重大: 発生確率高く、影響度大
  - 潜在重大: 発生確率低く、影響度大
  - 潜在軽微: 発生確率低く、影響度小
  - リスクなし: 事故リスクはない
- 複数のリスクを追加可能
- すべてのリスクを登録したら次の画像へ

### Phase 3: Validity（妥当性）評価
- 画像と複数エージェントのリスク評価理由を表示
- 各評価について以下を4段階で評価:
  - 同意度: この評価への同意度（1-4）
  - 熟慮度: よく考えられているか（1-4）
- エージェントの出典は非表示

### Phase 4: 完了
- 結果のサマリーを表示
- データをエクスポート:
  - JSONファイル
  - CSVファイル（Coverage用、Validity用）
  - Google Spreadsheet（設定済みの場合）

## 出力データ形式

### JSON形式
```json
{
  "participant": {
    "name": "参加者名",
    "email": "メール",
    "startTime": "開始時刻",
    "endTime": "終了時刻"
  },
  "coverageResults": [
    {
      "imageId": "01",
      "room": "Kitchen",
      "risks": [
        {
          "description": "リスクの説明",
          "riskLevel": "緊急重大"
        }
      ]
    }
  ],
  "validityResults": [
    {
      "imageId": "00",
      "room": "Kitchen",
      "assessments": [
        {
          "agentId": "A",
          "reason": "評価理由",
          "judge": "潜在軽微",
          "agreeRating": 3,
          "thoughtRating": 4
        }
      ]
    }
  ]
}
```

### CSV形式

**Coverage CSV:**
| Participant | ImageID | Room | Description | RiskLevel |
|------------|---------|------|-------------|-----------|
| 山田太郎 | 01 | Kitchen | IHコンロに布巾がある | 緊急重大 |

**Validity CSV:**
| Participant | ImageID | Room | AgentID | Judge | AgreeRating | ThoughtRating |
|------------|---------|------|---------|-------|-------------|---------------|
| 山田太郎 | 00 | Kitchen | A | 潜在軽微 | 3 | 4 |

## カスタマイズ

### 画像の追加
`risk_evaluation_survey.html` 内の以下の配列を編集:

```javascript
const coverageImages = [
  { id: '01', path: 'evaluation_coverage/Rooms/Kitchen/01.jpg', room: 'Kitchen' },
  // 新しい画像を追加
];

const validityImages = [
  { id: '00', path: 'evaluation_validity/Rooms/Kitchen/Semantic_state/pred_id_00.jpg', room: 'Kitchen' },
  // 新しい画像を追加
];
```

### エージェント評価の追加
`agentAssessments` オブジェクトを編集:

```javascript
const agentAssessments = {
  '00': [
    { agentId: 'A', reason: '評価理由', judge: '判断' },
    // 新しいエージェントを追加
  ],
  // 新しい画像IDを追加
};
```

## 注意事項

- アンケートはブラウザ上で動作し、途中経過はローカルストレージに保存されません
- ブラウザを閉じるとデータは失われるため、必ず完了までお願いします
- 大量のデータを扱う場合は、定期的にエクスポートすることを推奨します

