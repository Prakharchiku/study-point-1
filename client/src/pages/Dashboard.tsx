import { Plus } from "lucide-react";
import { useRef } from "react";
import { StudyProvider } from "@/context/StudyContext";

// Create a temporary dashboard without dependencies on the context for testing
export default function Dashboard() {
  return (
    <StudyProvider>
      <DashboardContent />
    </StudyProvider>
  );
}

// Separate component wrapped by the StudyProvider
function DashboardContent() {
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
            <span className="ml-1 font-bold">0</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div ref={timerRef} className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Study Timer</h2>
              <p>Study timer component would go here</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Study Stats</h2>
              <p>Study stats component would go here</p>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Break Store</h2>
              <p>Break store component would go here</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Achievements</h2>
              <p>Achievements component would go here</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          StudyRewards - Earn while you learn! &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
