export default function Footer() {
  return (
    <footer className="bg-navy text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-sky-light">
              My Smart Digital School
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Empowering education through AI-driven, sustainable learning experiences.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Analytics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Guides
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Case Studies
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-sky-light transition-colors duration-300">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2025 My Smart Digital School. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}