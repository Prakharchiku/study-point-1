import { Button } from "@/components/ui/button";
import { useStudyContext } from "@/context/StudyContext";
import { formatBreakTime } from "@/lib/utils";

interface BreakModalProps {
  isOpen: boolean;
}

export default function BreakModal({ isOpen }: BreakModalProps) {
  const { activeBreak, breakTimeRemaining, endBreak } = useStudyContext();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-10">
        <h2 className="font-heading font-bold text-2xl mb-3 text-center">Break Time!</h2>
        <div className="text-5xl font-bold text-center mb-6 font-heading">
          {formatBreakTime(breakTimeRemaining)}
        </div>
        <p className="text-center mb-6">Enjoy your well-earned break!</p>
        <div className="flex justify-center">
          <Button 
            onClick={endBreak}
            className="px-6 py-3 bg-primary hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition"
          >
            End Break Early
          </Button>
        </div>
      </div>
    </div>
  );
}
