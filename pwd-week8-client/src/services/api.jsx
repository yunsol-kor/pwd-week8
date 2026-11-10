import axios from 'axios';
import { supabase } from '../config/supabase';
import { apiUrl } from '../config/environment';

// 서버 URL 설정 (환경별 자동 감지)
const API_BASE_URL = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Supabase 액세스 토큰으로 인증
  timeout: 10000,
});

// 공개 조회 전용 인스턴스: 교차 출처 시 자격증명(쿠키) 제외
export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    // [이론: HTTP의 무상태성] 이전 로그인 결과가 새 요청에 자동 연결되지는 않습니다.
    // getSession()은 저장된 세션을 읽고 필요 시 갱신하는 클라이언트 동작입니다.
    // 매 요청의 Authorization 헤더에 Bearer 방식으로 토큰을 제시하고, 서버가 검증해 사용자를 확인합니다.
    const { data } = supabase ? await supabase.auth.getSession() : { data: {} };
    if (data.session) config.headers.Authorization = `Bearer ${data.session.access_token}`;
    console.log('API request:', config.method?.toUpperCase(), `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 서버에서 온 에러 메시지가 있으면 사용, 없으면 기본 메시지
    const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || '네트워크 오류가 발생했습니다.';
    console.error('API error:', errorMessage);
    
    // 에러 객체에 사용자 친화적인 메시지 추가
    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);

export const restaurantAPI = {
  getRestaurants: async () => {
    const response = await publicApi.get('/api/restaurants', { withCredentials: false });
    return response.data;
  },

  createRestaurant: async (payload) => {
    const response = await api.post('/api/restaurants', payload);
    return response.data;
  },

  updateRestaurant: async (id, payload) => {
    const response = await api.put(`/api/restaurants/${id}`, payload);
    return response.data;
  },

  deleteRestaurant: async (id) => {
    const response = await api.delete(`/api/restaurants/${id}`);
    return response.status;
  },

  getRestaurantById: async (id) => {
    const response = await publicApi.get(`/api/restaurants/${id}`, { withCredentials: false });
    return response.data;
  },

  getPopularRestaurants: async () => {
    const response = await publicApi.get('/api/restaurants/popular', { withCredentials: false });
    return response.data;
  },
};

export const submissionAPI = {
  createSubmission: async (payload) => {
    const response = await api.post('/api/submissions', payload);
    return response.data;
  },
  listSubmissions: async (status) => {
    const response = await api.get('/api/submissions', { params: { status } });
    return response.data;
  },
  updateSubmission: async (id, payload) => {
    const response = await api.put(`/api/submissions/${id}`, payload);
    return response.data;
  },
  approveSubmission: async (id) => {
    const response = await api.post(`/api/submissions/${id}/approve`);
    return response.data;
  },
  deleteSubmission: async (id) => {
    const response = await api.delete(`/api/submissions/${id}`);
    return response.status;
  },
};

export default api;
