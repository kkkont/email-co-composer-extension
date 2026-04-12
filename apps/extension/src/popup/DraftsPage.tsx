import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Copy, RefreshCw, ChevronRight, Mail } from "lucide-react";
import type { Draft, EmailIntent } from "../types";

interface DraftsPageProps {
  drafts: Draft[];
  onDeleteDraft: (id: string) => void;
  onInsertDraft: (content: string) => void;
  onRefineDraft: (fromDraft: Draft, refinedIntent: EmailIntent) => void;
  isLoading?: boolean;
}

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

export default function DraftsPage({
  drafts,
  onDeleteDraft,
  onInsertDraft,
  onRefineDraft,
  isLoading = false,
}: DraftsPageProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>(
    drafts[drafts.length - 1]?.id ?? "",
  );
  const [workingIntent, setWorkingIntent] = useState<EmailIntent | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sessions = useMemo(() => {
    const map = new Map<string, Draft[]>();
    for (const draft of drafts) {
      const group = map.get(draft.sessionId) ?? [];
      group.push(draft);
      map.set(draft.sessionId, group);
    }
    return Array.from(map.entries());
  }, [drafts]);

  const selectedDraft =
    drafts.find((d) => d.id === selectedId) ?? drafts[drafts.length - 1];
  const displayIntent = workingIntent ?? selectedDraft?.intent;
  const intentChanged =
    workingIntent !== null &&
    JSON.stringify(workingIntent) !== JSON.stringify(selectedDraft?.intent);

  const selectDraft = (draft: Draft) => {
    setSelectedId(draft.id);
    setWorkingIntent(null);
    onInsertDraft(draft.content);
  };

  const handleRefineAndRegenerate = () => {
    if (!selectedDraft || !displayIntent) return;
    onRefineDraft(selectedDraft, workingIntent ?? selectedDraft.intent);
    setWorkingIntent(null);
  };

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400">
        <Mail className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">{t("drafts.empty")}</p>
        <p className="text-xs mt-1">{t("drafts.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Timeline */}
      <div className="shrink-0 border-b bg-gray-50 overflow-y-auto max-h-44 px-3 pt-3 pb-2 space-y-3">
        {sessions.map(([sessionId, sessionDrafts], sessionIndex) => (
          <div key={sessionId}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              {t("drafts.session", { number: sessionIndex + 1 })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sessionDrafts.map((draft, draftIndex) => {
                const isSelected = draft.id === selectedId;
                const isRefinement = draftIndex > 0;
                return (
                  <div key={draft.id} className="flex items-center gap-1">
                    {isRefinement && (
                      <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                    )}
                    <button
                      onClick={() => selectDraft(draft)}
                      className={`flex flex-col items-start px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      <span className="font-semibold leading-none">
                        {isRefinement
                          ? t("drafts.refinementLabel", { number: draftIndex })
                          : t("drafts.rootLabel")}
                      </span>
                      <span
                        className={`text-[10px] mt-0.5 ${isSelected ? "text-blue-100" : "text-gray-400"}`}
                      >
                        {new Date(draft.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Workspace */}
      {selectedDraft && displayIntent && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-5">
            {/* Email preview (read-only) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold text-gray-700">
                  {t("drafts.generatedContent")}
                </h3>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(selectedDraft.content)
                    }
                    className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                    title={t("drafts.copy")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteDraft(selectedDraft.id)}
                    className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title={t("drafts.delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="w-full p-3 border rounded-lg text-sm bg-white leading-relaxed text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedDraft.content}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 font-medium shrink-0">
                {t("drafts.refineSection")}
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Goal */}
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">
                {t("form.goal.label")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {GOAL_KEYS.map((key) => {
                  const label = t(`form.goal.options.${key}`);
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setWorkingIntent({
                          ...(workingIntent ?? selectedDraft.intent),
                          goal: label,
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        displayIntent.goal === label
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Message */}
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-1">
                {t("form.mainMessage.label")}
              </h3>
              <textarea
                className="w-full p-3 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={displayIntent.mainMessage}
                onChange={(e) =>
                  setWorkingIntent({
                    ...(workingIntent ?? selectedDraft.intent),
                    mainMessage: e.target.value,
                  })
                }
                placeholder={t("form.mainMessage.placeholder")}
              />
            </div>

            {/* Recipient */}
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-1">
                {t("form.recipient.label")}
              </h3>
              <input
                type="text"
                className="w-full p-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={displayIntent.recipientContext}
                onChange={(e) =>
                  setWorkingIntent({
                    ...(workingIntent ?? selectedDraft.intent),
                    recipientContext: e.target.value,
                  })
                }
                placeholder={t("form.recipient.placeholder")}
              />
            </div>

            {/* Advanced */}
            <div className="border-t pt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full text-left flex items-center gap-2 mb-3"
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
                        {t(getToneLabelKey(displayIntent.tone))}
                      </span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={displayIntent.tone}
                        onChange={(e) =>
                          setWorkingIntent({
                            ...(workingIntent ?? selectedDraft.intent),
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
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-semibold text-gray-700">
                        {t("form.length.label")}
                      </h3>
                      <span className="text-xs text-blue-600">
                        {t(getLengthLabelKey(displayIntent.length))}
                      </span>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={displayIntent.length}
                        onChange={(e) =>
                          setWorkingIntent({
                            ...(workingIntent ?? selectedDraft.intent),
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
                  {/* Urgency */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">
                      {t("form.urgency.label")}
                    </span>
                    <button
                      onClick={() =>
                        setWorkingIntent({
                          ...(workingIntent ?? selectedDraft.intent),
                          urgency: !displayIntent.urgency,
                        })
                      }
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${displayIntent.urgency ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${displayIntent.urgency ? "translate-x-4" : "translate-x-0.5"}`}
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
                      value={displayIntent.extraNotes}
                      onChange={(e) =>
                        setWorkingIntent({
                          ...(workingIntent ?? selectedDraft.intent),
                          extraNotes: e.target.value,
                        })
                      }
                      placeholder={t("form.extraNotes.placeholder")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {selectedDraft && intentChanged && (
        <div className="border-t p-4 space-y-2 shrink-0">
          <button
            onClick={handleRefineAndRegenerate}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading
              ? t("actions.generating")
              : t("drafts.refineAndRegenerate")}
          </button>
          <button
            onClick={() => setWorkingIntent(null)}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700"
          >
            {t("drafts.resetChanges")}
          </button>
        </div>
      )}
    </div>
  );
}
