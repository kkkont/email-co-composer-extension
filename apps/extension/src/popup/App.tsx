import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Trash2 } from "lucide-react";
import { availableLanguages, languageNames } from "../i18n";
import type { EmailIntent, Draft } from "../types";
import DraftsPage from "./DraftsPage";

const API_URL = "http://localhost:3000/api/generate";

const GOAL_KEYS = [
  "inform",
  "request",
  "clarify",
  "feedback",
  "propose",
  "apologize",
] as const;

const getToneLabelKey = (value: number): string => {
  if (value < 0.2) return "form.tone.values.veryCasual";
  if (value < 0.4) return "form.tone.values.casual";
  if (value < 0.6) return "form.tone.values.neutral";
  if (value < 0.8) return "form.tone.values.formal";
  return "form.tone.values.veryFormal";
};

const getLengthLabelKey = (value: number): string => {
  if (value < 0.2) return "form.length.values.veryBrief";
  if (value < 0.4) return "form.length.values.brief";
  if (value < 0.6) return "form.length.values.balanced";
  if (value < 0.8) return "form.length.values.detailed";
  return "form.length.values.veryDetailed";
};

export default function App() {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState<"composer" | "drafts">(
    "composer",
  );
  const [intent, setIntent] = useState<EmailIntent>({
    goal: "",
    mainMessage: "",
    recipientContext: "",
    tone: 0.5,
    length: 0.5,
    urgency: false,
    extraNotes: "",
  });
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Generate from composer (fresh session) ──────────────────────────────
  const handleGenerate = async () => {
    if (!intent.goal || !intent.mainMessage || !intent.recipientContext) return;
    setIsLoading(true);

    // Each click of Generate starts a brand-new session
    const sessionId = `session-${Date.now()}`;

    try {
      const payload = {
        ...intent,
        tone: Math.round(intent.tone * 100) / 100,
        language: i18n.language,
      };
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      const newDraft: Draft = {
        id: `draft-${Date.now()}`,
        sessionId,
        intent,
        content: data.email,
        timestamp: new Date(),
      };

      setDrafts((prev) => [...prev, newDraft]);
      insertToGmail(data.email); // auto-insert on fresh generation
      setCurrentPage("drafts"); // jump to drafts page so user sees the result
    } catch (error) {
      console.error("Failed to generate email:", error);
      const errorDraft: Draft = {
        id: `draft-${Date.now()}`,
        sessionId,
        intent,
        content: t("actions.errorMessage"),
        timestamp: new Date(),
      };
      setDrafts((prev) => [...prev, errorDraft]);
      setCurrentPage("drafts");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Refine an existing draft (stays in same session) ────────────────────
  const handleRefineDraft = async (
    fromDraft: Draft,
    refinedIntent: EmailIntent,
  ) => {
    setIsLoading(true);
    try {
      const payload = {
        ...refinedIntent,
        tone: Math.round(refinedIntent.tone * 100) / 100,
        language: i18n.language,
      };
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      const newDraft: Draft = {
        id: `draft-${Date.now()}`,
        sessionId: fromDraft.sessionId, // same session = nested under same group
        intent: refinedIntent,
        content: data.email,
        timestamp: new Date(),
        parentId: fromDraft.id,
      };

      setDrafts((prev) => [...prev, newDraft]);
      insertToGmail(data.email); // auto-insert refined draft too
    } catch (error) {
      console.error("Failed to refine draft:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const insertToGmail = (email: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      try {
        await chrome.tabs.sendMessage(tabId, { action: "insertEmail", email });
      } catch {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"],
        });
        setTimeout(() => {
          chrome.tabs.sendMessage(tabId, { action: "insertEmail", email });
        }, 100);
      }
    });
  };

  const clearGmailCompose = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;
      try {
        await chrome.tabs.sendMessage(tabId, { action: "clearEmail" });
      } catch {
        // content script not loaded, nothing to clear
      }
    });
  };

  const isFormValid =
    intent.goal && intent.mainMessage && intent.recipientContext;

  const handleDeleteDraft = (id: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.id !== id));
  };

  return (
    <div className="flex flex-col bg-white h-screen">
      {/* Page Navigation */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => setCurrentPage("composer")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            currentPage === "composer"
              ? "text-blue-600 border-b-2 border-blue-600 bg-white"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {t("page.composer")}
        </button>
        <button
          onClick={() => setCurrentPage("drafts")}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            currentPage === "drafts"
              ? "text-blue-600 border-b-2 border-blue-600 bg-white"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {t("page.drafts")}
          {drafts.length > 0 && (
            <span className="absolute top-1 right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {drafts.length}
            </span>
          )}
        </button>
      </div>

      {/* Page Content */}
      {currentPage === "drafts" ? (
        <DraftsPage
          drafts={drafts}
          onDeleteDraft={handleDeleteDraft}
          onInsertDraft={insertToGmail}
          onRefineDraft={handleRefineDraft}
          isLoading={isLoading}
        />
      ) : (
        <>
          {/* Composer Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">
                    <Mail
                      className="inline w-10 h-10 mr-1 text-blue-600"
                      strokeWidth={1.5}
                    />{" "}
                    {t("app.title")}
                  </h2>
                  <select
                    value={i18n.language}
                    onChange={(e) => {
                      i18n.changeLanguage(e.target.value);
                      setIntent({
                        goal: "",
                        mainMessage: "",
                        recipientContext: "",
                        tone: 0.5,
                        length: 0.5,
                        urgency: false,
                        extraNotes: "",
                      });
                      clearGmailCompose();
                    }}
                    className="text-xs border rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableLanguages.map((code) => (
                      <option key={code} value={code}>
                        {code.toUpperCase()} - {languageNames[code] ?? code}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-600 mb-6">
                  {t("app.subtitle")}
                </p>
              </div>

              {/* Communicative Goal */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold text-gray-700">
                    {t("form.goal.label")}
                  </h3>
                  <span className="text-xs text-blue-600">
                    {t("form.mandatory")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GOAL_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() =>
                        setIntent({
                          ...intent,
                          goal: t(`form.goal.options.${key}`),
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        intent.goal === t(`form.goal.options.${key}`)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {t(`form.goal.options.${key}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Message */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xs font-semibold text-gray-700">
                    {t("form.mainMessage.label")}
                  </h3>
                  <span className="text-xs text-blue-600">
                    {t("form.mandatory")}
                  </span>
                </div>
                <textarea
                  className="w-full p-3 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={intent.mainMessage}
                  onChange={(e) =>
                    setIntent({ ...intent, mainMessage: e.target.value })
                  }
                  placeholder={t("form.mainMessage.placeholder")}
                />
              </div>

              {/* Recipient Context */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xs font-semibold text-gray-700">
                    {t("form.recipient.label")}
                  </h3>
                  <span className="text-xs text-blue-600">
                    {t("form.mandatory")}
                  </span>
                </div>
                <input
                  type="text"
                  className="w-full p-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={intent.recipientContext}
                  onChange={(e) =>
                    setIntent({ ...intent, recipientContext: e.target.value })
                  }
                  placeholder={t("form.recipient.placeholder")}
                />
              </div>

              {/* Advanced Controls */}
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
                    {t("form.advanced.toggle")}
                  </h3>
                </button>

                {showAdvanced && (
                  <div className="space-y-4 pl-2 border-l-2 border-blue-200">
                    {/* Tone */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-semibold text-gray-700">
                          {t("form.tone.label")}
                        </h3>
                        <span className="text-xs text-blue-600">
                          {t(getToneLabelKey(intent.tone))}
                        </span>
                      </div>
                      <div className="px-1">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
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
                          <span>{t("form.tone.casual")}</span>
                          <span>{t("form.tone.formal")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Length */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-700">
                          {t("form.length.label")}
                        </span>
                        <span className="text-xs text-blue-600">
                          {t(getLengthLabelKey(intent.length))}
                        </span>
                      </div>
                      <div className="px-1">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
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
                          <span>{t("form.length.brief")}</span>
                          <span>{t("form.length.detailed")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Urgency Toggle */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-medium text-gray-700">
                        {t("form.urgency.label")}
                      </span>
                      <span className="text-xs text-gray-600 mr-2">
                        {t("form.urgency.description")}
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
                        {t("form.extraNotes.label")}
                      </h3>
                      <textarea
                        className="w-full p-3 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        value={intent.extraNotes}
                        onChange={(e) =>
                          setIntent({ ...intent, extraNotes: e.target.value })
                        }
                        placeholder={t("form.extraNotes.placeholder")}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer — just the generate button, no draft chips */}
          <div className="border-t p-4">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !isFormValid}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? t("actions.generating") : t("actions.generate")}
            </button>
            {drafts.length > 0 && (
              <button
                onClick={() => {
                  setDrafts([]);
                  clearGmailCompose();
                }}
                className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("actions.clearAll")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
