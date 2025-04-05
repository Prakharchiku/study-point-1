import React, { createContext, useContext, ReactNode } from 'react';
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

export function StudyProvider({ children }: { children: ReactNode }) {
  // Get logged in user ID from auth state
  const { user } = useAuth();
  const userId = user?.id || 0;
  
  // Timer state
  const [timerState, setTimerState] = React.useState<'idle' | 'running' | 'paused'>('idle');
  const [elapsedTime, setElapsedTime] = React.useState(0);
  const [focusProgressPercent, setFocusProgressPercent] = React.useState(0);
  const [lastCoinUpdate, setLastCoinUpdate] = React.useState(0);
  const earnRate = 10; // coins per minute
  
  // Break state
  const [activeBreak, setActiveBreak] = React.useState<any | null>(null);
  const [breakTimeRemaining, setBreakTimeRemaining] = React.useState(0);
  
  // Animation state
  const [coinAnimationProps, setCoinAnimationProps] = React.useState({
    amount: 0,
    isVisible: false
  });
  
  // Refs
  const startTimeRef = React.useRef<number | null>(null);
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
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
  const startTimer = React.useCallback(() => {
    if (timerState === 'running') return;
    
    // Update streak when starting timer
    apiRequest('POST', '/api/protected/update-streak')
      .then(() => refetchUserStats());
    
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
        
        // Create a study session for each minute to ensure coins are persisted
        createSessionMutation.mutate({
          userId: user?.id || 0,
          duration: 60, // one minute in seconds
          coinsEarned: earnRate
        }, {
          onSuccess: () => {
            // Trigger coin animation
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
            // Refetch stats to get updated coin count
            refetchUserStats();
          }
        });
      }
    }, 100);
    
  }, [timerState, elapsedTime, lastCoinUpdate, earnRate, user, createSessionMutation, refetchUserStats]);
  
  const pauseTimer = React.useCallback(() => {
    if (timerState !== 'running') return;
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setTimerState('paused');
  }, [timerState]);
  
  const stopTimer = React.useCallback(() => {
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
          const newCurrency = (userStats?.currency || 0) + coinsEarned;
          const newTotalSessions = (userStats?.totalSessions || 0) + 1;
          
          updateStatsMutation.mutate({
            currency: newCurrency,
            totalSessions: newTotalSessions
          }, {
            onSuccess: () => {
              refetchUserStats();
            }
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
  }, [timerState, elapsedTime, earnRate, createSessionMutation, toast, userId, userStats, updateStatsMutation, refetchUserStats]);
  
  const updateFocusProgress = React.useCallback(() => {
    // Update progress bar (resets every minute)
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const progressPercent = (seconds / 60) * 100;
    setFocusProgressPercent(progressPercent);
  }, [elapsedTime]);
  
  // Break functions
  const purchaseBreak = React.useCallback((breakOption: any) => {
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
  
  const endBreak = React.useCallback(() => {
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
  React.useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    };
  }, []);
  
  // Fetch user stats when component mounts
  React.useEffect(() => {
    if (user?.id) {
      refetchUserStats();
    }
  }, [user?.id, refetchUserStats]);
  
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
}

export function useStudyContext() {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
}