
import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../services/geminiService';

interface CharacterMessageProps {
  message: string;
  isAi?: boolean;
}

export const CharacterMessage: React.FC<CharacterMessageProps> = ({ message, isAi = true }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(message.slice(0, i));
      i++;
      if (i > message.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [message]);

  const handleSpeak = () => {
    speakText(message);
  };

  return (
    <div className={`flex ${isAi ? 'flex-row' : 'flex-row-reverse'} items-end gap-3 mb-6`}>
      {isAi && (
        <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-bounce">
          <span className="text-3xl">🤖</span>
        </div>
      )}
      <div className={`max-w-[80%] p-4 rounded-2xl shadow-md relative ${
        isAi ? 'bg-white rounded-bl-none text-gray-800' : 'bg-blue-500 rounded-br-none text-white'
      }`}>
        <p className="text-lg leading-relaxed">{displayedText}</p>
        {isAi && (
          <button 
            onClick={handleSpeak}
            className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full hover:scale-110 transition-transform shadow-sm"
          >
            <Volume2 size={16} />
          </button>
        )}
      </div>
      {!isAi && (
        <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center border-2 border-white">
          <span className="text-xl">🧒</span>
        </div>
      )}
    </div>
  );
};
