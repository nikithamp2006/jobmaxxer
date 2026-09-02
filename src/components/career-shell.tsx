import { Bell, BriefcaseBusiness, ChevronRight, Code2, Compass, FileText, Gauge, Gamepad2, Menu, MessageSquare, Moon, PanelLeftClose, Settings, Target, Trophy, X, Zap, Map, Swords, Star, Flame, Eye } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { useProgress } from '@/context/progress-context';

const sampleNotifications = [
  { id: 'demo-notif-1', icon: <Star size={14} />, message: 'New role match: Backend Engineer Intern at CloudPeak Systems — 90% match.', time: '12m ago' },
  { id: 'demo-notif-2', icon: <BriefcaseBusiness size={14} />, message: 'Application update: Freshworks moved you to the interview stage.', time: '1h ago' },
  { id: 'demo-notif-3', icon: <Eye size={14} />, message: 'Your resume was viewed by a recruiter at Zoho.', time: '3h ago' },
  { id: 'demo-notif-4', icon: <Trophy size={14} />, message: 'You climbed to rank #12 on the weekly leaderboard.', time: '6h ago' },
  { id: 'demo-notif-5', icon: <Flame size={14} />, message: 'Streak reminder: complete a warm-up run to keep your 5-day streak.', time: 'Yesterday' },
];

const navItems = [
  { href: '/', label: 'Command center', icon: Gauge },
  { href: '/discover', label: 'Discover roles', icon: Compass },
  { href: '/practice', label: 'Practice lab', icon: Target },
  { href: '/mock-interview', label: 'Mock interview', icon: Gamepad2 },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/interview-roadmap', label: 'Prep roadmap', icon: Map },
  { href: '/resume', label: 'Resume analyzer', icon: FileText },
  { href: '/soft-skills', label: 'Soft Skills', icon: MessageSquare },
  { href: '/dsa', label: 'DSA', icon: Code2 },
  { href: '/applications', label: 'Applications', icon: BriefcaseBusiness },
];

export function CareerShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { notifications, markAllNotificationsRead } = useProgress();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const toggleNotifications = () => { setNotifOpen(value => !value); markAllNotificationsRead(); };
  return (
    <div className="career-shell noise flex min-h-[100dvh] text-foreground">
      <aside className={`${compact ? 'lg:w-[84px]' : 'lg:w-[248px]'} fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 lg:flex lg:flex-col`}>
        <SidebarContent compact={compact} location={location} />
        <button data-testid="button-collapse-sidebar" onClick={() => setCompact(!compact)} className="mb-5 ml-5 mr-5 flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <PanelLeftClose size={15} className={compact ? 'rotate-180' : ''} />
          {!compact && 'Collapse sidebar'}
        </button>
      </aside>
      {mobileOpen && <div data-testid="mobile-backdrop" onClick={closeMobile} className="fixed inset-0 z-40 bg-sidebar/40 lg:hidden" />}
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:hidden`}>
         <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <button data-testid="button-close-mobile-nav" onClick={closeMobile} className="rounded-md p-2 hover:bg-sidebar-accent"><X size={18} /></button>
        </div>
        <SidebarContent compact={false} location={location} onNavigate={closeMobile} />
      </aside>
      <div className={`${compact ? 'lg:pl-[84px]' : 'lg:pl-[248px]'} flex min-w-0 flex-1 flex-col transition-[padding] duration-300`}>
         <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button data-testid="button-open-mobile-nav" onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-muted lg:hidden"><Menu size={20} /></button>
             <div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex"><span className="font-mono text-accent">~/career</span><ChevronRight size={13} /><span>{location === '/' ? 'command-center' : location.slice(1).replace('-', ' ')}</span><span className="ml-1 h-2 w-2 bg-accent" /></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <button data-testid="button-toggle-theme" onClick={() => document.documentElement.classList.toggle('dark')} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Moon size={17} /></button>
            <div className="relative">
              <button data-testid="button-notifications" aria-label={`${notifications.filter(notification => !notification.read).length} unread notifications`} aria-expanded={notifOpen} onClick={toggleNotifications} className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Bell size={17} />{notifications.some(notification => !notification.read) && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}</button>
              {notifOpen && <>
                <div data-testid="backdrop-notifications" onClick={() => setNotifOpen(false)} className="fixed inset-0 z-40" />
                <div data-testid="panel-notifications" className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-md">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Notifications</span>
                    <button data-testid="button-close-notifications" onClick={() => setNotifOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={14} /></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {sampleNotifications.map(notification => <div key={notification.id} data-testid={`notification-${notification.id}`} className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-foreground">{notification.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug text-foreground">{notification.message}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>)}
                  </div>
                </div>
              </>}
            </div>
             <Link data-testid="link-profile-header" href="/profile" className="flex items-center gap-2 border-l border-border pl-3">
               <span data-testid="text-header-initials" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials(user?.name)}</span>
               <span data-testid="text-header-name" className="hidden text-sm font-semibold sm:block">{user?.name}</span>
            </Link>
             <button data-testid="button-logout" type="button" onClick={logout} className="border-l border-border pl-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive">Log out</button>
          </div>
        </header>
        <main className="page-enter mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">{children}</main>
        <div className="h-7" />
      </div>
    </div>
  );
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'CO';
}

function Logo() {
  return <Link data-testid="link-logo" href="/" className="group flex items-center gap-3 px-1 py-1"><span className="relative grid h-9 w-9 place-items-center rounded-sm border-2 border-sidebar-foreground/20 bg-accent text-primary shadow-[3px_3px_0_#f27c9d] transition-transform group-hover:-translate-y-0.5"><Swords size={18} strokeWidth={2.7} /><span className="absolute -right-1 -top-1 h-2 w-2 bg-sidebar-foreground" /></span><span className="font-bold tracking-[-0.05em]">FINAL<span className="text-accent">BOSS</span><span className="ml-2 font-mono text-[9px] text-sidebar-foreground/40">OS / 01</span></span></Link>;
}

function SidebarContent({ compact, location, onNavigate }: { compact: boolean; location: string; onNavigate?: () => void }) {
  return <>
     <div className="px-5 py-6"><Logo /><div className={`${compact ? 'sr-only' : ''} mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.16em] text-sidebar-foreground/35`}><span className="h-2 w-2 bg-accent" /> career boss fight / online</div></div>
    <div className="px-3">
       {!compact && <div className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/35">Your workspace /</div>}
      <nav className="space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? location === '/' : location.startsWith(href);
          return <Link data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={onNavigate} key={href} href={href} className={`${active ? 'bg-sidebar-primary font-medium text-sidebar-primary-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'} flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${compact ? 'justify-center' : ''}`}><Icon size={17} strokeWidth={active ? 2.2 : 1.7} /><span className={compact ? 'sr-only' : ''}>{label}</span>{active && !compact && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}</Link>;
        })}
      </nav>
    </div>
     {!compact && <div className="mt-auto space-y-3 px-5 pb-5">
       <div className="relative overflow-hidden rounded-sm border border-sidebar-border bg-sidebar-accent/50 p-4">
         <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full border-4 border-accent/20" />
         <div className="mb-2 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/45">Weekly signal</span><span className="flex items-center gap-1 text-xs text-accent"><Zap size={11} /> +12%</span></div>
         <div className="mb-3 h-2 overflow-hidden bg-sidebar-border"><div className="h-full w-[68%] bg-accent" /></div>
         <p className="text-xs leading-relaxed text-sidebar-foreground/60">You are building a stronger case for product roles.</p>
       </div>
       <Link data-testid="link-settings-sidebar" href="/settings" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"><Settings size={17} /> Settings</Link>
     </div>}
  </>;
}