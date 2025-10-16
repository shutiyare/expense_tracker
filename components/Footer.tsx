export function Footer() {
  return (
    <footer className="bg-white/95 border-t border-gray-200 py-4 sm:py-6 fixed bottom-0 left-0 right-0 lg:left-64 z-40 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            © {new Date().getFullYear()} ExpenseTracker. All rights reserved.
          </div>
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-right">
            Developed with ❤️ by{" "}
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Eng. Shutiye
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
