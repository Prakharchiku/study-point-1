import { Plus } from "lucide-react";
import { useRef } from "react";
import StudyTimer from "@/components/StudyTimer";
import StudyStats from "@/components/StudyStats";
import BreakStore from "@/components/BreakStore";
import Achievements from "@/components/Achievements";
import CoinAnimation from "@/components/CoinAnimation";
import BreakModal from "@/components/BreakModal";
import { useStudyContext } from "@/context/StudyContext";
import { StudyProvider } from "@/context/StudyContext";

// This ensures the Dashboard component has access to the StudyProvider
export default function Dashboard() {
  return (
    <StudyProvider>
      <DashboardContent />
    </StudyProvider>
  );
}

// Inner component that uses the context
function DashboardContent() {
  const { userStats, coinAnimationProps, activeBreak } = useStudyContext();
  
  const timerRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] font-sans">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Plus className="h-8 w-8 mr-2" />
            <h1 className="font-heading font-bold text-xl md:text-2xl">StudyRewards</h1>
          </div>
          <div ref={currencyRef} className="flex items-center bg-indigo-600 px-3 py-1 rounded-full shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span key={userStats?.currency} className="ml-1 font-bold">{userStats?.currency || 0}</span>
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

      <footer className="bg-gray-50 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          StudyRewards - Earn while you learn! &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
