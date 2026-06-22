const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET all students
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { search, status } = req.query;
    
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY id DESC';
    
    const students = await db.all(query, params);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET general student stats (for Dashboard)
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    
    const totalStudents = await db.get('SELECT COUNT(*) as count FROM students');
    const activeStudents = await db.get("SELECT COUNT(*) as count FROM students WHERE status = 'Active'");
    const graduatedStudents = await db.get("SELECT COUNT(*) as count FROM students WHERE status = 'Graduated'");
    const suspendedStudents = await db.get("SELECT COUNT(*) as count FROM students WHERE status = 'Suspended'");
    
    // Enrollments count
    const totalEnrollments = await db.get('SELECT COUNT(*) as count FROM enrollments');
    
    // Average GPA/Score across all students
    const avgScore = await db.get('SELECT AVG(score) as avg FROM grades');
    
    // Average Attendance rate across all records
    const attendanceStats = await db.get(`
      SELECT 
        COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance
    `);
    
    const attendanceRate = attendanceStats.total > 0 
      ? Math.round((attendanceStats.attended / attendanceStats.total) * 100) 
      : 100;

    res.json({
      total: totalStudents.count,
      active: activeStudents.count,
      graduated: graduatedStudents.count,
      suspended: suspendedStudents.count,
      enrollments: totalEnrollments.count,
      averageScore: avgScore.avg ? Math.round(avgScore.avg * 10) / 10 : 0,
      attendanceRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET student details by ID (with enrollments, grades, and attendance)
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const student = await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get enrolled courses
    const courses = await db.all(`
      SELECT c.*, e.enrollment_date 
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = ?
    `, [req.params.id]);
    
    // Get grades
    const grades = await db.all(`
      SELECT g.*, c.name as course_name, c.course_code 
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      WHERE g.student_id = ?
    `, [req.params.id]);
    
    // Get attendance
    const attendance = await db.all(`
      SELECT a.*, c.name as course_name, c.course_code 
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = ?
      ORDER BY a.date DESC
    `, [req.params.id]);
    
    res.json({
      ...student,
      courses,
      grades,
      attendance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create student
router.post('/', async (req, res) => {
  const { first_name, last_name, email, phone, dob, enrollment_date, status } = req.body;
  
  if (!first_name || !last_name || !email || !status) {
    return res.status(400).json({ error: 'First name, last name, email, and status are required' });
  }
  
  try {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO students (first_name, last_name, email, phone, dob, enrollment_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, dob, enrollment_date || new Date().toISOString().split('T')[0], status]
    );
    
    const newStudent = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
    res.status(201).json(newStudent);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email is already in use' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT update student
router.put('/:id', async (req, res) => {
  const { first_name, last_name, email, phone, dob, enrollment_date, status } = req.body;
  
  try {
    const db = await getDb();
    const student = await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await db.run(
      `UPDATE students SET first_name = ?, last_name = ?, email = ?, phone = ?, dob = ?, enrollment_date = ?, status = ? WHERE id = ?`,
      [
        first_name || student.first_name,
        last_name || student.last_name,
        email || student.email,
        phone !== undefined ? phone : student.phone,
        dob !== undefined ? dob : student.dob,
        enrollment_date || student.enrollment_date,
        status || student.status,
        req.params.id
      ]
    );
    
    const updatedStudent = await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(updatedStudent);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email is already in use' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE student
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const student = await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await db.run('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
