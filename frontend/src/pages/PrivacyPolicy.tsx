import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Eye, Lock, Users, Database, Globe } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <Badge variant="secondary">
              Last updated: {new Date().toLocaleDateString()}
            </Badge>
          </div>
          <p className="text-lg text-gray-600">
            This policy describes how Infrasync collects, uses, and protects
            your information.
          </p>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Information We Collect
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Account Information
              </h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>GitHub username and profile information</li>
                <li>Email address (from GitHub)</li>
                <li>GitHub user ID and authentication tokens</li>
                <li>Organization membership information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Repository Data
              </h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Repository names, descriptions, and metadata</li>
                <li>Commit information (hash, message, author, timestamp)</li>
                <li>
                  Pull request data (title, description, status, reviewers)
                </li>
                <li>
                  Issue information (title, description, labels, assignees)
                </li>
                <li>Branch and release information</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Usage Data
              </h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Service usage patterns and preferences</li>
                <li>Notification delivery logs</li>
                <li>Error logs and performance metrics</li>
                <li>IP addresses and browser information</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. How We Use Your Information
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Service Provision:</strong> We use your information to
                  provide GitHub repository monitoring services, including
                  digest generation and notification delivery.
                </p>
                <p>
                  <strong>Account Management:</strong> To manage your account,
                  process payments, and provide customer support.
                </p>
                <p>
                  <strong>Service Improvement:</strong> To analyze usage
                  patterns and improve our service functionality and
                  performance.
                </p>
                <p>
                  <strong>Security:</strong> To detect and prevent fraud, abuse,
                  and security threats.
                </p>
                <p>
                  <strong>Communication:</strong> To send you service updates,
                  security alerts, and support messages.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Information Sharing
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>We do not sell your personal information.</strong> We
                  may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Service Providers:</strong> With third-party
                    services that help us operate our service (e.g., Stripe for
                    payments, email providers for notifications)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or
                    to protect our rights and safety
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with a
                    merger, acquisition, or sale of assets
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> When you explicitly
                    authorize us to share information
                  </li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Data Security
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Encryption:</strong> All data is encrypted in transit
                  using TLS 1.3 and at rest using AES-256 encryption.
                </p>
                <p>
                  <strong>Access Controls:</strong> We implement strict access
                  controls and authentication measures to protect your data.
                </p>
                <p>
                  <strong>Security Monitoring:</strong> We continuously monitor
                  our systems for security threats and vulnerabilities.
                </p>
                <p>
                  <strong>Data Minimization:</strong> We only collect and retain
                  the minimum amount of data necessary to provide our services.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data Retention
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Active Accounts:</strong> We retain your data for as
                  long as your account is active and you use our services.
                </p>
                <p>
                  <strong>Account Deletion:</strong> When you delete your
                  account, we will delete your personal data within 30 days,
                  except for data we must retain for legal or compliance
                  purposes.
                </p>
                <p>
                  <strong>Backup Data:</strong> Backup copies may be retained
                  for up to 90 days for disaster recovery purposes.
                </p>
                <p>
                  <strong>Audit Logs:</strong> We retain audit logs for up to 1
                  year for security and compliance purposes.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Your Rights and Choices
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Access and Portability:</strong> You can access and
                  download your data through our service dashboard.
                </p>
                <p>
                  <strong>Correction:</strong> You can update your account
                  information and preferences at any time.
                </p>
                <p>
                  <strong>Deletion:</strong> You can delete your account and
                  request deletion of your data.
                </p>
                <p>
                  <strong>Opt-out:</strong> You can opt out of non-essential
                  communications and data processing.
                </p>
                <p>
                  <strong>Data Export:</strong> You can request a copy of your
                  data in a machine-readable format.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Third-Party Services
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>GitHub:</strong> We integrate with GitHub's API to
                  access repository data. GitHub's privacy policy applies to
                  data collected by GitHub.
                </p>
                <p>
                  <strong>Payment Processors:</strong> We use Stripe for payment
                  processing. Stripe's privacy policy applies to payment
                  information.
                </p>
                <p>
                  <strong>Notification Services:</strong> We may use Slack,
                  Discord, and email providers to deliver notifications. These
                  services have their own privacy policies.
                </p>
                <p>
                  <strong>Analytics:</strong> We may use analytics services to
                  understand usage patterns. These services are configured to
                  respect your privacy preferences.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. International Data Transfers
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Data Location:</strong> Your data is primarily stored
                  in the United States. We may transfer data to other countries
                  where our service providers are located.
                </p>
                <p>
                  <strong>Adequacy Decisions:</strong> We ensure that
                  international data transfers comply with applicable data
                  protection laws and regulations.
                </p>
                <p>
                  <strong>EU Users:</strong> For users in the European Union, we
                  comply with GDPR requirements for international data
                  transfers.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Children's Privacy
              </h2>
              <p className="text-gray-700">
                Infrasync is not intended for use by children under 13 years of
                age. We do not knowingly collect personal information from
                children under 13. If you believe we have collected information
                from a child under 13, please contact us immediately.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Changes to This Policy
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this privacy policy from time to time. We will
                  notify you of significant changes by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending you an email notification</li>
                  <li>Displaying a notice in our service</li>
                </ul>
                <p>
                  Your continued use of Infrasync after changes become effective
                  constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Contact Us
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you have questions about this privacy policy or our data
                  practices, please contact us:
                </p>
                <ul className="list-none space-y-2">
                  <li>
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:saadmukhtar01@gmail.com"
                      className="text-blue-600 hover:underline">
                      saadmukhtar01@gmail.com
                    </a>
                  </li>
                  <li>
                    <strong>Data Protection Officer:</strong>{" "}
                    <a
                      href="mailto:saadmukhtar01@gmail.com"
                      className="text-blue-600 hover:underline">
                      saadmukhtar01@gmail.com
                    </a>
                  </li>
                </ul>
                <p>
                  For EU users, you also have the right to lodge a complaint
                  with your local data protection authority.
                </p>
              </div>
            </section>

            <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">
                    Your Privacy Matters
                  </h3>
                  <p className="text-green-800 text-sm">
                    We are committed to protecting your privacy and being
                    transparent about how we handle your data. If you have any
                    concerns or questions, please don't hesitate to reach out to
                    us.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
