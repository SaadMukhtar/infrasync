import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { OrgSettings } from "@/components/OrgSettings";

const OrgSettingsPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
    <Header />
    <main className="container mx-auto px-4 py-8 max-w-4xl flex-1">
      <OrgSettings />
    </main>
    <Footer />
  </div>
);

export default OrgSettingsPage;
