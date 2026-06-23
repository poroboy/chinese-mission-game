import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Flame, Gauge, Headphones,
  Home, Languages, Lightbulb, LockKeyhole, LogOut, Map, RotateCcw, Settings,
  ShieldCheck, Sparkles, Star, Trophy, UserRound, Volume2, X,
} from 'lucide-react'
import { lessons, getLesson } from './data/lessons'
import { useGame } from './state/GameContext'
import { getChineseVoices, speakChinese } from './services/audio'
import { SCORE, validateLocalAnswer } from './utils/scoring'
import type { AnswerTile, Lesson, MissionTurn, UserProfile, VocabWord } from './types'

const playChinese = (text: string, profile?: UserProfile | null) => speakChinese(text, {
  enabled: profile?.voiceEnabled,
  rate: profile?.speechRate ?? 0.7,
  voiceURI: profile?.voiceURI,
})

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`}>
    <span className="brand__mark">中</span>
    {!compact && <span><strong>CHINESE</strong><small>MISSION</small></span>}
  </Link>
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useGame()
  return <div className="app-shell">
    <aside className="side-nav">
      <Brand />
      <nav>
        <NavLink to="/" end><Home size={19}/> ภาพรวม</NavLink>
        <NavLink to="/lessons"><Map size={19}/> ภารกิจ</NavLink>
        <NavLink to="/review"><RotateCcw size={19}/> ทบทวน</NavLink>
        <NavLink to="/settings"><Settings size={19}/> ตั้งค่า</NavLink>
      </nav>
      <div className="side-player">
        <div className="avatar">{profile?.displayName.slice(0, 1).toUpperCase()}</div>
        <div><small>ผู้เล่น</small><strong>{profile?.displayName}</strong></div>
      </div>
    </aside>
    <main className="main-content">{children}</main>
    <nav className="bottom-nav">
      <NavLink to="/" end><Home/><span>หน้าหลัก</span></NavLink>
      <NavLink to="/lessons"><Map/><span>ภารกิจ</span></NavLink>
      <NavLink to="/review"><RotateCcw/><span>ทบทวน</span></NavLink>
      <NavLink to="/settings"><Settings/><span>ตั้งค่า</span></NavLink>
    </nav>
  </div>
}

function LoginPage() {
  const { login, cloudMode } = useGame()
  const [busy, setBusy] = useState(false)
  const handleLogin = async () => { setBusy(true); try { await login() } finally { setBusy(false) } }
  return <div className="login-page">
    <div className="login-art" aria-hidden="true">
      <div className="orbit orbit--one"/><div className="orbit orbit--two"/>
      <span className="floating-word word--1">你好</span><span className="floating-word word--2">朋友</span><span className="floating-word word--3">学习</span>
      <div className="login-seal">中<small>01</small></div>
    </div>
    <section className="login-panel">
      <Brand />
      <div className="eyebrow"><Sparkles size={15}/> เริ่มภารกิจแรกของคุณ</div>
      <h1>เรียนจีนแบบ<br/><em>ลงสนามจริง</em></h1>
      <p>จำคำศัพท์ แล้วใช้มันในบทสนทนา AI<br/>ต่อประโยคเอง เก็บแต้ม และปลดล็อกโลกใหม่</p>
      <button className="btn btn--primary btn--wide" onClick={handleLogin} disabled={busy}>
        <span className="google-g">G</span>{busy ? 'กำลังเข้าสู่ระบบ…' : cloudMode ? 'เข้าสู่ระบบด้วย Google' : 'ทดลองเล่น Demo'}<ArrowRight size={18}/>
      </button>
      {!cloudMode && <div className="demo-note"><ShieldCheck size={16}/><span><strong>Development demo</strong> ยังไม่เชื่อม Firebase — ความคืบหน้าอยู่เฉพาะ session นี้</span></div>}
      <small className="login-foot">HSK 1 · 10 ภารกิจ · เริ่มต้นฟรี</small>
    </section>
  </div>
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="page-header">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}
  </header>
}

function Dashboard() {
  const { profile, cloudMode } = useGame()
  if (!profile) return null
  const current = getLesson(profile.currentLessonId) ?? lessons[0]
  const completed = Object.values(profile.lessonProgress).filter((item) => item.status === 'completed').length
  const progress = profile.lessonProgress[current.id]
  return <AppShell>
    <div className="dashboard page-wrap">
      <PageHeader eyebrow="PLAYER DASHBOARD" title={`你好, ${profile.displayName.split(' ')[0]}`} description="เก็บจังหวะการเรียนไว้ แล้วภาษาจีนจะค่อย ๆ กลายเป็นของคุณ" action={<div className={`cloud-pill ${cloudMode ? 'is-cloud' : ''}`}><span/>{cloudMode ? 'Cloud sync' : 'Demo session'}</div>}/>
      <section className="stats-grid">
        <article className="stat-card stat-card--score"><div className="stat-icon"><Gauge/></div><span>MISSION RATING</span><strong>{profile.totalScore.toLocaleString()}</strong><small>MMR · ระดับ {profile.currentLevel}</small><div className="rating-bar"><i style={{width:`${Math.min((profile.totalScore-800)/5,100)}%`}}/></div></article>
        <article className="stat-card"><div className="stat-icon lime"><Flame/></div><span>LEARNING STREAK</span><strong>{profile.streak}<em>วัน</em></strong><small>สถิติสูงสุด · {profile.streak} วัน</small><div className="week-dots">{['จ','อ','พ','พฤ','ศ','ส','อา'].map((day,i)=><span className={i < profile.streak ? 'done':''} key={day}>{i < profile.streak ? <Check/> : day}</span>)}</div></article>
        <article className="stat-card"><div className="stat-icon purple"><Trophy/></div><span>MISSION PROGRESS</span><strong>{completed}<em>/ 10</em></strong><small>HSK 1 Starter Path</small><div className="mini-progress"><i style={{width:`${completed*10}%`}}/></div></article>
      </section>

      <section className="continue-card" style={{'--accent': current.accent} as React.CSSProperties}>
        <div className="mission-number"><small>MISSION</small><strong>{String(current.order).padStart(2,'0')}</strong></div>
        <div className="continue-copy"><span>ภารกิจปัจจุบัน</span><h2>{current.title}</h2><p>{current.subtitle} · {current.vocab.length} คำศัพท์</p><div className="continue-progress"><i style={{width:`${progress.targetVocabCoverage}%`}}/></div><small>{progress.targetVocabCoverage}% ของภารกิจ</small></div>
        <Link className="btn btn--dark" to={`/lessons/${current.id}/vocab`}>ทำภารกิจต่อ <ArrowRight/></Link>
        <div className="continue-hanzi" aria-hidden="true">{current.vocab[0]?.hanzi}</div>
      </section>

      <section className="section-row"><div><span className="eyebrow">UP NEXT</span><h2>เส้นทางของคุณ</h2></div><Link to="/lessons">ดูทั้งหมด <ArrowRight size={16}/></Link></section>
      <div className="lesson-preview-grid">{lessons.slice(0,3).map(lesson => <MiniLesson key={lesson.id} lesson={lesson}/>)}</div>
    </div>
  </AppShell>
}

function MiniLesson({ lesson }: { lesson: Lesson }) {
  const { profile } = useGame(); const progress = profile!.lessonProgress[lesson.id]
  return <Link to={progress.status === 'locked' ? '#' : `/lessons/${lesson.id}/vocab`} className={`mini-lesson ${progress.status}`} style={{'--accent':lesson.accent} as React.CSSProperties}>
    <div className="mini-lesson__top"><span>{String(lesson.order).padStart(2,'0')}</span>{progress.status==='completed'?<Check/>:progress.status==='locked'?<LockKeyhole/>:<ArrowRight/>}</div>
    <div className="mini-hanzi">{lesson.vocab[0]?.hanzi}</div><h3>{lesson.subtitle}</h3><p>{lesson.vocab.length} คำใหม่</p>
  </Link>
}

function LessonListPage() {
  const { profile } = useGame(); if (!profile) return null
  return <AppShell><div className="page-wrap">
    <PageHeader eyebrow="HSK 1 · STARTER PATH" title="เลือกภารกิจ" description="ทุกบทจะหยิบคำเก่ากลับมาใช้ พร้อมเพิ่มความท้าทายทีละนิด"/>
    <div className="lesson-list">{lessons.map((lesson) => {
      const progress = profile.lessonProgress[lesson.id]
      return <article className={`lesson-row ${progress.status}`} key={lesson.id} style={{'--accent': lesson.accent} as React.CSSProperties}>
        <div className="lesson-index">{progress.status==='locked'?<LockKeyhole/>:String(lesson.order).padStart(2,'0')}</div>
        <div className="lesson-symbol">{lesson.vocab[0]?.hanzi}</div>
        <div className="lesson-copy"><span>{progress.status==='completed'?'ผ่านภารกิจแล้ว':progress.status==='active'?'พร้อมลุย':'ยังไม่ปลดล็อก'}</span><h2>{lesson.title}</h2><p>{lesson.subtitle} · {lesson.vocab.length} คำใหม่</p></div>
        <div className="lesson-score"><strong>{progress.score}</strong><small>คะแนนบท</small></div>
        {progress.status !== 'locked' && <Link className="icon-btn" aria-label={`เปิดบท ${lesson.order}`} to={`/lessons/${lesson.id}/vocab`}><ChevronRight/></Link>}
      </article>
    })}</div>
  </div></AppShell>
}

function WordCard({ item, learned, onLearn }: { item: VocabWord; learned: boolean; onLearn: () => void }) {
  const { profile } = useGame(); const [open, setOpen] = useState(false)
  return <article className={`word-card ${open?'open':''} ${learned?'learned':''}`}>
    <button className="word-main" onClick={()=>setOpen(!open)}><span className="word-check">{learned?<Check/>:null}</span><strong>{item.hanzi}</strong><div><b>{item.pinyin}</b><span>{item.meaningTh}</span></div><ChevronRight/></button>
    {open && <div className="word-detail"><div><small>ตัวอย่างประโยค</small><strong>{item.example}</strong><span>{item.examplePinyin}</span><p>{item.exampleMeaningTh}</p></div><button className="audio-btn" onClick={()=>playChinese(item.hanzi, profile)}><Volume2/> ฟังเสียง</button><button className="learn-btn" onClick={onLearn}>{learned?<><Check/>จำได้แล้ว</>:<>ทำเครื่องหมายว่าเรียนแล้ว</>}</button></div>}
  </article>
}

function VocabularyPage() {
  const { lessonId } = useParams(); const lesson = getLesson(lessonId ?? ''); const navigate = useNavigate()
  const { profile, updateLessonProgress } = useGame(); const [learned, setLearned] = useState<Set<string>>(new Set())
  if (!lesson || !profile) return <Navigate to="/lessons" replace/>
  if (profile.lessonProgress[lesson.id].status === 'locked') return <Navigate to="/lessons" replace/>
  const percentage = Math.round((learned.size / lesson.vocab.length) * 100)
  const startMission = async () => { await updateLessonProgress(lesson.id,{targetVocabCoverage:Math.max(percentage, profile.lessonProgress[lesson.id].targetVocabCoverage)}); navigate(`/lessons/${lesson.id}/mission`) }
  return <AppShell><div className="page-wrap vocab-page">
    <Link className="back-link" to="/lessons"><ArrowLeft/> กลับไปเส้นทาง</Link>
    <div className="vocab-hero" style={{'--accent':lesson.accent} as React.CSSProperties}><div><span>MISSION {String(lesson.order).padStart(2,'0')} · VOCAB LOADOUT</span><h1>{lesson.title}</h1><p>{lesson.scenario}</p></div><div className="vocab-count"><strong>{learned.size}</strong><span>/ {lesson.vocab.length}<br/>พร้อมใช้</span></div></div>
    <div className="vocab-layout"><section><div className="section-row"><div><span className="eyebrow">NEW VOCABULARY</span><h2>เตรียมคลังคำศัพท์</h2></div><span>{percentage}%</span></div><div className="word-list">{lesson.vocab.map(item=><WordCard item={item} key={item.id} learned={learned.has(item.id)} onLearn={()=>setLearned(prev=>{const next=new Set(prev); next.has(item.id)?next.delete(item.id):next.add(item.id); return next})}/>)}</div></section>
      <aside className="grammar-panel"><Lightbulb/><span className="eyebrow">GRAMMAR KIT</span><h3>โครงสร้างที่ต้องใช้</h3>{lesson.grammar.map(rule=><p key={rule}>{rule}</p>)}<div className="tip"><strong>ไม่ต้องจำทุกอย่าง</strong><span>กดที่คำเพื่อดูรายละเอียด และกลับมาทบทวนได้เสมอ</span></div><button className="btn btn--primary btn--wide" onClick={startMission}>เข้าสถานการณ์ <ArrowRight/></button></aside>
    </div>
  </div></AppShell>
}

function ChatBubble({ turn, showPinyin, showTranslation, onTogglePinyin, onToggleTranslation }: { turn: MissionTurn; showPinyin:boolean; showTranslation:boolean; onTogglePinyin:()=>void; onToggleTranslation:()=>void }) {
  const { profile } = useGame()
  return <div className="npc-message"><div className="npc-avatar">林</div><div className="bubble"><span className="speaker">林老师 · AI PARTNER</span><strong>{turn.npc.hanzi}</strong>{showPinyin&&<p className="pinyin">{turn.npc.pinyin}</p>}{showTranslation&&<p className="translation">{turn.npc.meaningTh}</p>}<div className="bubble-actions"><button onClick={()=>playChinese(turn.npc.hanzi, profile)}><Volume2/> ฟัง</button><button className={showPinyin?'active':''} onClick={onTogglePinyin}><Languages/> พินอิน</button><button className={showTranslation?'active':''} onClick={onToggleTranslation}><BookOpen/> แปล</button></div></div></div>
}

function Tile({ item, onAdd }: { item: AnswerTile; onAdd:()=>void }) {
  const [info, setInfo] = useState(false)
  return <div className="tile-wrap"><button className="answer-tile" onClick={onAdd}>{item.hanzi}<span onClick={(event)=>{event.stopPropagation();setInfo(!info)}}>i</span></button>{info&&<div className="tile-info"><strong>{item.pinyin}</strong><small>{item.meaningTh}</small></div>}</div>
}

function MissionPage() {
  const { lessonId } = useParams(); const lesson = getLesson(lessonId ?? ''); const navigate = useNavigate()
  const { profile, updateProfile, updateLessonProgress } = useGame()
  const [turnIndex,setTurnIndex]=useState(0), [selected,setSelected]=useState<AnswerTile[]>([]), [wrongAttempts,setWrongAttempts]=useState(0)
  const [showPinyin,setShowPinyin]=useState(false), [showTranslation,setShowTranslation]=useState(false)
  const [feedback,setFeedback]=useState<{type:'correct'|'wrong';text:string}|null>(null), [complete,setComplete]=useState(false)
  const [sessionDelta,setSessionDelta]=useState(0), [correctCount,setCorrectCount]=useState(0), [wrongCount,setWrongCount]=useState(0)
  const turn=lesson?.turns[turnIndex]
  const available=useMemo(()=>turn?.tiles.filter(tile=>!selected.some(item=>item.id===tile.id))??[],[turn,selected])
  if(!lesson||!profile||!turn) return <Navigate to="/lessons" replace/>
  const progress=profile.lessonProgress[lesson.id]
  if(progress.status==='locked') return <Navigate to="/lessons" replace/>
  const applyHintPenalty=async(type:'pinyin'|'translation')=>{
    if((type==='pinyin'&&showPinyin)||(type==='translation'&&showTranslation)) return
    const delta=type==='pinyin'?SCORE.pinyinHint:SCORE.translationHint; setSessionDelta(v=>v+delta)
    await updateProfile({totalScore:Math.max(0,profile.totalScore+delta)})
    await updateLessonProgress(lesson.id,type==='pinyin'?{hintCount:progress.hintCount+1}:{translateCount:progress.translateCount+1})
  }
  const checkAnswer=async()=>{
    const answer=selected.map(item=>item.hanzi).join(''); const result=validateLocalAnswer(answer,turn.expectedAnswers)
    if(!result.isCorrect){setWrongAttempts(v=>v+1);setWrongCount(v=>v+1);setFeedback({type:'wrong',text:result.feedbackTh});setSessionDelta(v=>v+SCORE.wrong);await updateProfile({totalScore:Math.max(0,profile.totalScore+SCORE.wrong)});await updateLessonProgress(lesson.id,{wrongCount:progress.wrongCount+1});return}
    const delta=wrongAttempts?SCORE.correctAfterRetry:SCORE.correctFirstTry; setCorrectCount(v=>v+1); setSessionDelta(v=>v+delta);setFeedback({type:'correct',text:`${result.feedbackTh} +${delta} MMR`});await updateProfile({totalScore:profile.totalScore+delta})
    setTimeout(async()=>{
      if(turnIndex<lesson.turns.length-1){setTurnIndex(v=>v+1);setSelected([]);setWrongAttempts(0);setFeedback(null);setShowPinyin(false);setShowTranslation(false);return}
      const totalCorrect=correctCount+1,totalWrong=wrongCount;const accuracy=Math.round((totalCorrect/(totalCorrect+totalWrong))*100);const bonus=SCORE.lessonComplete+(accuracy>=90?SCORE.highAccuracyBonus:0);const next=lessons[lesson.order]
      await updateProfile({totalScore:profile.totalScore+delta+bonus,currentLevel:Math.max(profile.currentLevel,lesson.order+1),currentLessonId:next?.id??lesson.id})
      await updateLessonProgress(lesson.id,{status:'completed',score:sessionDelta+delta+bonus,accuracy,correctCount:progress.correctCount+totalCorrect,wrongCount:progress.wrongCount,targetVocabCoverage:100})
      if(next) await updateLessonProgress(next.id,{status:'active'});setSessionDelta(v=>v+bonus);setComplete(true)
    },700)
  }
  if(complete) return <AppShell><div className="completion page-wrap"><div className="completion-burst"><Trophy/></div><span className="eyebrow">MISSION COMPLETE</span><h1>ภารกิจ {String(lesson.order).padStart(2,'0')} สำเร็จ!</h1><p>คุณใช้คำศัพท์ในสถานการณ์จริงได้แล้ว พร้อมไปต่อบทใหม่</p><div className="summary-grid"><div><strong>+{sessionDelta}</strong><span>MMR ที่ได้รับ</span></div><div><strong>{Math.round((correctCount/(correctCount+wrongCount))*100)||100}%</strong><span>ความแม่นยำ</span></div><div><strong>{lesson.vocab.length}</strong><span>คำที่ฝึก</span></div></div><div className="completion-actions"><button className="btn btn--ghost" onClick={()=>navigate(`/lessons/${lesson.id}/vocab`)}>ทบทวนอีกครั้ง</button><button className="btn btn--primary" onClick={()=>navigate('/lessons')}>ไปภารกิจถัดไป <ArrowRight/></button></div></div></AppShell>
  return <div className="mission-screen">
    <header className="mission-top"><button onClick={()=>navigate(`/lessons/${lesson.id}/vocab`)}><X/></button><div><span>MISSION {String(lesson.order).padStart(2,'0')}</span><strong>{lesson.title}</strong></div><div className="turn-progress"><i style={{width:`${((turnIndex+1)/lesson.turns.length)*100}%`}}/></div><div className="live-score"><Star/> {profile.totalScore}</div></header>
    <main className="mission-body"><div className="scene-label"><span/> สถานการณ์จำลอง · เทิร์น {turnIndex+1}/{lesson.turns.length}</div><ChatBubble turn={turn} showPinyin={showPinyin} showTranslation={showTranslation} onTogglePinyin={()=>{applyHintPenalty('pinyin');setShowPinyin(v=>!v)}} onToggleTranslation={()=>{applyHintPenalty('translation');setShowTranslation(v=>!v)}}/>
      <section className="response-zone"><div className="response-head"><div><span className="eyebrow">YOUR RESPONSE</span><h2>เรียงคำเพื่อตอบกลับ</h2></div><p>เป้าหมาย: {turn.answerMeaning}</p></div>
        <div className={`sentence-builder ${feedback?.type??''}`}>{selected.length===0?<span>แตะคำด้านล่างเพื่อสร้างประโยค…</span>:selected.map((item,index)=><button key={item.id} onClick={()=>{setSelected(v=>v.filter((_,i)=>i!==index));setFeedback(null)}}>{item.hanzi}</button>)}{feedback&&<div className="feedback-icon">{feedback.type==='correct'?<Check/>:<X/>}</div>}</div>
        {feedback&&<div className={`feedback ${feedback.type}`}>{feedback.type==='correct'?<Check/>:<Lightbulb/>}<span>{feedback.text}</span>{feedback.type==='wrong'&&<button onClick={()=>{setSelected([]);setFeedback(null)}}>ลองใหม่</button>}</div>}
        <div className="tile-bank">{available.map(item=><Tile item={item} key={item.id} onAdd={()=>{setSelected(v=>[...v,item]);setFeedback(null)}}/>)}</div>
        <button className="btn btn--primary check-btn" disabled={!selected.length||feedback?.type==='correct'} onClick={checkAnswer}>ตรวจคำตอบ <ArrowRight/></button>
      </section>
    </main>
  </div>
}

function ReviewPage(){const {profile}=useGame();if(!profile)return null;const weak=lessons.flatMap(l=>l.vocab.slice(0,2).map(v=>({...v,lesson:l.order}))).slice(0,6);return <AppShell><div className="page-wrap"><PageHeader eyebrow="MISTAKE BOOK" title="ทบทวนจุดที่ยังไม่แม่น" description="ระบบจะค่อย ๆ จัดคำที่พลาดบ่อยมาให้ฝึกซ้ำ"/><div className="review-banner"><div><Sparkles/><span>ระบบทบทวนอัจฉริยะ</span><h2>ยังไม่มีคำที่ต้องกังวล</h2><p>ลองทำภารกิจ แล้วคำที่ตอบผิดจะถูกจัดคิวไว้ตรงนี้</p></div><strong>{Object.values(profile.lessonProgress).reduce((n,p)=>n+p.wrongCount,0)}<small>ข้อผิดพลาด</small></strong></div><h2 className="subheading">คำแนะนำสำหรับวันนี้</h2><div className="review-grid">{weak.map(item=><button key={item.id} onClick={()=>playChinese(item.hanzi,profile)}><span>{item.hanzi}</span><div><strong>{item.pinyin}</strong><small>{item.meaningTh}</small></div><Volume2/></button>)}</div></div></AppShell>}

function SettingsPage(){
  const {profile,cloudMode,updateProfile,resetProgress,logout}=useGame()
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([])
  useEffect(()=>{
    const loadVoices=()=>setVoices(getChineseVoices())
    loadVoices()
    window.speechSynthesis?.addEventListener('voiceschanged',loadVoices)
    return()=>window.speechSynthesis?.removeEventListener('voiceschanged',loadVoices)
  },[])
  if(!profile)return null
  return <AppShell><div className="page-wrap settings-page"><PageHeader eyebrow="PLAYER SETTINGS" title="ตั้งค่าการเรียน" description="ปรับภารกิจให้เข้ากับจังหวะของคุณ"/><div className="settings-card"><div className="profile-line"><div className="avatar large">{profile.displayName[0]}</div><div><strong>{profile.displayName}</strong><span>{profile.email}</span></div><span className="mode-badge">{cloudMode?'FIREBASE CLOUD':'DEMO MODE'}</span></div>
    <label><span><Volume2/>เสียงภาษาจีน<small>เล่นเสียงคำศัพท์และบทสนทนา</small></span><input type="checkbox" checked={profile.voiceEnabled} onChange={e=>updateProfile({voiceEnabled:e.target.checked})}/></label>
    <label><span><UserRound/>ผู้ให้เสียง<small>{voices.length ? `พบเสียงจีน ${voices.length} เสียงในเครื่อง` : 'ใช้เสียงจีนเริ่มต้นของ browser'}</small></span><select className="voice-select" value={profile.voiceURI??''} onChange={e=>updateProfile({voiceURI:e.target.value})}><option value="">อัตโนมัติ</option>{voices.map(voice=><option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>
    <label><span><Gauge/>ความเร็วเสียง<small>ช้าลงช่วยให้แยกพยางค์ง่ายขึ้น</small></span><div className="rate-control"><input aria-label="ความเร็วเสียง" type="range" min="0.5" max="1" step="0.05" value={profile.speechRate??0.7} onChange={e=>updateProfile({speechRate:Number(e.target.value)})}/><strong>{(profile.speechRate??0.7).toFixed(2)}×</strong></div></label>
    <button className="voice-preview" onClick={()=>playChinese('你好，你叫什么名字？',profile)}><Volume2/> ทดลองฟังเสียง</button>
    <label><span><Gauge/>เป้าหมายต่อวัน<small>จำนวนนาทีที่อยากเรียนในแต่ละวัน</small></span><select value={profile.dailyGoal} onChange={e=>updateProfile({dailyGoal:Number(e.target.value)})}><option value="5">5 นาที</option><option value="10">10 นาที</option><option value="15">15 นาที</option><option value="20">20 นาที</option></select></label><button className="settings-action danger" onClick={()=>{if(window.confirm('รีเซ็ตคะแนนและความคืบหน้าทั้งหมด?'))resetProgress()}}><RotateCcw/>รีเซ็ตความคืบหน้า</button><button className="settings-action" onClick={logout}><LogOut/>ออกจากระบบ</button></div></div></AppShell>
}

export function App() {
  const { profile, loading } = useGame()
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo({ top: 0, left: 0 }), [pathname])
  if (loading) return <div className="loader"><span>中</span><p>กำลังโหลดภารกิจ…</p></div>
  if (!profile) return <Routes><Route path="*" element={<LoginPage/>}/></Routes>
  return <Routes>
    <Route path="/" element={<Dashboard/>}/><Route path="/lessons" element={<LessonListPage/>}/><Route path="/lessons/:lessonId/vocab" element={<VocabularyPage/>}/><Route path="/lessons/:lessonId/mission" element={<MissionPage/>}/><Route path="/review" element={<ReviewPage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>
}
