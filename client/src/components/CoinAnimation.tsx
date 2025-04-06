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
    if (!isVisible || amount <= 0) return;
    
    try {
      // Get positions for animation
      let startX = window.innerWidth / 2;
      let startY = window.innerHeight / 3;
      let endX = window.innerWidth / 2;
      let endY = window.innerHeight / 2;
      
      // Try to get actual element positions if available
      if (timerRef.current) {
        const timerRect = timerRef.current.getBoundingClientRect();
        startX = timerRect.left + timerRect.width / 2;
        startY = timerRect.top + timerRect.height / 2;
      }
      
      if (currencyRef.current) {
        const currencyRect = currencyRef.current.getBoundingClientRect();
        endX = currencyRect.left + currencyRect.width / 2;
        endY = currencyRect.top + currencyRect.height / 2;
      }
      
      const newCoins: Coin[] = [];
      const maxCoins = Math.min(amount, 5);
      
      console.log(`Animating ${maxCoins} coins from (${startX}, ${startY}) to (${endX}, ${endY})`);
      
      for (let i = 0; i < maxCoins; i++) {
        setTimeout(() => {
          const coinId = `coin-${Date.now()}-${i}`;
          
          // Random starting position near the timer
          const randomOffsetX = Math.random() * 100 - 50;
          const randomOffsetY = Math.random() * 20 - 10;
          const coinStartX = startX + randomOffsetX;
          const coinStartY = startY + randomOffsetY;
          
          // Add coin with initial position
          newCoins.push({
            id: coinId,
            style: {
              left: `${coinStartX}px`,
              top: `${coinStartY}px`,
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
                      left: `${endX}px`,
                      top: `${endY}px`,
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
    } catch (error) {
      console.error("Error in coin animation:", error);
      // Clear any existing coins to prevent stale animations
      setCoins([]);
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
