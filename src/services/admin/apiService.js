import axios from 'axios';

// const API_BASE_URL = 'https://ziarapi.myterranet.com/api'
const API_BASE_URL = 'http://127.0.0.1:3000/api';
const API_DB_URL = 'http://127.0.0.1:8000/api';

export const getCollectionApi = async () => {
  try {
    // const res = await axios.get(`${API_BASE_URL}/marketplace/admin/collection`);
    const res = await axios.get(`${API_DB_URL}/v1/collections`);

    return res;
  } catch (err) {
    throw err.response?.data?.error || err.message;
  }
};

export const saveCollectionApi = async (data) => {

  try {
    // const res = await axios.post(`${API_BASE_URL}/marketplace/admin/save-collection`, {
    const res = await axios.post(`${API_DB_URL}/v1/collections`, data);

    return res;
  } catch (err) {
    throw err.response?.data?.error || err.message;
  }
};

export const removeCollectionApi = async (collectionId) => {
  try {
    // const res = await axios.post(`${API_BASE_URL}/marketplace/admin/delete-collection`, {
    const res = await axios.delete(`${API_DB_URL}/v1/collections/${collectionId}`);

    return res;
  } catch (err) {
    throw err.response?.data?.error || err.message;
  }
};


