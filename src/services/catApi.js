import axios from 'axios';

const catApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 5000,
});

export const registerCatPet = async () => {
  const { data } = await catApi.post('/api/cat/pet');
  return data;
};
