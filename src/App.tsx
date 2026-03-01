import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './themes.css';
import CyclePlanner, { Subject } from './components/CyclePlanner';
import StudyStats from './components/StudyStats';

// Type definitions
type Session = {
  id: string;
  durationInSeconds: number;
  date: string;
  subjectId?: string; // Added this field
};

type TimerMode = 'work' | 'break' | 'idle'; // Removed duplicate definition

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'timer' | 'cycle' | 'stats'>('timer');
  const [mode, setMode] = useState<TimerMode>('idle');
  const [workTimeTotal, setWorkTimeTotal] = useState(0); // in seconds
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0); // in seconds
  const [sessions, setSessions] = useState<Session[]>([]);

  // Cycle State (Lifted)
  const [totalHours, setTotalHours] = useState<number>(40);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [restMultiplier, setRestMultiplier] = useState(0.2); // Default 20%
  const [theme, setTheme] = useState('dark'); // 'dark' | 'amoled' | 'light'
  const appVersion = '0.1';

  // Deletion state
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(false);
  const [dontAskAgainChecked, setDontAskAgainChecked] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('flowdoro_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
    const savedMultiplier = localStorage.getItem('flowdoro_rest_multiplier');
    if (savedMultiplier) {
      setRestMultiplier(Number(savedMultiplier));
    }
    const savedSkipConfirm = localStorage.getItem('flowdoro_skip_delete_confirm');
    if (savedSkipConfirm === 'true') {
      setSkipDeleteConfirm(true);
    }
    const savedTheme = localStorage.getItem('flowdoro_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Cycle Data Update
    const savedHours = localStorage.getItem('flowdoro_cycle_hours');
    if (savedHours) setTotalHours(Number(savedHours));
    const savedSubjects = localStorage.getItem('flowdoro_cycle_subjects');
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem('flowdoro_sessions', JSON.stringify(sessions));
    localStorage.setItem('flowdoro_rest_multiplier', restMultiplier.toString());
    localStorage.setItem('flowdoro_skip_delete_confirm', skipDeleteConfirm.toString());
    localStorage.setItem('flowdoro_cycle_hours', totalHours.toString());
    localStorage.setItem('flowdoro_cycle_subjects', JSON.stringify(subjects));
    localStorage.setItem('flowdoro_theme', theme);
  }, [sessions, restMultiplier, skipDeleteConfirm, totalHours, subjects, theme]);

  // Apply Theme
  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : `theme-${theme}`;
  }, [theme]);

  // Handle Window Controls
  const minimizeWindow = () => {
    window.ipcRenderer.send('window-min');
  };

  const maximizeWindow = () => {
    window.ipcRenderer.send('window-max');
  };

  const closeWindow = () => {
    window.ipcRenderer.send('window-close');
  };

  // Timer Tick
  useEffect(() => {
    if (mode === 'work') {
      timerRef.current = window.setInterval(() => {
        setWorkTimeTotal(prev => prev + 1);
      }, 1000);
    } else if (mode === 'break') {
      timerRef.current = window.setInterval(() => {
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            handleStopBreak();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode]);

  // Settings
  const toggleSettings = () => {
    setIsSettingsOpen((prev: boolean) => !prev);
  };

  // Actions
  const handleStartWork = () => {
    setMode('work');
  };

  const handlePauseWork = () => {
    setMode('idle');
  };

  const handleStopWork = () => {
    if (mode === 'work') {
      setMode('idle');
      return;
    }

    const newSession: Session = {
      id: Date.now().toString(),
      durationInSeconds: workTimeTotal,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectId: activeSubjectId || undefined // Added subjectId here
    };
    setSessions((prev: Session[]) => [newSession, ...prev]);

    // Enter break mode based on user multiplier
    const breakTime = Math.floor(workTimeTotal * restMultiplier);
    setBreakTimeRemaining(breakTime > 0 ? breakTime : 0);
    setWorkTimeTotal(0);

    if (breakTime > 0) {
      setMode('break');
    } else {
      setMode('idle');
    }
  };

  const handleStopBreak = () => {
    setBreakTimeRemaining(0);
    setMode('idle');
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    // Auto-hide hours if 0
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddManualSession = (subjectId: string, durationInSeconds: number) => {
    const newSession: Session = {
      id: Date.now().toString(),
      durationInSeconds,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      subjectId
    };
    setSessions((prev: Session[]) => [newSession, ...prev]);
  };

  const handleNewCycle = () => {
    if (subjects.length === 0) return;

    // Save to history JSON
    if (window.confirm("Deseja realmente iniciar um Novo Ciclo? O ciclo atual será salvo no histórico e as horas zeradas.")) {
      const historyStr = localStorage.getItem('flowdoro_cycle_history') || '[]';
      const history = JSON.parse(historyStr);

      const cycleCapture = subjects.map(s => {
        const studiedSeconds = sessions
          .filter(session => session.subjectId === s.id)
          .reduce((sum, session) => sum + session.durationInSeconds, 0);
        return { ...s, studiedSeconds };
      });

      history.push({
        date: new Date().toISOString(),
        totalHours,
        subjects: cycleCapture
      });

      localStorage.setItem('flowdoro_cycle_history', JSON.stringify(history));

      // Clear current cycle
      setSubjects([]);
      setActiveSubjectId('');
      setIsSettingsOpen(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ sessions, totalHours, subjects }, null, 2); // Export cycle data
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowdoro-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDurationString = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0 && s > 0) return `${m}m ${s}s`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
  };

  const requestDeleteSession = (id: string) => {
    if (skipDeleteConfirm) {
      handleDeleteConfirm(id);
    } else {
      setSessionToDelete(id);
      setDontAskAgainChecked(false);
    }
  };

  const handleDeleteConfirm = (id?: string) => {
    const targetId = id || sessionToDelete;
    if (!targetId) return;

    if (dontAskAgainChecked) {
      setSkipDeleteConfirm(true);
    }

    setSessions(prev => prev.filter(s => s.id !== targetId));
    setSessionToDelete(null);
  };

  const handleDeleteCancel = () => {
    setSessionToDelete(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.sessions) {
          setSessions(json.sessions);
        }
        if (json.totalHours) { // Import cycle data
          setTotalHours(json.totalHours);
        }
        if (json.subjects) { // Import cycle data
          setSubjects(json.subjects);
        }
      } catch (err) {
        console.error('Failed to parse JSON', err);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file could be selected again
    e.target.value = '';
  };

  return (
    <div className="app-container">
      {/* Custom Title Bar */}
      <div className="title-bar">
        {/* Settings Menu Button */}
        <div style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            className="action-btn"
            onClick={toggleSettings}
            style={{ padding: '6px' }}
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <span className="title-bar-title" style={{ flex: 1, textAlign: 'center' }}>{t('app.title')}</span>

        <div className="title-bar-actions">
          <button className="action-btn minimize" onClick={minimizeWindow} title="Minimize">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button className="action-btn maximize" onClick={maximizeWindow} title="Maximize/Restore">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          </button>
          <button className="action-btn close" onClick={closeWindow} title="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Dropdown Layer */}
      {isSettingsOpen && (
        <div style={{
          position: 'absolute', top: '48px', left: '16px', zIndex: 50,
          background: 'var(--surface-color)', border: '1px solid var(--surface-border)',
          borderRadius: '8px', padding: '16px', width: '260px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t('app.settings')}</h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('app.language')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => i18n.changeLanguage('pt')}
                style={{ flex: 1, padding: '6px', background: i18n.language === 'pt' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--surface-border)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >Português</button>
              <button
                onClick={() => i18n.changeLanguage('en')}
                style={{ flex: 1, padding: '6px', background: i18n.language === 'en' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--surface-border)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >English</button>
            </div>
          </div>

          {/* Theme Option */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {t('settings.theme', { defaultValue: 'Tema Visual' })}
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid var(--surface-border)',
                padding: '8px', borderRadius: '6px', outline: 'none', cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              <option value="dark">{t('settings.themeDark', { defaultValue: 'Padrão (Escuro)' })}</option>
              <option value="amoled">{t('settings.themeAmoled', { defaultValue: 'AMOLED (Preto)' })}</option>
              <option value="light">{t('settings.themeLight', { defaultValue: 'Claro' })}</option>
            </select>
          </div>

          {/* New Cycle Button */}
          <div style={{ marginTop: '0.5rem' }}>
            <button
              onClick={handleNewCycle}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', padding: '10px', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21v-5h5"></path></svg>
              {t('settings.newCycle', { defaultValue: 'Iniciar Novo Ciclo' })}
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('app.restPercentage')} ({(restMultiplier * 100).toFixed(0)}%)</label>
            <input
              type="range" min="0.05" max="0.5" step="0.05"
              value={restMultiplier}
              onChange={e => setRestMultiplier(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0, fontStyle: 'italic' }}>{t('app.restPercentageDesc')}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--surface-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('app.version')} {appVersion}</span>
            <button onClick={() => setIsSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}>{t('app.cancel', { defaultValue: 'Close' })}</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface-color)', border: '1px solid var(--surface-border)',
            borderRadius: '12px', padding: '1.5rem', width: '80%', maxWidth: '320px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{t('app.deleteSession')}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {t('app.deleteConfirmMsg')}
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={dontAskAgainChecked} onChange={(e) => setDontAskAgainChecked(e.target.checked)} />
              {t('app.dontAskAgain')}
            </label>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={handleDeleteCancel} style={{ flex: 1, ...btnSecondaryStyle, padding: '8px' }}>
                {t('app.cancel')}
              </button>
              <button onClick={() => handleDeleteConfirm()} style={{ flex: 1, ...btnDangerStyle, padding: '8px', background: 'var(--danger-color)', color: 'white' }}>
                {t('app.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', background: 'var(--surface-color)', padding: '0 1rem', borderBottom: '1px solid var(--surface-border)', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('timer')}
            style={{ ...tabBtnStyle, color: activeTab === 'timer' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'timer' ? '3px solid var(--accent-color)' : '3px solid transparent' }}
          >
            {t('app.tabTimer', { defaultValue: 'Temporizador' })}
          </button>
          <button
            onClick={() => setActiveTab('cycle')}
            style={{ ...tabBtnStyle, color: activeTab === 'cycle' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'cycle' ? '3px solid var(--accent-color)' : '3px solid transparent' }}
          >
            {t('app.tabCycle', { defaultValue: 'Ciclo de Estudos' })}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{ ...tabBtnStyle, color: activeTab === 'stats' ? 'var(--text-primary)' : 'var(--text-secondary)', borderBottom: activeTab === 'stats' ? '3px solid var(--accent-color)' : '3px solid transparent' }}
          >
            Estatísticas
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'timer' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 2rem', height: '100%', boxSizing: 'border-box' }}>
            {/* Subject Selector Layout */}
            {subjects.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <select
                  value={activeSubjectId}
                  onChange={(e) => setActiveSubjectId(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid var(--surface-border)',
                    padding: '8px 16px', borderRadius: '20px', outline: 'none', cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  <option value="">{t('cycle.addSubject', { defaultValue: 'Select Subject...' })}</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Main Timer Display */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0', flex: 1 }}>
              <div style={{
                fontSize: '0.9rem',
                color: mode === 'break' ? 'var(--success-color)' : 'var(--accent-color)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '1rem',
                fontWeight: 600
              }}>
                {mode === 'work' && t('app.flowStateActive')}
                {mode === 'break' && t('app.restPhase')}
                {mode === 'idle' && (breakTimeRemaining > 0 ? t('app.paused') : t('app.readyToFocus'))}
              </div>

              <div
                className={mode === 'work' ? 'glow-active' : ''}
                style={{
                  fontSize: '4.5rem',
                  fontWeight: 300,
                  fontVariantNumeric: 'tabular-nums',
                  color: mode === 'break' ? 'var(--success-color)' : 'var(--text-primary)',
                  background: 'var(--surface-color)',
                  border: '1px solid var(--surface-border)',
                  padding: '2rem',
                  borderRadius: '50%',
                  height: '220px',
                  width: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                {formatTime(mode === 'break' ? breakTimeRemaining : workTimeTotal)}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                {mode === 'idle' && breakTimeRemaining === 0 && (
                  <button onClick={handleStartWork} style={btnPrimaryStyle}>
                    {t('app.enterFlow')}
                  </button>
                )}

                {(mode === 'work' || (mode === 'idle' && workTimeTotal > 0)) && (
                  <>
                    <button onClick={mode === 'work' ? handlePauseWork : handleStartWork} style={btnSecondaryStyle}>
                      {mode === 'work' ? t('app.pause') : t('app.resume')}
                    </button>
                    <button onClick={handleStopWork} style={btnDangerStyle}>
                      {t('app.stopAndRest')}
                    </button>
                  </>
                )}

                {mode === 'break' && (
                  <button onClick={handleStopBreak} style={btnSecondaryStyle}>
                    {t('app.skipBreak')}
                  </button>
                )}
              </div>
            </div>

            {/* History Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>

              <div style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--surface-border)',
                borderRadius: '12px', padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {t('app.todaySessions', { defaultValue: 'Sessões de Hoje' })}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImport} />
                    <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>{t('app.importData')}</button>
                    <button onClick={handleExport} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>{t('app.exportData')}</button>
                  </div>
                </div>

                {sessions.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    {t('app.noSessions', { defaultValue: 'Nenhuma sessão registrada.' })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessions.map((s: Session) => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-secondary)', marginRight: '12px' }}>{s.date}</span>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatDurationString(s.durationInSeconds)}</span>
                          {s.subjectId && subjects.find((sub: Subject) => sub.id === s.subjectId) && (
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                              {subjects.find((sub: Subject) => sub.id === s.subjectId)?.emoji} {subjects.find((sub: Subject) => sub.id === s.subjectId)?.name}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => requestDeleteSession(s.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px' }}
                          title={t('app.deleteSessionTitle')}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'cycle' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 0', height: '100%' }}>
            <CyclePlanner
              totalHours={totalHours}
              setTotalHours={setTotalHours}
              subjects={subjects}
              setSubjects={setSubjects}
              sessions={sessions}
              onAddManualSession={handleAddManualSession}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 0', height: '100%' }}>
            <StudyStats sessions={sessions} subjects={subjects} />
          </div>
        )}
      </div>
    </div>
  );
}

// Inline styles for basic buttons
const btnBaseStyle = {
  padding: '10px 20px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.95rem',
  border: 'none',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const btnPrimaryStyle = {
  ...btnBaseStyle,
  background: 'var(--accent-color)',
  color: 'white',
};

const btnSecondaryStyle = {
  ...btnBaseStyle,
  background: 'transparent',
  border: '1px solid var(--surface-border)',
  color: 'var(--text-primary)',
};

const btnDangerStyle = {
  ...btnBaseStyle,
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid var(--danger-color)',
  color: 'var(--danger-color)',
};

const tabBtnStyle = {
  background: 'none',
  border: 'none',
  padding: '12px 16px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  transition: 'color 0.2s',
  outline: 'none',
  WebkitAppRegion: 'no-drag' as any,
};
