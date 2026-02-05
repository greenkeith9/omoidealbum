
export enum Step {
  INTRO = 'INTRO',
  TOPIC = 'TOPIC', // なにを かくか きめる
  DETAILS = 'DETAILS', // いつ、だれと、どこで、なにをした
  FEELING = 'FEELING', // どう おもったか
  PREVIEW = 'PREVIEW', // つなげて よんでみる
  FINISH = 'FINISH' // かんせい！
}

export interface MemoryData {
  title: string;
  when: string;
  who: string;
  where: string;
  what: string;
  feeling: string;
  completedText: string;
}

export interface Message {
  role: 'ai' | 'user';
  text: string;
}
