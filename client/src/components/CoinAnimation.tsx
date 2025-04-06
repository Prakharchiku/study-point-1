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
      // Default positions (center of screen) as fallback
      let startX = window.innerWidth / 2;
      let startY = window.innerHeight / 3;
      let endX = window.innerWidth / 2;
      let endY = window.innerHeight / 2;
      
      // Try to get actual element positions if available
      try {
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
      } catch (posError) {
        console.warn("Using default positions due to element reference error:", posError);
        // Continue with default positions
      }
      
      // Limit number of coins to animate
      const maxCoins = Math.min(amount, 5);
      console.log(`Animating ${maxCoins} coins from (${startX}, ${startY}) to (${endX}, ${endY})`);
      
      // Create all coins at once with a simpler approach
      const newCoins: Coin[] = [];
      
      for (let i = 0; i < maxCoins; i++) {
        // Create unique ID for each coin
        const coinId = `coin-${Date.now()}-${i}`;
        
        // Add slight randomization to starting position
        const offsetX = (Math.random() * 60) - 30; // -30 to +30
        const offsetY = (Math.random() * 20) - 10; // -10 to +10
        
        newCoins.push({
          id: coinId,
          style: {
            left: `${startX + offsetX}px`,
            top: `${startY + offsetY}px`,
            opacity: '1',
            transform: 'scale(1)'
          }
        });
      }
      
      // Add all coins at once
      setCoins(newCoins);
      
      // Animate all coins to destination after a short delay
      setTimeout(() => {
        setCoins(prev => 
          prev.map(coin => ({
            ...coin,
            style: {
              left: `${endX}px`,
              top: `${endY}px`,
              opacity: '0',
              transform: 'scale(0.5)'
            }
          }))
        );
        
        // Clear all coins after animation completes
        setTimeout(() => {
          setCoins([]);
        }, 1000);
      }, 500);
      
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
