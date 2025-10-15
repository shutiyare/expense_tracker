export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} ExpenseTracker. All rights reserved.
          </div>
          <div className="text-sm text-gray-600">
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
