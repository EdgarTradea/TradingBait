import { Header } from "components/Header";
import { Sidebar } from "components/Sidebar";
import { useStore } from "utils/store";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  const { isSidebarCollapsed } = useStore();

  return (
    <div
      className={`flex min-h-screen w-full flex-col bg-gradient-to-b from-gray-950 via-slate-900 to-gray-950 text-white ${
        isSidebarCollapsed ? "lg:pl-14" : "lg:pl-64"
      }`}
    >
      <Sidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-8 pb-20 sm:pb-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Privacy Policy</h1>
              <p className="text-xl text-gray-400">
                Last updated: June 28, 2025
              </p>
            </div>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="prose prose-slate dark:prose-invert max-w-none p-8">
                <h2 className="text-white">1. Introduction</h2>
                <p className="text-gray-300">
                  TradingBait ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading analytics and journaling platform. This policy applies to our analytics and productivity platform that helps traders track their performance and develop better trading habits.
                </p>

                <h2 className="text-white">2. Information We Collect</h2>
                
                <h3 className="text-white">2.1 Personal Information</h3>
                <p className="text-gray-300">We collect information that identifies you personally, including:</p>
                <ul>
                  <li className="text-gray-300">Name and email address (for account creation and communication)</li>
                  <li className="text-gray-300">Profile information and preferences</li>
                  <li className="text-gray-300">Payment information (processed securely through Stripe)</li>
                  <li className="text-gray-300">Communication preferences and marketing consent</li>
                </ul>

                <h3 className="text-white">2.2 Trading Data and Analytics</h3>
                <p className="text-gray-300">To provide our analytics and journaling services, we collect:</p>
                <ul>
                  <li className="text-gray-300">Trading performance data imported from MetaTrader, cTrader, or manually entered</li>
                  <li className="text-gray-300">Journal entries, notes, and reflections you create</li>
                  <li className="text-gray-300">Habit tracking data and behavioral patterns</li>
                  <li className="text-gray-300">Platform usage analytics and feature interactions</li>
                  <li className="text-gray-300">AI interaction data to improve our coaching insights</li>
                </ul>

                <h3 className="text-white">2.3 Technical Information</h3>
                <p className="text-gray-300">We automatically collect technical data including:</p>
                <ul>
                  <li className="text-gray-300">Browser type, operating system, and device information</li>
                  <li className="text-gray-300">IP address and general location data</li>
                  <li className="text-gray-300">Usage patterns, feature engagement, and session data</li>
                  <li className="text-gray-300">Performance metrics and error reports</li>
                </ul>

                <h2 className="text-white">3. How We Use Your Information</h2>
                
                <h3 className="text-white">3.1 Service Provision</h3>
                <ul>
                  <li className="text-gray-300">Provide trading analytics and performance insights</li>
                  <li className="text-gray-300">Generate AI-powered coaching recommendations</li>
                  <li className="text-gray-300">Enable journal functionality and habit tracking</li>
                  <li className="text-gray-300">Process payments and manage subscriptions</li>
                </ul>

                <h3 className="text-white">3.2 Platform Improvement</h3>
                <ul>
                  <li className="text-gray-300">Analyze usage patterns to improve our algorithms</li>
                  <li className="text-gray-300">Develop new features based on user behavior</li>
                  <li className="text-gray-300">Enhance AI coaching capabilities through anonymized data analysis</li>
                  <li className="text-gray-300">Conduct research on trading behavior patterns (using anonymized data)</li>
                </ul>

                <h3 className="text-white">3.3 Communication</h3>
                <ul>
                  <li className="text-gray-300">Send service-related notifications and updates</li>
                  <li className="text-gray-300">Provide customer support and respond to inquiries</li>
                  <li className="text-gray-300">Share educational content and platform improvements (with consent)</li>
                </ul>

                <h2 className="text-white">4. Legal Basis for Processing (EU Users)</h2>
                <p className="text-gray-300">Under GDPR, we process your data based on:</p>
                <ul>
                  <li className="text-gray-300"><strong>Contract performance:</strong> Processing necessary to provide our analytics services</li>
                  <li className="text-gray-300"><strong>Legitimate interests:</strong> Platform improvement, fraud prevention, and research</li>
                  <li className="text-gray-300"><strong>Consent:</strong> Marketing communications and optional features</li>
                  <li className="text-gray-300"><strong>Legal obligation:</strong> Compliance with financial and tax regulations</li>
                </ul>

                <h2 className="text-white">5. Data Sharing and Third Parties</h2>
                
                <h3 className="text-white">5.1 Service Providers</h3>
                <p className="text-gray-300">We share data with trusted third-party providers:</p>
                <ul>
                  <li className="text-gray-300"><strong>Firebase/Google Cloud:</strong> Database hosting and authentication</li>
                  <li className="text-gray-300"><strong>Stripe:</strong> Payment processing and subscription management</li>
                  <li className="text-gray-300"><strong>OpenAI:</strong> AI-powered insights and coaching features</li>
                  <li className="text-gray-300"><strong>Analytics providers:</strong> Platform usage analysis (anonymized)</li>
                </ul>

                <h3 className="text-white">5.2 Data Transfers</h3>
                <p className="text-gray-300">
                  Your data may be transferred to and processed in countries outside your region. We ensure appropriate safeguards are in place for international transfers, including Standard Contractual Clauses and adequacy decisions.
                </p>

                <h3 className="text-white">5.3 Legal Requirements</h3>
                <p className="text-gray-300">
                  We may disclose your information if required by law, court order, or to protect our rights and the safety of our users.
                </p>

                <h2 className="text-white">6. Your Rights (GDPR)</h2>
                <p className="text-gray-300">If you're in the EU, you have the following rights:</p>
                <ul>
                  <li className="text-gray-300"><strong>Access:</strong> Request a copy of your personal data</li>
                  <li className="text-gray-300"><strong>Rectification:</strong> Correct inaccurate personal data</li>
                  <li className="text-gray-300"><strong>Erasure:</strong> Request deletion of your personal data</li>
                  <li className="text-gray-300"><strong>Portability:</strong> Receive your data in a structured format</li>
                  <li className="text-gray-300"><strong>Restriction:</strong> Limit how we process your data</li>
                  <li className="text-gray-300"><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                  <li className="text-gray-300"><strong>Withdraw consent:</strong> For consent-based processing</li>
                </ul>
                <p className="text-gray-300">
                  To exercise these rights, visit your Settings page or contact us at support@tradingbait.com
                </p>

                <h2 className="text-white">7. Data Retention</h2>
                
                <h3 className="text-white">7.1 Personal Data</h3>
                <p className="text-gray-300">
                  We retain personal information for as long as necessary to provide our services, comply with legal obligations, and resolve disputes. Personal data is deleted upon account closure request.
                </p>

                <h3 className="text-white">7.2 Analytics and Research Data</h3>
                <p className="text-gray-300">
                  Trading analytics, journal insights, and behavioral patterns may be retained in anonymized form for research and platform improvement purposes. This anonymized data cannot be traced back to individual users.
                </p>

                <h2 className="text-white">8. Data Security</h2>
                <p className="text-gray-300">
                  We implement industry-standard security measures including:
                </p>
                <ul>
                  <li className="text-gray-300">Encryption in transit and at rest</li>
                  <li className="text-gray-300">Regular security audits and monitoring</li>
                  <li className="text-gray-300">Access controls and authentication requirements</li>
                  <li className="text-gray-300">Secure cloud infrastructure with Google Cloud/Firebase</li>
                </ul>

                <h2 className="text-white">9. Cookies and Tracking</h2>
                <p className="text-gray-300">
                  We use cookies and similar technologies for:
                </p>
                <ul>
                  <li className="text-gray-300"><strong>Essential cookies:</strong> Platform functionality and security</li>
                  <li className="text-gray-300"><strong>Analytics cookies:</strong> Usage patterns and performance monitoring</li>
                  <li className="text-gray-300"><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="text-gray-300">
                  You can manage cookie preferences through our cookie banner and browser settings.
                </p>

                <h2 className="text-white">10. Children's Privacy</h2>
                <p className="text-gray-300">
                  Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware of such data, we will delete it promptly.
                </p>

                <h2 className="text-white">11. Changes to This Policy</h2>
                <p className="text-gray-300">
                  We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Your continued use of the service constitutes acceptance of the updated policy.
                </p>

                <h2 className="text-white">12. Contact Information</h2>
                <p className="text-gray-300">
                  For privacy-related questions or to exercise your rights, contact us at:
                </p>
                <ul>
                  <li className="text-gray-300">Email: support@tradingbait.com</li>
                  <li className="text-gray-300">Data Protection Officer: support@tradingbait.com</li>
                </ul>
                
                <p className="text-gray-300">
                  For EU residents, you also have the right to lodge a complaint with your local data protection authority.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

