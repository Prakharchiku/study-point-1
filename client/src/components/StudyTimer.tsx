import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square } from "lucide-react";
import { useStudyContext } from "@/context/StudyContext";
import { useEffect } from "react";

export default function StudyTimer() {
  const { 
    timerState, 
    startTimer, 
    pauseTimer, 
    stopTimer, 
    elapsedTime, 
    earnRate,
    focusProgressPercent,
    updateFocusProgress
  } = useStudyContext();

  // Update the progress bar every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (timerState === 'running') {
        updateFocusProgress();
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [timerState, updateFocusProgress]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <Card className="shadow-md border border-gray-100">
      <CardContent className="p-6">
        <h2 className="font-heading font-bold text-xl mb-4 text-center">Study Session</h2>
        
        <div className="flex flex-col items-center">
          <div className="text-6xl font-bold mb-8 font-heading">
            {formatTime(Math.floor(elapsedTime / 1000))}
          </div>
          
          <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-6">
            <Button
              variant="secondary"
              className="py-3 bg-[#10B981] hover:bg-green-600 text-white font-medium rounded-lg shadow transition flex items-center justify-center"
              onClick={startTimer}
              disabled={timerState === 'running'}
            >
              <Play className="h-5 w-5 mr-1" />
              Start
            </Button>
            
            <Button
              variant="secondary"
              className={`py-3 bg-[#F59E0B] hover:bg-yellow-600 text-white font-medium rounded-lg shadow transition flex items-center justify-center ${
                timerState !== 'running' ? 'opacity-50' : ''
              }`}
              onClick={pauseTimer}
              disabled={timerState !== 'running'}
            >
              <Pause className="h-5 w-5 mr-1" />
              Pause
            </Button>
            
            <Button
              variant="destructive"
              className={`py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition flex items-center justify-center ${
                timerState === 'idle' ? 'opacity-50' : ''
              }`}
              onClick={stopTimer}
              disabled={timerState === 'idle'}
            >
              <Square className="h-5 w-5 mr-1" />
              Stop
            </Button>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
            <div 
              className="bg-[#10B981] h-4 rounded-full transition-all duration-300" 
              style={{ width: `${focusProgressPercent}%` }}
            />
          </div>
          
          <div className="text-gray-500 text-sm">
            Earning {earnRate} coins per minute of focused study
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
