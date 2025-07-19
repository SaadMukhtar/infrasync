import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Cookie, Settings, Eye, Clock } from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
            <Badge variant="secondary">
              Last updated: {new Date().toLocaleDateString()}
            </Badge>
          </div>
          <p className="text-lg text-gray-600">
            This policy explains how Infrasync uses cookies and similar
            technologies to provide our services.
          </p>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg">
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. What Are Cookies?
              </h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are stored on your device when
                you visit our website. They help us provide you with a better
                experience by remembering your preferences and enabling certain
                functionality.
              </p>
              <p className="text-gray-700">
                We use both session cookies (which expire when you close your
                browser) and persistent cookies (which remain on your device for
                a set period).
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Types of Cookies We Use
              </h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Essential Cookies
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Authentication & Security
                    </h4>
                    <p className="text-blue-800 text-sm mb-3">
                      These cookies are essential for the website to function
                      properly and cannot be disabled.
                    </p>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>
                        <strong>jwt_token:</strong> Stores your authentication
                        token for secure access (httpOnly, secure, 1 hour
                        expiry)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Functional Cookies
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">
                      User Preferences
                    </h4>
                    <p className="text-green-800 text-sm mb-3">
                      These cookies remember your choices and preferences to
                      improve your experience.
                    </p>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>
                        <strong>sidebar:state:</strong> Remembers your sidebar
                        open/closed state (7 days expiry)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-medium text-gray-800 mb-3">
                Future Analytics Cookies
              </h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-2">
                      Performance & Analytics (Planned)
                    </h4>
                    <p className="text-purple-800 text-sm mb-3">
                      We may add analytics cookies in the future to help us
                      understand how visitors use our website.
                    </p>
                    <ul className="text-purple-800 text-sm space-y-1">
                      <li>
                        <em>Google Analytics cookies may be added later</em>
                      </li>
                      <li>
                        <em>
                          Performance monitoring cookies may be added later
                        </em>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Cookie Duration
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Session Cookies
                    </h3>
                    <p className="text-sm">
                      Expire when you close your browser or after 1 hour of
                      inactivity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Persistent Cookies
                    </h3>
                    <p className="text-sm">
                      Remain on your device for up to 1 year or until manually
                      deleted
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Third-Party Cookies
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We use third-party services that may set their own cookies:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Stripe:</strong> For payment processing and billing
                    management (when you access billing features)
                  </li>
                  <li>
                    <strong>GitHub:</strong> For OAuth authentication and API
                    access (when you connect your GitHub account)
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                  These third-party services have their own privacy policies and
                  cookie practices. We do not currently use Google Analytics or
                  other tracking services.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Managing Your Cookie Preferences
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>You can control and manage cookies in several ways:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Browser Settings
                    </h3>
                    <p className="text-sm text-gray-600">
                      Most browsers allow you to block or delete cookies through
                      their settings. Check your browser's help section for
                      instructions.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Cookie Consent
                    </h3>
                    <p className="text-sm text-gray-600">
                      Currently, we only use essential cookies that are
                      necessary for the website to function. We do not use
                      tracking or analytics cookies that would require explicit
                      consent.
                    </p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Disabling essential cookies may
                    prevent certain features from working properly, including
                    authentication and security features.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Updates to This Policy
              </h2>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons. We will notify you of any material changes
                by posting the updated policy on our website.
              </p>
            </section>

            <Separator className="my-8" />

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Contact Us
              </h2>
              <p className="text-gray-700">
                If you have questions about our use of cookies, please contact
                us at{" "}
                <a
                  href="mailto:saadmukhtar01@gmail.com"
                  className="text-blue-600 hover:underline">
                  saadmukhtar01@gmail.com
                </a>
              </p>
            </section>

            <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Cookie className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Cookie Consent
                  </h3>
                  <p className="text-blue-800 text-sm">
                    By continuing to use our website, you consent to our use of
                    cookies as described in this policy. You can change your
                    cookie preferences at any time through your browser settings
                    or by contacting us.
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

export default CookiePolicy;
