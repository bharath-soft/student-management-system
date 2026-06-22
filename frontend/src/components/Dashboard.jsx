import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  CalendarCheck, 
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    graduated: 0,
    suspended: 0,
    enrollments: 0,
    averageScore: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await api.students.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading dashboard data...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--color-danger)', padding: '20px' }}>{error}</div>;
  }

  const kpis = [
    {
      label: 'Total Students',
      value: stats.total,
      subtext: `${stats.active} Active Profiles`,
      icon: Users,
      color: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      tab: 'students'
    },
    {
      label: 'Course Enrollments',
      value: stats.enrollments,
      subtext: 'Across all subjects',
      icon: BookOpen,
      color: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      tab: 'courses'
    },
    {
      label: 'Class Avg Performance',
      value: `${stats.averageScore}%`,
      subtext: 'Average Gradebook Score',
      icon: Award,
      color: 'linear-gradient(135deg, #f59e0b, #eab308)',
      tab: 'grades'
    },
    {
      label: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      subtext: 'Year to date average',
      icon: CalendarCheck,
      color: 'linear-gradient(135deg, #10b981, #059669)',
      tab: 'attendance'
    }
  ];

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Overview Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Real-time analytics and student management metrics.
          </p>
        </div>
        <div style={{
          fontSize: '0.85rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          padding: '8px 16px',
          borderRadius: '9999px',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)'
        }}>
          System Date: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="glass-card" 
              onClick={() => setActiveTab(kpi.tab)}
              style={{
                marginBottom: 0,
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
              }}
            >
              {/* Background gradient glow */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '120px',
                height: '120px',
                background: kpi.color,
                borderRadius: '50%',
                opacity: 0.15,
                filter: 'blur(30px)'
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>{kpi.label}</span>
                <div style={{
                  background: kpi.color,
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Icon size={20} />
                </div>
              </div>

              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
                {kpi.value}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={14} color="var(--color-success)" />
                <span>{kpi.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Actions Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Performance Chart Card */}
        <div className="glass-card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Grade Distribution Overview</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '400' }}>(Grade Scale A-F)</span>
          </h3>

          <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 0 20px 0', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            {/* Visual Bar Grids */}
            {[
              { label: 'A (90-100)', pct: 60, color: 'var(--color-success)', count: 6 },
              { label: 'B (80-89)', pct: 40, color: 'var(--color-primary)', count: 4 },
              { label: 'C (70-79)', pct: 25, color: 'var(--color-warning)', count: 2 },
              { label: 'D (60-69)', pct: 0, color: 'var(--color-accent)', count: 0 },
              { label: 'F (<60)', pct: 0, color: 'var(--color-danger)', count: 0 }
            ].map((bar, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: '600', marginBottom: '8px' }}>{bar.count}</span>
                <div style={{
                  width: '32px',
                  height: `${Math.max(bar.pct, 4)}%`,
                  background: bar.pct > 0 ? bar.color : 'rgba(255,255,255,0.05)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', whiteSpace: 'nowrap' }}>{bar.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>A & B levels dominate current term performance.</span>
            <span>Total graded course metrics: 12</span>
          </div>
        </div>

        {/* Quick Actions and Stats Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Action shortcuts */}
          <div className="glass-card" style={{ flex: 1, marginBottom: 0 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Quick Control Centre</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setActiveTab('students')} className="btn" style={{ justifyContent: 'center', width: '100%' }}>
                Manage Students <ArrowUpRight size={16} />
              </button>
              <button onClick={() => setActiveTab('courses')} className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
                Course Configuration
              </button>
              <button onClick={() => setActiveTab('attendance')} className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
                Log Attendance
              </button>
              <button onClick={() => setActiveTab('grades')} className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
                Enter Term Grades
              </button>
            </div>
          </div>

          {/* Student Status Summary Card */}
          <div className="glass-card" style={{ marginBottom: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Academic Profiles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Students</span>
                <span className="badge badge-success" style={{ textTransform: 'none' }}>{stats.active}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Graduated Alumni</span>
                <span className="badge badge-info" style={{ textTransform: 'none' }}>{stats.graduated}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Suspended Profiles</span>
                <span className="badge badge-danger" style={{ textTransform: 'none' }}>{stats.suspended}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
