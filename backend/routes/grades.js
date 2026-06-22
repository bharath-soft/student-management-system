const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// Helper function to calculate letter grade
function calculateLetterGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// GET all grades for a specific course
router.get('/course/:courseId', async (req, res) => {
  try {
    const db = await getDb();
    const courseId = req.params.courseId;
    
    // Get all enrolled students and their grades (if set)
    const gradebook = await db.all(`
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.email,
        g.id as grade_id,
        g.score,
        g.grade,
        g.remarks
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN grades g ON s.id = g.student_id AND g.course_id = ?
      WHERE e.course_id = ?
      ORDER BY s.last_name ASC, s.first_name ASC
    `, [courseId, courseId]);
    
    res.json(gradebook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST record or update a grade (Upsert)
router.post('/', async (req, res) => {
  const { student_id, course_id, score, remarks } = req.body;
  
  if (student_id === undefined || course_id === undefined || score === undefined) {
    return res.status(400).json({ error: 'Student ID, course ID, and score are required' });
  }
  
  const numericScore = parseInt(score, 10);
  if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
    return res.status(400).json({ error: 'Score must be a number between 0 and 100' });
  }
  
  try {
    const db = await getDb();
    
    // Verify enrollment exists first
    const enrollment = await db.get(
      'SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?',
      [student_id, course_id]
    );
    
    if (!enrollment) {
      return res.status(400).json({ error: 'Student is not enrolled in this course' });
    }
    
    const letterGrade = calculateLetterGrade(numericScore);
    
    // SQLite upsert syntax
    await db.run(`
      INSERT INTO grades (student_id, course_id, score, grade, remarks)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(student_id, course_id) 
      DO UPDATE SET 
        score = excluded.score,
        grade = excluded.grade,
        remarks = excluded.remarks
    `, [student_id, course_id, numericScore, letterGrade, remarks || null]);
    
    const savedGrade = await db.get(
      'SELECT * FROM grades WHERE student_id = ? AND course_id = ?',
      [student_id, course_id]
    );
    
    res.json({ message: 'Grade recorded successfully', data: savedGrade });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
