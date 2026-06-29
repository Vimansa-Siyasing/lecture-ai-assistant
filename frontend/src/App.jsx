import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API = import.meta.env.VITE_API_URL;
const BG = "/background.jpg";

const tabs = [
  { id: "chat", label: "💬 Chat" },
  { id: "summary", label: "📄 Summary" },
  { id: "flashcards", label: "🃏 Flashcards" },
  { id: "quiz", label: "🧠 Quiz" },
  { id: "keyterms", label: "🔑 Key Terms" },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [flippedCards, setFlippedCards] = useState({});
  const [quiz, setQuiz] = useState([]);
  const [quizSeed, setQuizSeed] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [keyterms, setKeyterms] = useState([]);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [quizRegenerating, setQuizRegenerating] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await axios.post(`${API}/upload`, formData);
      setUploaded(true);
    } catch {
      alert("Upload failed!");
    }
    setUploading(false);
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const userMsg = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);
    try {
      const res = await axios.post(`${API}/ask`, { question: userMsg.text });
      setMessages((prev) => [...prev, { role: "ai", text: res.data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Error getting answer." }]);
    }
    setAsking(false);
  };

  const loadQuiz = async (seed) => {
    try {
      const res = await axios.post(`${API}/quiz`, { seed });
      setQuiz(res.data.questions);
      setSelectedAnswers({});
    } catch {}
  };

  const handleTabClick = async (tab) => {
    setActiveTab(tab);
    if (tab === "summary" && !summary) {
      setFeatureLoading(true);
      try { const res = await axios.post(`${API}/summary`); setSummary(res.data.summary); } catch {}
      setFeatureLoading(false);
    }
    if (tab === "flashcards" && flashcards.length === 0) {
      setFeatureLoading(true);
      try { const res = await axios.post(`${API}/flashcards`); setFlashcards(res.data.flashcards); } catch {}
      setFeatureLoading(false);
    }
    if (tab === "quiz" && quiz.length === 0) {
      setFeatureLoading(true);
      await loadQuiz(0);
      setFeatureLoading(false);
    }
    if (tab === "keyterms" && keyterms.length === 0) {
      setFeatureLoading(true);
      try { const res = await axios.post(`${API}/keyterms`); setKeyterms(res.data.terms); } catch {}
      setFeatureLoading(false);
    }
  };

  const handleRegenerateQuiz = async () => {
    const newSeed = quizSeed + 1;
    setQuizSeed(newSeed);
    setQuizRegenerating(true);
    await loadQuiz(newSeed);
    setQuizRegenerating(false);
  };

  const toggleFlip = (i) => setFlippedCards((prev) => ({ ...prev, [i]: !prev[i] }));

  const selectAnswer = (qi, opt) => {
    if (selectedAnswers[qi] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [qi]: opt[0] }));
  };

  const getScore = () => quiz.filter((q, i) => selectedAnswers[i] === q.answer).length;
  const allAnswered = quiz.length > 0 && Object.keys(selectedAnswers).length === quiz.length;

  const glass = "bg-white/85 border border-white/60 rounded-2xl shadow-lg";
  const glassInput = "bg-white/90 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 px-4 py-3 text-sm transition";

  const bgStyle = {
    backgroundImage: `url(${BG})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };

  const resetAll = () => {
    setUploaded(false); setFile(null); setSummary("");
    setFlashcards([]); setQuiz([]); setKeyterms([]);
    setMessages([]); setSelectedAnswers({}); setFlippedCards({});
    setActiveTab("chat"); setQuizSeed(0);
  };

  // ─── Upload Screen ───────────────────────────────────────────────
  if (!uploaded) {
    return (
      <div style={bgStyle} className="min-h-screen flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-white/20" />
        <div className={`${glass} p-10 w-full max-w-md relative z-10`}>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📚</div>
            <h1 className="text-2xl font-bold text-gray-800">AI Lecture Assistant</h1>
            <p className="text-gray-500 mt-2 text-sm">Upload your lecture PDF to get started</p>
          </div>

          <label className="block w-full border-2 border-dashed border-amber-400 rounded-xl p-8 text-center cursor-pointer hover:border-amber-600 hover:bg-amber-50/70 transition mb-4 bg-white/60">
            <div className="text-3xl mb-2">📄</div>
            <div className="text-gray-800 font-semibold text-sm">
              {file ? file.name : "Click to browse PDF"}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {file ? "✅ Ready to upload" : "Supports .pdf files"}
            </div>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition shadow-md"
          >
            {uploading ? "⏳ Processing..." : "Upload & Process"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main App ────────────────────────────────────────────────────
  return (
    <div style={bgStyle} className="min-h-screen flex text-gray-800 relative">
      <div className="absolute inset-0 bg-white/20" />

      {/* ── Sidebar ── */}
      <div className="w-56 bg-white/85 border-r border-gray-200 flex flex-col p-4 shrink-0 relative z-10 shadow-xl">
        <div className="text-lg font-bold text-amber-800 mb-1">📚 LectureAI</div>
        <div className="text-xs text-gray-500 mb-6 truncate" title={file?.name}>
          {file?.name}
        </div>

        <nav className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-amber-50 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={resetAll}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-red-200 py-2.5 px-3 rounded-xl transition font-semibold"
          >
            ↩ Upload New PDF
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">

        {/* Chat */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/30">
              {messages.length === 0 && (
                <div className="flex items-center justify-center mt-16">
                  <div className="bg-white/90 border border-gray-200 rounded-2xl shadow-lg px-10 py-8 text-center max-w-sm w-full">
                    <p className="font-bold text-gray-800 text-base mb-1">Ask anything about your lecture</p>
                    <p className="text-gray-500 text-sm">I'll answer based on your uploaded PDF</p>
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap shadow-md ${
                    m.role === "user"
                      ? "bg-amber-600 text-white"
                      : "bg-white/90 border border-gray-200 text-gray-800"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {asking && (
                <div className="flex justify-start">
                  <div className="bg-white/90 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-500 animate-pulse shadow">
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-white/80 flex gap-3">
              <input
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                className={`flex-1 ${glassInput}`}
              />
              <button
                onClick={handleAsk}
                disabled={asking}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-40 shadow-md"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        {activeTab === "summary" && (
          <div className="flex-1 overflow-y-auto p-8 bg-white/30">
            <h2 className="text-xl font-bold mb-6 text-gray-800">📄 Summary</h2>
            {featureLoading ? (
              <div className="bg-white/90 border border-gray-200 rounded-2xl p-6 text-gray-500 animate-pulse shadow">
                Generating summary...
              </div>
            ) : (
              <div className="bg-white/90 border border-gray-200 rounded-2xl p-6 text-gray-800 text-sm leading-relaxed shadow-lg prose prose-sm max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-700">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Flashcards */}
        {activeTab === "flashcards" && (
          <div className="flex-1 overflow-y-auto p-8 bg-white/30">
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              🃏 Flashcards{" "}
              <span className="text-sm text-gray-500 font-normal">— click to flip</span>
            </h2>
            {featureLoading ? (
              <div className="bg-white/90 border border-gray-200 rounded-2xl p-6 text-gray-500 animate-pulse shadow">
                Generating flashcards...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashcards.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => toggleFlip(i)}
                    className="cursor-pointer bg-white/90 hover:bg-white border border-gray-200 hover:border-amber-300 rounded-2xl shadow-md hover:shadow-lg p-6 min-h-[140px] flex items-center justify-center text-center transition"
                  >
                    <div>
                      <div className="text-xs text-amber-700 mb-2 font-bold tracking-wide uppercase">
                        {flippedCards[i] ? "Answer" : "Question"}
                      </div>
                      <div className="text-sm text-gray-700">
                        {flippedCards[i] ? card.back : card.front}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quiz */}
        {activeTab === "quiz" && (
          <div className="flex-1 overflow-y-auto p-8 bg-white/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">🧠 Quiz</h2>
                {quizSeed > 0 && (
                  <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                    Set #{quizSeed + 1}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {allAnswered && (
                  <div className="bg-amber-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
                    Score: {getScore()} / {quiz.length}
                  </div>
                )}
                <button
                  onClick={handleRegenerateQuiz}
                  disabled={quizRegenerating || featureLoading}
                  className="flex items-center gap-2 bg-white/90 hover:bg-amber-50 border border-gray-200 hover:border-amber-400 text-gray-700 hover:text-amber-800 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-40"
                >
                  <span className={quizRegenerating ? "animate-spin inline-block" : ""}>🔄</span>
                  {quizRegenerating ? "Generating..." : "New Quiz"}
                </button>
              </div>
            </div>

            {featureLoading || quizRegenerating ? (
              <div className="bg-white/90 border border-gray-200 rounded-2xl p-6 text-gray-500 animate-pulse shadow">
                {quizRegenerating ? "Generating new questions..." : "Generating quiz..."}
              </div>
            ) : (
              <div className="space-y-6">
                {quiz.map((q, qi) => (
                  <div key={qi} className="bg-white/95 border border-gray-200 rounded-2xl p-6 shadow-md">
                    <p className="text-base font-bold text-gray-900 mb-4">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const selected = selectedAnswers[qi];
                        const isCorrect = opt[0] === q.answer;
                        const isSelected = selected === opt[0];
                        let cls = "border-gray-300 text-gray-700 font-medium hover:border-amber-500 hover:bg-amber-50 hover:text-amber-800 cursor-pointer";
                        if (selected !== undefined) {
                          if (isCorrect) cls = "border-green-500 bg-green-100 text-green-800 font-semibold cursor-default";
                          else if (isSelected) cls = "border-red-500 bg-red-100 text-red-800 font-semibold cursor-default";
                          else cls = "border-gray-200 text-gray-400 cursor-default";
                        }
                        return (
                          <button
                            key={oi}
                            onClick={() => selectAnswer(qi, opt)}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition bg-white ${cls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {allAnswered && (
                  <div className="bg-white/90 border border-amber-200 rounded-2xl p-5 text-center shadow-md">
                    <p className="text-gray-700 text-sm font-medium mb-3">
                      {getScore() === quiz.length
                        ? "🎉 Perfect score! Well done!"
                        : getScore() >= quiz.length / 2
                        ? "👍 Good job! Try another set to improve."
                        : "📖 Keep studying! Try a new quiz set."}
                    </p>
                    <button
                      onClick={handleRegenerateQuiz}
                      disabled={quizRegenerating}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-md disabled:opacity-40"
                    >
                      🔄 Try Another Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Key Terms */}
        {activeTab === "keyterms" && (
          <div className="flex-1 overflow-y-auto p-8 bg-white/30">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🔑 Key Terms</h2>
            {featureLoading ? (
              <div className="bg-white/90 border border-gray-200 rounded-2xl p-6 text-gray-500 animate-pulse shadow">
                Extracting key terms...
              </div>
            ) : (
              <div className="space-y-3">
                {keyterms.map((item, i) => (
                  <div key={i} className="bg-white/90 border border-gray-200 rounded-2xl px-5 py-4 shadow-md">
                    <span className="text-amber-700 font-bold text-sm">{item.term}</span>
                    <p className="text-gray-600 text-sm mt-1">{item.definition}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
