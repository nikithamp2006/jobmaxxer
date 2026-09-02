import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ActivityType = 'practice' | 'roadmap' | 'interview' | 'job' | 'application' | 'level';
export type NotificationType = 'info' | 'success' | 'warning';
export type TopicPerformance = { attempted: number; correct: number };
export type DailyMissionId = 'warm-up-run' | 'accuracy-strike' | 'topic-explorer';
export type DailyMissions = {
  date: string;
  progress: Record<DailyMissionId, number>;
  completed: DailyMissionId[];
  topicProgress: Record<string, number>;
};
export type PracticeActivity = { topic: string; difficulty: string; completed: number; correct: number; accuracy: number; xp: number };
export type Activity = { id: string; type: ActivityType; message: string; timestamp: string; practice?: PracticeActivity };
export type LeaderboardPointEvent = {
  id: string;
  questionId: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  timestamp: string;
  source?: 'question' | 'daily-mission';
  missionId?: DailyMissionId;
};
export type XPEventCategory = 'dsa' | 'interview' | 'career' | 'consistency' | 'other';
export type XPEvent = { id: string; amount: number; reason: string; category: XPEventCategory; timestamp: string; rewardKey?: string };
export type Notification = { id: string; message: string; type: NotificationType; timestamp: string; read: boolean };
export type ProgressApplication = {
  id: string; company: string; role: string; status: string; date: string;
  location?: string; url?: string; notes?: string; source?: string; match?: number; nextAction?: string;
};
export type InterviewResult = {
  id: string;
  track: string;
  interviewType?: 'technical' | 'behavioral' | 'hr' | 'product';
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
  questions: { id: string; question: string; answer: string; score: number; conceptsFound: string[] }[];
  score: number;
  strengths: string[];
  weaknesses: string[];
  timestamp: string;
  durationSeconds: number;
};

export type UserProgress = {
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastActiveDate?: string;
  dailyGoal: { target: number; completed: number; date: string };
  questionsAttempted: number;
  questionsCorrect: number;
  topics: Record<string, TopicPerformance>;
  dailyMissions: DailyMissions;
  leaderboardPoints: number;
  leaderboardPointEvents: LeaderboardPointEvent[];
  completedRoadmapNodes: string[];
  savedJobs: string[];
  applications: ProgressApplication[];
  interviewAttempts: number;
  activities: Activity[];
  notifications: Notification[];
  rewardKeys: string[];
  xpHistory: XPEvent[];
  interviewResults: InterviewResult[];
};

type ProgressContextValue = UserProgress & {
  addXP: (amount: number, reason: string, rewardKey?: string) => void;
  addCoins: (amount: number, reason: string, rewardKey?: string) => void;
  updateStreak: () => void;
  recordActivity: (type: ActivityType, message: string) => void;
  recordPractice: (details: PracticeActivity) => void;
  recordPracticeQuestion: (question: { id: string; topic: string; difficulty: 'Easy' | 'Medium' | 'Hard' }, correct: boolean) => void;
  createNotification: (message: string, type?: NotificationType) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  recordQuestion: (topic: string, correct: boolean) => void;
  completeRoadmapNode: (nodeId: string, label?: string) => void;
  saveJob: (jobId: string, label?: string) => void;
  recordApplication: (application: ProgressApplication) => void;
  updateApplication: (id: string, application: Partial<ProgressApplication>) => void;
  deleteApplication: (id: string) => void;
  clearApplications: () => void;
  recordInterview: (label?: string) => void;
  saveInterviewResult: (result: InterviewResult) => void;
};

const STORAGE_KEY = 'finalboss:user-progress:v1';
const LEVEL_XP = 500;
const MAX_ACTIVITIES = 20;
const MAX_NOTIFICATIONS = 30;

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const DAILY_MISSION_REWARDS: Record<DailyMissionId, { target: number; points: number; title: string }> = {
  'warm-up-run': { target: 3, points: 25, title: 'WARM-UP RUN' },
  'accuracy-strike': { target: 2, points: 35, title: 'ACCURACY STRIKE' },
  'topic-explorer': { target: 5, points: 50, title: 'TOPIC EXPLORER' },
};

const createDailyMissions = (): DailyMissions => ({
  date: today(),
  progress: { 'warm-up-run': 0, 'accuracy-strike': 0, 'topic-explorer': 0 },
  completed: [],
  topicProgress: {},
});

function normalizeDailyMissions(input?: Partial<DailyMissions>): DailyMissions {
  const defaults = createDailyMissions();
  const rawProgress = input?.progress;
  const counter = (value: number | undefined, fallback: number) => Number.isFinite(value) ? Math.max(0, value as number) : fallback;
  const rawTopicProgress = input?.topicProgress;
  const topicProgress = rawTopicProgress && typeof rawTopicProgress === 'object'
    ? Object.entries(rawTopicProgress).reduce<Record<string, number>>((result, [topic, value]) => {
      if (Number.isFinite(value)) result[topic] = Math.max(0, value as number);
      return result;
    }, {})
    : {};
  const completed = Array.isArray(input?.completed)
    ? input.completed.filter((missionId): missionId is DailyMissionId => missionId in DAILY_MISSION_REWARDS)
    : [];
  return {
    date: typeof input?.date === 'string' ? input.date : defaults.date,
    progress: {
      'warm-up-run': counter(rawProgress?.['warm-up-run'], 0),
      'accuracy-strike': counter(rawProgress?.['accuracy-strike'], 0),
      'topic-explorer': counter(rawProgress?.['topic-explorer'], 0),
    },
    completed: [...new Set(completed)],
    topicProgress,
  };
}

const initialProgress = (): UserProgress => ({
  xp: 0, level: 1, coins: 0, streak: 0, lastActiveDate: undefined,
  dailyGoal: { target: 3, completed: 0, date: today() },
  questionsAttempted: 0, questionsCorrect: 0, topics: {}, dailyMissions: createDailyMissions(), completedRoadmapNodes: [],
  leaderboardPoints: 0, leaderboardPointEvents: [],
  savedJobs: [], applications: [], interviewAttempts: 0, activities: [], notifications: [], rewardKeys: [], xpHistory: [], interviewResults: [],
});

function withFreshDailyState(progress: UserProgress): UserProgress {
  const date = today();
  return {
    ...progress,
    dailyGoal: progress.dailyGoal.date === date
      ? progress.dailyGoal
      : { ...progress.dailyGoal, completed: 0, date },
    dailyMissions: progress.dailyMissions.date === date
      ? normalizeDailyMissions(progress.dailyMissions)
      : createDailyMissions(),
  };
}

function readProgress(): UserProgress {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialProgress();
    const parsed = JSON.parse(stored) as Partial<UserProgress>;
    const defaults = initialProgress();
    const dailyGoal = parsed.dailyGoal && typeof parsed.dailyGoal === 'object'
      ? {
        target: Number.isFinite(parsed.dailyGoal.target) ? Math.max(1, parsed.dailyGoal.target) : defaults.dailyGoal.target,
        completed: Number.isFinite(parsed.dailyGoal.completed) ? Math.max(0, parsed.dailyGoal.completed) : 0,
        date: typeof parsed.dailyGoal.date === 'string' ? parsed.dailyGoal.date : defaults.dailyGoal.date,
      }
      : defaults.dailyGoal;
    return withFreshDailyState({
      ...defaults,
      ...parsed,
      dailyGoal,
      dailyMissions: normalizeDailyMissions(parsed.dailyMissions),
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      rewardKeys: Array.isArray(parsed.rewardKeys) ? parsed.rewardKeys : [],
      xpHistory: Array.isArray(parsed.xpHistory) ? parsed.xpHistory : [],
      leaderboardPoints: Number.isFinite(parsed.leaderboardPoints) ? Math.max(0, parsed.leaderboardPoints as number) : 0,
      leaderboardPointEvents: Array.isArray(parsed.leaderboardPointEvents) ? parsed.leaderboardPointEvents : [],
      interviewResults: Array.isArray(parsed.interviewResults) ? parsed.interviewResults : [],
    });
  } catch {
    return initialProgress();
  }
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

function categoryForReward(reason: string, rewardKey?: string): XPEventCategory {
  const source = `${reason} ${rewardKey ?? ''}`.toLowerCase();
  if (source.includes('interview')) return 'interview';
  if (source.includes('roadmap') || source.includes('resume') || source.includes('application') || source.includes('job')) return 'career';
  if (source.includes('streak') || source.includes('daily')) return 'consistency';
  if (source.includes('question') || source.includes('practice') || source.includes('topic') || source.includes('dsa')) return 'dsa';
  return 'other';
}

function applyReward(current: UserProgress, field: 'xp' | 'coins', amount: number, reason: string, rewardKey?: string): UserProgress {
  if (rewardKey && current.rewardKeys.includes(rewardKey)) return current;
  const value = Math.max(0, amount);
  const timestamp = new Date().toISOString();
  const xp = field === 'xp' ? current.xp + value : current.xp;
  const level = Math.floor(xp / LEVEL_XP) + 1;
  const next: UserProgress = {
    ...current,
    [field]: current[field] + value,
    xp,
    level,
    rewardKeys: rewardKey ? [...current.rewardKeys, rewardKey].slice(-500) : current.rewardKeys,
  };
  if (field === 'xp' && value > 0) {
    next.xpHistory = [...current.xpHistory, {
      id: id('xp'),
      amount: value,
      reason,
      category: categoryForReward(reason, rewardKey),
      timestamp,
      rewardKey,
    }].slice(-500);
  }
  if (level > current.level) {
    next.notifications = [{ id: id('notification'), message: `Level ${level} reached — ${reason}`, type: 'success' as NotificationType, timestamp, read: false }, ...next.notifications].slice(0, MAX_NOTIFICATIONS);
  }
  return next;
}

function withDailyGoalReward(current: UserProgress, completed: number): UserProgress {
  const next = { ...current, dailyGoal: { ...current.dailyGoal, completed } };
  if (completed >= current.dailyGoal.target && current.dailyGoal.completed < current.dailyGoal.target) {
    return applyReward(next, 'xp', 50, 'completed daily goal', `daily-goal:${today()}`);
  }
  return next;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(() => readProgress());
  const update = useCallback((change: (current: UserProgress) => UserProgress) => {
    setProgress(current => {
      const next = change(withFreshDailyState(current));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const syncDailyState = () => setProgress(current => {
      const next = withFreshDailyState(current);
      if (next.dailyGoal.date === current.dailyGoal.date && next.dailyMissions.date === current.dailyMissions.date) return current;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    const interval = window.setInterval(syncDailyState, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const recordActivity = useCallback((type: ActivityType, message: string) => update(current => ({
    ...withDailyGoalReward(
      { ...current, activities: [{ id: id('activity'), type, message, timestamp: new Date().toISOString() }, ...current.activities].slice(0, MAX_ACTIVITIES) },
      Math.min(current.dailyGoal.target, current.dailyGoal.completed + 1),
    ),
  })), [update]);
  const recordPractice = useCallback((details: PracticeActivity) => update(current => withDailyGoalReward({
    ...current,
    activities: [{
      id: id('activity'),
      type: 'practice' as ActivityType,
      message: `Completed ${details.topic} Practice — ${details.correct}/${details.completed}`,
      timestamp: new Date().toISOString(),
      practice: details,
    }, ...current.activities].slice(0, MAX_ACTIVITIES),
  }, Math.min(current.dailyGoal.target, current.dailyGoal.completed + 1))), [update]);
  const recordPracticeQuestion = useCallback((question: { id: string; topic: string; difficulty: 'Easy' | 'Medium' | 'Hard' }, correct: boolean) => update(current => {
    const daily = current.dailyMissions;
    const warmUpProgress = Math.min(DAILY_MISSION_REWARDS['warm-up-run'].target, daily.progress['warm-up-run'] + 1);
    const accuracyProgress = Math.min(DAILY_MISSION_REWARDS['accuracy-strike'].target, daily.progress['accuracy-strike'] + (correct ? 1 : 0));
    const topicProgress = {
      ...daily.topicProgress,
      [question.topic]: Math.min(DAILY_MISSION_REWARDS['topic-explorer'].target, (daily.topicProgress[question.topic] ?? 0) + 1),
    };
    const topicExplorerProgress = Math.min(DAILY_MISSION_REWARDS['topic-explorer'].target, Math.max(0, ...Object.values(topicProgress)));
    const missionProgress = {
      'warm-up-run': warmUpProgress,
      'accuracy-strike': accuracyProgress,
      'topic-explorer': topicExplorerProgress,
    };
    const newlyCompleted: DailyMissionId[] = [];
    (Object.keys(DAILY_MISSION_REWARDS) as DailyMissionId[]).forEach(missionId => {
      if (missionProgress[missionId] >= DAILY_MISSION_REWARDS[missionId].target && !daily.completed.includes(missionId)) newlyCompleted.push(missionId);
    });
    const next: UserProgress = {
      ...current,
      questionsAttempted: current.questionsAttempted + 1,
      questionsCorrect: current.questionsCorrect + (correct ? 1 : 0),
      dailyMissions: {
        date: daily.date,
        progress: missionProgress,
        completed: [...new Set([...daily.completed, ...newlyCompleted])],
        topicProgress,
      },
      topics: {
        ...current.topics,
        [question.topic]: {
          attempted: (current.topics[question.topic]?.attempted ?? 0) + 1,
          correct: (current.topics[question.topic]?.correct ?? 0) + (correct ? 1 : 0),
        },
      },
    };
    let rewarded: UserProgress = next;
    if (correct && !current.leaderboardPointEvents.some(event => event.questionId === question.id)) {
      const points = question.difficulty === 'Easy' ? 10 : question.difficulty === 'Medium' ? 20 : 30;
      const timestamp = new Date().toISOString();
      rewarded = {
        ...rewarded,
        leaderboardPoints: rewarded.leaderboardPoints + points,
        leaderboardPointEvents: [...rewarded.leaderboardPointEvents, {
          id: id('leaderboard-point'),
          questionId: question.id,
          topic: question.topic,
          difficulty: question.difficulty,
          points,
          timestamp,
          source: 'question' as const,
        }].slice(-1000),
      };
    }
    return newlyCompleted.reduce<UserProgress>((state, missionId) => {
      const reward = DAILY_MISSION_REWARDS[missionId];
      const timestamp = new Date().toISOString();
      return {
        ...state,
        leaderboardPoints: state.leaderboardPoints + reward.points,
        leaderboardPointEvents: [...state.leaderboardPointEvents, {
          id: id('leaderboard-point'),
          questionId: `daily-mission:${daily.date}:${missionId}`,
          topic: 'Daily Missions',
          difficulty: 'Easy' as const,
          points: reward.points,
          timestamp,
          source: 'daily-mission' as const,
          missionId,
        }].slice(-1000),
        notifications: [{
          id: id('notification'),
          message: `MISSION COMPLETE! ${reward.title} +${reward.points} BONUS POINTS`,
          type: 'success' as NotificationType,
          timestamp,
          read: false,
        }, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
      };
    }, rewarded);
  }), [update]);
  const createNotification = useCallback((message: string, type: NotificationType = 'info') => update(current => ({
    ...current, notifications: [{ id: id('notification'), message, type, timestamp: new Date().toISOString(), read: false }, ...current.notifications].slice(0, MAX_NOTIFICATIONS),
  })), [update]);
  const addReward = useCallback((field: 'xp' | 'coins', amount: number, reason: string, rewardKey?: string) => update(current => applyReward(current, field, amount, reason, rewardKey)), [update]);
  const addXP = useCallback((amount: number, reason: string, rewardKey?: string) => addReward('xp', amount, reason, rewardKey), [addReward]);
  const addCoins = useCallback((amount: number, reason: string, rewardKey?: string) => addReward('coins', amount, reason, rewardKey), [addReward]);
  const updateStreak = useCallback(() => update(current => {
    const date = today();
    if (current.lastActiveDate === date) return current;
    const previous = current.lastActiveDate ? new Date(`${current.lastActiveDate}T00:00:00`) : null;
    const daysSince = previous ? Math.round((Date.now() - previous.getTime()) / 86400000) : 0;
    const streak = daysSince === 1 ? current.streak + 1 : 1;
    const next = { ...current, lastActiveDate: date, streak };
    return streak >= 7 && current.streak < 7
      ? applyReward(next, 'xp', 100, 'reached 7-day streak', `streak-7:${date}`)
      : next;
  }), [update]);
  const recordQuestion = useCallback((topic: string, correct: boolean) => update(current => ({ ...current, questionsAttempted: current.questionsAttempted + 1, questionsCorrect: current.questionsCorrect + (correct ? 1 : 0), topics: { ...current.topics, [topic]: { attempted: (current.topics[topic]?.attempted ?? 0) + 1, correct: (current.topics[topic]?.correct ?? 0) + (correct ? 1 : 0) } } })), [update]);
  const completeRoadmapNode = useCallback((nodeId: string, label = nodeId) => update(current => {
    if (current.completedRoadmapNodes.includes(nodeId)) return current;
    return { ...current, completedRoadmapNodes: [...current.completedRoadmapNodes, nodeId], activities: [{ id: id('activity'), type: 'roadmap' as ActivityType, message: `Completed ${label}`, timestamp: new Date().toISOString() }, ...current.activities].slice(0, MAX_ACTIVITIES) };
  }), [update]);
  const saveJob = useCallback((jobId: string, label = 'a role') => update(current => {
    if (current.savedJobs.includes(jobId)) return current;
    return { ...current, savedJobs: [...current.savedJobs, jobId], activities: [{ id: id('activity'), type: 'job' as ActivityType, message: `Saved ${label}`, timestamp: new Date().toISOString() }, ...current.activities].slice(0, MAX_ACTIVITIES) };
  }), [update]);
  const recordApplication = useCallback((application: ProgressApplication) => update(current => {
    const duplicate = current.applications.some(item => item.id === application.id
      || (item.company.trim().toLowerCase() === application.company.trim().toLowerCase()
        && item.role.trim().toLowerCase() === application.role.trim().toLowerCase())
      || Boolean(application.url && item.url && item.url === application.url));
    if (duplicate) return current;
    return { ...current, applications: [application, ...current.applications], activities: [{ id: id('activity'), type: 'application' as ActivityType, message: `Applied to ${application.company}`, timestamp: new Date().toISOString() }, ...current.activities].slice(0, MAX_ACTIVITIES) };
  }), [update]);
  const updateApplication = useCallback((applicationId: string, changes: Partial<ProgressApplication>) => update(current => ({ ...current, applications: current.applications.map(item => item.id === applicationId ? { ...item, ...changes } : item) })), [update]);
  const deleteApplication = useCallback((applicationId: string) => update(current => ({ ...current, applications: current.applications.filter(item => item.id !== applicationId) })), [update]);
  const clearApplications = useCallback(() => update(current => ({ ...current, applications: [], activities: current.activities.filter(activity => activity.type !== 'application') })), [update]);
  const recordInterview = useCallback((label = 'mock interview') => update(current => ({ ...current, interviewAttempts: current.interviewAttempts + 1, activities: [{ id: id('activity'), type: 'interview' as ActivityType, message: `Finished ${label}`, timestamp: new Date().toISOString() }, ...current.activities].slice(0, MAX_ACTIVITIES) })), [update]);
  const saveInterviewResult = useCallback((result: InterviewResult) => update(current => {
    if (current.interviewResults.some(item => item.id === result.id)) return current;
    return {
      ...current,
      interviewResults: [result, ...current.interviewResults].slice(0, 10),
      interviewAttempts: current.interviewAttempts + 1,
      activities: [{ id: id('activity'), type: 'interview' as ActivityType, message: `Completed ${result.track} Mock Interview — ${result.score}/100`, timestamp: result.timestamp }, ...current.activities].slice(0, MAX_ACTIVITIES),
      notifications: [{ id: id('notification'), message: `Mock interview completed. Score: ${result.score}/100.`, type: 'success' as NotificationType, timestamp: result.timestamp, read: false }, ...current.notifications].slice(0, MAX_NOTIFICATIONS),
    };
  }), [update]);
  const value = useMemo<ProgressContextValue>(() => ({ ...progress, addXP, addCoins, updateStreak, recordActivity, recordPractice, recordPracticeQuestion, createNotification, markNotificationRead: id => update(current => ({ ...current, notifications: current.notifications.map(item => item.id === id ? { ...item, read: true } : item) })), markAllNotificationsRead: () => update(current => ({ ...current, notifications: current.notifications.map(item => ({ ...item, read: true })) })), clearNotifications: () => update(current => ({ ...current, notifications: [] })), recordQuestion, completeRoadmapNode, saveJob, recordApplication, updateApplication, deleteApplication, clearApplications, recordInterview, saveInterviewResult }), [progress, addXP, addCoins, updateStreak, recordActivity, recordPractice, recordPracticeQuestion, createNotification, recordQuestion, completeRoadmapNode, saveJob, recordApplication, updateApplication, deleteApplication, clearApplications, recordInterview, saveInterviewResult, update]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used inside ProgressProvider');
  return context;
}