import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmailIntent } from '../types';

const API_URL = 'http://localhost:3000/api/generate';

const TONE_LABELS = ['Casual', 'Friendly', 'Neutral', 'Professional', 'Formal'];

export default function App() {
    const { t } = useTranslation();
    const [intent, setIntent] = useState<EmailIntent>({
        goal: '',
        mainMessage: '',
        recipientContext: '',
        tone: 2,
        length: 'medium',
        urgency: 'medium',
        extraNotes: ''
    });
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleGenerate = async () => {
        if (!intent.goal || !intent.mainMessage || !intent.recipientContext) return;
        setIsLoading(true);
        try {
            const payload = {
                ...intent,
                tone: TONE_LABELS[intent.tone],
            };
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Generation failed');
            setGeneratedEmail(data.email);
        } catch (error) {
            console.error('Failed to generate email:', error);
            setGeneratedEmail('Error generating email. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInsertToGmail = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tabId = tabs[0]?.id;
            if (!tabId) return;

            try {
                await chrome.tabs.sendMessage(tabId, {
                    action: 'insertEmail',
                    email: generatedEmail
                });
            } catch {
                await chrome.scripting.executeScript({
                    target: { tabId },
                    files: ['content.js']
                });
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, {
                        action: 'insertEmail',
                        email: generatedEmail
                    });
                }, 100);
            }
        });
    };

    const isFormValid = intent.goal && intent.mainMessage && intent.recipientContext;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold">{t('app.title')}</h1>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('form.goal.label')} <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="w-full p-2 border rounded text-sm"
                        value={intent.goal}
                        onChange={(e) => setIntent({ ...intent, goal: e.target.value })}
                    >
                        <option value="">{t('form.goal.placeholder')}</option>
                        <option value="inform">{t('form.goal.options.inform')}</option>
                        <option value="request">{t('form.goal.options.request')}</option>
                        <option value="clarify">{t('form.goal.options.clarify')}</option>
                        <option value="feedback">{t('form.goal.options.feedback')}</option>
                        <option value="propose">{t('form.goal.options.propose')}</option>
                        <option value="apologize">{t('form.goal.options.apologize')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('form.mainMessage.label')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        className="w-full p-2 border rounded text-sm h-20"
                        value={intent.mainMessage}
                        onChange={(e) => setIntent({ ...intent, mainMessage: e.target.value })}
                        placeholder={t('form.mainMessage.placeholder')}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        {t('form.recipient.label')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded text-sm"
                        value={intent.recipientContext}
                        onChange={(e) => setIntent({ ...intent, recipientContext: e.target.value })}
                        placeholder={t('form.recipient.placeholder')}
                    />
                </div>

                {/* Advanced Controls Toggle */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                    <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
                    {t('form.advanced.toggle')}
                </button>

                {showAdvanced && (
                    <div className="space-y-3 pl-2 border-l-2 border-blue-200">
                        {/* Tone Slider */}
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('form.tone.label')}</label>
                            <input
                                type="range"
                                min={0}
                                max={4}
                                step={1}
                                value={intent.tone}
                                onChange={(e) => setIntent({ ...intent, tone: Number(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{t('form.tone.options.casual')}</span>
                                <span>{t('form.tone.options.neutral')}</span>
                                <span>{t('form.tone.options.formal')}</span>
                            </div>
                        </div>

                        {/* Length */}
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('form.length.label')}</label>
                            <select
                                className="w-full p-2 border rounded text-sm"
                                value={intent.length}
                                onChange={(e) => setIntent({ ...intent, length: e.target.value })}
                            >
                                <option value="short">{t('form.length.options.short')}</option>
                                <option value="medium">{t('form.length.options.medium')}</option>
                                <option value="long">{t('form.length.options.long')}</option>
                            </select>
                        </div>

                        {/* Urgency */}
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('form.urgency.label')}</label>
                            <select
                                className="w-full p-2 border rounded text-sm"
                                value={intent.urgency}
                                onChange={(e) => setIntent({ ...intent, urgency: e.target.value })}
                            >
                                <option value="low">{t('form.urgency.options.low')}</option>
                                <option value="medium">{t('form.urgency.options.medium')}</option>
                                <option value="high">{t('form.urgency.options.high')}</option>
                            </select>
                        </div>

                        {/* Extra Notes */}
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('form.extraNotes.label')}</label>
                            <textarea
                                className="w-full p-2 border rounded text-sm h-16"
                                value={intent.extraNotes}
                                onChange={(e) => setIntent({ ...intent, extraNotes: e.target.value })}
                                placeholder={t('form.extraNotes.placeholder')}
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !isFormValid}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                >
                    {isLoading ? t('actions.generating') : t('actions.generate')}
                </button>

                {generatedEmail && (
                    <>
                        <div className="p-3 border rounded bg-gray-50 text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {generatedEmail}
                        </div>
                        <button
                            onClick={handleInsertToGmail}
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                        >
                            {t('actions.insertToGmail')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
