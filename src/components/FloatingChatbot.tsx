import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Languages, 
  Sparkles, 
  Waves, 
  Minimize2, 
  Maximize2,
  StopCircle,
  RotateCcw
} from 'lucide-react';
import { ChatMessage, SupportedLanguage } from '../types';
import { soundEngine } from '../services/soundEngine';

interface FloatingChatbotProps {
  currentDetectionContext?: string;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'English',
  'Hindi (हिंदी)',
  'Spanish (Español)',
  'French (Français)',
  'Arabic (العربية)',
  'Chinese (中文)',
  'Bengali (বাংলা)',
  'Tamil (தமிழ்)',
  'German (Deutsch)',
  'Japanese (日本語)',
];

const SUGGESTED_QUESTIONS = [
  'What are the dangers of ghost fishing nets?',
  'What does high water turbidity mean for coral reefs?',
  'How does the Raspberry Pi & YOLO vision model work?',
  'Explain cleanup recommendations for severe plastic clusters',
];

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ currentDetectionContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Greetings. I am the Deep Scan AI Ocean & Marine Conservation Specialist. How may I assist you with marine debris detection, ocean sensor telemetry, or cleanup protocols today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('English');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Voice Input Setup (Web Speech Recognition)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set recognition language
      const langCodes: Record<string, string> = {
        'English': 'en-US',
        'Hindi (हिंदी)': 'hi-IN',
        'Spanish (Español)': 'es-ES',
        'French (Français)': 'fr-FR',
        'Arabic (العربية)': 'ar-SA',
        'Chinese (中文)': 'zh-CN',
        'Bengali (বাংলা)': 'bn-IN',
        'Tamil (தமிழ்)': 'ta-IN',
        'German (Deutsch)': 'de-DE',
        'Japanese (日本語)': 'ja-JP',
      };
      recognition.lang = langCodes[selectedLanguage] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        soundEngine.playNotificationSound();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Send Chat message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call backend Gemini AI endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          language: selectedLanguage,
          conversationHistory: messages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Chat service encountered an error.');
      }

      const data = await response.json();
      const replyText = data.reply || 'Data received. Ready for further marine queries.';

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      soundEngine.playNotificationSound();

      // Read response aloud if auto speech is enabled
      if (autoSpeechEnabled) {
        setIsSpeaking(true);
        await soundEngine.speakText(replyText, selectedLanguage);
        setIsSpeaking(false);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: 'The AI assistant service is temporarily reconnecting. Please retry your question or check connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSpeaking = () => {
    soundEngine.stopSpeaking();
    setIsSpeaking(false);
  };

  const playSingleMessageSpeech = async (text: string) => {
    setIsSpeaking(true);
    await soundEngine.speakText(text, selectedLanguage);
    setIsSpeaking(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'init-1',
        sender: 'assistant',
        text: 'Chat history reset. How may I assist your ocean monitoring research?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    soundEngine.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            soundEngine.playNotificationSound();
          }}
          aria-label="Open Deep Scan AI Assistant"
          className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 group"
        >
          <Waves className="w-5 h-5 text-slate-950 animate-pulse" />
          <span className="hidden sm:inline text-xs font-bold tracking-tight pr-1">
            Ocean AI Assistant
          </span>
          <span className="w-2 h-2 rounded-full bg-slate-950 shadow-inner" />
        </button>
      )}

      {/* Floating Expandable Chat Panel */}
      {isOpen && (
        <div
          role="complementary"
          aria-label="Marine AI Assistant"
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-40 w-[calc(100vw-2rem)] sm:w-[420px] ocean-glass-card rounded-2xl shadow-2xl border border-cyan-500/30 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Deep Scan Ocean AI</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400">
                  Multilingual Marine Specialist
                </div>
              </div>
            </div>

            {/* Header Affordances */}
            <div className="flex items-center gap-1">
              {/* Language Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-cyan-300 focus:outline-none"
                  title="Select Chatbot Language"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stop Speaking / Mute voice */}
              {isSpeaking ? (
                <button
                  onClick={handleStopSpeaking}
                  className="p-1.5 text-amber-400 hover:bg-slate-800 rounded"
                  title="Stop Speaking"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setAutoSpeechEnabled(!autoSpeechEnabled)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                  title={autoSpeechEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
                >
                  {autoSpeechEnabled ? (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              )}

              {/* Minimize / Maximize */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close Widget */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleStopSpeaking();
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content (Visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-medium rounded-br-none shadow-md'
                          : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => playSingleMessageSpeech(msg.text)}
                          className="hover:text-cyan-400 transition-colors"
                          title="Read aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-slate-900/60 rounded-2xl rounded-bl-none border border-slate-800 text-slate-400 w-fit">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[11px] font-mono">Analyzing marine telemetry...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions Chips */}
              <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-500 shrink-0 font-medium">Prompts:</span>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 whitespace-nowrap shrink-0 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 shrink-0"
              >
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Ask in ${selectedLanguage} or voice...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />

                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl border transition-colors ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : 'bg-slate-950 text-slate-400 hover:text-cyan-300 border-slate-800'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Voice Input'}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-xl font-medium transition-colors"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
