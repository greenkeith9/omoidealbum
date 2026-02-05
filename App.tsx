
import React, { useState, useEffect, useRef } from 'react';
import { Step, MemoryData } from './types';
import { COLORS, STEP_CONFIG } from './constants';
import { getGeminiResponse, speakText } from './services/geminiService';
import { CharacterMessage } from './components/CharacterMessage';
import { Trophy, ArrowRight, Mic, RotateCcw, FileDown, BookOpen, Copy, Check, Save, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.INTRO);
  const [aiMessage, setAiMessage] = useState<string>("こんにちは！ぼくは、おもいでロボの「アルくん」だよ。きみの一年間のたのしかったことを、いっしょに「おもいでアルバム」にしよう！");
  const [userInput, setUserInput] = useState("");
  const [detailsInput, setDetailsInput] = useState({ when: "", who: "", where: "", what: "" });
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [memory, setMemory] = useState<MemoryData>({
    title: "",
    when: "",
    who: "",
    where: "",
    what: "",
    feeling: "",
    completedText: ""
  });
  const [badges, setBadges] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerGemRef = useRef<HTMLDivElement>(null);
  const stepIconRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (currentStep !== Step.INTRO) {
      speakText(aiMessage);
    }
  }, [aiMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessage]);

  const triggerGemAnimation = (stepKey: string) => {
    const iconEl = stepIconRefs.current[stepKey];
    const targetEl = headerGemRef.current;
    if (!iconEl || !targetEl) return;

    const iconRect = iconEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const gem = document.createElement('div');
    gem.innerHTML = '💎';
    gem.className = 'gem-anim text-2xl';
    gem.style.left = `${iconRect.left}px`;
    gem.style.top = `${iconRect.top}px`;
    gem.style.setProperty('--target-x', `${targetRect.left - iconRect.left}px`);
    gem.style.setProperty('--target-y', `${targetRect.top - iconRect.top}px`);

    document.body.appendChild(gem);
    setTimeout(() => {
      document.body.removeChild(gem);
      setBadges(prev => [...prev, '💎']);
    }, 1000);
  };

  const handleStart = () => {
    setCurrentStep(Step.TOPIC);
    const msg = "まずは、いちばん こころに のこっている ことは なにかな？ えんそく？ うんどうかい？ おうちで あそんだこと？ おしえてね！";
    setAiMessage(msg);
  };

  const startSpeechRecognition = (field: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声入力に対応していません。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(field);
    recognition.onend = () => setIsRecording(null);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'main') {
        setUserInput(prev => prev + transcript);
      } else {
        setDetailsInput(prev => ({ ...prev, [field]: (prev as any)[field] + transcript }));
      }
    };

    recognition.start();
  };

  const handleNextStep = async () => {
    setIsTyping(true);
    let nextStep: Step = currentStep;
    let systemPrompt = "";
    let userMsg = userInput;

    if (currentStep === Step.TOPIC) {
      nextStep = Step.DETAILS;
      setMemory(prev => ({ ...prev, title: userInput }));
      systemPrompt = STEP_CONFIG.DETAILS.prompt;
      triggerGemAnimation('TOPIC');
    } else if (currentStep === Step.DETAILS) {
      nextStep = Step.FEELING;
      setMemory(prev => ({ ...prev, ...detailsInput }));
      systemPrompt = STEP_CONFIG.FEELING.prompt;
      userMsg = `いつ：${detailsInput.when}、どこで：${detailsInput.where}、だれと：${detailsInput.who}、なにを：${detailsInput.what}`;
      triggerGemAnimation('DETAILS');
    } else if (currentStep === Step.FEELING) {
      nextStep = Step.PREVIEW;
      setMemory(prev => ({ ...prev, feeling: userInput }));
      systemPrompt = STEP_CONFIG.PREVIEW.prompt;
      triggerGemAnimation('FEELING');
    }

    const response = await getGeminiResponse(systemPrompt, `ユーザーの入力: ${userMsg}\nこれまでの情報: ${JSON.stringify(memory)}`);
    
    if (nextStep === Step.PREVIEW) {
      let cleanText = response.trim();
      // AIが字下げを忘れた場合のために、文頭が全角スペースでなければ追加
      if (!cleanText.startsWith('　')) {
        cleanText = '　' + cleanText;
      }
      setMemory(prev => ({ ...prev, completedText: cleanText }));
      setAiMessage("すばらしい さくぶんですね。いっしょうけんめい がんばったことが、よく つたわってきました。ひとつに まとめましたので、よんで みてくださいね。これからも、たのしく さくぶんを かいて くださいね。おうえん しています！");
    } else {
      setAiMessage(response);
    }

    setCurrentStep(nextStep);
    setUserInput("");
    setIsTyping(false);
  };

  const downloadPdf = async () => {
    const element = document.getElementById('pdf-export-area');
    if (!element) return;
    element.style.display = 'block';

    try {
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('おもいでアルバム.pdf');
    } catch (error) {
      console.error('PDF Error:', error);
      alert('PDFの作成に失敗しました。');
    } finally {
      element.style.display = 'none';
    }
  };

  const resetGame = () => {
    setCurrentStep(Step.INTRO);
    setMemory({ title: "", when: "", who: "", where: "", what: "", feeling: "", completedText: "" });
    setDetailsInput({ when: "", who: "", where: "", what: "" });
    setBadges([]);
    setAiMessage("こんにちは！また いっしょに アルバムを つくろう！");
  };

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto shadow-2xl bg-[#F7FFF7] border-x border-gray-200 font-['M_PLUS_Rounded_1c']">
      <header className="p-4 bg-white border-b flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 p-2 rounded-lg shadow-sm">
            <BookOpen className="text-white" size={24} />
          </div>
          <h1 className="font-bold text-xl text-gray-800">おもいでアルバム</h1>
        </div>
        <div ref={headerGemRef} className="flex gap-1 min-w-[60px] justify-end">
          {badges.map((b, i) => (
            <span key={i} className="text-2xl animate-bounce">💎</span>
          ))}
          {badges.length === 0 && <span className="text-gray-300 text-xs">💎 0</span>}
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-blue-50 to-white pb-32">
        {currentStep === Step.INTRO ? (
          <div className="text-center py-12">
            <div className="w-32 h-32 bg-yellow-300 rounded-full mx-auto mb-8 flex items-center justify-center border-8 border-white shadow-xl">
              <span className="text-6xl">🤖</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">ぼうけんに でかけよう！</h2>
            <p className="text-lg text-gray-600 mb-8 px-8 leading-relaxed">
              きみが １ねんかんで いちばん たのしかったことを、さくぶんに するよ。<br/>
              ロボの「アルくん」が おてつだいするから、だいじょうぶ！
            </p>
            <button 
              onClick={handleStart}
              className="bg-red-500 hover:bg-red-600 text-white text-2xl font-bold py-6 px-12 rounded-full shadow-lg transform active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              スタート！ <ArrowRight size={28} />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between mb-8 px-2">
              {Object.entries(STEP_CONFIG).map(([key, config], idx) => {
                const isActive = currentStep === key;
                const isDone = Object.keys(STEP_CONFIG).indexOf(currentStep as any) > idx;
                return (
                  <div key={key} className="flex flex-col items-center flex-1">
                    <div 
                      // Fixed: Ref callback must return void (or a cleanup function in React 19+). 
                      // Assignment expressions return the value, which causes TypeScript errors.
                      ref={(el) => { stepIconRefs.current[key] = el; }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive ? 'bg-yellow-400 border-yellow-500 scale-110 shadow-md ring-4 ring-yellow-200' : 
                        isDone ? 'bg-green-400 border-green-500' : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      {isDone ? <Trophy size={18} className="text-white" /> : config.icon}
                    </div>
                    <span className={`text-[10px] mt-1 text-center font-bold ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <CharacterMessage message={aiMessage} />

            {currentStep === Step.DETAILS ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                {[
                  { label: 'いつ？', field: 'when', placeholder: 'きのう、なつやすみ、など' },
                  { label: 'だれと？', field: 'who', placeholder: 'ともだち、かぞく、など' },
                  { label: 'どこで？', field: 'where', placeholder: 'こうえん、がっこう、など' },
                  { label: 'なにをした？', field: 'what', placeholder: 'あそんだ、べんきょうした、など' }
                ].map((item) => (
                  <div key={item.field} className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-sm relative">
                    <label className="block text-sm font-bold text-blue-500 mb-1">{item.label}</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={(detailsInput as any)[item.field]}
                        onChange={(e) => setDetailsInput(prev => ({ ...prev, [item.field]: e.target.value }))}
                        placeholder={item.placeholder}
                        className="flex-1 outline-none text-lg py-1 border-b-2 border-transparent focus:border-blue-400 transition-colors"
                      />
                      <button 
                        onClick={() => startSpeechRecognition(item.field)}
                        className={`p-2 rounded-full transition-all ${isRecording === item.field ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}
                      >
                        <Mic size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={handleNextStep}
                  disabled={!detailsInput.when || !detailsInput.what || isTyping}
                  className={`w-full py-5 rounded-2xl font-bold text-2xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                    !detailsInput.when || !detailsInput.what || isTyping ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {isTyping ? 'かんがえちゅう...' : 'つぎへ！'} <ArrowRight size={28} />
                </button>
              </div>
            ) : currentStep === Step.PREVIEW ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                <div className="bg-white p-8 rounded-2xl border-4 border-blue-400 shadow-xl relative overflow-hidden min-h-[300px]">
                  <div className="absolute top-0 left-0 bg-blue-400 text-white px-4 py-1 rounded-br-xl text-xs font-bold z-10 flex items-center gap-1">
                    <Sparkles size={12}/> かんせいした さくぶん
                  </div>
                  <div className="pt-6">
                    <p className="whitespace-pre-wrap font-sans text-2xl text-gray-800 leading-relaxed tracking-wider">
                      {memory.completedText}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={downloadPdf}
                    className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <FileDown /> じぶんの じで かけるように PDFをだす
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(memory.completedText);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="w-full bg-white text-blue-500 border-2 border-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    {copied ? <><Check size={18}/> コピーしました</> : <><Copy size={18}/> ぶんしょうを コピーする</>}
                  </button>
                  <button 
                    onClick={() => setCurrentStep(Step.FINISH)}
                    className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-green-600"
                  >
                    できた！ おわりにする
                  </button>
                </div>
              </div>
            ) : currentStep === Step.FINISH ? (
              <div className="text-center py-10 bg-white rounded-3xl border-4 border-yellow-400 shadow-xl">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">よくがんばったね！</h2>
                <p className="text-xl text-gray-600 mb-6 px-4">きみの おもいでが すてきな さくぶんに なったよ。また いっしょに かこうね！</p>
                <button onClick={resetGame} className="bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-md hover:bg-blue-600">
                  べつの おはなしも つくる
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <div className="relative">
                  <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="ここに おはなしを かいてね..."
                    className="w-full h-48 p-4 rounded-2xl border-4 border-blue-200 focus:border-blue-400 outline-none text-xl resize-none shadow-inner leading-relaxed"
                    disabled={isTyping}
                  />
                  <button 
                    onClick={() => startSpeechRecognition('main')}
                    className={`absolute bottom-4 right-4 p-4 rounded-full shadow-lg transition-all z-20 ${
                      isRecording === 'main' ? 'bg-red-500 text-white animate-pulse scale-110 ring-4 ring-red-200' : 'bg-yellow-400 text-white hover:scale-105'
                    }`}
                  >
                    <Mic size={32} />
                  </button>
                </div>
                <button 
                  onClick={handleNextStep}
                  disabled={!userInput || isTyping}
                  className={`w-full mt-6 py-5 rounded-2xl font-bold text-2xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                    !userInput || isTyping ? 'bg-gray-300 text-gray-500' : 'bg-red-500 text-white hover:bg-red-600 transform active:scale-95'
                  }`}
                >
                  {isTyping ? 'かんがえちゅう...' : 'つぎへ！'} <ArrowRight size={28} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="p-4 bg-white border-t flex justify-center items-center gap-4 fixed bottom-0 w-full max-w-2xl z-40">
        <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden flex">
          <div 
            className="bg-yellow-400 h-full transition-all duration-700" 
            style={{ width: `${(Object.keys(STEP_CONFIG).indexOf(currentStep as any) + 1) * 25}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gray-500 whitespace-nowrap">
          {Object.keys(STEP_CONFIG).indexOf(currentStep as any) === -1 ? '0' : Object.keys(STEP_CONFIG).indexOf(currentStep as any) + 1} / 4
        </span>
      </footer>

      {/* PDF Export Hidden Area */}
      <div id="pdf-export-area" style={{ display: 'none', padding: '40px', width: '210mm', minHeight: '297mm', backgroundColor: 'white' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '40px', textAlign: 'center' }}>おもいでアルバム（さくぶん）</h2>
        <div className="writing-vertical" style={{ fontSize: '24px', height: '240mm', width: '100%', border: '1px solid #eee', padding: '20px' }}>
          {memory.completedText}
        </div>
      </div>
    </div>
  );
};

export default App;
