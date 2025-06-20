import { Link } from "react-router-dom";
import { Github, Shield, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              Made with <Heart className="w-4 h-4 inline text-red-500" /> for
              developers
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link to="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link
              to="/cookies"
              className="hover:text-gray-900 transition-colors">
              Cookie Policy
            </Link>
            <a
              href="https://github.com/SaadMukhtar/infrasync"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 transition-colors duration-150">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Infrasync. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
