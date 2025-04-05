import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useStudyContext } from "@/context/StudyContext";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatBreakTime } from "@/lib/utils";

export default function BreakStore() {
  const { data: breaks = [] } = useQuery({
    queryKey: ['/api/breaks'],
    queryFn: () => fetch('/api/breaks').then(res => res.json())
  });
  
  const { 
    userStats, 
    purchaseBreak, 
    activeBreak, 
    breakTimeRemaining 
  } = useStudyContext();
  
  const { toast } = useToast();
  
  const handlePurchaseBreak = (breakOption: any) => {
    if (!userStats || userStats.currency < breakOption.cost) {
      toast({
        title: "Not enough coins",
        description: "You need more coins to purchase this break",
        variant: "destructive"
      });
      return;
    }
    
    if (activeBreak) {
      toast({
        title: "Break in progress",
        description: "You already have an active break",
        variant: "destructive"
      });
      return;
    }
    
    purchaseBreak(breakOption);
  };

  return (
    <Card className="shadow-md border border-gray-100">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-bold text-xl">Break Store</h2>
          <div className="flex items-center bg-indigo-100 px-3 py-1 rounded-full">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="ml-1 font-bold">{userStats?.currency || 0}</span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">Use your earned coins to purchase breaks!</p>
        
        <div className="space-y-4">
          {breaks.map((breakOption) => (
            <div 
              key={breakOption.id}
              className="bg-gray-50 rounded-lg p-4 flex justify-between items-center transition-all hover:bg-gray-100"
            >
              <div>
                <h3 className="font-medium">{breakOption.name}</h3>
                <p className="text-sm text-gray-500">{breakOption.description}</p>
              </div>
              <Button
                onClick={() => handlePurchaseBreak(breakOption)}
                className="px-4 py-2 bg-primary hover:bg-indigo-700 text-white rounded-lg flex items-center"
              >
                <span>{breakOption.cost}</span>
                <Coins className="h-4 w-4 ml-1 text-yellow-500" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 bg-indigo-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Current Break</h3>
          <div className="text-center py-3">
            {activeBreak ? (
              <>
                <p className="font-medium text-primary">{activeBreak.name}</p>
                <p className="text-sm text-gray-500">
                  Remaining: {formatBreakTime(breakTimeRemaining)}
                </p>
              </>
            ) : (
              <p className="text-gray-500">No active break</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
