import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface StudyContextType {
  // Timer state
  timerState: 'idle' | 'running' | 'paused';
  elapsedTime: number;
  focusProgressPercent: number;
  earnRate: number;
  
  // Break state
  breakOptions: any[];
  activeBreak: any | null;
  breakTimeRemaining: number;
  
  // User data
  userId: number;
  userStats: any;
  sessions: any[];
  
  // Animation state
  coinAnimationProps: {
    amount: number;
    isVisible: boolean;
  };
  
  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  updateFocusProgress: () => void;
  purchaseBreak: (breakOption: any) => void;
  endBreak: () => void;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudyContext must be used within a StudyProvider");
  }
  return context;
};

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get logged in user ID from auth state
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  // Timer state
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [focusProgressPercent, setFocusProgressPercent] = useState(0);
  const [lastCoinUpdate, setLastCoinUpdate] = useState(0);
  const earnRate = 10; // coins per minute
  
  // Break state
  const [activeBreak, setActiveBreak] = useState<any | null>(null);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  
  // Animation state
  const [coinAnimationProps, setCoinAnimationProps] = useState({
    amount: 0,
    isVisible: false
  });
  
  // Refs
  const startTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Fetch user stats
  const { data: userStats = null, refetch: refetchUserStats } = useQuery<any>({
    queryKey: [`/api/stats/${userId}`],
  });
  
  // Fetch study sessions
  const { data: fetchedSessions = [] } = useQuery({
    queryKey: [`/api/sessions/${userId}`],
  });
  
  // Cast to the right type to prevent TypeScript errors
  const sessions = fetchedSessions as any[];
  
  // Fetch break options
  const { data: fetchedBreakOptions = [] } = useQuery({
    queryKey: ['/api/breaks'],
  });
  
  // Cast to the right type to prevent TypeScript errors
  const breakOptions = fetchedBreakOptions as any[];
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (sessionData: any) => 
      apiRequest('POST', '/api/sessions', sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stats/${userId}`] });
    }
  });
  
  // Update user stats mutation
  const updateStatsMutation = useMutation({
    mutationFn: (statsData: any) => 
      apiRequest('PATCH', `/api/stats/${userId}`, statsData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stats/${userId}`] });
    }
  });
  
  // Timer functions
  const startTimer = useCallback(() => {
    if (timerState === 'running') return;
    
    if (timerState === 'idle') {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setLastCoinUpdate(0);
    } else if (timerState === 'paused') {
      startTimeRef.current = Date.now() - elapsedTime;
    }
    
    setTimerState('running');
    
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = startTimeRef.current ? now - startTimeRef.current : 0;
      setElapsedTime(elapsed);
      
      // Award coins every minute
      const currentMinutes = Math.floor(elapsed / 60000);
      if (currentMinutes > lastCoinUpdate) {
        const coinsToAdd = earnRate * (currentMinutes - lastCoinUpdate);
        const newTotal = (userStats?.currency || 0) + coinsToAdd;
        
        // Update backend with new coins
        updateStatsMutation.mutate({
          currency: newTotal,
          totalSessions: userStats?.totalSessions || 0
        }, {
          onSuccess: () => {
            // Trigger coin animation only after backend update succeeds
            setCoinAnimationProps({
              amount: coinsToAdd,
              isVisible: true
            });
            
            // Reset animation after a delay
            setTimeout(() => {
              setCoinAnimationProps(prev => ({
                ...prev,
                isVisible: false
              }));
            }, 3000);
            
            setLastCoinUpdate(currentMinutes);
          }
        });
      }
    }, 100);
    
  }, [timerState, elapsedTime, lastCoinUpdate, earnRate]);
  
  const pauseTimer = useCallback(() => {
    if (timerState !== 'running') return;
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setTimerState('paused');
  }, [timerState]);
  
  const stopTimer = useCallback(() => {
    if (timerState === 'idle') return;
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Record session
    const sessionDuration = Math.floor(elapsedTime / 1000); // in seconds
    if (sessionDuration > 0) {
      const minutes = sessionDuration / 60;
      const coinsEarned = Math.floor(minutes * earnRate);
      
      createSessionMutation.mutate({
        userId: user?.id || 0,
        duration: sessionDuration,
        coinsEarned
      }, {
        onSuccess: () => {
          // Update stats with coins earned and increment session count
          updateStatsMutation.mutate({
            currency: (userStats?.currency || 0) + coinsEarned,
            totalSessions: (userStats?.totalSessions || 0) + 1
          });
        }
      });
      
      toast({
        title: "Study session completed!",
        description: `You earned ${coinsEarned} coins for ${Math.floor(minutes)} minutes of study.`
      });
    }
    
    setTimerState('idle');
    setElapsedTime(0);
    setLastCoinUpdate(0);
    setFocusProgressPercent(0);
    startTimeRef.current = null;
  }, [timerState, elapsedTime, earnRate, createSessionMutation, toast, userId]);
  
  const updateFocusProgress = useCallback(() => {
    // Update progress bar (resets every minute)
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const progressPercent = (seconds / 60) * 100;
    setFocusProgressPercent(progressPercent);
  }, [elapsedTime]);
  
  // Break functions
  const purchaseBreak = useCallback((breakOption: any) => {
    // Deduct cost
    if (!userStats || !breakOption) return;
    
    updateStatsMutation.mutate({
      currency: (userStats?.currency || 0) - breakOption.cost,
      breaksTaken: (userStats?.breaksTaken || 0) + 1
    });
    
    // Start break
    setActiveBreak(breakOption);
    setBreakTimeRemaining(breakOption.duration * 60); // convert to seconds
    
    // Pause study timer if running
    if (timerState === 'running') {
      pauseTimer();
    }
    
    // Start break timer
    breakIntervalRef.current = setInterval(() => {
      setBreakTimeRemaining(prev => {
        if (prev <= 1) {
          endBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    toast({
      title: "Break started",
      description: `You purchased a ${breakOption.name}. Enjoy your break!`
    });
  }, [userStats, updateStatsMutation, timerState, pauseTimer, toast]);
  
  const endBreak = useCallback(() => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
    
    setActiveBreak(null);
    setBreakTimeRemaining(0);
    
    toast({
      title: "Break ended",
      description: "Your break has ended. Ready to start studying again?"
    });
  }, [toast]);
  
  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    };
  }, []);
  
  // Create default user stats if needed
  useEffect(() => {
    if (!userStats) {
      updateStatsMutation.mutate({
        userId,
        currency: 0,
        totalStudyTime: 0,
        todayStudyTime: 0,
        totalSessions: 0,
        breaksTaken: 0,
        streakDays: 0
      });
    }
  }, [userStats, updateStatsMutation, userId]);
  
  const value = {
    timerState,
    elapsedTime,
    focusProgressPercent,
    earnRate,
    breakOptions,
    activeBreak,
    breakTimeRemaining,
    userId,
    userStats,
    sessions,
    coinAnimationProps,
    startTimer,
    pauseTimer,
    stopTimer,
    updateFocusProgress,
    purchaseBreak,
    endBreak
  };

  return (
    <StudyContext.Provider value={value}>
      {children}
    </StudyContext.Provider>
  );
};
