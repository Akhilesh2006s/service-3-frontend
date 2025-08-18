const API_BASE_URL = 'https://service-3-backend-production.up.railway.app/api';

class APIService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('telugu-basics-token');
    console.log('API Service - Token from localStorage:', token ? 'Present' : 'Missing');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('API Service - Adding Authorization header with token');
    } else {
      console.log('API Service - No token available, request will be unauthenticated');
      console.warn('API Service - Authentication token missing. User may need to re-login.');
    }
    
    return headers;
  }

  private async handleResponse(response: Response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  }

  // Authentication
  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    const data = await this.handleResponse(response);
    
    // Store token
    if (data.data?.token) {
      localStorage.setItem('telugu-basics-token', data.data.token);
      localStorage.setItem('telugu-basics-user', JSON.stringify(data.data.user));
    }
    
    return data;
  }

  async login(credentials: {
    email: string;
    password: string;
  }) {
    console.log('API Service - Login attempt for:', credentials.email);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials)
    });
    
    const data = await this.handleResponse(response);
    console.log('API Service - Login response:', data);
    
    // Store token
    if (data.data?.token) {
      console.log('Login - Storing token:', data.data.token.substring(0, 20) + '...');
      localStorage.setItem('telugu-basics-token', data.data.token);
      localStorage.setItem('telugu-basics-user', JSON.stringify(data.data.user));
      console.log('Login - Token stored successfully');
      
      // Verify storage
      const storedToken = localStorage.getItem('telugu-basics-token');
      console.log('Login - Verification - Stored token:', storedToken ? 'Present' : 'Missing');
    } else {
      console.log('Login - No token in response');
      console.log('Login - Response data:', data);
    }
    
    return data;
  }

  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders()
      });
      
      return this.handleResponse(response);
    } catch (error) {
      // If /me fails, return the user from localStorage
      const savedUser = localStorage.getItem('telugu-basics-user');
      if (savedUser) {
        return {
          success: true,
          data: JSON.parse(savedUser)
        };
      }
      throw error;
    }
  }

  async updateProfile(profileData: {
    name?: string;
    email?: string;
    phone?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    
    return this.handleResponse(response);
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData)
    });
    
    return this.handleResponse(response);
  }

  async forgotPassword(data: {
    email: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }

  async resetPassword(data: {
    resetToken: string;
    newPassword: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    
    // Clear local storage
    localStorage.removeItem('telugu-basics-token');
    localStorage.removeItem('telugu-basics-user');
    
    return this.handleResponse(response);
  }

  // Evaluators (for trainers)
  async getEvaluators() {
    const response = await fetch(`${API_BASE_URL}/evaluators`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async addEvaluator(evaluatorData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) {
    console.log('API Service - addEvaluator called with data:', evaluatorData);
    console.log('API Service - Current token:', localStorage.getItem('telugu-basics-token'));
    
    const headers = this.getAuthHeaders();
    console.log('API Service - Headers for addEvaluator:', headers);
    
    const response = await fetch(`${API_BASE_URL}/evaluators`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(evaluatorData)
    });
    
    console.log('API Service - addEvaluator response status:', response.status);
    
    return this.handleResponse(response);
  }

  async updateEvaluatorStatus(id: string, isActive: boolean) {
    const response = await fetch(`${API_BASE_URL}/evaluators/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isActive })
    });
    
    return this.handleResponse(response);
  }

  async removeEvaluator(id: string) {
    const response = await fetch(`${API_BASE_URL}/evaluators/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async getEvaluatorStats() {
    const response = await fetch(`${API_BASE_URL}/evaluators/stats`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Students (for trainers)
  async getStudents() {
    const response = await fetch(`${API_BASE_URL}/students`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async addStudent(studentData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(studentData)
    });
    
    return this.handleResponse(response);
  }

  async updateStudentStatus(id: string, isActive: boolean) {
    const response = await fetch(`${API_BASE_URL}/students/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isActive })
    });
    
    return this.handleResponse(response);
  }

  async removeStudent(id: string) {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async getStudentStats() {
    const response = await fetch(`${API_BASE_URL}/students/stats`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Submissions
  async getSubmissions(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/submissions?${queryParams}`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async getSubmission(id: string) {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async createSubmission(submissionData: {
    activityId?: string;
    examId?: string;
    submissionType: string;
    voiceRecording?: any;
    mcqAnswers?: any[];
    voiceAnswers?: any[];
  }) {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(submissionData)
    });
    
    return this.handleResponse(response);
  }

  async evaluateSubmission(id: string, evaluationData: {
    pronunciationScore: number;
    clarityScore: number;
    toneScore: number;
    feedback: string;
    errorTags?: string[];
    overallScore?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/evaluate`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(evaluationData)
    });
    
    return this.handleResponse(response);
  }

  async updateSubmissionStatus(id: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/submissions/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    
    return this.handleResponse(response);
  }

  async getSubmissionStats() {
    const response = await fetch(`${API_BASE_URL}/submissions/stats/overview`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Activities
  async getActivities() {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async getActivity(id: string) {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async createActivity(activityData: any) {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(activityData)
    });
    
    return this.handleResponse(response);
  }

  async updateActivity(id: string, activityData: any) {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(activityData)
    });
    
    return this.handleResponse(response);
  }

  async deleteActivity(id: string) {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Exam Management
  async getExams() {
    console.log('API Service - Getting exams from:', `${API_BASE_URL}/exams/trainer`);
    console.log('API Service - Auth headers:', this.getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/exams/trainer`, {
      headers: this.getAuthHeaders()
    });
    
    console.log('API Service - Get exams response status:', response.status);
    console.log('API Service - Get exams response headers:', response.headers);
    
    return this.handleResponse(response);
  }

  async createExam(examData: any) {
    console.log('API Service - Creating exam with data:', examData);
    console.log('API Service - Using base URL:', API_BASE_URL);
    console.log('API Service - Auth headers:', this.getAuthHeaders());
    
    const response = await fetch(`${API_BASE_URL}/exams`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(examData)
    });
    
    console.log('API Service - Exam creation response status:', response.status);
    console.log('API Service - Exam creation response headers:', response.headers);
    
    return this.handleResponse(response);
  }

  async getExam(id: string) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async updateExam(id: string, examData: any) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(examData)
    });
    
    return this.handleResponse(response);
  }

  async deleteExam(id: string) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  async publishExam(id: string) {
    const response = await fetch(`${API_BASE_URL}/exams/${id}/publish`, {
      method: 'PATCH',
      headers: this.getAuthHeaders()
    });
    
    return this.handleResponse(response);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('telugu-basics-token');
    const user = localStorage.getItem('telugu-basics-user');
    return !!(token && user);
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('telugu-basics-token');
    localStorage.removeItem('telugu-basics-user');
    console.log('API Service - Authentication data cleared');
  }

  // Check server connectivity
  async checkServerConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.error('API Service - Server connectivity check failed:', error);
      return false;
    }
  }
}

export const apiService = new APIService();
export default apiService;