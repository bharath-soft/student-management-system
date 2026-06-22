const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// GET attendance for a course (optionally filter by date)
router.get('/course/:courseId', async (req, res) => {
  try {
    const db = await getDb();
    const courseId = req.params.courseId;
    const { date } = req.query; // YYYY-MM-DD
    
    let query = `
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.email,
        a.id as attendance_id,
        a.date,
        a.status
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.course_id = ?
    `;
    const params = [courseId];
    
    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }
    
    query += ' WHERE e.course_id = ? ORDER BY s.last_name ASC, s.first_name ASC';
    params.push(courseId);
    
    const records = await db.all(query, params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all unique attendance dates recorded for a course (to show a list of past dates)
router.get('/course/:courseId/dates', async (req, res) => {
  try {
    const db = await getDb();
    const courseId = req.params.courseId;
    
    const dates = await db.all(`
      SELECT DISTINCT date 
      FROM attendance 
      WHERE course_id = ? 
      ORDER BY date DESC
    `, [courseId]);
    
    res.json(dates.map(d => d.date));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST record daily attendance for a course (Batch upsert)
router.post('/', async (req, res) => {
  const { course_id, date, records } = req.body;
  
  if (!course_id || !date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Course ID, Date, and records array are required' });
  }
  
  try {
    const db = await getDb();
    
    // We run this inside a transaction for efficiency and integrity
    await db.run('BEGIN TRANSACTION');
    
    for (const record of records) {
      const { student_id, status } = record;
      
      if (!student_id || !status) {
        continue;
      }
      
      // Upsert record
      await db.run(`
        INSERT INTO attendance (student_id, course_id, date, status)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(student_id, course_id, date) 
        DO UPDATE SET status = excluded.status
      `, [student_id, course_id, date, status]);
    }
    
    await db.run('COMMIT');
    
    res.json({ message: 'Attendance records saved successfully' });
  } catch (error) {
    try {
      const db = await getDb();
      await db.run('ROLLBACK');
    } catch (e) {
      // Ignore rollback errors
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
