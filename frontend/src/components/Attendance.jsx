import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Save, Calendar, CheckCircle, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

export default function Attendance() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pastDates, setPastDates] = useState([]);

  // Fetch course list on mount
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await api.courses.getAll();
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id.toString());
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    }
    loadCourses();
  }, []);

  // Fetch past dates and current checklist when course or date changes
  useEffect(() => {
    if (!selectedCourseId) return;

    async function loadAttendanceData() {
      try {
        setLoading(true);
        // Load past dates
        const dates = await api.attendance.getDates(selectedCourseId);
        setPastDates(dates);

        // Load student checklist for current date
        const checklist = await api.attendance.getByCourse(selectedCourseId, date);
        
        // If there's no existing record (status is null), default status to 'Present'
        const normalized = checklist.map(r => ({
          student_id: r.student_id,
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
          status: r.status || 'Present' // Default to Present
        }));
        setRecords(normalized);
      } catch (err) {
        console.error('Error fetching attendance:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadAttendanceData();
  }, [selectedCourseId, date]);

  // Handle status toggle for a student
  const handleStatusChange = (studentId, status) => {
    setRecords(prev => prev.map(rec => 
      rec.student_id === studentId ? { ...rec, status } : rec
    ));
  };

  // Submit batch save
  const handleSave = async () => {
    if (records.length === 0) {
      alert('No students to log attendance for.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        course_id: parseInt(selectedCourseId, 10),
        date: date,
        records: records.map(r => ({
          student_id: r.student_id,
          status: r.status
        }))
      };
      await api.attendance.record(payload);
      alert('Attendance saved successfully!');
      
      // Refresh past dates
      const dates = await api.attendance.getDates(selectedCourseId);
      setPastDates(dates);
    } catch (err) {
      alert('Failed to save attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Attendance Tracking</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Mark daily presence rolls, review class-wide attendance rates, and edit past logs.
        </p>
      </div>

      {/* Configuration Selection Bar */}
      <div className="glass-card" style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        padding: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label className="form-label">Subject Course</label>
          <select
            className="form-control"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            {courses.length === 0 ? (
              <option value="">No courses available</option>
            ) : (
              courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code}: {c.name}</option>
              ))
            )}
          </select>
        </div>

        <div style={{ width: '180px' }}>
          <label className="form-label">Log Date</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {pastDates.length > 0 && (
          <div style={{ width: '180px' }}>
            <label className="form-label">Jump to Past Logs</label>
            <select
              className="form-control"
              value={pastDates.includes(date) ? date : ''}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            >
              <option value="" disabled>-- Historical dates --</option>
              {pastDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Roster & Checklist */}
      {selectedCourseId && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Student Attendance Checklist</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Logging roll call for {date}
              </p>
            </div>
            {records.length > 0 && (
              <button 
                onClick={handleSave} 
                className="btn" 
                disabled={saving}
                style={{ minWidth: '150px', justifyContent: 'center' }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save Roll Call'}
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>
              Loading attendance roster...
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No students are currently enrolled in this course. Please enroll students under the "Courses" tab first.
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th style={{ textAlign: 'right', width: '400px' }}>Attendance Status Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.student_id}>
                      <td style={{ fontWeight: '500' }}>{rec.first_name} {rec.last_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{rec.email}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
                          {[
                            { name: 'Present', color: 'var(--color-success)', icon: CheckCircle },
                            { name: 'Late', color: 'var(--color-warning)', icon: Clock },
                            { name: 'Absent', color: 'var(--color-danger)', icon: AlertTriangle },
                            { name: 'Excused', color: 'var(--color-primary)', icon: HelpCircle }
                          ].map(opt => {
                            const isSelected = rec.status === opt.name;
                            const OptIcon = opt.icon;
                            return (
                              <button
                                key={opt.name}
                                onClick={() => handleStatusChange(rec.student_id, opt.name)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? opt.color : 'transparent',
                                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <OptIcon size={12} />
                                {opt.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
