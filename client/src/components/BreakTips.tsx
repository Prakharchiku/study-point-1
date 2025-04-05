import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import { useState } from "react";

const breakTips = [
  {
    id: 1,
    title: "Avoid Phone Scrolling",
    description: "Avoid phone scrolling during short breaks — it doesn't let your brain truly rest."
  },
  {
    id: 2,
    title: "Movement Helps",
    description: "Light stretching or walking boosts blood flow and focus."
  },
  {
    id: 3,
    title: "Eye & Body Care",
    description: "Use breaks to hydrate, breathe deeply, or look outside (eye strain relief)."
  },
  {
    id: 4,
    title: "Strategic Napping",
    description: "Napping for 10–20 minutes (not longer) after intense sessions helps memory retention."
  }
];

export default function BreakTips() {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const currentTip = breakTips[currentTipIndex];
  
  const handleNextTip = () => {
    setCurrentTipIndex((prevIndex) => (prevIndex + 1) % breakTips.length);
  };

  return (
    <Card className="shadow-md border border-green-100 bg-green-50">
      <CardContent className="p-5">
        <div className="flex items-start">
          <div className="bg-green-200 rounded-full p-2 mr-3 flex-shrink-0">
            <Info className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-medium text-green-800">{currentTip.title}</h3>
            <p className="text-sm text-green-700 mt-1">{currentTip.description}</p>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button 
            onClick={handleNextTip}
            className="text-xs text-green-700 hover:text-green-900 font-medium"
          >
            Next Tip →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}