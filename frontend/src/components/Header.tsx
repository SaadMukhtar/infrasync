
import { Github, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Github className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Infrasync</h1>
            <p className="text-xs text-slate-500">Repository Intelligence</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-slate-600 hover:text-slate-800 transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-slate-600 hover:text-slate-800 transition-colors">
            Pricing
          </a>
          <a href="#docs" className="text-slate-600 hover:text-slate-800 transition-colors">
            Docs
          </a>
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </nav>

        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
