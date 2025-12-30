#!/usr/bin/env python3
"""
Final comprehensive script to translate remaining Japanese text in JSON files to English.
"""
import json
import re

# Translation mappings for risk_judge values
JUDGE_TRANSLATIONS = {
    "潜在軽微": "Potential Minor",
    "潜在重大": "Potential Major",
    "緊急軽微": "Immediate Minor",
    "緊急重大": "Immediate Major",
    "安全": "Safe",
    "特に心配なし": "No particular concern"
}

# Object name translations
OBJECT_TRANSLATIONS = {
    "布（ふきん）": "Cloth (dish towel)",
    "包丁": "Knife",
    "ケーブル, 掃除機": "Cable, Vacuum cleaner",
    "洗面台": "Sink/Vanity",
    "収納扉": "Storage door",
    "電気ヒーター, 衣類": "Electric heater, Clothing",
    "ハサミ": "Scissors"
}

def contains_japanese(text):
    """Check if text contains Japanese characters."""
    if not isinstance(text, str):
        return False
    return bool(re.search(r'[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]', text))

def translate_japanese_text(text):
    """Use comprehensive translations for Japanese text."""
    if not contains_japanese(text):
        return text
    
    # Final translations dictionary
    translations = {
        # Scissors additional
        "フィードバックに基づき、評価を「潜在軽微」から「潜在重大」に更新する。元の判断ではハサミの存在を軽視したが、86歳の認知障害を持つ高齢者にとって、ハサミのような鋭利な物体が乱雑なデスク上に放置されている状態は、誤使用や不注意な操作、あるいは散乱物の中から取り出す際の接触により、予期せぬ外傷（切創）を引き起こす潜在的な重大リスクとなるため、「潜在重大」に格上げする。":
            "Based on feedback, updating evaluation from 'Potential Minor' to 'Potential Major'. The original judgment underestimated the presence of scissors, but for an 86-year-old elderly person with cognitive disability, the state of sharp objects like scissors left on a cluttered desk is a potential major risk causing unexpected injuries (cuts) due to misuse, careless operation, or contact when retrieving from clutter, so upgrading to 'Potential Major'.",

        "デスクの端近くにハサミ（鋭利な物体）が置かれている。これは、作業中に手が当たって落下したり、誤って触れて切り傷を負う潜在的なリスクがある。もしハサミが落下した場合、足元に怪我を負わせる可能性もあるため、重大事故につながりうる。":
            "Scissors (sharp object) are placed near the edge of the desk. This poses a potential risk of falling when hands hit during work, or accidentally touching and getting cuts. If the scissors fall, they could also injure feet, potentially leading to serious accidents.",

        # Books stacked - No concern
        "本が2冊、壁に立てかけて積み重ねられている（stacked）。この配置が特に不安定であるという情報がなく、通常、本の積み重ねが大きな事故リスク（重大な怪我や損害）に繋がる可能性は非常に低いため、実質的な事故リスクはないと判断する。":
            "Two books are stacked leaning against the wall (stacked). There is no information that this arrangement is particularly unstable, and normally, stacking books has a very low possibility of leading to major accident risk (serious injury or damage), so judging there is no practical accident risk.",

        "他のエージェントからのフィードバック（評価は妥当）と前回の評価は一致している。本が壁に立てかけられ積み重ねられている状態について、明確な不安定さや転倒リスクの根拠が見られないため、「特に心配なし」という評価を維持する。":
            "Feedback from other agents (evaluation is appropriate) and the previous evaluation are consistent. Since there is no clear basis for instability or fall risk regarding the state of books stacked leaning against the wall, maintaining the 'No particular concern' evaluation.",

        "元の判断「特に心配なし」を維持する。本が壁に立てかけられ積み重ねられている状態は、不安定さを示す情報がない限り、67歳のユーザーにとって重大な事故リスクを引き起こす可能性は極めて低い。実質的な事故リスクがないため、特に心配する必要はないと判断する。":
            "Maintaining original judgment 'No particular concern'. The state of books stacked leaning against the wall has extremely low possibility of causing serious accident risk for a 67-year-old user unless there is information indicating instability. Since there is no practical accident risk, judging there is no need for particular concern.",

        "フィードバックでも評価は妥当とされており、本が壁に立てかけられている状態は、不安定さが示されておらず、実質的な事故リスクは非常に低いと判断し、初期の評価「特に心配なし」を維持する。":
            "Feedback also considers the evaluation appropriate, and since the state of books leaning against the wall shows no instability, judging practical accident risk is very low, maintaining the initial evaluation 'No particular concern'.",

        "前回の評価（特に心配なし）を維持する。壁に立てかけられた本であり、不安定さを示す記述もなく、ペルソナ情報によってリスクが増幅される要因も見当たらないため、実質的な事故リスクはないと判断する。":
            "Maintaining the previous evaluation (No particular concern). It is books leaning against the wall with no description indicating instability, and no factors found that would amplify risk by persona information, so judging there is no practical accident risk.",

        "「特に心配なし」の判断を維持する。本が壁に立てかけられている状態は安定しており、高齢者や認知障害の有無にかかわらず、転倒や重大な外傷のリスクに繋がる可能性は極めて低く、実質的な事故リスクはないと判断する。":
            "Maintaining 'No particular concern' judgment. The state of books leaning against the wall is stable, and regardless of whether elderly or having cognitive disability, the possibility of leading to fall or serious injury risk is extremely low, judging there is no practical accident risk.",
    }
    
    # Check if exact match exists
    if text in translations:
        return translations[text]
    
    # Return original if no translation found
    return text

def translate_json_value(obj):
    """Recursively translate JSON values containing Japanese."""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if key in ['risk_judge', 'updated_judge_01', 'updated_judge_02'] and isinstance(value, str):
                result[key] = JUDGE_TRANSLATIONS.get(value, value)
            elif key in ['object_name', 'landmark_name'] and isinstance(value, str):
                result[key] = OBJECT_TRANSLATIONS.get(value, value)
            elif key in ['risk_reason', 'updated_reason_01', 'updated_reason_02'] and isinstance(value, str):
                result[key] = translate_japanese_text(value)
            else:
                result[key] = translate_json_value(value)
        return result
    elif isinstance(obj, list):
        return [translate_json_value(item) for item in obj]
    else:
        return obj

def process_file(input_path, output_path):
    """Process a JSON file and translate Japanese text."""
    print(f"Processing: {input_path}")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    translated_data = translate_json_value(data)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    base_path = "/home/akash/Documents/Experiments_thesis/Riskprediction"
    
    files = [
        "evaluation_dataset_LivingLab_en.json"
    ]
    
    for filename in files:
        filepath = f"{base_path}/{filename}"
        process_file(filepath, filepath)
    
    print("Final translation complete!")
