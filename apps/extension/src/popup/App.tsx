import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmailIntent } from '../types';

const API_URL = 'http://localhost:3000/api/generate';

export default function App() {
    const { t } = useTranslation();
    const [intent, setIntent] = useState<EmailIntent>({
        goal: '',
        mainMessage: '',
        recipientContext: '',
        tone: 'professional',
        constraints: ''
    });
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(intent),
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

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold">{t('app.title')}</h1>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('form.goal.label')}</label>
                    <select
                        className="w-full p-2 border rounded text-sm"
                        value={intent.goal}
                        onChange={(e) => setIntent({ ...intent, goal: e.target.value })}
                    >
                        <option value="">{t('form.goal.placeholder')}</option>
                        <option value="request">{t('form.goal.options.request')}</option>
                        <option value="inform">{t('form.goal.options.inform')}</option>
                        <option value="clarify">{t('form.goal.options.clarify')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('form.mainMessage.label')}</label>
                    <textarea
                        className="w-full p-2 border rounded text-sm h-20"
                        value={intent.mainMessage}
                        onChange={(e) => setIntent({ ...intent, mainMessage: e.target.value })}
                        placeholder={t('form.mainMessage.placeholder')}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">{t('form.recipient.label')}</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded text-sm"
                        value={intent.recipientContext}
                        onChange={(e) => setIntent({ ...intent, recipientContext: e.target.value })}
                        placeholder={t('form.recipient.placeholder')}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                >
                    {isLoading ? t('actions.generating') : t('actions.generate')}
                </button>

                {generatedEmail && (
                    <>
                        <div className="p-3 border rounded bg-gray-50 text-sm max-h-40 overflow-y-auto">
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
