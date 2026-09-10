import React, { useState } from 'react';
import { MessageSquare, Video, Plus, Check, Globe, Sparkles, ArrowLeft, X } from 'lucide-react';
import { ChatMode, UserPreferences } from '../types';

interface StartChatViewProps {
  initialMode: ChatMode;
  onStartMatching: (mode: ChatMode, preferences: UserPreferences) => void;
  onBack: () => void;
}

const PRESET_INTERESTS = [
  'Gaming',
  'Anime',
  'Movies',
  'Music',
  'Technology',
  'Travel',
  'Sports',
  'Fitness',
  'Books',
  'Education',
  'Memes',
  'Coding',
  'Art',
  'Photography',
  'Business',
  'Fashion',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'hi', label: 'Hindi' },
];

const REGIONS = [
  { code: 'ANY', label: 'Worldwide (Any Region)' },
  { code: 'NA', label: 'North America' },
  { code: 'EU', label: 'Europe' },
  { code: 'ASIA', label: 'Asia-Pacific' },
  { code: 'LATAM', label: 'Latin America' },
  { code: 'MEA', label: 'Middle East & Africa' },
];

export const StartChatView: React.FC<StartChatViewProps> = ({
  initialMode,
  onStartMatching,
  onBack,
}) => {
  const [selectedMode, setSelectedMode] = useState<ChatMode>(initialMode);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterestInput, setCustomInterestInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [language, setLanguage] = useState('en');
  const [country, setCountry] = useState('ANY');

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterestInput.trim();
    if (clean && !selectedInterests.includes(clean)) {
      setSelectedInterests((prev) => [...prev, clean]);
      setCustomInterestInput('');
      setShowAddInput(false);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setSelectedInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleLaunch = () => {
    onStartMatching(selectedMode, {
      interests: selectedInterests,
      language,
      country,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" id="start-chat-container">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors"
        id="back-to-home-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Section 1: Choose mode */}
      <div className="mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2" id="choose-mode-heading">
          Choose how you want to connect
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Select your preferred conversation format. You can switch at any time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="mode-cards-grid">
          {/* TEXT CHAT CARD */}
          <div
            id="mode-card-text"
            onClick={() => setSelectedMode('text')}
            className={`cursor-pointer rounded-2xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
              selectedMode === 'text'
                ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/15 ring-2 ring-indigo-500/40'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
            }`}
          >
            {selectedMode === 'text' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">TEXT CHAT</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Talk instantly without camera. Fast, low-bandwidth, and fully anonymous messaging.
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMode('text');
              }}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                selectedMode === 'text'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Start Text Chat
            </button>
          </div>

          {/* VIDEO CHAT CARD */}
          <div
            id="mode-card-video"
            onClick={() => setSelectedMode('video')}
            className={`cursor-pointer rounded-2xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
              selectedMode === 'video'
                ? 'bg-slate-900 border-rose-500 shadow-xl shadow-rose-500/15 ring-2 ring-rose-500/40'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
            }`}
          >
            {selectedMode === 'video' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">VIDEO CHAT</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Have a face-to-face conversation. High-definition peer-to-peer WebRTC video with real-time audio.
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMode('video');
              }}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                selectedMode === 'video'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Start Video Chat
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Interests */}
      <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800" id="interests-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">What are you interested in?</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              We prioritize matching you with strangers who share common interests.
            </p>
          </div>
          <span className="text-xs text-slate-400 self-start sm:self-auto bg-slate-800 px-2.5 py-1 rounded-full">
            {selectedInterests.length} selected
          </span>
        </div>

        {/* Interests Chips Grid */}
        <div className="flex flex-wrap gap-2.5 mb-5" id="interests-chips-grid">
          {PRESET_INTERESTS.map((interest) => {
            const isSelected = selectedInterests.includes(interest);
            return (
              <button
                key={interest}
                id={`interest-${interest.toLowerCase()}`}
                onClick={() => toggleInterest(interest)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md shadow-rose-500/15 border border-rose-400/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{interest}</span>
              </button>
            );
          })}

          {/* Custom interests rendered */}
          {selectedInterests
            .filter((i) => !PRESET_INTERESTS.includes(i))
            .map((custom) => (
              <span
                key={custom}
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5"
              >
                <span>{custom}</span>
                <X
                  className="w-3.5 h-3.5 cursor-pointer hover:text-white"
                  onClick={() => handleRemoveInterest(custom)}
                />
              </span>
            ))}

          {/* Add Interest Toggle / Form */}
          {!showAddInput ? (
            <button
              id="add-interest-toggle-btn"
              onClick={() => setShowAddInput(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-dashed border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add interest</span>
            </button>
          ) : (
            <form onSubmit={handleAddCustomInterest} className="flex items-center gap-1.5">
              <input
                type="text"
                value={customInterestInput}
                onChange={(e) => setCustomInterestInput(e.target.value)}
                placeholder="e.g. Chess, Crypto, Yoga"
                maxLength={30}
                autoFocus
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm bg-slate-950 border border-indigo-500 text-white focus:outline-none w-44"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddInput(false)}
                className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Optional Preferences: Language & Country/Region */}
        <div className="pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Language Preference (Optional)
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Country / Region Preference (Optional)
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          id="start-searching-match-btn"
          onClick={handleLaunch}
          className="w-full sm:w-80 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-lg shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>Find Someone Now</span>
        </button>
        <span className="text-xs text-slate-400">
          Anonymous session • Safe & encrypted • 18+ adults only
        </span>
      </div>
    </div>
  );
};
