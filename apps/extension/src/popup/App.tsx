import { useState } from "react";
import { useTranslation } from "react-i18next";
import { availableLanguages, languageNames } from "../i18n";
import type { EmailIntent } from "../types";

const API_URL = "http://localhost:3000/api/generate";

const GOAL_KEYS = [
  "inform",
  "request",
  "clarify",
  "feedback",
  "propose",
  "apologize",
] as const;

// Helper functions for dynamic labels
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
      insertToGmail(data.email);
    } catch (error) {
      console.error("Failed to generate email:", error);
      setDrafts((prev) => [...prev, t("actions.errorMessage")]);
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
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold mb-1">{t("app.title")}</h2>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableLanguages.map((code) => (
                  <option key={code} value={code}>
                    {code.toUpperCase()} - {languageNames[code] ?? code}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              {t("app.subtitle")}
            </p>
          </div>

          {/* Communicative Goal */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-gray-700">
                {t("form.goal.label")}
              </h3>
              <span className="text-xs text-blue-600">{t("form.mandatory")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOAL_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setIntent({ ...intent, goal: t(`form.goal.options.${key}`) })}
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
              <span className="text-xs text-blue-600">{t("form.mandatory")}</span>
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
              <span className="text-xs text-blue-600">{t("form.mandatory")}</span>
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

      {/* Footer - Generate Button + Draft Tabs */}
      <div className="border-t p-4 space-y-3">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !isFormValid}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {isLoading ? t("actions.generating") : t("actions.generate")}
        </button>

        {drafts.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">
              {t("actions.draftHint")}
            </p>
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
                 {t("actions.draftLabel", { number: i + 1 })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
