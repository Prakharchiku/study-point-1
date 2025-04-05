import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, Coins } from "lucide-react";
import { useStudyContext } from "@/context/StudyContext";

export default function Achievements() {
  const { userStats } = useStudyContext();
  
  // Calculate achievement progress
  const calculateFirstHourProgress = () => {
    const totalSeconds = userStats?.totalStudyTime || 0;
    const hourInSeconds = 3600;
    return Math.min(100, Math.floor((totalSeconds / hourInSeconds) * 100));
  };
  
  const consistencyProgress = userStats?.streakDays || 0;
  
  const calculateSaverProgress = () => {
    const savingGoal = 500;
    const currentCoins = userStats?.currency || 0;
    return Math.min(100, Math.floor((currentCoins / savingGoal) * 100));
  };

  return (
    <Card className="shadow-md border border-gray-100 mt-6">
      <CardContent className="p-6">
        <h2 className="font-heading font-bold text-xl mb-4">Achievements</h2>
        
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 rounded-full p-2 mr-3">
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-medium">First Hour</h3>
              <div className="text-sm text-gray-500">Complete 1 hour of total study time</div>
            </div>
            <div className="ml-auto">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium">{calculateFirstHourProgress()}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 rounded-full p-2 mr-3">
              <Zap className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-medium">Consistency</h3>
              <div className="text-sm text-gray-500">Study for 5 days in a row</div>
            </div>
            <div className="ml-auto">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium">{consistencyProgress}/5</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 rounded-full p-2 mr-3">
              <Coins className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="font-medium">Saver</h3>
              <div className="text-sm text-gray-500">Save up 500 coins</div>
            </div>
            <div className="ml-auto">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium">{calculateSaverProgress()}%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
