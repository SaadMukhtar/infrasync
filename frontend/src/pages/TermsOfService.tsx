import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, GitBranch, Users, Clock, AlertTriangle } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Terms of Service
            </h1>
            <Badge variant="secondary">
              Last updated: {new Date().toLocaleDateString()}
            </Badge>
          </div>
          <p className="text-lg text-gray-600">
            These terms govern your use of Infrasync, a GitHub repository
            monitoring service.
          </p>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Service Description
              </h2>
              <p className="text-gray-700 mb-4">
                Infrasync is a GitHub repository monitoring service that
                provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  Real-time monitoring of GitHub repositories for code changes,
                  pull requests, and issues
                </li>
                <li>
                  Automated digest generation and delivery via Slack, Discord,
                  and email
                </li>
                <li>Organization-based access control and team management</li>
                <li>Self-hosted deployment options for enterprise users</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Account and Registration
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>GitHub Authentication:</strong> You must authenticate
                  using your GitHub account to use Infrasync. By doing so, you
                  authorize us to access your GitHub repositories according to
                  your GitHub permissions.
                </p>
                <p>
                  <strong>Organization Setup:</strong> You may create or join
                  organizations to collaborate with team members. Organization
                  admins have control over member access and repository
                  permissions.
                </p>
                <p>
                  <strong>Account Responsibility:</strong> You are responsible
                  for maintaining the security of your account and for all
                  activities that occur under your account.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Repository Access and Permissions
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Repository Monitoring:</strong> Infrasync will only
                  monitor repositories to which you have access and for which
                  you have granted permission. We respect GitHub's permission
                  system and will not access private repositories without
                  explicit authorization.
                </p>
                <p>
                  <strong>Data Collection:</strong> We collect repository
                  metadata, commit information, pull request data, and issue
                  information to provide monitoring services. We do not store
                  your source code.
                </p>
                <p>
                  <strong>Permission Changes:</strong> If you lose access to a
                  repository or change permissions, Infrasync will automatically
                  stop monitoring that repository.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Service Usage and Limitations
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Fair Use:</strong> You agree to use Infrasync in a
                  manner consistent with its intended purpose and not to abuse
                  the service or interfere with its operation.
                </p>
                <p>
                  <strong>Rate Limits:</strong> We may implement rate limits to
                  ensure fair usage and service stability. These limits vary by
                  plan and are designed to accommodate normal usage patterns.
                </p>
                <p>
                  <strong>Service Availability:</strong> While we strive for
                  high availability, we do not guarantee 100% uptime. We will
                  provide reasonable notice for scheduled maintenance.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Data and Privacy
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Data Processing:</strong> We process repository data
                  to provide monitoring services. This includes analyzing
                  commits, pull requests, and issues to generate meaningful
                  insights.
                </p>
                <p>
                  <strong>Data Retention:</strong> We retain repository
                  monitoring data for the duration of your subscription and for
                  30 days after account deletion for compliance purposes.
                </p>
                <p>
                  <strong>Data Security:</strong> We implement industry-standard
                  security measures to protect your data. All data is encrypted
                  in transit and at rest.
                </p>
                <p>
                  <strong>Third-Party Services:</strong> We may use third-party
                  services (Slack, Discord, email providers) to deliver
                  notifications. These services have their own privacy policies.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Billing and Subscriptions
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Free Tier:</strong> We offer a free tier with limited
                  features. You may upgrade to paid plans for additional
                  repositories and features.
                </p>
                <p>
                  <strong>Paid Plans:</strong> Paid subscriptions are billed
                  monthly or annually through Stripe. You may cancel your
                  subscription at any time.
                </p>
                <p>
                  <strong>Refunds:</strong> We do not provide refunds for
                  partial months. If you cancel mid-month, you'll continue to
                  have access until the end of your billing period.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Prohibited Uses
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>You may not use Infrasync to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Monitor repositories without proper authorization</li>
                  <li>Attempt to reverse engineer or hack the service</li>
                  <li>Use the service for illegal activities</li>
                  <li>Violate GitHub's Terms of Service</li>
                  <li>Interfere with other users' use of the service</li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Termination
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Account Deletion:</strong> You may delete your account
                  at any time. Upon deletion, we will:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Stop monitoring all your repositories</li>
                  <li>Delete your account data within 30 days</li>
                  <li>Cancel any active subscriptions</li>
                  <li>Remove you from all organizations</li>
                </ul>
                <p>
                  <strong>Service Termination:</strong> We may terminate or
                  suspend your access if you violate these terms or engage in
                  prohibited activities.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Disclaimer of Warranties
              </h2>
              <p className="text-gray-700">
                Infrasync is provided "as is" without warranties of any kind. We
                do not guarantee that the service will be error-free or
                uninterrupted. We are not responsible for any issues with
                GitHub's API or services.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-700">
                Our liability is limited to the amount you paid for the service
                in the 12 months preceding the claim. We are not liable for
                indirect, incidental, or consequential damages.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Data Processing
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>GitHub Data Processing:</strong> By using our service,
                  you authorize us to access and process data from your GitHub
                  repositories for monitoring purposes. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Repository metadata and commit information</li>
                  <li>Pull request and issue data</li>
                  <li>Release and tag information</li>
                  <li>Webhook event data for real-time monitoring</li>
                </ul>
                <p>
                  <strong>Data Retention:</strong> We retain monitoring data for
                  up to 90 days unless you request deletion. Repository access
                  tokens are encrypted and stored securely.
                </p>
                <p>
                  <strong>Data Protection:</strong> We implement appropriate
                  technical and organizational measures to protect your data in
                  accordance with applicable data protection laws.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Contact Information
              </h2>
              <p className="text-gray-700">
                If you have questions about these terms, please contact us at{" "}
                <a
                  href="mailto:saadmukhtar01@gmail.com"
                  className="text-blue-600 hover:underline">
                  saadmukhtar01@gmail.com
                </a>
              </p>
            </section>

            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Important Notice
                  </h3>
                  <p className="text-blue-800 text-sm">
                    These terms are a legal agreement between you and Infrasync.
                    By using our service, you acknowledge that you have read,
                    understood, and agree to be bound by these terms. If you do
                    not agree to these terms, please do not use Infrasync.
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

export default TermsOfService;
