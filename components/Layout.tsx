import React from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isScanPage = location.pathname === "/scan";
  const isLoginPage = location.pathname === "/";

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-white shadow-2xl relative overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isScanPage && !isLoginPage && (
        <nav className="h-16 bg-white border-t border-gray-100 flex items-center justify-around px-2 z-20 pb-safe">
          <Link
            to="/home"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              location.pathname === "/home" ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <span className="material-icons-round text-2xl">home</span>
            <span className="text-[10px] font-medium mt-0.5">Home</span>
          </Link>

          <Link
            to="/scan"
            className="flex flex-col items-center -mt-8"
          >
            <div className="w-14 h-14 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center text-white active:scale-95 transition-transform border-4 border-white">
              <span className="material-icons-round text-3xl">filter_center_focus</span>
            </div>
          </Link>

          <Link
            to="/leaderboard"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              location.pathname === "/leaderboard" ? "text-emerald-600" : "text-gray-400"
            }`}
          >
            <span className="material-icons-round text-2xl">leaderboard</span>
            <span className="text-[10px] font-medium mt-0.5">Rank</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Layout;