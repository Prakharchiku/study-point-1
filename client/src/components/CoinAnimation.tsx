import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Coin {
  id: string;
  style: {
    left: string;
    top: string;
    opacity: string;
    transform: string;
  };
}

interface CoinAnimationProps {
  amount: number;
  isVisible: boolean;
  timerRef: React.RefObject<HTMLDivElement>;
  currencyRef: React.RefObject<HTMLDivElement>;
}

export default function CoinAnimation({ amount, isVisible, timerRef, currencyRef }: CoinAnimationProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  
  useEffect(() => {
    if (!isVisible || amount <= 0 || !timerRef.current || !currencyRef.current) return;
    
    const timerRect = timerRef.current.getBoundingClientRect();
    const currencyRect = currencyRef.current.getBoundingClientRect();
    
    const newCoins: Coin[] = [];
    
    const maxCoins = Math.min(amount, 5);
    
    for (let i = 0; i < maxCoins; i++) {
      setTimeout(() => {
        const coinId = `coin-${Date.now()}-${i}`;
        
        // Random position near the timer
        const startX = timerRect.left + timerRect.width / 2 + (Math.random() * 100 - 50);
        const startY = timerRect.top + timerRect.height / 2;
        
        // Add coin with initial position
        newCoins.push({
          id: coinId,
          style: {
            left: `${startX}px`,
            top: `${startY}px`,
            opacity: '1',
            transform: 'scale(1)'
          }
        });
        
        setCoins(prev => [...prev, ...newCoins]);
        
        // Animate to currency display after a short delay
        setTimeout(() => {
          setCoins(prev => 
            prev.map(coin => {
              if (coin.id === coinId) {
                return {
                  ...coin,
                  style: {
                    left: `${currencyRect.left + currencyRect.width / 2}px`,
                    top: `${currencyRect.top + currencyRect.height / 2}px`,
                    opacity: '0',
                    transform: 'scale(0.5)'
                  }
                };
              }
              return coin;
            })
          );
          
          // Remove coin after animation completes
          setTimeout(() => {
            setCoins(prev => prev.filter(coin => coin.id !== coinId));
          }, 1000);
        }, 10);
      }, i * 200);
    }
  }, [amount, isVisible, timerRef, currencyRef]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className={cn(
            "absolute w-8 h-8 bg-yellow-500 rounded-full text-white flex items-center justify-center font-bold transition-all duration-1000",
          )}
          style={coin.style}
        >
          +1
        </div>
      ))}
    </div>
  );
}
