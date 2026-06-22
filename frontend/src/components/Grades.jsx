import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Save, Award, RefreshCw } from 'lucide-react';

export default function Grades() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [gradebook, setGradebook] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Grading form state
  const [gradingForm, setGradingForm] = useState({
    student_id: '',
    score: '',
    remarks: ''
  });
  const [saving, setSaving] = useState(false);

  // Load courses
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

  // Fetch gradebook when selected course changes
  const loadGradebook = async () => {
    if (!selectedCourseId) return;
    try {
      setLoading(true);
      const data = await api.grades.getByCourse(selectedCourseId);
      setGradebook(data);
    } catch (err) {
      console.error('Error loading gradebook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGradebook();
  }, [selectedCourseId]);

  // Helper to calculate preview letter grade
  const getLetterGrade = (scoreStr) => {
    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score < 0 || score > 100) return '--';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Submit grading record
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!gradingForm.student_id) {
      alert('Please select a student to grade.');
      return;
    }
    const scoreVal = parseInt(gradingForm.score, 10);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      alert('Please enter a valid numeric score between 0 and 100.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        course_id: parseInt(selectedCourseId, 10),
        student_id: parseInt(gradingForm.student_id, 10),
        score: scoreVal,
        remarks: gradingForm.remarks
      };
      await api.grades.record(payload);
      alert('Student score recorded successfully!');
      
      // Clear form
      setGradingForm({
        student_id: '',
        score: '',
        remarks: ''
      });
      
      // Reload gradebook
      loadGradebook();
    } catch (err) {
      alert('Failed to record grade: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Pre-fill form when clicking "Grade" in the gradebook table
  const handleRecordSelect = (record) => {
    setGradingForm({
      student_id: record.student_id.toString(),
      score: record.score !== null ? record.score.toString() : '',
      remarks: record.remarks || ''
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Grades & Marks</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Evaluate student submissions, log numeric scores, and inspect class-wide grade distributions.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        {/* Grading Form Panel */}
        <div className="glass-card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="var(--color-accent)" /> Grade Evaluation
          </h3>

          <form onSubmit={handleGradeSubmit}>
            <div className="form-group">
              <label className="form-label">Subject Course</label>
              <select
                className="form-control"
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setGradingForm({ student_id: '', score: '', remarks: '' });
                }}
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

            <div className="form-group">
              <label className="form-label">Select Student *</label>
              <select
                required
                className="form-control"
                value={gradingForm.student_id}
                onChange={(e) => {
                  const studentIdStr = e.target.value;
                  // Look up if they already have scores set in gradebook
                  const existing = gradebook.find(g => g.student_id.toString() === studentIdStr);
                  setGradingForm({
                    student_id: studentIdStr,
                    score: existing && existing.score !== null ? existing.score.toString() : '',
                    remarks: existing && existing.remarks ? existing.remarks : ''
                  });
                }}
              >
                <option value="">-- Choose Student --</option>
                {gradebook.map(g => (
                  <option key={g.student_id} value={g.student_id}>
                    {g.first_name} {g.last_name} (#{g.student_id})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Numeric Score (0 - 100) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  placeholder="e.g. 85"
                  className="form-control"
                  value={gradingForm.score}
                  onChange={(e) => setGradingForm({ ...gradingForm, score: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ textAlign: 'center' }}>
                <label className="form-label">Grade</label>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  height: '42px',
                  lineHeight: '42px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-primary)'
                }}>
                  {getLetterGrade(gradingForm.score)}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Feedback Remarks</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Write feedback comments or grading remarks..."
                value={gradingForm.remarks}
                onChange={(e) => setGradingForm({ ...gradingForm, remarks: e.target.value })}
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn" 
              disabled={saving} 
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            >
              <Save size={16} /> {saving ? 'Recording...' : 'Record Grade'}
            </button>
          </form>
        </div>

        {/* Gradebook View Panel */}
        <div className="glass-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Subject Gradebook</h3>
            <button onClick={loadGradebook} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>
              Loading subject grades...
            </div>
          ) : gradebook.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              No students enrolled in this course to grade. Please register or enroll students first.
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Teacher Remarks</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gradebook.map((record) => (
                    <tr key={record.student_id}>
                      <td style={{ fontWeight: '500' }}>{record.first_name} {record.last_name}</td>
                      <td>
                        {record.score !== null ? (
                          <span style={{ fontWeight: '600' }}>{record.score}%</span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Ungraded</span>
                        )}
                      </td>
                      <td>
                        {record.grade ? (
                          <span className={`badge ${
                            record.grade === 'A' || record.grade === 'B' ? 'badge-success' :
                            record.grade === 'C' ? 'badge-info' :
                            record.grade === 'D' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {record.grade}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>--</span>
                        )}
                      </td>
                      <td style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem'
                      }}>
                        {record.remarks || '--'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleRecordSelect(record)} 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
