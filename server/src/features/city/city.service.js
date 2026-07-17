import City from './city.model.js';

export const getAllCities = async (query = {}) => {
  return await City.find(query).sort({ name: 1 });
};

export const createCity = async (cityData) => {
  return await City.create(cityData);
};

export const getCityById = async (id) => {
  return await City.findById(id);
};
