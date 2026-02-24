import { useState } from 'react';
import { CVProvider } from './context/CVContext';
import Toolbar from './components/Toolbar';
import Editor from './components/editor/Editor';
import Preview from './components/preview/Preview';
import ATSChecker from './components/ats/ATSChecker';
import AIChatbot from './components/chat/AIChatbot';

export default function App() {
  const [showATS, setShowATS] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  return (
    <CVProvider>
      <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
        <Toolbar
          showATS={showATS}
          onToggleATS={() => { setShowATS(!showATS); if (!showATS) setShowChat(false); }}
          showChat={showChat}
          onToggleChat={() => { setShowChat(!showChat); if (!showChat) setShowATS(false); }}
          mobileView={mobileView}
          onMobileViewChange={setMobileView}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div
            className={`w-full sm:w-[420px] lg:w-[480px] flex-shrink-0 border-r border-zinc-800 p-4 overflow-hidden ${mobileView !== 'editor' ? 'hidden sm:block' : ''
              }`}
          >
            <Editor />
          </div>

          {/* Preview Panel */}
          <div
            className={`flex-1 overflow-hidden ${mobileView !== 'preview' ? 'hidden sm:block' : ''
              }`}
          >
            <Preview />
          </div>

          {/* ATS Checker Sidebar */}
          {showATS && (
            <div className="hidden lg:block w-[300px] flex-shrink-0 border-l border-zinc-800 p-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-200">ATS Compatibility</h2>
                <button
                  onClick={() => setShowATS(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition"
                >
                  &times;
                </button>
              </div>
              <ATSChecker />
            </div>
          )}

          {/* AI Chatbot Sidebar */}
          {showChat && (
            <div className="hidden lg:flex lg:flex-col w-[360px] flex-shrink-0 border-l border-zinc-800">
              <AIChatbot />
            </div>
          )}
        </div>

        {/* Mobile ATS Checker (overlay) */}
        {showATS && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
            <div className="w-full max-w-lg bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-200">ATS Compatibility</h2>
                <button
                  onClick={() => setShowATS(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition text-lg"
                >
                  &times;
                </button>
              </div>
              <ATSChecker />
            </div>
          </div>
        )}

        {/* Mobile AI Chatbot (overlay) */}
        {showChat && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
            <div className="w-full max-w-lg bg-zinc-900 border-t border-zinc-700 rounded-t-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <h2 className="text-sm font-semibold text-zinc-200">✨ AI Assistant</h2>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition text-lg"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIChatbot />
              </div>
            </div>
          </div>
        )}
      </div>
    </CVProvider>
  );
}
