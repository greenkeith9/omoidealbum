
import React from 'react';
import { Sparkles, Camera, MapPin, Heart } from 'lucide-react';

export const COLORS = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  background: '#F7FFF7',
  text: '#2F2F2F'
};

export const STEP_CONFIG = {
  TOPIC: {
    icon: <Camera className="w-6 h-6" />,
    label: 'なにを かく？',
    description: 'いちばん たのしかった ことを おもいだしに いこう！',
    prompt: '一年生が「思い出のアルバム」という作文を書くために、楽しかった出来事を一つ選ぶのを手伝って。優しく、ひらがな多めで話しかけて。'
  },
  DETAILS: {
    icon: <MapPin className="w-6 h-6" />,
    label: 'くわしく おしえて',
    description: 'いつ、どこで、だれと、なにを したのかな？',
    prompt: '選んだ思い出について、「いつ」「どこで」「だれと」「なにをしたか」を具体的に聞き出して。一年生にわかりやすい短い言葉で。'
  },
  FEELING: {
    icon: <Heart className="w-6 h-6" />,
    label: 'どんな きもち？',
    description: 'そのとき、こころは どんな かんじ だった？',
    prompt: 'その時の気持ちを「うれしかった」「びっくりした」など、一年生らしい言葉で表現できるように促して。'
  },
  PREVIEW: {
    icon: <Sparkles className="w-6 h-6" />,
    label: 'つなげて みよう',
    description: 'まほうの ちからで、さくぶんに するよ！',
    prompt: 'これまでの情報を統合して、一年生の作文を作成して。以下のルールを【絶対】に守ること：\n1. 「はじめ」「なか」「おわり」の三段構成にするが、タイトルやセクション名は絶対に書かない。本文のみを出力する。\n2. 各段落の書き出し（冒頭）は、必ず全角スペースを1つ入れて「字下げ」を行うこと。\n3. 「分かち書き」（言葉の間のスペース）は絶対にしない。通常の日本語として、適切な場所に「、」（読点）と「。」（句点）を打つこと。\n4. ロボットの挨拶やコメントは含めず、作文の本文だけを出力する。\n5. 「〜です」「〜ました」の敬体で書く。'
  }
};
