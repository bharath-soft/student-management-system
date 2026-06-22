const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET all courses
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    
    // Get all courses along with number of enrolled students
    const courses = await db.all(`
      SELECT c.*, COUNT(e.student_id) as enrolled_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET course by ID with detailed info (students enrolled, stats)
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const courseId = req.params.id;
    
    const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get list of enrolled students
    const enrolledStudents = await db.all(`
      SELECT s.id, s.first_name, s.last_name, s.email, s.status, e.enrollment_date, g.score, g.grade
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN grades g ON s.id = g.student_id AND g.course_id = ?
      WHERE e.course_id = ?
    `, [courseId, courseId]);
    
    // Course performance metrics
    const stats = await db.get(`
      SELECT AVG(score) as avg_score, MIN(score) as min_score, MAX(score) as max_score
      FROM grades
      WHERE course_id = ?
    `, [courseId]);
    
    // Course attendance rate
    const attStats = await db.get(`
      SELECT 
        COUNT(CASE WHEN status IN ('Present', 'Late') THEN 1 END) as attended,
        COUNT(*) as total
      FROM attendance
      WHERE course_id = ?
    `, [courseId]);
    
    const attendanceRate = attStats.total > 0 
      ? Math.round((attStats.attended / attStats.total) * 100)
      : 100;
      
    res.json({
      ...course,
      enrolledStudents,
      stats: {
        avgScore: stats.avg_score ? Math.round(stats.avg_score * 10) / 10 : null,
        minScore: stats.min_score || null,
        maxScore: stats.max_score || null,
        attendanceRate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create course
router.post('/', async (req, res) => {
  const { course_code, name, description, credits, teacher } = req.body;
  
  if (!course_code || !name || !credits || !teacher) {
    return res.status(400).json({ error: 'Course code, name, credits, and teacher are required' });
  }
  
  try {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO courses (course_code, name, description, credits, teacher) VALUES (?, ?, ?, ?, ?)`,
      [course_code, name, description, credits, teacher]
    );
    
    const newCourse = await db.get('SELECT * FROM courses WHERE id = ?', [result.lastID]);
    res.status(201).json(newCourse);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Course code is already in use' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT update course
router.put('/:id', async (req, res) => {
  const { course_code, name, description, credits, teacher } = req.body;
  
  try {
    const db = await getDb();
    const course = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await db.run(
      `UPDATE courses SET course_code = ?, name = ?, description = ?, credits = ?, teacher = ? WHERE id = ?`,
      [
        course_code || course.course_code,
        name || course.name,
        description !== undefined ? description : course.description,
        credits || course.credits,
        teacher || course.teacher,
        req.params.id
      ]
    );
    
    const updatedCourse = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    res.json(updatedCourse);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Course code is already in use' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE course
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const course = await db.get('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await db.run('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST enroll student in a course
router.post('/:id/enroll', async (req, res) => {
  const { student_id, enrollment_date } = req.body;
  const courseId = req.params.id;
  
  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }
  
  try {
    const db = await getDb();
    
    // Check if student exists
    const student = await db.get('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await db.run(
      `INSERT INTO enrollments (student_id, course_id, enrollment_date) VALUES (?, ?, ?)`,
      [student_id, courseId, enrollment_date || new Date().toISOString().split('T')[0]]
    );
    
    res.status(201).json({ message: 'Student enrolled successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST unenroll student from a course
router.post('/:id/unenroll', async (req, res) => {
  const { student_id } = req.body;
  const courseId = req.params.id;
  
  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required' });
  }
  
  try {
    const db = await getDb();
    const result = await db.run(
      `DELETE FROM enrollments WHERE student_id = ? AND course_id = ?`,
      [student_id, courseId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Enrollment record not found' });
    }
    
    // Also cleanup grades and attendance for this student in this course
    await db.run('DELETE FROM grades WHERE student_id = ? AND course_id = ?', [student_id, courseId]);
    await db.run('DELETE FROM attendance WHERE student_id = ? AND course_id = ?', [student_id, courseId]);
    
    res.json({ message: 'Student unenrolled successfully and related academic records cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
