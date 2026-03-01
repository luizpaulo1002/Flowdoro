import React from 'react';
import { useTranslation } from 'react-i18next';
import { Subject } from './CyclePlanner';

type Session = {
  id: string;
  durationInSeconds: number;
  date: string;
  subjectId?: string;
};

interface StudyStatsProps {
  sessions: Session[];
  subjects: Subject[];
}

export default function StudyStats({ sessions, subjects }: StudyStatsProps) {
  const { t } = useTranslation();

  // 1. Group total seconds by Subject ID.
  // We'll also collect sessions with no subjectId under an 'Outros' (Other) category.
  let totalTrackedSeconds = 0;
  let otherSeconds = 0;

  const subjectTotals = subjects.map(s => {
    const secs = sessions.filter(sess => sess.subjectId === s.id)
      .reduce((sum, sess) => sum + sess.durationInSeconds, 0);
    totalTrackedSeconds += secs;
    return { ...s, studiedSeconds: secs };
  }).filter(s => s.studiedSeconds > 0)
    .sort((a, b) => b.studiedSeconds - a.studiedSeconds); // Largest first

  // Handle sessions with no linked subject
  sessions.forEach(sess => {
    if (!sess.subjectId || !subjects.find(sub => sub.id === sess.subjectId)) {
      otherSeconds += sess.durationInSeconds;
      totalTrackedSeconds += sess.durationInSeconds;
    }
  });

  // Calculate the conic gradient strings
  let cumulativePercent = 0;
  const pieSlices = subjectTotals.map(s => {
    const percent = totalTrackedSeconds > 0 ? (s.studiedSeconds / totalTrackedSeconds) * 100 : 0;
    const sliceStr = `${s.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return sliceStr;
  });

  if (otherSeconds > 0) {
    const percent = (otherSeconds / totalTrackedSeconds) * 100;
    pieSlices.push(`#64748b ${cumulativePercent}% ${cumulativePercent + percent}%`);
  }

  const conicGradient = pieSlices.length > 0
    ? `conic-gradient(${pieSlices.join(', ')})`
    : 'conic-gradient(var(--surface-border) 0% 100%)';

  return (
    <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', alignSelf: 'flex-start' }}>
          Análise de Distribuição: Total
        </h2>

        {totalTrackedSeconds === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '2rem 0' }}>
            Não há dados de estudo registrados ainda.
          </div>
        ) : (
          <>
            {/* The Pie Chart */}
            <div style={{
              width: '200px', height: '200px',
              borderRadius: '50%',
              background: conicGradient,
              marginBottom: '2rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              border: '4px solid var(--surface-color)'
            }}></div>

            {/* The Legend */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {subjectTotals.map(s => {
                const pct = ((s.studiedSeconds / totalTrackedSeconds) * 100).toFixed(1);
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.color }} />
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>{s.emoji} {s.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {Math.floor(s.studiedSeconds / 3600)}h {Math.floor((s.studiedSeconds % 3600) / 60)}m
                      </span>
                      <span style={{ fontWeight: 'bold', color: s.color, width: '45px', textAlign: 'right' }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {otherSeconds > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#64748b' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sessões sem Matéria</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {Math.floor(otherSeconds / 3600)}h {Math.floor((otherSeconds % 3600) / 60)}m
                    </span>
                    <span style={{ fontWeight: 'bold', color: '#64748b', width: '45px', textAlign: 'right' }}>
                      {((otherSeconds / totalTrackedSeconds) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
