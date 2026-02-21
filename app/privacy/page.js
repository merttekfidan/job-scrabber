export const metadata = {
    title: 'Privacy Policy — Job Scrabber',
    description: 'How Job Scrabber handles your data',
};

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-gray-950 text-gray-300 py-16 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: February 22, 2025</p>

                <div className="space-y-8 leading-relaxed text-sm">
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">What We Collect</h2>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>Email address (for authentication only)</li>
                            <li>Job application data you save through the extension (job title, company, description)</li>
                            <li>CV/resume text you upload for AI analysis</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">How We Use Your Data</h2>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>To display your saved job applications on the dashboard</li>
                            <li>To generate AI-powered coaching and analysis through the Groq API</li>
                            <li>To compute analytics about your job search progress</li>
                        </ul>
                        <p className="mt-2">We do <strong className="text-white">NOT</strong> sell, share, or monetize your data.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">Data Storage</h2>
                        <p>Your data is stored in a PostgreSQL database hosted on Railway (EU/US). All connections are encrypted via TLS. Passwords are not stored — we use passwordless OTP authentication.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">Third-Party Services</h2>
                        <ul className="list-disc ml-6 space-y-1">
                            <li><strong className="text-white">Groq API</strong> — processes AI prompts (job descriptions + CV text are sent for analysis)</li>
                            <li><strong className="text-white">Resend</strong> — sends OTP login emails</li>
                            <li><strong className="text-white">Railway</strong> — hosts the application and database</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">Chrome Extension</h2>
                        <p>The extension reads job posting content from the active tab <strong className="text-white">only when you click &quot;Save Job&quot;</strong>. It does not track browsing history, run in the background, or access any data from other tabs.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">Your Rights (GDPR)</h2>
                        <ul className="list-disc ml-6 space-y-1">
                            <li><strong className="text-white">Access</strong> — request a copy of your data</li>
                            <li><strong className="text-white">Deletion</strong> — request complete deletion of your account and data</li>
                            <li><strong className="text-white">Export</strong> — download your applications as CSV from the dashboard</li>
                        </ul>
                        <p className="mt-2">Contact <strong className="text-white">merttekfidan@gmail.com</strong> for any data requests.</p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-2">Data Retention</h2>
                        <p>Your data is retained as long as your account is active. You can delete individual applications or your entire account at any time.</p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 text-xs text-gray-600">
                    <p>Job Scrabber is a personal project by Mert Tekfidan.</p>
                </div>
            </div>
        </main>
    );
}
