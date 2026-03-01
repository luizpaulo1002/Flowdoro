import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Subject = {
  id: string;
  name: string;
  emoji: string;
  difficulty: number; // 1 to 5
  volume: number;     // 1 to 5
  weight: number;     // e.g. 1, 2, 3
  color: string;
};

// Preset Design Options
const presetColors = ['#7c3aed', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'];
const presetEmojis = ['📚', '💻', '📐', '🔬', '🌍', '🎨', '📝', '🧠', '💼'];

type Session = {
  id: string;
  durationInSeconds: number;
  date: string;
  subjectId?: string;
};

interface CyclePlannerProps {
  totalHours: number;
  setTotalHours: React.Dispatch<React.SetStateAction<number>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  sessions: Session[];
  onAddManualSession: (subjectId: string, durationInSeconds: number) => void;
}

export default function CyclePlanner({ totalHours, setTotalHours, subjects, setSubjects, sessions, onAddManualSession }: CyclePlannerProps) {
  const { t } = useTranslation();

  // Form State
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [difficulty, setDifficulty] = useState(3);
  const [volume, setVolume] = useState(3);
  const [weight, setWeight] = useState(1);
  const [color, setColor] = useState('#7c3aed'); // default purple

  // Manual Time Entry State
  const [manualTimeSubject, setManualTimeSubject] = useState<string | null>(null);
  const [manualHours, setManualHours] = useState<number>(0);
  const [manualMinutes, setManualMinutes] = useState<number>(0);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSubject: Subject = {
      id: Date.now().toString(),
      name: name.trim(),
      emoji,
      difficulty,
      volume,
      weight,
      color
    };

    setSubjects([...subjects, newSubject]);

    // Reset form
    setName('');
    setEmoji('📚');
    setDifficulty(3);
    setVolume(3);
    setWeight(1);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const submitManualTime = (subjectId: string) => {
    const totalSeconds = (manualHours * 3600) + (manualMinutes * 60);
    if (totalSeconds > 0) {
      onAddManualSession(subjectId, totalSeconds);
    }
    setManualTimeSubject(null);
    setManualHours(0);
    setManualMinutes(0);
  };

  // Calculate Distribution
  // PRD Additive Formula: Score = Peso (Weight) + Dificuldade (Difficulty) + Quantidade de Conteúdo (Volume)
  const calculateDistribution = () => {
    let totalScore = 0;
    const scores = subjects.map(s => {
      // Additive Score calculation
      const score = s.weight + s.difficulty + (s.volume || 3); // Fallback to 3 if old data
      totalScore += score;
      return { ...s, score };
    });

    if (totalScore === 0) return [];

    return scores.map(s => {
      // Calculate how many seconds have been spent on this subject
      const studiedSeconds = sessions
        .filter(session => session.subjectId === s.id)
        .reduce((sum, session) => sum + session.durationInSeconds, 0);

      return {
        ...s,
        allocatedHours: Math.round((s.score / totalScore) * totalHours * 10) / 10,
        studiedSeconds
      };
    });
  };

  const distribution = calculateDistribution();

  return (
    <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{t('cycle.title')}</h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('cycle.totalHours')}: {totalHours}h
          </label>
          <input
            type="range"
            min="20" max="100" step="1"
            value={totalHours}
            onChange={(e) => setTotalHours(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
            {t('cycle.hoursLimit')}
          </p>
        </div>

        <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{t('cycle.addSubject')}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{t('cycle.subjectName')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={emoji} onChange={e => setEmoji(e.target.value)}
                    style={{ ...inputStyle, width: '50px', padding: '8px', cursor: 'pointer', appearance: 'none', textAlign: 'center' }}
                  >
                    {presetEmojis.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <input required value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 1 }} type="text" placeholder="Ex: Matemática" />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{t('cycle.color')}</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {presetColors.map(c => (
                  <button
                    key={c} type="button" onClick={() => setColor(c)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c,
                      border: color === c ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', padding: 0, boxSizing: 'border-box'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>Dificuldade</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={`diff-${n}`} type="button" onClick={() => setDifficulty(n)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: difficulty === n ? 'var(--accent-color)' : 'transparent',
                        color: difficulty === n ? 'white' : 'var(--text-secondary)',
                        border: difficulty === n ? 'none' : '1px solid var(--surface-border)',
                        cursor: 'pointer', fontWeight: 'bold'
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>1 = Fácil, 5 = Muito Difícil</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={labelStyle}>Quantidade de Conteúdo</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={`vol-${n}`} type="button" onClick={() => setVolume(n)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        backgroundColor: volume === n ? 'var(--accent-color)' : 'transparent',
                        color: volume === n ? 'white' : 'var(--text-secondary)',
                        border: volume === n ? 'none' : '1px solid var(--surface-border)',
                        cursor: 'pointer', fontWeight: 'bold'
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>1 = Pouco, 5 = Muito Conteúdo</span>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <label style={labelStyle}>{t('cycle.weight', { defaultValue: 'Peso da Matéria' })}</label>
              <input value={weight} onChange={e => setWeight(Number(e.target.value))} style={inputStyle} type="number" min="1" step="0.5" required />
            </div>
          </div>

          <button type="submit" style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
            {t('cycle.addBtn')}
          </button>
        </form>
      </div>

      <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Distribuição do Ciclo</h3>

        {distribution.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
            {t('cycle.empty')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {distribution.map(subject => (
              <div key={subject.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${subject.color}20`, color: subject.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: `1px solid ${subject.color}50` }}>
                  {subject.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{subject.name}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {Math.floor(subject.studiedSeconds / 3600)}h {Math.floor((subject.studiedSeconds % 3600) / 60)}m / {subject.allocatedHours}h
                      </span>
                      <button
                        onClick={() => { setManualTimeSubject(subject.id); setManualHours(0); setManualMinutes(0); }}
                        style={{ background: 'var(--surface-border)', border: 'none', color: 'var(--text-primary)', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        + Tempo
                      </button>
                    </div>
                  </div>

                  {/* Inline Form for Manual Time */}
                  {manualTimeSubject === subject.id && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>
                      <input type="number" min="0" value={manualHours} onChange={e => setManualHours(Number(e.target.value))} placeholder="h" style={{ width: '40px', padding: '2px 4px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '4px' }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>h</span>
                      <input type="number" min="0" max="59" value={manualMinutes} onChange={e => setManualMinutes(Number(e.target.value))} placeholder="m" style={{ width: '40px', padding: '2px 4px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '4px' }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>m</span>

                      <button onClick={() => submitManualTime(subject.id)} style={{ marginLeft: 'auto', background: 'var(--success-color)', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>Salvar</button>
                      <button onClick={() => setManualTimeSubject(null)} style={{ background: 'var(--danger-color)', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>X</button>
                    </div>
                  )}

                  {/* Grid of 1-Hour Squares */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Array.from({ length: Math.ceil(subject.allocatedHours) }).map((_, i) => {
                      const hourIndex = i;
                      const secondsInThisHour = Math.max(0, Math.min(3600, subject.studiedSeconds - (hourIndex * 3600)));
                      const fillPct = (secondsInThisHour / 3600) * 100;

                      return (
                        <div key={i} style={{
                          width: '18px', height: '18px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          border: `1px solid ${subject.color}30`,
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: `${fillPct}%`, backgroundColor: subject.color,
                            transition: 'height 0.3s ease'
                          }}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSubject(subject.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                >
                  {t('cycle.delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.3rem',
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  fontWeight: 600
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.2)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box' as const
};
