import {
  ArrowRight,
  BadgeCheck,
  ChevronUp,
  CircleHelp,
  Flame,
  Gamepad2,
  RefreshCw,
  Sparkles,
  Swords,
  Target,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { useAuth, type AvatarId } from '@/context/auth-context';
import { useProgress, type UserProgress } from '@/context/progress-context';

type BoardView = 'overall' | 'weekly';
type BoardEntry = {
  id: string;
  name: string;
  title: string;
  score: number;
  level: number;
  streak: number;
  isCurrent?: boolean;
  badges: string[];
  color: string;
  avatar?: AvatarId;
};

const views: { id: BoardView; label: string; shortLabel: string; icon: typeof Trophy }[] = [
  { id: 'overall', label: 'Overall', shortLabel: 'ALL', icon: Trophy },
  { id: 'weekly', label: 'Weekly', shortLabel: 'WEEK', icon: Zap },
];

const benchmarkRoster = [
  { id: 'mira', name: 'Mira Shah', title: 'STACK RUNNER', overall: 2240, weekly: 480, streak: 31, badges: ['Top practice 1%', 'Hard clear'], color: 'pink' },
  { id: 'noah', name: 'Noah Kim', title: 'BUG HUNTER', overall: 1810, weekly: 420, streak: 24, badges: ['DSA main', 'Medium clear'], color: 'cyan' },
  { id: 'theo', name: 'Theo Mensah', title: 'SHIP CAPTAIN', overall: 1390, weekly: 360, streak: 18, badges: ['Topic clear', 'Closer'], color: 'yellow' },
  { id: 'ines', name: 'Ines Laurent', title: 'SIGNAL SCOUT', overall: 1010, weekly: 300, streak: 11, badges: ['Practice pace', 'Proof builder'], color: 'purple' },
  { id: 'ravi', name: 'Ravi Nair', title: 'QUERY CRAFTER', overall: 760, weekly: 240, streak: 8, badges: ['Early clear'], color: 'coral' },
  { id: 'jun', name: 'Jun Park', title: 'CODE APPRENTICE', overall: 440, weekly: 180, streak: 5, badges: ['First clear'], color: 'blue' },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'P';
}

function dateIsInCurrentWeek(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  const mondayOffset = (now.getDay() + 6) % 7;
  start.setDate(now.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return parsed >= start;
}

function safeProgress(progress: UserProgress): UserProgress {
  return {
    ...progress,
    xp: Number.isFinite(progress.xp) ? Math.max(0, progress.xp) : 0,
    level: Number.isFinite(progress.level) ? Math.max(1, progress.level) : 1,
    streak: Number.isFinite(progress.streak) ? Math.max(0, progress.streak) : 0,
    questionsAttempted: Number.isFinite(progress.questionsAttempted) ? Math.max(0, progress.questionsAttempted) : 0,
    questionsCorrect: Number.isFinite(progress.questionsCorrect) ? Math.max(0, progress.questionsCorrect) : 0,
    leaderboardPoints: Number.isFinite(progress.leaderboardPoints) ? Math.max(0, progress.leaderboardPoints) : 0,
    leaderboardPointEvents: Array.isArray(progress.leaderboardPointEvents) ? progress.leaderboardPointEvents : [],
    interviewAttempts: Number.isFinite(progress.interviewAttempts) ? Math.max(0, progress.interviewAttempts) : 0,
    activities: Array.isArray(progress.activities) ? progress.activities : [],
    applications: Array.isArray(progress.applications) ? progress.applications : [],
    completedRoadmapNodes: Array.isArray(progress.completedRoadmapNodes) ? progress.completedRoadmapNodes : [],
    interviewResults: Array.isArray(progress.interviewResults) ? progress.interviewResults : [],
  };
}

function getWeeklyScore(progress: UserProgress) {
  return progress.leaderboardPointEvents
    .filter(event => dateIsInCurrentWeek(event.timestamp))
    .reduce((total, event) => total + Math.max(0, event.points), 0);
}

function getBadges(progress: UserProgress) {
  const events = progress.leaderboardPointEvents.filter(event => event.source !== 'daily-mission');
  const badges: string[] = [];
  if (events.length > 0) badges.push('First clear');
  if (events.some(event => event.difficulty === 'Hard')) badges.push('Hard clear');
  if (events.length >= 10) badges.push('10 questions');
  if (progress.leaderboardPoints >= 300) badges.push('Practice pace');
  return badges.length ? badges.slice(0, 3) : ['Rookie Signal'];
}

function avatarColor(avatar?: AvatarId) {
  return avatar === 'cyber' ? 'cyan' : avatar === 'data' ? 'purple' : avatar === 'cloud' ? 'blue' : avatar === 'game' ? 'coral' : avatar === 'designer' ? 'pink' : 'lime';
}

function viewScore(progress: UserProgress, view: BoardView) {
  if (view === 'weekly') return getWeeklyScore(progress);
  return progress.leaderboardPoints;
}

function getPracticeStats(progress: UserProgress) {
  const practiceActivities = progress.activities
    .filter(activity => activity.type === 'practice' && activity.practice)
    .map(activity => activity.practice!);
  const attempted = practiceActivities.reduce((total, activity) => total + Math.max(0, activity.completed), 0);
  const correct = practiceActivities.reduce((total, activity) => total + Math.max(0, activity.correct), 0);
  const events = progress.leaderboardPointEvents.filter(event => event.source !== 'daily-mission');
  return {
    questionsCompleted: events.length,
    easy: events.filter(event => event.difficulty === 'Easy').length,
    medium: events.filter(event => event.difficulty === 'Medium').length,
    hard: events.filter(event => event.difficulty === 'Hard').length,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
  };
}

function makeEntries(progress: UserProgress, name: string, avatar: AvatarId | undefined, view: BoardView): BoardEntry[] {
  const current: BoardEntry = {
    id: 'current-player',
    name: name || 'Player one',
    title: 'CURRENT RUNNER',
    score: viewScore(progress, view),
    level: progress.level,
    streak: progress.streak,
    isCurrent: true,
    badges: getBadges(progress),
    color: avatarColor(avatar),
    avatar,
  };
  return [
    ...benchmarkRoster.map(({ id, name: rosterName, title, badges, color, overall, weekly, streak }) => ({
      id,
      name: rosterName,
      title,
      score: view === 'overall' ? overall : weekly,
      level: Math.floor(overall / 500) + 1,
      streak,
      badges,
      color,
      isCurrent: false,
    })),
    current,
  ].sort((a, b) => b.score - a.score || Number(Boolean(a.isCurrent)) - Number(Boolean(b.isCurrent)));
}

function formatScore(score: number) {
  return `${score.toLocaleString()} Practice Points`;
}

export function getPracticeLeaderboardPreview(progress: UserProgress) {
  const clean = safeProgress(progress);
  const entries = makeEntries(clean, '', undefined, 'overall');
  const currentIndex = Math.max(0, entries.findIndex(entry => entry.isCurrent));
  const current = entries[currentIndex];
  const playerAbove = entries[currentIndex - 1];
  return {
    rank: currentIndex + 1,
    points: current.score,
    level: clean.level,
    streak: clean.streak,
    pointsToOvertake: playerAbove ? Math.max(playerAbove.score - current.score, 0) : 0,
    playerAboveRank: playerAbove ? currentIndex : undefined,
  };
}

function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <header className="retro-page-header flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="pixel-label text-retro-pink">Hall of Champions / local circuit</p>
        <h1 className="mt-3 text-4xl font-semibold leading-none tracking-[-.07em] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

function BoardLoading() {
  return (
    <div className="leaderboard-loading space-y-7" aria-label="Loading leaderboard">
      <div><div className="leaderboard-skeleton h-3 w-36" /><div className="leaderboard-skeleton mt-4 h-12 w-80 max-w-full" /><div className="leaderboard-skeleton mt-3 h-4 w-[30rem] max-w-full" /></div>
      <div className="leaderboard-skeleton h-12 w-full" />
      <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]"><div className="leaderboard-skeleton h-64" /><div className="leaderboard-skeleton h-64" /></div>
      <div className="leaderboard-skeleton h-80" />
    </div>
  );
}

function BoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="leaderboard-error">
      <div className="leaderboard-error-mark"><CircleHelp size={22} /></div>
      <p className="pixel-label text-retro-pink">Board signal interrupted</p>
      <h2 className="mt-3 text-2xl font-semibold">Your run is safe.</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">The local progress signal could not be read. Reconnect the board and try again.</p>
      <button type="button" onClick={onRetry} className="button-secondary mt-6"><RefreshCw size={15} /> Retry board</button>
    </div>
  );
}

function BoardEmpty() {
  return (
    <section className="leaderboard-empty">
      <div className="leaderboard-empty-mark"><Target size={19} /></div>
      <div className="min-w-0">
        <p className="pixel-label text-retro-yellow">Awaiting first signal</p>
        <h2 className="mt-2 text-lg font-semibold">Your champion card is still blank.</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">Complete a Practice Lab question correctly and the board will start tracking your run.</p>
      </div>
      <Link href="/practice" className="button-secondary shrink-0"><Swords size={15} /> Start a rep <ArrowRight size={14} /></Link>
    </section>
  );
}

function Podium({ entries }: { entries: BoardEntry[] }) {
  const podium = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <section className="leaderboard-card leaderboard-podium-card" aria-labelledby="podium-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div><p className="pixel-label text-retro-cyan">Live local circuit</p><h2 id="podium-title" className="mt-2 text-xl font-semibold">The top three</h2></div>
        <Swords size={19} className="text-retro-pink" />
      </div>
      <div className="leaderboard-podium">
        {podium.map((entry, index) => {
          const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
          return (
            <div key={entry.id} className={`leaderboard-podium-slot leaderboard-podium-${rank} ${entry.isCurrent ? 'is-current' : ''}`}>
              <div className={`leaderboard-avatar leaderboard-avatar-${entry.color}`}><span>{initials(entry.name)}</span>{rank === 1 && <Trophy size={13} />}</div>
              <span className="leaderboard-rank">0{rank}</span>
              <strong className="truncate text-sm">{entry.name}</strong>
              <span className="leaderboard-podium-title">{entry.title}</span>
               <span className="leaderboard-podium-score">{formatScore(entry.score)}</span>
              <div className="leaderboard-podium-block"><span>{rank === 1 ? 'CHAMPION' : `RANK 0${rank}`}</span></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RankCard({ entry, rank, nextEntry, progress }: { entry: BoardEntry; rank: number; nextEntry?: BoardEntry; progress: UserProgress }) {
  const gap = nextEntry ? Math.max(nextEntry.score - entry.score, 0) : 0;
  const stats = getPracticeStats(progress);
  const completion = nextEntry ? Math.min(100, Math.round((entry.score / Math.max(nextEntry.score, 1)) * 100)) : 100;
  return (
    <section className="leaderboard-card leaderboard-rank-card" aria-labelledby="rank-title">
      <div className="flex items-start justify-between gap-3">
        <div><p className="pixel-label text-retro-lime">Your position</p><h2 id="rank-title" className="mt-2 text-xl font-semibold">Stay on the board.</h2></div>
        <div className="leaderboard-rank-number">#{rank}</div>
      </div>
       <div className="mt-6 flex items-center gap-3">
         <div className={`leaderboard-avatar leaderboard-avatar-${entry.color}`} aria-label={`${entry.avatar ?? 'coder'} avatar`}><UserRound size={18} /></div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{entry.name}</p><p className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{entry.title}</p></div>
         <span className="ml-auto font-mono text-xs font-bold text-retro-pink">{formatScore(entry.score)}</span>
      </div>
       <div className="mt-6 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.12em]"><span>{nextEntry ? `+${gap} points to overtake #${rank - 1}` : 'YOU ARE THE FINAL BOSS'}</span><span>{completion}%</span></div>
      <div className="leaderboard-progress-track mt-2"><div className="leaderboard-progress-fill" style={{ width: `${completion}%` }} /></div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/70 pt-4">
         <div><p className="leaderboard-mini-label">Questions cleared</p><p className="mt-1 font-mono text-sm font-bold">{stats.questionsCompleted}</p></div>
         <div><p className="leaderboard-mini-label">Difficulty mix</p><p className="mt-1 font-mono text-sm font-bold">{stats.easy}/{stats.medium}/{stats.hard}<span className="text-muted-foreground"> E/M/H</span></p></div>
      </div>
    </section>
  );
}

function BoardRows({ entries }: { entries: BoardEntry[] }) {
  return (
    <section className="leaderboard-card leaderboard-rows-card" aria-labelledby="rankings-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="pixel-label text-retro-yellow">Rankings feed</p><h2 id="rankings-title" className="mt-2 text-xl font-semibold">Every run counts.</h2></div>
        <span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">{entries.length} players / synced locally</span>
      </div>
       <div className="leaderboard-table-head"><span>Rank / runner</span><span>Badge loadout</span><span className="text-right">Practice Points</span></div>
      <div className="divide-y divide-border/70">
        {entries.map((entry, index) => (
          <div key={entry.id} className={`leaderboard-row ${entry.isCurrent ? 'is-current' : ''}`}>
            <div className="flex min-w-0 items-center gap-3">
              <span className={`leaderboard-row-rank ${index < 3 ? 'top-rank' : ''}`}>{String(index + 1).padStart(2, '0')}</span>
               <div className={`leaderboard-avatar leaderboard-avatar-${entry.color} leaderboard-avatar-small`} aria-label={`${entry.avatar ?? 'runner'} avatar`}>{entry.isCurrent ? <UserRound size={15} /> : initials(entry.name)}</div>
               <div className="min-w-0"><p className="truncate text-sm font-semibold">{entry.name}{entry.isCurrent && <span className="ml-2 leaderboard-you">YOU</span>}</p><p className="truncate font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">{entry.title} · LV {entry.level}</p></div>
            </div>
             <div className="leaderboard-badges"><span className="leaderboard-streak"><Flame size={12} /> {entry.streak}d</span>{entry.badges.map(badge => <span key={badge} className="leaderboard-badge"><BadgeCheck size={12} /> {badge}</span>)}</div>
             <div className="text-right"><p className="font-mono text-sm font-bold">{formatScore(entry.score)}</p>{index === 0 && <span className="leaderboard-lead"><ChevronUp size={11} /> LEAD</span>}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Challenge({ progress }: { progress: UserProgress }) {
  const weekly = getWeeklyScore(progress);
  const target = 300;
  const percent = Math.min(100, Math.round((weekly / target) * 100));
  return (
    <section className="leaderboard-challenge">
      <div className="leaderboard-challenge-orbit"><Gamepad2 size={23} /></div>
      <div className="relative">
        <p className="pixel-label text-retro-ink">Weekly boss challenge</p>
        <h2 className="mt-2 text-xl font-semibold text-retro-ink">Clear the warm-up lap.</h2>
         <p className="mt-2 max-w-md text-sm leading-relaxed text-retro-ink/70">Earn 300 Practice Lab points before the week resets. Only correctly completed questions count.</p>
          <div className="mt-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.14em] text-retro-ink"><span>{weekly} / {target} Practice Points</span><span>{percent}%</span></div>
        <div className="leaderboard-challenge-track mt-2"><div className="leaderboard-challenge-fill" style={{ width: `${percent}%` }} /></div>
        <Link href="/practice" className="button-primary mt-5"><Swords size={15} /> Enter practice arena <ArrowRight size={14} /></Link>
      </div>
    </section>
  );
}

export default function Leaderboard() {
  const progress = useProgress();
  const { user } = useAuth();
  const [view, setView] = useState<BoardView>('overall');
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('ready'), 220);
    return () => window.clearTimeout(timer);
  }, [reloadKey]);

  const computed = useMemo(() => {
    try {
      const clean = safeProgress(progress);
       const entries = makeEntries(clean, user?.name ?? '', user?.avatar, view);
      const currentIndex = Math.max(0, entries.findIndex(entry => entry.isCurrent));
      return { progress: clean, entries, rank: currentIndex + 1, current: entries[currentIndex], next: entries[currentIndex - 1] };
    } catch {
      return null;
    }
  }, [progress, user?.name, view]);

  if (phase === 'loading') return <BoardLoading />;
  if (!computed) return <BoardError onRetry={() => { setPhase('loading'); setReloadKey(key => key + 1); }} />;

  const { entries, rank, current, next, progress: cleanProgress } = computed;
  const currentView = views.find(item => item.id === view) ?? views[0];
  const practiceStats = getPracticeStats(cleanProgress);
  const hasLocalSignal = cleanProgress.leaderboardPointEvents.length > 0 || cleanProgress.leaderboardPoints > 0;

  return (
    <div className="stagger leaderboard-page space-y-7">
      <PageHeader
        title="Practice Lab leaderboard."
        description="A separate competition powered by correctly completed Practice Lab questions and bonus Daily Mission clears. Easy questions are worth 10 points, Medium 20, and Hard 30."
        action={<div className="hud-chip"><span className="hud-dot" /> Local signal online</div>}
      />

      <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard views">
        {views.map(item => {
          const Icon = item.icon;
          return <button type="button" key={item.id} role="tab" aria-selected={view === item.id} onClick={() => setView(item.id)} className={`leaderboard-tab ${view === item.id ? 'is-active' : ''}`}><Icon size={15} /><span className="hidden sm:inline">{item.label}</span><span className="sm:hidden">{item.shortLabel}</span></button>;
        })}
      </div>

      <div className="leaderboard-stat-strip">
        <div><span className="leaderboard-strip-label">Current rank</span><strong>#{rank}</strong><span className="leaderboard-strip-detail">of {entries.length}</span></div>
        <div><span className="leaderboard-strip-label">Leaderboard points</span><strong>{formatScore(current.score)}</strong><span className="leaderboard-strip-detail">{currentView.label}</span></div>
        <div><span className="leaderboard-strip-label">Questions completed</span><strong>{practiceStats.questionsCompleted}</strong><span className="leaderboard-strip-detail">{practiceStats.easy} easy · {practiceStats.medium} medium · {practiceStats.hard} hard</span></div>
        <div><span className="leaderboard-strip-label">Practice accuracy</span><strong>{practiceStats.accuracy}%</strong><span className="leaderboard-strip-detail">all Practice Lab attempts</span></div>
      </div>

      {!hasLocalSignal && <BoardEmpty />}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
         <Podium entries={entries} />
         <RankCard entry={current} rank={rank} nextEntry={next} progress={cleanProgress} />
      </div>

      <BoardRows entries={entries} />
      <Challenge progress={cleanProgress} />

       <div className="leaderboard-footer-note"><Sparkles size={15} className="text-retro-pink" /><span>Practice Points update immediately after a correct answer or Daily Mission clear and are never awarded twice for the same reward.</span><Link href="/practice" className="font-semibold text-primary hover:underline">Open Practice Lab <ArrowRight size={13} /></Link></div>
    </div>
  );
}