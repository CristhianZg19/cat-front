import axios from 'axios';

const catApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 5000,
});

export const registerLunaUser = async (payload) => {
  const { data } = await catApi.post('/api/cat/register', payload);
  return data;
};

export const registerLunaPet = async (payload) => {
  const { data } = await catApi.post('/api/cat/pet', payload);
  return data;
};
