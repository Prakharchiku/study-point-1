import { Plus } from "lucide-react";
import { useRef, createContext, useContext, useState } from "react";
import StudyTimer from "@/components/StudyTimer";
import StudyStats from "@/components/StudyStats";
import BreakStore from "@/components/BreakStore";
import Achievements from "@/components/Achievements";
import CoinAnimation from "@/components/CoinAnimation";
import BreakModal from "@/components/BreakModal";
import { useStudyContext } from "@/context/StudyContext";
import { StudyProvider } from "@/context/StudyContext";

const ThemeContext = createContext('light');

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`bg-[#F9FAFB] dark:bg-gray-800 ${theme === 'dark' ? 'dark' : ''}`}> {/* Apply dark mode class */}
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  return useContext(ThemeContext);
};

const ThemeToggle = () => {
  const { toggleTheme, theme } = useTheme();
  return (
    <button onClick={toggleTheme} className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
    </button>
  );
};


// This ensures the Dashboard component has access to the StudyProvider
export default function Dashboard() {
  return (
    <StudyProvider>
      <ThemeProvider>
        <DashboardContent />
      </ThemeProvider>
    </StudyProvider>
  );
}

// Inner component that uses the context
function DashboardContent() {
  const { userStats, coinAnimationProps, activeBreak } = useStudyContext();
  const { theme } = useTheme();

  const timerRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`flex flex-col min-h-screen font-sans ${theme === 'dark' ? 'dark' : ''}`}>
      <header className={`bg-primary dark:bg-gray-900 text-white dark:text-white shadow-md`}> {/* Apply dark mode classes */}
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Plus className="h-8 w-8 mr-2" />
            <h1 className="font-heading font-bold text-xl md:text-2xl">StudyRewards</h1>
          </div>
          <div className="flex gap-2">
            <div ref={currencyRef} className={`flex items-center bg-indigo-600 dark:bg-indigo-500 px-3 py-1 rounded-full shadow-sm`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span key={userStats?.currency} className="ml-1 font-bold">{userStats?.currency || 0}</span>
            </div>
            <div className={`flex items-center bg-green-600 dark:bg-green-500 px-3 py-1 rounded-full shadow-sm`}> {/* Apply dark mode classes */}
              <span className="text-yellow-400 dark:text-yellow-300">🔥</span>
              <span className="ml-1 font-bold text-white dark:text-white">{userStats?.streakDays || 0} days</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div ref={timerRef} className="lg:col-span-8 space-y-6">
            <StudyTimer />
            <StudyStats />
          </div>
          <div className="lg:col-span-4">
            <BreakStore />
            <Achievements />
          </div>
        </div>
      </main>

      <CoinAnimation 
        amount={coinAnimationProps.amount}
        isVisible={coinAnimationProps.isVisible}
        timerRef={timerRef}
        currencyRef={currencyRef}
      />

      <BreakModal isOpen={!!activeBreak} />

      <footer className={`bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 border-gray-200 py-4`}> {/* Apply dark mode classes */}
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          StudyRewards - Earn while you learn! &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}