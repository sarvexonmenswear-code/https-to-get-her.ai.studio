import React, { useState } from 'react';
import { X, Shield, FileText, Users, Lock } from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms' | 'guidelines';

interface LegalModalProps {
  initialType: LegalDocType;
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ initialType, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in" id="legal-modal-overlay">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-400" />
            <span className="font-bold text-base text-white">TO-GET-HER Legal & Trust</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="px-6 py-2 border-b border-slate-800 flex gap-2 bg-slate-900/40 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'privacy'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'terms'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'guidelines'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Community Guidelines
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-300 text-xs sm:text-sm leading-relaxed space-y-4">
          
          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Privacy Policy</h2>
              <p className="text-slate-400 text-xs">Last updated: September 2026</p>

              <h3 className="text-base font-bold text-white pt-2">1. Strict 18+ Requirement</h3>
              <p>
                TO-GET-HER is intended strictly for adults aged 18 and above. We do not knowingly permit minors to use the service. Any suspected underage use will result in immediate termination of the session and a permanent hardware/token ban.
              </p>

              <h3 className="text-base font-bold text-white pt-2">2. Anonymous Temporary Sessions</h3>
              <p>
                You are not required to create an account or provide personal identifiers (such as your name, email, or telephone number) to start text or video chats. When you connect, an ephemeral anonymous session token is generated to facilitate matchmaking and rate limiting.
              </p>

              <h3 className="text-base font-bold text-white pt-2">3. What Information Is Collected</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Temporary session identifiers and token hashes.</li>
                <li>User-selected discovery preferences (interests, language, general region).</li>
                <li>Hashed network metadata (to enforce rate limits, prevent DDoS, and combat spam).</li>
                <li>Safety reports and moderation event logs submitted by users.</li>
              </ul>

              <h3 className="text-base font-bold text-white pt-2">4. Data Retention & Ephemeral Communications</h3>
              <p>
                Private conversations are ephemeral. Text chat messages and peer-to-peer WebRTC video streams are not stored permanently on our servers. When a chat session concludes, conversation buffers are released from memory.
              </p>

              <h3 className="text-base font-bold text-white pt-2">5. User Safety & Moderation</h3>
              <p>
                To protect users from malicious behavior, our automated safety layer monitors for rapid flooding (rate limiting), automated bot spam, and prohibited threat patterns. Flagged reports are stored to investigate safety violations and enforce bans.
              </p>

              <h3 className="text-base font-bold text-white pt-2">6. Contact Information</h3>
              <p>
                For legal inquiries, safety concerns, or reports regarding the service, contact our trust team at: <code>safety@to-get-her.app</code>.
              </p>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Terms of Service</h2>
              <p className="text-slate-400 text-xs">Effective date: September 2026</p>

              <h3 className="text-base font-bold text-white pt-2">1. Acceptance of Terms</h3>
              <p>
                By accessing and using TO-GET-HER, you agree to comply with and be bound by these Terms of Service. If you do not agree, you must exit immediately.
              </p>

              <h3 className="text-base font-bold text-white pt-2">2. Age Verification</h3>
              <p>
                You explicitly warrant and represent that you are at least 18 years of age (or the age of legal majority in your jurisdiction). Using the platform while underage constitutes a material breach of these terms.
              </p>

              <h3 className="text-base font-bold text-white pt-2">3. Prohibited Conduct</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Broadcasting non-consensual sexual content, explicit nudity, or harassment.</li>
                <li>Threatening, stalking, or extorting any participant.</li>
                <li>Transmitting automated spam, advertisements, or malicious software.</li>
                <li>Impersonating another individual or attempting to dox other users.</li>
                <li>Attempting to bypass security controls, rate limiters, or bans.</li>
              </ul>

              <h3 className="text-base font-bold text-white pt-2">4. Termination & Bans</h3>
              <p>
                We reserve the unilateral right to terminate access, disconnect active connections, or permanently ban any session, token, or IP address that violates these terms or community standards.
              </p>

              <h3 className="text-base font-bold text-white pt-2">5. Disclaimer of Warranties</h3>
              <p>
                TO-GET-HER is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations or warranties regarding stranger behavior or content encountered during random discovery.
              </p>
            </div>
          )}

          {/* COMMUNITY GUIDELINES */}
          {activeTab === 'guidelines' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Community Guidelines</h2>
              <p className="text-slate-400 text-xs">Fostering respectful anonymous connection</p>

              <h3 className="text-base font-bold text-white pt-2">1. Mutual Respect</h3>
              <p>
                Treat every person you meet with dignity and kindness. Remember that behind every anonymous screen is another real human being.
              </p>

              <h3 className="text-base font-bold text-white pt-2">2. Zero Tolerance for Hate Speech</h3>
              <p>
                Racism, misogyny, homophobia, religious bigotry, and discrimination are banned on TO-GET-HER. Accounts exhibiting hate speech will be immediately banned.
              </p>

              <h3 className="text-base font-bold text-white pt-2">3. Consent & Inappropriate Exposure</h3>
              <p>
                Never display non-consensual nudity or sexual content. Video chat is for face-to-face social discovery. Violations are tracked and reported.
              </p>

              <h3 className="text-base font-bold text-white pt-2">4. Protect Your Privacy</h3>
              <p>
                Never disclose sensitive personal details, credit cards, or passwords. Use the Next and Block buttons freely if you ever feel uncomfortable.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};
