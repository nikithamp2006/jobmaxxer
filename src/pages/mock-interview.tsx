import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Camera, CameraOff, Check, Clock3, Mic, MicOff, PhoneOff, RotateCcw, Sparkles, Trophy, Video, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { useProgress, type InterviewResult } from '@/context/progress-context';
import { useAuth } from '@/context/auth-context';

type Role = 'frontend' | 'backend' | 'data' | 'ai_ml';
type InterviewType = 'technical' | 'behavioral' | 'hr' | 'product';
type Difficulty = 'easy' | 'medium' | 'hard';
type Stage = 'setup' | 'live' | 'evaluating' | 'results';
type Question = { id: string; role: Role; type: InterviewType; difficulty: Difficulty; question: string; concepts: string[]; modelAnswer: string };
type Answer = Question & { answer: string; score: number; conceptsFound: string[] };

const roleMeta: Record<Role, { label: string; description: string; topics: string[] }> = {
  frontend: { label: 'Frontend Developer', description: 'React, JavaScript, browsers, and UI performance.', topics: ['React', 'JavaScript', 'accessibility', 'performance'] },
  backend: { label: 'Backend Developer', description: 'APIs, data stores, reliability, and system design.', topics: ['APIs', 'databases', 'caching', 'reliability'] },
  data: { label: 'Data Scientist', description: 'Statistics, modeling, experimentation, and data quality.', topics: ['statistics', 'experimentation', 'modeling', 'data quality'] },
  ai_ml: { label: 'AI/ML Engineer', description: 'Training, evaluation, deployment, and model tradeoffs.', topics: ['training', 'evaluation', 'deployment', 'MLOps'] },
};
const typeMeta: Record<InterviewType, { label: string; description: string }> = {
  technical: { label: 'Technical', description: 'Programming, CS fundamentals, and role-specific systems.' },
  behavioral: { label: 'Behavioral', description: 'Teamwork, conflict, leadership, and STAR stories.' },
  hr: { label: 'HR', description: 'Motivation, strengths, goals, and company fit.' },
  product: { label: 'Product / Case', description: 'Product thinking, prioritization, and analytical reasoning.' },
};
const difficultyMeta: Record<Difficulty, string> = { easy: 'Foundations', medium: 'Applied', hard: 'Advanced' };
const countOptions = [5, 10, 15];
const technicalSeeds: Record<Role, string[]> = {
  frontend: ['Explain the difference between React state and props.', 'How would you debug and optimize a slow web application?', 'How do you build an accessible form?', 'How would you prevent unnecessary React re-renders?', 'Describe a frontend architecture tradeoff.'],
  backend: ['How would you design a REST API for a to-do application?', 'How do you handle database migrations safely in production?', 'Explain SQL and NoSQL tradeoffs.', 'How would you design a rate limiter?', 'Describe a production incident you diagnosed.'],
  data: ['How do you decide which statistical test to use?', 'Explain the bias-variance tradeoff.', 'How would you detect data quality issues?', 'Walk me through designing an A/B test.', 'How do you communicate model uncertainty?'],
  ai_ml: ['What causes overfitting and how do you address it?', 'How would you evaluate a model beyond accuracy?', 'Walk me through deploying a model reliably.', 'How do you monitor a model for drift?', 'Describe an ML project end to end.'],
};
const typeSeeds: Record<Exclude<InterviewType, 'technical'>, string[]> = {
  behavioral: ['Tell me about a time you handled a disagreement on a team.', 'Describe a difficult project and how you kept it moving.', 'Tell me about feedback that changed your approach.', 'Describe a time you showed leadership without authority.', 'Tell me about a failure and what you learned.'],
  hr: ['Tell me about yourself and your career direction.', 'Why do you want this role?', 'What is a strength you rely on and a weakness you are improving?', 'What kind of team helps you do your best work?', 'Where do you want to grow over the next few years?'],
  product: ['How would you improve a product you use every day?', 'Design a solution for a user with an ambiguous problem.', 'How would you prioritize competing feature requests?', 'How would you measure whether a product change worked?', 'How would you investigate a sudden drop in engagement?'],
};
const conceptMap: Record<InterviewType, string[]> = {
  technical: ['state', 'api', 'database', 'measure', 'testing', 'tradeoff', 'performance', 'model', 'validation', 'monitor'],
  behavioral: ['situation', 'task', 'action', 'result', 'team', 'conflict', 'feedback', 'impact', 'learned'],
  hr: ['experience', 'motivation', 'strength', 'weakness', 'goal', 'team', 'company', 'growth'],
  product: ['user', 'problem', 'prioritize', 'tradeoff', 'metric', 'experiment', 'impact', 'constraint'],
};
const INTERVIEW_TIME_LIMIT_SECONDS = 300;

function buildQuestions(role: Role, type: InterviewType, difficulty: Difficulty, count: number): Question[] {
  const seeds = type === 'technical' ? technicalSeeds[role] : typeSeeds[type];
  return Array.from({ length: count }, (_, index) => {
    const seed = seeds[index % seeds.length];
    const cycle = Math.floor(index / seeds.length);
    const suffix = cycle ? ` Follow-up ${cycle + 1}: explain how your answer changes under a larger scale or tighter constraint.` : '';
    const framing = difficulty === 'easy' ? 'Focus on the core concepts and a clear example. ' : difficulty === 'hard' ? 'Address edge cases, tradeoffs, and how you would validate the decision. ' : 'Include your reasoning, an example, and how you would validate the outcome. ';
    return { id: `${role}-${type}-${difficulty}-${index + 1}`, role, type, difficulty, question: `${framing}${seed}${suffix}`, concepts: [...new Set([...conceptMap[type], ...roleMeta[role].topics])], modelAnswer: 'A strong response is structured, specific to the role, and explains the reasoning, tradeoffs, validation, and measurable impact.' };
  });
}

function useInterviewDevices() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [microphoneError, setMicrophoneError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [lostDevice, setLostDevice] = useState<'camera' | 'microphone' | null>(null);
  const cameraReady = !!stream?.getVideoTracks().some(track => track.readyState === 'live');
  const microphoneReady = !!stream?.getAudioTracks().some(track => track.readyState === 'live');
  const request = async () => {
    setRequesting(true); setCameraError(''); setMicrophoneError(''); setLostDevice(null);
    stream?.getTracks().forEach(track => track.stop());
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is required to start the interview.'); setMicrophoneError('Microphone access is required to start the interview.'); setRequesting(false); return;
    }
    const tracks: MediaStreamTrack[] = [];
    try {
      const combined = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      tracks.push(...combined.getTracks());
    } catch {
      try { tracks.push(...(await navigator.mediaDevices.getUserMedia({ video: true })).getVideoTracks()); } catch { setCameraError('Camera access is required to start the interview.'); }
      try { tracks.push(...(await navigator.mediaDevices.getUserMedia({ audio: true })).getAudioTracks()); } catch { setMicrophoneError('Microphone access is required to start the interview.'); }
    }
    const next = new MediaStream(tracks);
    setStream(next);
    if (!next.getVideoTracks().some(track => track.readyState === 'live')) setCameraError('Camera access is required to start the interview.');
    if (!next.getAudioTracks().some(track => track.readyState === 'live')) setMicrophoneError('Microphone access is required to start the interview.');
    setRequesting(false);
  };
  useEffect(() => {
    if (!stream) return;
    const onEnded = (kind: 'camera' | 'microphone') => setLostDevice(kind);
    const video = stream.getVideoTracks()[0]; const audio = stream.getAudioTracks()[0];
    if (video) video.addEventListener('ended', () => onEnded('camera'));
    if (audio) audio.addEventListener('ended', () => onEnded('microphone'));
    return () => { video?.stop(); audio?.stop(); };
  }, [stream]);
  useEffect(() => () => stream?.getTracks().forEach(track => track.stop()), [stream]);
  return { stream, cameraReady, microphoneReady, cameraError, microphoneError, lostDevice, requesting, request, setLostDevice };
}

function MicLevelMeter({ stream }: { stream: MediaStream | null }) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const audio = stream?.getAudioTracks()[0]; if (!audio) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext; if (!AudioCtx) return;
    const context = new AudioCtx(); const source = context.createMediaStreamSource(stream); const analyser = context.createAnalyser(); analyser.fftSize = 256; source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount); let frame = 0;
    const tick = () => { analyser.getByteFrequencyData(data); setLevel(Math.min(100, Math.round(data.reduce((a, b) => a + b, 0) / data.length / 128 * 100))); frame = requestAnimationFrame(tick); };
    tick(); return () => { cancelAnimationFrame(frame); source.disconnect(); void context.close(); };
  }, [stream]);
  return <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${level}%` }} /></div>;
}

function scoreAnswer(answer: string, question: Question) {
  const normalized = answer.toLowerCase(); const conceptsFound = question.concepts.filter(concept => normalized.includes(concept.toLowerCase()));
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const coverage = Math.round((conceptsFound.length / question.concepts.length) * 55);
  const completeness = words === 0 ? 0 : words < 15 ? 12 : words < 40 ? 25 : 35;
  const structure = /because|first|then|result|example|tradeoff|impact|situation|action/i.test(answer) ? 10 : 4;
  const typeBonus = question.type === 'behavioral' && /situation|task|action|result/i.test(answer) ? 5 : question.type === 'product' && /user|metric|priorit/i.test(answer) ? 5 : 0;
  return { score: Math.min(100, coverage + completeness + structure + typeBonus), conceptsFound };
}

export default function MockInterview() {
  const { user } = useAuth(); const progress = useProgress(); const devices = useInterviewDevices(); const videoRef = useRef<HTMLVideoElement | null>(null); const recognitionRef = useRef<any>(null); const completionRef = useRef(false);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const [role, setRole] = useState<Role>('frontend'); const [type, setType] = useState<InterviewType>('technical'); const [difficulty, setDifficulty] = useState<Difficulty>('medium'); const [questionCount, setQuestionCount] = useState(5); const [stage, setStage] = useState<Stage>('setup'); const [questionIndex, setQuestionIndex] = useState(0); const [answers, setAnswers] = useState<Answer[]>([]); const [transcript, setTranscript] = useState(''); const [answering, setAnswering] = useState(false); const [duration, setDuration] = useState(0); const [answerSeconds, setAnswerSeconds] = useState(0); const [finalResult, setFinalResult] = useState<InterviewResult | null>(null); const [paused, setPaused] = useState(false);
  const questions = useMemo(() => buildQuestions(role, type, difficulty, questionCount), [role, type, difficulty, questionCount]); const question = questions[questionIndex]; const ready = devices.cameraReady && devices.microphoneReady && !devices.lostDevice;
  useEffect(() => { if (videoRef.current) videoRef.current.srcObject = devices.stream; }, [devices.stream, stage]);
  useEffect(() => { if (stage !== 'live' || paused) return; const timer = window.setInterval(() => setDuration(value => value + 1), 1000); return () => window.clearInterval(timer); }, [stage, paused]);
  useEffect(() => { if (!answering) return; const timer = window.setInterval(() => setAnswerSeconds(value => value + 1), 1000); return () => window.clearInterval(timer); }, [answering]);
  useEffect(() => { if (stage === 'live' && devices.lostDevice) { setPaused(true); setAnswering(false); recognitionRef.current?.stop?.(); } else if (stage === 'live' && ready) setPaused(false); }, [devices.lostDevice, stage, ready]);
  const finishInterview = (completedAnswers: Answer[]) => {
    if (completionRef.current) return; completionRef.current = true; devices.stream?.getTracks().forEach(track => track.stop()); recognitionRef.current?.stop?.();
    const score = completedAnswers.length ? Math.round(completedAnswers.reduce((sum, item) => sum + item.score, 0) / completedAnswers.length) : 0;
    const found = completedAnswers.flatMap(item => item.conceptsFound); const strengths = [...new Set(completedAnswers.filter(item => item.score >= 65).flatMap(item => item.conceptsFound))].slice(0, 4); const weaknesses = [...new Set(questions.flatMap(item => item.concepts).filter(concept => !found.includes(concept)))].slice(0, 5);
    const result: InterviewResult = { id: `interview:${Date.now()}`, track: roleMeta[role].label, interviewType: type, difficulty, questionCount, questions: completedAnswers.map(item => ({ id: item.id, question: item.question, answer: item.answer, score: item.score, conceptsFound: item.conceptsFound })), score, strengths: strengths.length ? strengths : ['You completed the session'], weaknesses, timestamp: new Date().toISOString(), durationSeconds: duration };
    setFinalResult(result); setStage('evaluating'); progress.saveInterviewResult(result); progress.addXP(100, `completed ${roleMeta[role].label} ${type} interview`, result.id); progress.updateStreak();
  };
  useEffect(() => { if (stage === 'live' && duration >= INTERVIEW_TIME_LIMIT_SECONDS) finishInterview(answers); }, [duration, stage, answers]);
  useEffect(() => { if (stage !== 'evaluating') return; const timer = window.setTimeout(() => setStage('results'), 900); return () => window.clearTimeout(timer); }, [stage]);
  const startInterview = () => { if (!ready) return; completionRef.current = false; setStage('live'); setQuestionIndex(0); setAnswers([]); setDuration(0); setTranscript(''); };
  const startAnswer = () => { if (paused || !ready) return; setAnswering(true); setAnswerSeconds(0); if (!speechSupported) return; const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; const recognition = new SR(); recognition.continuous = true; recognition.interimResults = true; recognition.onresult = (event: any) => { let text = ''; for (let i = 0; i < event.results.length; i++) text += `${event.results[i][0].transcript} `; setTranscript(text.trim()); }; recognition.onerror = () => setAnswering(false); recognition.start(); recognitionRef.current = recognition; };
  const submitAnswer = () => { if (!answering || !ready) return; setAnswering(false); recognitionRef.current?.stop?.(); const answer = transcript.trim(); const scored = scoreAnswer(answer, question); const next = [...answers, { ...question, answer: answer || 'No answer provided.', ...scored }]; setAnswers(next); setTranscript(''); if (questionIndex + 1 >= questions.length) finishInterview(next); else setQuestionIndex(value => value + 1); };
  const reset = () => { completionRef.current = false; setStage('setup'); setQuestionIndex(0); setAnswers([]); setTranscript(''); setDuration(0); setFinalResult(null); setPaused(false); setAnswering(false); };
  const durationLabel = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`; const answerTimerLabel = `${Math.floor(answerSeconds / 60)}:${String(answerSeconds % 60).padStart(2, '0')}`;

  if (stage === 'setup') return <div className="stagger space-y-7">
    <div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent"><span className="mr-2 text-primary/40">04</span>Mock interview</div><h1 className="text-3xl font-semibold tracking-[-.055em] sm:text-[2.6rem]">Choose your interview loadout.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Configure the arena, verify your devices, then enter a focused question-by-question interview.</p></div>
    <section className="grid gap-3 md:grid-cols-4">{(Object.keys(roleMeta) as Role[]).map(item => <button key={item} onClick={() => setRole(item)} className={`rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${role === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}><h2 className="font-semibold">{roleMeta[item].label}</h2><p className={`mt-2 text-sm leading-relaxed ${role === item ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{roleMeta[item].description}</p></button>)}</section>
    <section className="grid gap-4 lg:grid-cols-3"><div className="rounded-xl border border-border bg-card p-5"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Interview type</p><div className="space-y-2">{(Object.keys(typeMeta) as InterviewType[]).map(item => <button key={item} onClick={() => setType(item)} className={`w-full rounded-md border p-3 text-left ${type === item ? 'border-accent bg-accent/15' : 'border-border'}`}><span className="font-semibold">{typeMeta[item].label}</span><span className="mt-1 block text-xs text-muted-foreground">{typeMeta[item].description}</span></button>)}</div></div><div className="rounded-xl border border-border bg-card p-5"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Difficulty</p><div className="grid gap-2">{(Object.keys(difficultyMeta) as Difficulty[]).map(item => <button key={item} onClick={() => setDifficulty(item)} className={`rounded-md border p-3 text-left font-semibold capitalize ${difficulty === item ? 'border-accent bg-accent/15' : 'border-border'}`}>{item}<span className="mt-1 block text-xs font-normal text-muted-foreground">{difficultyMeta[item]}</span></button>)}</div></div><div className="rounded-xl border border-border bg-card p-5"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Question count</p><div className="grid gap-2">{countOptions.map(count => <button key={count} onClick={() => setQuestionCount(count)} className={`rounded-md border p-3 text-left font-semibold ${questionCount === count ? 'border-accent bg-accent/15' : 'border-border'}`}>{count} Questions<span className="mt-1 block text-xs font-normal text-muted-foreground">{count === 5 ? 'Quick rep' : count === 10 ? 'Full session' : 'Deep dive'}</span></button>)}</div></div></section>
    <section className="rounded-xl border-2 border-primary bg-card p-6 shadow-[5px_5px_0_var(--retro-purple)] sm:p-8"><div className="mb-6 flex items-center gap-2"><Sparkles size={17} className="text-accent" /><h2 className="font-mono text-xs uppercase tracking-[.18em]">Interview loadout</h2></div><div className="grid gap-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Role</p><p className="mt-1 font-semibold">{roleMeta[role].label}</p></div><div><p className="text-xs text-muted-foreground">Interview Type</p><p className="mt-1 font-semibold">{typeMeta[type].label}</p></div><div><p className="text-xs text-muted-foreground">Difficulty</p><p className="mt-1 font-semibold capitalize">{difficulty}</p></div><div><p className="text-xs text-muted-foreground">Questions</p><p className="mt-1 font-semibold">{questionCount}</p></div></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><div><p className="mb-3 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Interview device check</p><div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">{devices.cameraReady ? <video ref={videoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-white/60">No live camera preview</div>}</div></div><div className="flex flex-col justify-between"><div className="space-y-3"><div className="flex items-center justify-between rounded-md border border-border p-4"><span className="flex items-center gap-2"><Camera size={16} /> Camera</span><span className={devices.cameraReady ? 'text-accent' : 'text-destructive'}>{devices.cameraReady ? '● Camera Ready' : '● Camera Not Available'}</span></div><div className="rounded-md border border-border p-4"><div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2"><Mic size={16} /> Microphone</span><span className={devices.microphoneReady ? 'text-accent' : 'text-destructive'}>{devices.microphoneReady ? '● Microphone Ready' : '● Microphone Not Available'}</span></div><MicLevelMeter stream={devices.stream} /></div>{devices.cameraError && <p className="text-xs text-destructive">{devices.cameraError}</p>}{devices.microphoneError && <p className="text-xs text-destructive">{devices.microphoneError}</p>}{!ready && <p className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">Camera and microphone are required for the interview. Please enable both devices and try again.</p>}</div><div className="mt-6 flex flex-col gap-2"><button onClick={devices.request} disabled={devices.requesting} className="button-secondary justify-center"><Video size={16} /> {devices.requesting ? 'Checking devices…' : 'Check camera & microphone'}</button><button onClick={startInterview} disabled={!ready} className="button-primary justify-center disabled:cursor-not-allowed disabled:opacity-40"><Sparkles size={16} /> Start Interview</button></div></div></div></section>
  </div>;

  if (stage === 'live') return <div className="stagger space-y-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Mock interview · {roleMeta[role].label} · {typeMeta[type].label} · {difficulty}</p><p className="mt-2 font-semibold">Question {questionIndex + 1} / {questions.length}</p><div className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div></div><div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-mono text-xs"><Clock3 size={14} /> {durationLabel} / 5:00</div></div>{paused && <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"><span className="flex items-center gap-2"><AlertTriangle size={17} /> Interview paused — {devices.lostDevice === 'camera' ? 'camera' : 'microphone'} connection lost. Restore both devices to continue.</span><button onClick={devices.request} className="button-secondary">Reconnect devices</button></div>}<div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]"><section className="rounded-xl border border-primary bg-primary p-6 text-primary-foreground shadow-[5px_5px_0_var(--retro-purple)] sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-accent">{difficultyMeta[difficulty]} · {typeMeta[type].label}</p><h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-.04em] sm:text-3xl">{question.question}</h2><div className="mt-8"><textarea disabled={paused || !ready} value={transcript} onChange={event => setTranscript(event.target.value)} placeholder="Type your answer here, or use Start voice answer…" className="min-h-36 w-full resize-y rounded-lg border border-white/20 bg-black/20 p-4 text-sm leading-relaxed text-primary-foreground outline-none placeholder:text-primary-foreground/40 disabled:opacity-50" /></div><div className="mt-5 flex items-center justify-between"><span className="text-xs text-primary-foreground/60">{answering && <span className="flex items-center gap-1 text-red-300"><span className="h-2 w-2 animate-pulse rounded-full bg-red-300" /> Recording · {answerTimerLabel}</span>}</span>{!answering ? <button onClick={startAnswer} disabled={paused || !ready} className="button-primary disabled:opacity-40"><Mic size={16} /> {speechSupported ? 'Start voice answer' : 'Start answer'}</button> : <button onClick={submitAnswer} disabled={paused || !ready} className="button-secondary"><Check size={15} /> Submit answer <ArrowRight size={15} /></button>}</div></section><aside className="space-y-4"><div className="overflow-hidden rounded-xl border border-border bg-black"><div className="aspect-video">{devices.cameraReady ? <video ref={videoRef} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" /> : <div className="flex h-full items-center justify-center text-white/50"><CameraOff size={22} /></div>}</div><div className="flex items-center justify-between bg-card px-3 py-2 text-xs"><span>Live camera</span><span className="flex items-center gap-2 text-accent"><Mic size={13} /> Microphone active</span></div></div><div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-3"><span className="mr-2 flex items-center gap-2 text-xs text-accent"><Mic size={14} /> Active</span><button onClick={() => { setStage('setup'); recognitionRef.current?.stop?.(); }} title="End interview" className="grid h-10 w-10 place-items-center rounded-full bg-destructive text-destructive-foreground"><PhoneOff size={17} /></button></div><button onClick={() => { setStage('setup'); recognitionRef.current?.stop?.(); }} className="button-secondary w-full justify-center">End interview</button></aside></div></div>;

  const result = finalResult; const score = result?.score ?? 0;
  return <div className="stagger space-y-7"><div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-accent">04 / Interview results</div><h1 className="text-3xl font-semibold tracking-[-.055em] sm:text-[2.6rem]">Interview complete.</h1><p className="mt-2 text-sm text-muted-foreground">Local evaluation based on concept coverage, completeness, structure, and the selected interview type.</p></div><section className="grid gap-4 lg:grid-cols-[.5fr_1fr]"><div className="rounded-xl bg-primary p-6 text-primary-foreground"><div className="mb-6 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-primary-foreground/55">Overall score</span><Trophy size={19} className="text-accent" /></div><div className="text-6xl font-semibold tracking-[-.08em]">{score}<span className="text-2xl text-accent">/100</span></div><p className="mt-4 text-sm text-primary-foreground/60">{result?.questionCount} questions · {result ? typeMeta[result.interviewType ?? type].label : typeMeta[type].label} · {result?.difficulty}</p></div><div className="rounded-xl border border-border bg-card p-6"><p className="mb-4 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">What you did well</p><div className="grid gap-6 sm:grid-cols-2"><div>{(result?.strengths ?? []).map(item => <p key={item} className="mb-2 text-sm">✓ {item}</p>)}</div><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">Areas to improve</p>{(result?.weaknesses ?? []).map(item => <p key={item} className="mb-2 text-sm">⚠ {item}</p>)}</div></div></div></section>{result && <section className="rounded-xl border border-border bg-card p-6"><div className="mb-4 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Recommended practice / question review</span><span className="text-xs text-muted-foreground">{result.durationSeconds}s total</span></div><div className="space-y-3">{result.questions.map(item => <div key={item.id} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold">{item.question}</p><span className="font-mono text-sm font-bold text-accent-foreground">{item.score}/100</span></div><p className="mt-2 text-sm text-muted-foreground">{item.answer}</p></div>)}</div></section>}<div className="flex flex-wrap gap-3"><button onClick={reset} className="button-primary"><RotateCcw size={16} /> Retry interview</button><Link href="/mock-interview" className="button-secondary">Back to Mock Interview <ArrowRight size={15} /></Link><Link href="/practice" className="button-secondary">Practice weak areas <ArrowRight size={15} /></Link></div></div>;
}