const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'students.db');

let db = null;

async function getDb() {
  if (db) return db;
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');
  
  return db;
}

async function initDb() {
  const database = await getDb();
  
  // Create tables
  await database.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      dob TEXT,
      enrollment_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Active', 'Suspended', 'Graduated'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      credits INTEGER NOT NULL,
      teacher TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      enrollment_date TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
      grade TEXT NOT NULL,
      remarks TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'Excused')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(student_id, course_id, date)
    );
  `);

  // Seed Data if students table is empty
  const studentCount = await database.get('SELECT COUNT(*) as count FROM students');
  if (studentCount.count === 0) {
    console.log('Seeding initial data...');
    
    // Seed Students
    const students = [
      ['Alex', 'Morgan', 'alex.morgan@academy.edu', '555-0101', '2002-05-14', '2024-09-01', 'Active'],
      ['Emma', 'Watson', 'emma.watson@academy.edu', '555-0102', '2001-04-15', '2024-09-01', 'Active'],
      ['Ryan', 'Reynolds', 'ryan.reynolds@academy.edu', '555-0103', '2003-10-23', '2024-09-01', 'Active'],
      ['Taylor', 'Swift', 'taylor.swift@academy.edu', '555-0104', '2001-12-13', '2023-09-01', 'Active'],
      ['Bruce', 'Wayne', 'bruce.wayne@academy.edu', '555-0105', '2000-02-19', '2023-09-01', 'Graduated'],
      ['Selina', 'Kyle', 'selina.kyle@academy.edu', '555-0106', '2002-07-27', '2024-09-01', 'Suspended'],
      ['Peter', 'Parker', 'peter.parker@academy.edu', '555-0107', '2004-08-10', '2025-01-15', 'Active'],
      ['Clark', 'Kent', 'clark.kent@academy.edu', '555-0108', '2001-06-18', '2024-09-01', 'Active']
    ];
    
    for (const s of students) {
      await database.run(
        `INSERT INTO students (first_name, last_name, email, phone, dob, enrollment_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        s
      );
    }

    // Seed Courses
    const courses = [
      ['CS-101', 'Introduction to Computer Science', 'Fundamental concepts of programming, algorithms, and computational thinking using Python.', 4, 'Dr. Alan Turing'],
      ['CS-202', 'Database Management Systems', 'Relational database design, SQL querying, transactions, and indexing structures.', 3, 'Dr. Edgar Codd'],
      ['CS-303', 'Software Engineering Practices', 'Agile methodologies, system architecture, version control, and design patterns.', 4, 'Prof. Margaret Hamilton'],
      ['MATH-151', 'Calculus I', 'Limits, derivatives, integrals, and their applications in science and engineering.', 3, 'Dr. Isaac Newton'],
      ['PHY-101', 'General Physics I', 'Classical mechanics, kinematics, Newton\'s laws of motion, work, and energy.', 4, 'Dr. Albert Einstein']
    ];

    for (const c of courses) {
      await database.run(
        `INSERT INTO courses (course_code, name, description, credits, teacher) VALUES (?, ?, ?, ?, ?)`,
        c
      );
    }

    // Seed Enrollments (cross-sections of students and courses)
    // IDs: Alex(1), Emma(2), Ryan(3), Taylor(4), Selina(6), Peter(7), Clark(8) - Bruce(5) graduated, has old history
    const enrollments = [
      [1, 1, '2024-09-02'], [1, 2, '2024-09-02'], [1, 4, '2024-09-02'],
      [2, 1, '2024-09-02'], [2, 3, '2024-09-02'], [2, 5, '2024-09-02'],
      [3, 1, '2024-09-02'], [3, 2, '2024-09-02'], [3, 4, '2024-09-02'],
      [4, 2, '2023-09-02'], [4, 3, '2023-09-02'], [4, 5, '2023-09-02'],
      [7, 1, '2025-01-16'], [7, 5, '2025-01-16'],
      [8, 1, '2024-09-02'], [8, 5, '2024-09-02']
    ];

    for (const e of enrollments) {
      await database.run(
        `INSERT INTO enrollments (student_id, course_id, enrollment_date) VALUES (?, ?, ?)`,
        e
      );
    }

    // Seed Grades
    const grades = [
      // score, student_id, course_id
      [95, 1, 1, 'A', 'Excellent code logic and structures.'],
      [88, 1, 2, 'B', 'Strong SQL performance, minor normalisation errors.'],
      [72, 1, 4, 'C', 'Struggled with integrations, but passed exams.'],
      [99, 2, 1, 'A', 'Outstanding performance in all coding labs.'],
      [92, 2, 3, 'A', 'Great architectural overview in the term project.'],
      [81, 2, 5, 'B', 'Solid understanding of dynamics.'],
      [78, 3, 1, 'C', 'Needs practice with recursion.'],
      [85, 3, 2, 'B', 'Good participation in class queries.'],
      [94, 4, 2, 'A', 'Flawless database normalisation design.'],
      [91, 4, 3, 'A', 'Great work leading the scrum team.'],
      [89, 8, 1, 'B', 'Consistently good labs.'],
      [95, 8, 5, 'A', 'Remarkable physics insights.']
    ];

    for (const g of grades) {
      await database.run(
        `INSERT INTO grades (score, student_id, course_id, grade, remarks) VALUES (?, ?, ?, ?, ?)`,
        g
      );
    }

    // Seed Attendance
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const prevDay = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    const attendanceRecords = [
      // student_id, course_id, date, status
      [1, 1, today, 'Present'], [1, 2, today, 'Present'],
      [2, 1, today, 'Present'], [2, 3, today, 'Present'],
      [3, 1, today, 'Late'], [3, 2, today, 'Absent'],
      [8, 1, today, 'Present'], [8, 5, today, 'Present'],
      
      [1, 1, yesterday, 'Present'], [1, 2, yesterday, 'Present'],
      [2, 1, yesterday, 'Present'], [2, 3, yesterday, 'Late'],
      [3, 1, yesterday, 'Present'], [3, 2, yesterday, 'Present'],
      [8, 1, yesterday, 'Present'], [8, 5, yesterday, 'Present'],

      [1, 1, prevDay, 'Present'], [1, 2, prevDay, 'Excused'],
      [2, 1, prevDay, 'Absent'], [2, 3, prevDay, 'Present'],
      [3, 1, prevDay, 'Present'], [3, 2, prevDay, 'Present'],
      [8, 1, prevDay, 'Present'], [8, 5, prevDay, 'Present']
    ];

    for (const a of attendanceRecords) {
      await database.run(
        `INSERT INTO attendance (student_id, course_id, date, status) VALUES (?, ?, ?, ?)`,
        a
      );
    }
    
    console.log('Seeding complete.');
  }
}

module.exports = {
  getDb,
  initDb
};
