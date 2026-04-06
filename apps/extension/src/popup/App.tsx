import { useState } from "react";
import type { EmailIntent } from "../types";

const API_URL = "http://localhost:3000/api/generate";

const GOALS = [
  "Inform",
  "Request",
  "Clarify",
  "Feedback",
  "Propose",
  "Apologize",
];

// Helper functions for dynamic labels
const getToneLabel = (value: number): string => {
  if (value < 0.33) return "Casual";
  if (value < 0.66) return "Neutral";
  return "Formal";
};

const getLengthLabel = (value: number): string => {
  if (value < 0.33) return "Brief";
  if (value < 0.66) return "Balanced";
  return "Detailed";
};

export default function App() {
  const [intent, setIntent] = useState<EmailIntent>({
    goal: "",
    mainMessage: "",
    recipientContext: "",
    tone: 0.5,
    length: 0.5,
    urgency: false,
    extraNotes: "",
  });
  const [drafts, setDrafts] = useState<string[]>([]);
  const [activeDraftIndex, setActiveDraftIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"intent" | "draft">("intent");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = async () => {
    if (!intent.goal || !intent.mainMessage || !intent.recipientContext) return;
    setIsLoading(true);
    try {
      const payload = {
        ...intent,
        goal: intent.goal,
        tone: Math.round(intent.tone * 100) / 100,
      };
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");
      setDrafts((prev) => [...prev, data.email]);
      setActiveDraftIndex(drafts.length);
      setActiveTab("draft");
      insertToGmail(data.email);
    } catch (error) {
      console.error("Failed to generate email:", error);
      setDrafts((prev) => [...prev, "Error generating email. Is the backend running?"]);
      setActiveDraftIndex(drafts.length);
    } finally {
      setIsLoading(false);
    }
  };

  const insertToGmail = (email: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      try {
        await chrome.tabs.sendMessage(tabId, {
          action: "insertEmail",
          email,
        });
      } catch {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"],
        });
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, {
            action: "insertEmail",
            email,
          });
        }, 100);
      }
    });
  };

  const isFormValid =
    intent.goal && intent.mainMessage && intent.recipientContext;

  return (
    <div className="flex flex-col bg-white">
      {/* Tabs */}
      <div className="flex border-b">
        {(["intent", "draft"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "intent" && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Define Your Intent</h2>
              <p className="text-xs text-gray-600 mb-4">
                Guide the assistant to craft the perfect response based on your
                specific goals.
              </p>
            </div>

            {/* Communicative Goal */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold text-gray-700">
                  COMMUNICATIVE GOAL
                </h3>
                <span className="text-xs text-blue-600">MANDATORY</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setIntent({ ...intent, goal })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      intent.goal === goal
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Message */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-semibold text-gray-700">
                  MAIN MESSAGE
                </h3>
                <span className="text-xs text-blue-600">MANDATORY</span>
              </div>
              <textarea
                className="w-full p-3 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={intent.mainMessage}
                onChange={(e) =>
                  setIntent({ ...intent, mainMessage: e.target.value })
                }
                placeholder="What is the core takeaway for the recipient?"
              />
            </div>

            {/* Recipient Context */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-semibold text-gray-700">
                  RECIPIENT CONTEXT
                </h3>
                <span className="text-xs text-blue-600">MANDATORY</span>
              </div>
              <input
                type="text"
                className="w-full p-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={intent.recipientContext}
                onChange={(e) =>
                  setIntent({ ...intent, recipientContext: e.target.value })
                }
                placeholder="Full Name or Title"
              />
            </div>

            {/* Advanced Controls Dropdown */}
            <div className="border-t pt-4 mt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full text-left flex items-center gap-2 mb-4"
              >
                <span
                  className={`text-xs text-gray-500 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                <h3 className="text-xs font-semibold text-gray-700">
                  ADVANCED CONTROLS
                </h3>
              </button>

              {showAdvanced && (
                <div className="space-y-4 pl-2 border-l-2 border-blue-200">
                  {/* Tone */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-semibold text-gray-700">
                        TONE
                      </h3>
                      <span className="text-xs text-blue-600">
                        {getToneLabel(intent.tone)}
                      </span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={intent.tone}
                        onChange={(e) =>
                          setIntent({
                            ...intent,
                            tone: parseFloat(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Casual</span>
                        <span>Formal</span>
                      </div>
                    </div>
                  </div>

                  {/* Empathy Filter */}

                  {/* Length */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-700">
                        LENGTH
                      </span>
                      <span className="text-xs text-blue-600">
                        {getLengthLabel(intent.length)}
                      </span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={intent.length}
                        onChange={(e) =>
                          setIntent({
                            ...intent,
                            length: parseFloat(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Brief</span>
                        <span>Detailed</span>
                      </div>
                    </div>
                  </div>

                  {/* Urgency Toggle */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-medium text-gray-700">
                      URGENCY
                    </span>
                    <span className="text-xs text-gray-600 mr-2">
                      Mark as immediate action
                    </span>
                    <button
                      onClick={() =>
                        setIntent({ ...intent, urgency: !intent.urgency })
                      }
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                        intent.urgency ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          intent.urgency ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Extra Notes */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 mb-1">
                      EXTRA NOTES
                    </h3>
                    <textarea
                      className="w-full p-3 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      value={intent.extraNotes}
                      onChange={(e) =>
                        setIntent({ ...intent, extraNotes: e.target.value })
                      }
                      placeholder="Mention specific context or deadline..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "draft" && (
          <div className="p-4 flex flex-col h-full">
            {drafts.length > 0 ? (
              <div className="space-y-3">
                {/* Draft history tabs */}
                <div className="flex flex-wrap gap-2">
                  {drafts.map((draft, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveDraftIndex(i);
                        insertToGmail(draft);
                      }}
                      className={`px-3 py-2 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                        activeDraftIndex === i
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Draft {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  Generate a draft to see it here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Generate Button */}
      {activeTab === "intent" && (
        <div className="border-t p-4">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !isFormValid}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? "Generating..." : "Generate Draft"}
          </button>
        </div>
      )}
    </div>
  );
}
