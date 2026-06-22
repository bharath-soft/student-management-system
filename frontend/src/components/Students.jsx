import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  Mail, 
  Phone, 
  X 
} from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form State
  const initialFormState = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');

  // Fetch list
  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.students.getAll({ search, status: statusFilter });
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load student profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search, statusFilter]);

  // View detail
  const handleViewDetails = async (id) => {
    try {
      const details = await api.students.get(id);
      setSelectedStudent(details);
    } catch (err) {
      alert('Error fetching student details: ' + err.message);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this student record? All related grades and attendance logs will be lost.')) {
      try {
        await api.students.delete(id);
        alert('Student deleted successfully.');
        loadStudents();
        if (selectedStudent && selectedStudent.id === id) {
          setSelectedStudent(null);
        }
      } catch (err) {
        alert('Failed to delete student: ' + err.message);
      }
    }
  };

  // Submit Create
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.students.create(formData);
      setShowAddModal(false);
      setFormData(initialFormState);
      loadStudents();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Setup Edit
  const handleEditClick = (student) => {
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      dob: student.dob || '',
      enrollment_date: student.enrollment_date,
      status: student.status
    });
    setSelectedStudent(student); // Save to track ID
    setShowEditModal(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.students.update(selectedStudent.id, formData);
      setShowEditModal(false);
      setFormData(initialFormState);
      setSelectedStudent(null);
      loadStudents();
    } catch (err) {
      setFormError(err.message);
    }
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
          <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Student Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Register new students, review grade reports, and modify enrollment states.
          </p>
        </div>
        <button onClick={() => { setFormData(initialFormState); setFormError(''); setShowAddModal(true); }} className="btn">
          <Plus size={18} /> Add Student
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        padding: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)'
          }} />
          <input
            type="text"
            placeholder="Search students by name or email..."
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--text-secondary)" />
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '160px', padding: '10px' }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading students list...</div>
      ) : students.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No student records found matching the criteria.
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Enrollment Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{ fontWeight: '600' }}>#{student.id}</td>
                  <td>{student.first_name} {student.last_name}</td>
                  <td>{student.email}</td>
                  <td>{student.enrollment_date}</td>
                  <td>
                    <span className={`badge ${
                      student.status === 'Active' ? 'badge-success' :
                      student.status === 'Suspended' ? 'badge-danger' :
                      'badge-info'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleViewDetails(student.id)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px' }}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleEditClick(student)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px' }}
                        title="Edit Profile"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px' }}
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedStudent && !showEditModal && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <span className={`badge ${
                  selectedStudent.status === 'Active' ? 'badge-success' :
                  selectedStudent.status === 'Suspended' ? 'badge-danger' :
                  'badge-info'
                }`} style={{ marginBottom: '8px' }}>
                  {selectedStudent.status}
                </span>
                <h2 style={{ fontSize: '1.5rem' }}>{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Student ID: #{selectedStudent.id}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Mail size={16} color="var(--text-secondary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                  <span>{selectedStudent.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Phone size={16} color="var(--text-secondary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
                  <span>{selectedStudent.phone || 'N/A'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Calendar size={16} color="var(--text-secondary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>DOB:</span>
                  <span>{selectedStudent.dob || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <Calendar size={16} color="var(--text-secondary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>Enrolled:</span>
                  <span>{selectedStudent.enrollment_date}</span>
                </div>
              </div>
            </div>

            {/* Courses & Academic Records */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Enrolled Courses</h3>
              {!selectedStudent.courses || selectedStudent.courses.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Not currently enrolled in any courses.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {selectedStudent.courses.map((course) => {
                    const gradeRecord = selectedStudent.grades?.find(g => g.course_id === course.id);
                    return (
                      <div key={course.id} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{course.course_code}: {course.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Credits: {course.credits} | {course.teacher}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Score: {gradeRecord ? `${gradeRecord.score}%` : 'Not Graded'}</span>
                          {gradeRecord && (
                            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Grade {gradeRecord.grade}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Attendance */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>Recent Attendance Logs</h3>
              {!selectedStudent.attendance || selectedStudent.attendance.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>No attendance events logged.</p>
              ) : (
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Date</th>
                        <th style={{ padding: '8px 12px' }}>Course</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.attendance.slice(0, 10).map((att) => (
                        <tr key={att.id}>
                          <td style={{ padding: '8px 12px' }}>{att.date}</td>
                          <td style={{ padding: '8px 12px' }}>{att.course_code}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <span className={`badge ${
                              att.status === 'Present' ? 'badge-success' :
                              att.status === 'Absent' ? 'badge-danger' :
                              att.status === 'Late' ? 'badge-warning' : 'badge-info'
                            }`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                              {att.status}
                            </span>
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

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Register New Student</h2>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Enrollment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.enrollment_date}
                    onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Edit Student Profile</h2>
              <button onClick={() => { setShowEditModal(false); setSelectedStudent(null); }} className="btn btn-secondary" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              {formError && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '12px', padding: '8px', border: '1px solid var(--color-danger)', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.05)' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Enrollment Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.enrollment_date}
                    onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedStudent(null); }} className="btn btn-secondary">
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
