import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Swords, UserRound, Zap } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { type AvatarId, type CareerProfile, useAuth } from '@/context/auth-context';

type QuestKey = 'specialization' | 'skills' | 'programmingLevel' | 'target';

const specializations = ['Software Development', 'Artificial Intelligence / Machine Learning', 'Data Science', 'Cybersecurity', 'Web Development', 'Cloud Computing / DevOps', 'Mobile App Development', 'Game Development', 'UI/UX & Frontend', 'Still Exploring'];
const skillOptions = ['C / C++', 'Java', 'Python', 'JavaScript / TypeScript', 'HTML / CSS', 'React', 'Node.js', 'SQL / Databases', 'Git / GitHub', 'Machine Learning', 'Data Structures & Algorithms'];
const levelOptions = [
  { value: 'Beginner', detail: 'Learning the map', xp: '+80 XP' },
  { value: 'Intermediate', detail: 'Shipping small quests', xp: '+160 XP' },
  { value: 'Advanced', detail: 'Ready for boss phases', xp: '+240 XP' },
] as const;
const targets = ['Software Engineer', 'AI / ML Engineer', 'Data Scientist', 'Cybersecurity Engineer', 'Full-Stack Developer', 'Cloud / DevOps Engineer', 'Mobile Developer', 'Game Developer', 'Get an Internship', 'Prepare for Placements', 'Still Exploring'];
const avatarOptions: { id: AvatarId; label: string; detail: string }[] = [
  { id: 'coder', label: 'Code Warrior', detail: 'Builds fearless solutions' },
  { id: 'cyber', label: 'Cyber Guardian', detail: 'Defends every system' },
  { id: 'data', label: 'Data Sage', detail: 'Finds the hidden signal' },
  { id: 'cloud', label: 'Cloud Ranger', detail: 'Ships beyond the horizon' },
  { id: 'game', label: 'Game Maker', detail: 'Turns ideas into worlds' },
  { id: 'designer', label: 'Pixel Designer', detail: 'Makes complexity feel clear' },
];

function AuthFrame({ children, kicker, wide = false }: { children: ReactNode; kicker: string; wide?: boolean }) {
  return <main className="boss-auth noise">
    <div className="boss-auth-grid" aria-hidden="true" />
    <div className={`boss-auth-frame ${wide ? 'boss-auth-frame-wide' : ''}`}>
      <Link data-testid="link-auth-logo" href="/login" className="boss-logo"><span className="boss-logo-mark"><Swords size={18} /></span><span>FINAL<span>BOSS</span></span><small>CAREER OS / BUILD 01</small></Link>
      <div className="boss-kicker"><i /> {kicker}</div>
      {children}
      <p className="boss-footer">FRONTEND DEMO · PROGRESS SAVED TO THIS DEVICE · NO ACCOUNT REQUIRED</p>
    </div>
  </main>;
}

function PixelAdventurer({ specialization = '', avatar = 'coder' as AvatarId }: { specialization?: string; avatar?: AvatarId }) {
  const isData = specialization.toLowerCase().includes('data') || specialization.toLowerCase().includes('ai');
  const isSecurity = specialization.toLowerCase().includes('cyber');
  const isFrontend = specialization.toLowerCase().includes('front') || specialization.toLowerCase().includes('full');
  return <div className={`pixel-hero pixel-avatar-${avatar}`} aria-label={`${avatarOptions.find(option => option.id === avatar)?.label ?? 'Player'} pixel avatar`} role="img">
    <div className="pixel-stars" aria-hidden="true"><b /><b /><b /><b /></div>
    <div className="pixel-portrait">
      <span className="pixel-shadow" />
      <span className="pixel-cape" />
      <span className="pixel-body" />
      <span className="pixel-head" />
      <span className="pixel-hair" />
      <span className="pixel-face" />
      <span className="pixel-eye pixel-eye-one" /><span className="pixel-eye pixel-eye-two" />
      <span className="pixel-arm" /><span className="pixel-laptop" />
      {isFrontend && <span className="pixel-accessory pixel-brackets">&lt;/&gt;</span>}
      {isData && <span className="pixel-accessory pixel-chart">+ +</span>}
      {isSecurity && <span className="pixel-accessory pixel-shield">◆</span>}
      {avatar === 'cloud' && <span className="pixel-accessory pixel-cloud">☁</span>}
      {avatar === 'game' && <span className="pixel-accessory pixel-game">★</span>}
      {avatar === 'designer' && <span className="pixel-accessory pixel-designer">✦</span>}
    </div>
    <div className="pixel-caption"><span>PLAYER AVATAR</span><strong>{specialization ? 'LOADOUT UPDATED' : 'AWAITING CLASS'}</strong></div>
  </div>;
}

function StatusLines({ phase }: { phase: 1 | 2 | 3 }) {
  return <div className="boss-auth-status" role="status" aria-live="polite">
    <p className={phase > 1 ? 'done' : phase === 1 ? 'active' : ''}><span>{phase > 1 ? 'OK' : '01'}</span> AUTHENTICATING PLAYER</p>
    <p className={phase > 2 ? 'done' : phase === 2 ? 'active' : ''}><span>{phase > 2 ? 'OK' : '02'}</span> LOADING CAREER PROFILE</p>
    <p className={phase === 3 ? 'active' : ''}><span>{phase === 3 ? 'OK' : '03'}</span> LOGIN SUCCESSFUL</p>
  </div>;
}

export function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loginPhase, setLoginPhase] = useState<1 | 2 | 3>(1);
  const [forgot, setForgot] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || !form.password) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setLoginPhase(1);
    window.setTimeout(() => {
      setLoginPhase(2);
      window.setTimeout(() => {
        setLoginPhase(3);
        setStatus('success');
        window.setTimeout(() => void login(form.email).then(() => setLocation('/')), 800);
      }, 700);
    }, 700);
  };

  return <AuthFrame kicker={status === 'loading' ? 'SIGNAL LINK / AUTHENTICATING' : status === 'success' ? 'SIGNAL LINK / LOCKED' : 'SIGNAL LINK / READY'}>
    <section className="boss-login-layout">
      <div className="boss-login-copy">
        <p className="boss-eyebrow">A CAREER RPG FOR CS BUILDERS</p>
        <h1>FINAL<br /><em>BOSS</em></h1>
        <p className="boss-subtitle">YOUR CAREER.<br />YOUR QUEST.<br /><strong>YOUR BOSS FIGHT.</strong></p>
        <p className="boss-lede">The job hunt is not a waiting room. It is a playable system of reps, choices, and proof. Build the character you want to bring to the fight.</p>
        <PixelAdventurer />
        <div className="boss-console"><span><i /> LOCAL RUN</span><span>XP TRACKING ON</span><span>NO LOGIN WALLS</span></div>
      </div>
      <div className="boss-panel">
         <div className="boss-panel-heading"><div><p className="boss-eyebrow">PLAYER LOGIN</p><h2>PLAYER LOGIN</h2></div><LockKeyhole size={21} /></div>
        <form onSubmit={submit} className="boss-form" noValidate>
          <label><span><Mail size={13} /> Player ID / email</span><input data-testid="input-login-email" type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@yourmail.com" aria-invalid={status === 'error'} /></label>
          <label><span><LockKeyhole size={13} /> Secret key / password</span><div className="boss-password"><input data-testid="input-login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Any password works in demo mode" aria-invalid={status === 'error'} /><button data-testid="button-toggle-login-password" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {status === 'error' && <p data-testid="status-login-error" className="boss-error" role="alert">Enter a valid email and password to continue.</p>}
          {forgot && <p className="boss-inline-note" role="status">Demo mode: enter any email and password to re-enter the arena.</p>}
          {status !== 'idle' && status !== 'error' && <StatusLines phase={loginPhase} />}
          <button data-testid="button-login-submit" disabled={status === 'loading' || status === 'success'} className="boss-submit">{status === 'loading' ? 'AUTHENTICATING...' : status === 'success' ? <><Check size={16} /> LOGIN SUCCESSFUL</> : <>ENTER THE ARENA <ArrowRight size={16} /></>}</button>
        </form>
        <button type="button" className="boss-forgot" onClick={() => setForgot(true)}>Forgot Password?</button>
        <p className="boss-switch">New player? <Link data-testid="link-register" href="/register">CREATE CHARACTER <ArrowRight size={14} /></Link></p>
      </div>
    </section>
  </AuthFrame>;
}

type RegisterForm = CareerProfile & { password: string; confirmPassword: string };
const initialForm: RegisterForm = { name: '', email: '', city: '', field: 'Computer Science', path: '', skillLevel: '', goal: '', specialization: '', skills: [], programmingLevel: '', target: '', avatar: 'coder', password: '', confirmPassword: '' };

export function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [creationStage, setCreationStage] = useState(0);
  const [created, setCreated] = useState(false);
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const identityReady = form.name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(form.email) && form.password.length >= 4 && form.password === form.confirmPassword;
  const questValues: Record<QuestKey, string | string[]> = { specialization: form.specialization ?? '', skills: form.skills ?? [], programmingLevel: form.programmingLevel ?? '', target: form.target ?? '' };
  const quests = useMemo(() => [
     { key: 'specialization' as QuestKey, eyebrow: 'QUEST 01 / 04 · CS SPECIALIZATION', prompt: 'WHICH AREA OF COMPUTER SCIENCE INTERESTS YOU THE MOST?', help: 'Choose one specialization to set your character class.' },
     { key: 'skills' as QuestKey, eyebrow: 'QUEST 02 / 04 · TECHNICAL SKILLS', prompt: 'WHICH TECHNICAL SKILLS DO YOU CURRENTLY HAVE?', help: 'Select every skill in your current loadout.' },
     { key: 'programmingLevel' as QuestKey, eyebrow: 'QUEST 03 / 04 · PROGRAMMING LEVEL', prompt: 'HOW WOULD YOU RATE YOUR PROGRAMMING SKILLS?', help: 'Choose the level that best matches what you can build today.' },
     { key: 'target' as QuestKey, eyebrow: 'QUEST 04 / 04 · CAREER TARGET', prompt: 'WHAT IS YOUR MAIN COMPUTER SCIENCE CAREER GOAL?', help: 'Your roadmap and role radar will tune to this target.' },
  ], []);
  const quest = quests[step - 1];
  const setValue = <K extends keyof RegisterForm,>(key: K, value: RegisterForm[K]) => setForm(current => ({ ...current, [key]: value }));
  const selected = quest ? questValues[quest.key] : '';
  const canNext = step === 0 ? identityReady : quest?.key === 'skills' ? Array.isArray(selected) && selected.length > 0 : Boolean(selected);

  useEffect(() => {
    if (!creating) return;
    const ticker = window.setInterval(() => setCreationStage(value => Math.min(value + 1, 3)), 620);
    const finish = window.setTimeout(() => setCreated(true), 2450);
    return () => { window.clearInterval(ticker); window.clearTimeout(finish); };
  }, [creating]);

  const next = () => {
    if (!canNext) return;
    if (step < quests.length) setStep(value => value + 1);
    else { setCreating(true); setCreationStage(0); }
  };
  const back = () => setStep(value => Math.max(0, value - 1));
  const toggleSkill = (skill: string) => setValue('skills', (form.skills ?? []).includes(skill) ? (form.skills ?? []).filter(item => item !== skill) : [...(form.skills ?? []), skill]);
  const className = mapClass(form);
  const finishRegistration = () => void register({ ...form, field: 'Computer Science', path: form.specialization ?? '', skillLevel: form.programmingLevel ?? '', goal: form.target ?? '', className }).then(() => setLocation('/'));

  if (creating) return <AuthFrame kicker={created ? 'CHARACTER FORGE / COMPLETE' : 'CHARACTER FORGE / SCANNING'} wide><section className={`boss-creation ${created ? 'is-ready' : ''}`}>
    {!created ? <><div className="boss-forge-orb"><Zap size={27} /></div><p className="boss-eyebrow">CHARACTER FORGE / {creationStage + 1} OF 04</p><h1>Building your<br /><em>career weapon.</em></h1><div className="boss-forge-lines">{['READING PLAYER IDENTITY', 'ASSEMBLING CLASS LOADOUT', 'TUNING QUEST PRIORITIES', 'OPENING CAREER OS'].map((line, index) => <p className={index <= creationStage ? 'active' : ''} key={line}><span>{index <= creationStage ? 'OK' : '--'}</span>{line}</p>)}</div></> : <><div className="boss-result-top"><PixelAdventurer specialization={form.specialization} /><div><p className="boss-eyebrow">CHARACTER CREATED</p><h1>Welcome, <em>{form.name.split(' ')[0]}.</em></h1><p className="boss-result-copy">Your build is locked in. The arena is ready when you are.</p></div></div><div className="boss-character-sheet"><div><span>PLAYER</span><strong>{form.name.toUpperCase()}</strong></div><div><span>CLASS</span><strong>{className}</strong></div><div><span>SPECIALIZATION</span><strong>{form.specialization}</strong></div><div><span>LEVEL</span><strong>{form.programmingLevel}</strong></div><div><span>SKILLS</span><strong>{(form.skills ?? []).join(' · ')}</strong></div><div><span>BOSS TARGET</span><strong>{form.target}</strong></div></div><button data-testid="button-enter-career-os" className="boss-submit" onClick={finishRegistration}>ENTER CAREER OS <ArrowRight size={16} /></button></>}</section></AuthFrame>;

  return <AuthFrame kicker={step === 0 ? 'CHARACTER CREATION / START' : `CAREER QUESTS / ${String(step).padStart(2, '0')} OF 04`} wide><section className="boss-register">
    <div className="boss-register-main">
       <div className="boss-register-heading"><div><p className="boss-eyebrow">{step === 0 ? 'CHARACTER CREATION · PLAYER IDENTITY' : quest?.eyebrow}</p><h1>{step === 0 ? <>CHARACTER<br /><em>CREATION</em></> : quest?.prompt}</h1><p className="boss-question-help">{step === 0 ? 'BUILD YOUR CAREER HERO · Enter the identity for your playable career character.' : quest?.help}</p></div><div className="boss-counter"><strong>{String(step).padStart(2, '0')}</strong><span>/ 04</span></div></div>
      <div className="boss-step-track" aria-label={`Character creation progress, ${step} of 4`}><div style={{ width: `${(step / 4) * 100}%` }} /></div>
      {step === 0 ? <div className="boss-details-grid">
        <label><span><UserRound size={13} /> Player name</span><input data-testid="input-register-name" value={form.name} onChange={event => setValue('name', event.target.value)} placeholder="How should the arena call you?" /></label>
        <label><span><Mail size={13} /> Player ID / email</span><input data-testid="input-register-email" type="email" value={form.email} onChange={event => setValue('email', event.target.value)} placeholder="you@yourmail.com" /></label>
        <label><span><LockKeyhole size={13} /> Secret key / password</span><input data-testid="input-register-password" type="password" value={form.password} onChange={event => setValue('password', event.target.value)} placeholder="4+ characters for demo mode" /></label>
        <label><span><LockKeyhole size={13} /> Confirm secret key</span><input data-testid="input-register-confirm-password" type="password" value={form.confirmPassword} onChange={event => setValue('confirmPassword', event.target.value)} placeholder="Type it again" /></label>
         {!identityReady && form.confirmPassword && <p className="boss-error">⚠ ENTER YOUR PLAYER NAME · VALID EMAIL · MATCHING PASSWORDS REQUIRED</p>}
        <div className="boss-avatar-picker"><div className="boss-avatar-picker-heading"><span>Choose your avatar</span><small>YOUR CHARACTER, YOUR LOADOUT</small></div><div className="boss-avatar-grid">{avatarOptions.map(option => <button key={option.id} type="button" data-testid={`button-avatar-${option.id}`} aria-pressed={form.avatar === option.id} className={`boss-avatar-option ${form.avatar === option.id ? 'selected' : ''}`} onClick={() => setValue('avatar', option.id)}><span className={`boss-avatar-mini pixel-avatar-${option.id}`} aria-hidden="true"><i /><b /></span><strong>{option.label}</strong><small>{option.detail}</small></button>)}</div></div>
      </div> : <QuestContent quest={quest!} form={form} selected={selected} setValue={setValue} toggleSkill={toggleSkill} />}
      <div className="boss-register-actions">{step > 0 ? <button data-testid="button-register-back" type="button" onClick={back} className="boss-back"><ArrowLeft size={15} /> BACK</button> : <span className="boss-register-note"><Zap size={13} /> NO REAL ACCOUNT REQUIRED</span>}<button data-testid="button-register-next" type="button" disabled={!canNext} onClick={next} className="boss-submit">{step === quests.length ? <>FORGE MY CHARACTER <Zap size={15} /></> : <>NEXT QUEST <ArrowRight size={15} /></>}</button></div>
      <p className="boss-switch">Already have a character? <Link data-testid="link-login" href="/login">RETURN TO LOGIN <ArrowRight size={14} /></Link></p>
    </div>
    <aside className="boss-register-aside"><PixelAdventurer specialization={form.specialization} avatar={form.avatar} /><div className="boss-mini-stats"><span><b>{form.skills?.length ?? 0}</b> SKILLS</span><span><b>{step}</b> / 04 QUESTS</span></div><p>Your avatar follows you into the career arena.</p></aside>
  </section></AuthFrame>;
}

function QuestContent({ quest, form, selected, setValue, toggleSkill }: { quest: { key: QuestKey }; form: RegisterForm; selected: string | string[]; setValue: <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => void; toggleSkill: (skill: string) => void }) {
  if (quest.key === 'skills') return <div className="boss-skill-grid" role="group" aria-label="Technical skills">{skillOptions.map((skill, index) => <button data-testid={`button-quest-skills-${index}`} key={skill} type="button" role="checkbox" aria-checked={(form.skills ?? []).includes(skill)} className={`boss-option boss-skill-option ${(form.skills ?? []).includes(skill) ? 'selected' : ''}`} onClick={() => toggleSkill(skill)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{skill}</strong>{(form.skills ?? []).includes(skill) && <Check size={16} />}</button>)}</div>;
  if (quest.key === 'programmingLevel') return <div className="boss-level-grid" role="radiogroup" aria-label="Programming level">{levelOptions.map((level, index) => <button data-testid={`button-quest-programmingLevel-${index}`} type="button" role="radio" aria-checked={selected === level.value} className={`boss-level-card ${selected === level.value ? 'selected' : ''}`} onClick={() => setValue('programmingLevel', level.value)} key={level.value}><span className="boss-level-number">{index + 1}</span><strong>{level.value}</strong><small>{level.detail}</small><b>{level.xp}</b></button>)}</div>;
  const options = quest.key === 'specialization' ? specializations : targets;
  return <div className="boss-option-grid" role="radiogroup" aria-label={quest.key === 'specialization' ? 'CS specialization' : 'Career target'}>{options.map((option, index) => <button data-testid={`button-quest-${quest.key}-${index}`} key={option} type="button" role="radio" aria-checked={selected === option} className={`boss-option ${selected === option ? 'selected' : ''}`} onClick={() => setValue(quest.key, option)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{option}</strong>{selected === option && <Check size={16} />}</button>)}</div>;
}

function mapClass(profile: Partial<CareerProfile>) {
  const specialization = profile.specialization?.toLowerCase() ?? '';
  if (specialization.includes('software')) return 'CODE WARRIOR';
  if (specialization.includes('ai') || specialization.includes('machine')) return 'AI EXPLORER';
  if (specialization.includes('data')) return 'DATA ANALYST';
  if (specialization.includes('cyber')) return 'CYBER GUARDIAN';
  if (specialization.includes('web')) return 'WEB ARCHITECT';
  if (specialization.includes('cloud') || specialization.includes('devops')) return 'CLOUD ENGINEER';
  if (specialization.includes('mobile')) return 'APP BUILDER';
  if (specialization.includes('game')) return 'GAME DEVELOPER';
  if (specialization.includes('ui') || specialization.includes('frontend')) return 'DIGITAL DESIGNER';
  if (specialization.includes('exploring')) return 'CODE APPRENTICE';
  return profile.programmingLevel === 'Advanced' ? 'CODE WARRIOR' : 'CODE APPRENTICE';
}