import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  BookOpen, 
  UserPlus, 
  UserMinus, 
  TrendingUp, 
  CalendarCheck, 
  X 
} from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]); // Used for enrollment dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Form states
  const initialCourseForm = {
    course_code: '',
    name: '',
    description: '',
    credits: 3,
    teacher: ''
  };
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', enrollment_date: new Date().toISOString().split('T')[0] });
  const [formError, setFormError] = useState('');

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await api.courses.getAll();
      setCourses(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await api.students.getAll();
      setStudents(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCourses();
    loadStudents();
  }, []);

  const handleViewCourse = async (id) => {
    try {
      const details = await api.courses.get(id);
      setSelectedCourse(details);
    } catch (err) {
      alert('Error loading course details: ' + err.message);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course? All student grades and attendance records associated with this course will be permanently deleted.')) {
      try {
        await api.courses.delete(id);
        alert('Course deleted successfully.');
        loadCourses();
        if (selectedCourse && selectedCourse.id === id) {
          setSelectedCourse(null);
        }
      } catch (err) {
        alert('Failed to delete course: ' + err.message);
      }
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.courses.create(courseForm);
      setShowAddModal(false);
      setCourseForm(initialCourseForm);
      loadCourses();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEditClick = (course) => {
    setCourseForm({
      course_code: course.course_code,
      name: course.name,
      description: course.description || '',
      credits: course.credits,
      teacher: course.teacher
    });
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.courses.update(selectedCourse.id, courseForm);
      setShowEditModal(false);
      setCourseForm(initialCourseForm);
      setSelectedCourse(null);
      loadCourses();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollForm.student_id) {
      alert('Please select a student to enroll.');
      return;
    }
    try {
      await api.courses.enroll(selectedCourse.id, enrollForm.student_id, enrollForm.enrollment_date);
      alert('Student enrolled successfully.');
      setShowEnrollModal(false);
      setEnrollForm({ student_id: '', enrollment_date: new Date().toISOString().split('T')[0] });
      // Refresh details
      handleViewCourse(selectedCourse.id);
      loadCourses();
    } catch (err) {
      alert('Failed to enroll student: ' + err.message);
    }
  };

  const handleUnenroll = async (studentId) => {
    if (window.confirm('Are you sure you want to unenroll this student? Their grades and attendance records for this course will be cleared.')) {
      try {
        await api.courses.unenroll(selectedCourse.id, studentId);
        alert('Student unenrolled successfully.');
        // Refresh details
        handleViewCourse(selectedCourse.id);
        loadCourses();
      } catch (err) {
        alert('Failed to unenroll student: ' + err.message);
      }
    }
  };

  // Get list of students eligible to enroll (not currently in selected course)
  const getEnrollableStudents = () => {
    if (!selectedCourse || !selectedCourse.enrolledStudents) return [];
    const enrolledIds = selectedCourse.enrolledStudents.map(s => s.id);
    return students.filter(s => s.status === 'Active' && !enrolledIds.includes(s.id));
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Course Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Configure the academic catalog, assign faculty, and handle student enrollment rosters.
          </p>
        </div>
        <button onClick={() => { setCourseForm(initialCourseForm); setFormError(''); setShowAddModal(true); }} className="btn">
          <Plus size={18} /> Add Course
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading course catalog...</div>
      ) : courses.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No courses currently configured in the database.
        </div>
      ) : (
        /* Course Grid Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {courses.map((course) => (
            <div key={course.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge badge-info">{course.course_code}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  {course.credits} Credits
                </span>
              </div>
              
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{course.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1, marginBottom: '16px' }}>
                {course.description || 'No description provided.'}
              </p>
              
              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Instructor</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>{course.teacher}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Enrolled</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', textAlign: 'right' }}>{course.enrolled_count} Students</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button onClick={() => handleViewCourse(course.id)} className="btn btn-secondary" style={{ flex: 1, padding: '8px', justifyContent: 'center' }}>
                  <Eye size={16} /> Roster
                </button>
                <button onClick={() => handleEditClick(course)} className="btn btn-secondary" style={{ padding: '8px' }} title="Edit Course">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDeleteCourse(course.id)} className="btn btn-danger" style={{ padding: '8px' }} title="Delete Course">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW COURSE DETAILS & ROSTER MODAL */}
      {selectedCourse && !showEditModal && !showEnrollModal && (
        <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '8px' }}>{selectedCourse.course_code}</span>
                <h2 style={{ fontSize: '1.5rem' }}>{selectedCourse.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Instructor: {selectedCourse.teacher} | Credits: {selectedCourse.credits}</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Performance Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} color="var(--color-primary)" /> Average Score
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '4px' }}>
                  {selectedCourse.stats.avgScore !== null ? `${selectedCourse.stats.avgScore}%` : 'N/A'}
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Grade Range (Min/Max)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '4px' }}>
                  {selectedCourse.stats.minScore !== null ? `${selectedCourse.stats.minScore}% - ${selectedCourse.stats.maxScore}%` : 'N/A'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarCheck size={14} color="var(--color-success)" /> Attendance Rate
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '4px' }}>
                  {selectedCourse.stats.attendanceRate}%
                </div>
              </div>
            </div>

            {/* Enrolled Students Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Enrolled Students ({selectedCourse.enrolledStudents?.length || 0})</h3>
                <button onClick={() => setShowEnrollModal(true)} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <UserPlus size={16} /> Enroll Student
                </button>
              </div>

              {!selectedCourse.enrolledStudents || selectedCourse.enrolledStudents.length === 0 ? (
                <div style={{
                  border: '1px dashed var(--border-color)',
                  padding: '30px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  No students currently enrolled in this course.
                </div>
              ) : (
                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Enrollment Date</th>
                        <th>Score</th>
                        <th>Grade</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCourse.enrolledStudents.map((student) => (
                        <tr key={student.id}>
                          <td style={{ fontWeight: '500' }}>{student.first_name} {student.last_name}</td>
                          <td>{student.email}</td>
                          <td>{student.enrollment_date}</td>
                          <td>{student.score !== null ? `${student.score}%` : 'N/A'}</td>
                          <td>
                            {student.grade ? (
                              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{student.grade}</span>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>N/A</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              onClick={() => handleUnenroll(student.id)} 
                              className="btn btn-danger" 
                              style={{ padding: '4px 8px' }}
                              title="Unenroll Student"
                            >
                              <UserMinus size={14} />
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
      )}

      {/* ENROLL STUDENT MODAL */}
      {showEnrollModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Enroll Student: {selectedCourse?.course_code}</h2>
              <button onClick={() => setShowEnrollModal(false)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            {getEnrollableStudents().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                No active students are currently eligible for enrollment (either all are already enrolled or no active profiles exist).
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit}>
                <div className="form-group">
                  <label className="form-label">Select Student *</label>
                  <select
                    required
                    className="form-control"
                    value={enrollForm.student_id}
                    onChange={(e) => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                  >
                    <option value="">-- Choose Student --</option>
                    {getEnrollableStudents().map(s => (
                      <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (#{s.id})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Enrollment Effective Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={enrollForm.enrollment_date}
                    onChange={(e) => setEnrollForm({ ...enrollForm, enrollment_date: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowEnrollModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn">
                    Enroll
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD COURSE MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Create New Course</h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit}>
              {formError && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px', padding: '8px', border: '1px solid var(--color-danger)', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.05)' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-101"
                    className="form-control"
                    value={courseForm.course_code}
                    onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Introduction to Programming"
                    className="form-control"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Outline course materials and objectives..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Credits *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="6"
                    className="form-control"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Instructor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Instructor Name"
                    className="form-control"
                    value={courseForm.teacher}
                    onChange={(e) => setCourseForm({ ...courseForm, teacher: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Modify Course Details</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedCourse(null); }} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              {formError && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px', padding: '8px', border: '1px solid var(--color-danger)', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.05)' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={courseForm.course_code}
                    onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Credits *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="6"
                    className="form-control"
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Instructor *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={courseForm.teacher}
                    onChange={(e) => setCourseForm({ ...courseForm, teacher: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedCourse(null); }} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
