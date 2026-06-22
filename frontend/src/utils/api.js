const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

export const api = {
  students: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      const queryString = query.toString() ? `?${query.toString()}` : '';
      return request(`/students${queryString}`);
    },
    getStats: () => request('/students/stats'),
    get: (id) => request(`/students/${id}`),
    create: (data) => request('/students', { method: 'POST', body: data }),
    update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  },
  courses: {
    getAll: () => request('/courses'),
    get: (id) => request(`/courses/${id}`),
    create: (data) => request('/courses', { method: 'POST', body: data }),
    update: (id, data) => request(`/courses/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
    enroll: (courseId, studentId, date) => 
      request(`/courses/${courseId}/enroll`, { 
        method: 'POST', 
        body: { student_id: studentId, enrollment_date: date } 
      }),
    unenroll: (courseId, studentId) => 
      request(`/courses/${courseId}/unenroll`, { 
        method: 'POST', 
        body: { student_id: studentId } 
      }),
  },
  grades: {
    getByCourse: (courseId) => request(`/grades/course/${courseId}`),
    record: (data) => request('/grades', { method: 'POST', body: data }),
  },
  attendance: {
    getByCourse: (courseId, date) => {
      const query = date ? `?date=${date}` : '';
      return request(`/attendance/course/${courseId}${query}`);
    },
    getDates: (courseId) => request(`/attendance/course/${courseId}/dates`),
    record: (data) => request('/attendance', { method: 'POST', body: data }),
  }
};
