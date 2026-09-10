import React, { useState } from 'react';
import { Flag, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ReportCategory } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: ReportCategory, description: string, disconnect: boolean) => void;
}

const REPORT_CATEGORIES: { id: ReportCategory; label: string; desc: string }[] = [
  { id: 'harassment', label: 'Harassment & Bullying', desc: 'Targeted insults, persistent unwanted contact, or stalking' },
  { id: 'sexual_content', label: 'Inappropriate Sexual Content', desc: 'Unsolicited sexual solicitation or commercial sex offers' },
  { id: 'nudity', label: 'Non-consensual Nudity', desc: 'Displaying explicit body parts without mutual consent' },
  { id: 'hate_speech', label: 'Hate Speech & Discrimination', desc: 'Attacking race, ethnicity, gender, sexual orientation, religion' },
  { id: 'threatening_behavior', label: 'Threats & Violence', desc: 'Threats of violence, self-harm incitement, or extortion' },
  { id: 'underage_concern', label: 'Underage Concern (Urgent)', desc: 'Suspected minor under 18 years old or child safety issue' },
  { id: 'spam', label: 'Spam & Repetitive Messages', desc: 'Automated spam, bot behavior, repeated flooding' },
  { id: 'scam', label: 'Scam & Financial Fraud', desc: 'Phishing links, fake cash app requests, investment scams' },
  { id: 'other', label: 'Other Guidelines Violation', desc: 'Any other violation of TO-GET-HER Community Guidelines' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('harassment');
  const [description, setDescription] = useState('');
  const [disconnectNow, setDisconnectNow] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedCategory, description, disconnectNow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" id="report-modal-overlay">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-400">
            <Flag className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">Report Stranger</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Reason for Report
            </label>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {REPORT_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-rose-950/40 border-rose-500/50 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_category"
                    value={cat.id}
                    checked={selectedCategory === cat.id}
                    onChange={() => setSelectedCategory(cat.id)}
                    className="mt-0.5 text-rose-500 focus:ring-rose-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-200">{cat.label}</div>
                    <div className="text-[11px] text-slate-400">{cat.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred (e.g. offensive message, inappropriate camera behavior)..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={disconnectNow}
                onChange={(e) => setDisconnectNow(e.target.checked)}
                className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span>Disconnect from this stranger immediately</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-report-btn"
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30"
            >
              Submit Report
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            Reports are encrypted and reviewed by our moderation staff. Your identity remains anonymous.
          </p>
        </form>
      </div>
    </div>
  );
};
