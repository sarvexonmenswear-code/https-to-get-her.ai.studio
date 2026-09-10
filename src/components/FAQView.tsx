import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ArrowLeft } from 'lucide-react';

interface FAQViewProps {
  onBack: () => void;
  onStartChat: () => void;
}

const FAQ_ITEMS = [
  {
    q: 'What is TO-GET-HER?',
    a: 'TO-GET-HER is an original anonymous social discovery platform where adults aged 18 and older can meet random people around the globe through instant text chat and real-time WebRTC video chat.',
  },
  {
    q: 'How does random matching work?',
    a: 'When you click Start, you enter our matchmaking queue. The engine prioritizes users with the same chat mode (text or video), shared interests, preferred language, and regional preferences, while strictly avoiding users you have recently skipped or blocked.',
  },
  {
    q: 'Is registration required?',
    a: 'No! TO-GET-HER is completely registration-free for discovery. You receive an encrypted anonymous temporary session token that lets you chat immediately without providing an email, phone number, or social media profile.',
  },
  {
    q: 'Is TO-GET-HER free?',
    a: 'Yes, TO-GET-HER is 100% free to use. Both text chat and video chat features are available to all adult users without hidden paywalls.',
  },
  {
    q: 'Can I use video chat?',
    a: 'Yes! Video chat runs on real peer-to-peer WebRTC technology with low latency. Simply select "Video Chat" on the connection screen and grant your browser camera and microphone permissions.',
  },
  {
    q: 'How do I skip someone?',
    a: 'Whenever you wish to move on to a new conversation, click the "Next" button in the bottom control bar. This will immediately terminate the current session, record a skip so you will not immediately rematch with that person, and pair you with a new available stranger.',
  },
  {
    q: 'How do I report someone?',
    a: 'Click the "Report" (flag) button on any chat screen. Select from categories such as harassment, inappropriate nudity, threats, underage concerns, or spam. Reports are encrypted and immediately sent to our safety and moderation dashboard.',
  },
  {
    q: 'How do I block someone?',
    a: 'Click the "Block" button. This immediately terminates your session and stores a permanent block relationship so that our matchmaking engine will never pair you with that user again.',
  },
  {
    q: 'Is TO-GET-HER safe?',
    a: 'We take safety very seriously. We enforce an adult age gate (18+ only), active automated abuse and profanity filters, spam prevention, rate limiters, one-click blocking, and 24/7 moderation reviewing flagged sessions.',
  },
  {
    q: 'Can I choose interests?',
    a: 'Yes! Before entering the queue, you can select from preset topics like Gaming, Anime, Music, Tech, Travel, Books, or type your own custom interests using the "+ Add interest" button. Our matchmaking algorithm pairs users with the highest shared interest overlap.',
  },
  {
    q: 'Can I choose a country?',
    a: 'Yes. You can select your preferred country or regional discovery group (e.g. Worldwide, Europe, North America, Asia-Pacific) in your connection preferences before starting.',
  },
  {
    q: 'How is my privacy protected?',
    a: 'We never store private conversation transcripts permanently. We do not sell your personal data or track your real-world identity. Your IP and tokens are hashed, and video is transferred peer-to-peer over encrypted WebRTC channels.',
  },
];

export const FAQView: React.FC<FAQViewProps> = ({ onBack, onStartChat }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10" id="faq-page-container">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
          <HelpCircle className="w-4 h-4" /> Got Questions?
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-400 text-sm">
          Everything you need to know about connecting, matchmaking, and staying safe on TO-GET-HER.
        </p>
      </div>

      {/* Accordions */}
      <div className="space-y-3 mb-12">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-rose-400 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-slate-300 text-xs sm:text-sm leading-relaxed border-t border-slate-800/60 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to action */}
      <div className="text-center p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-2">Still have questions?</h3>
        <p className="text-slate-400 text-xs mb-4">
          Jump right in and try a live conversation! It takes less than 5 seconds.
        </p>
        <button
          onClick={onStartChat}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all"
        >
          Start Chatting
        </button>
      </div>
    </div>
  );
};
