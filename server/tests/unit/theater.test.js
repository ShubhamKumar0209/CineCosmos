import { jest } from '@jest/globals';
import * as theaterService from '../../src/features/theater/theater.service.js';
import Theater from '../../src/features/theater/theater.model.js';
import Screen from '../../src/features/theater/screen.model.js';
import City from '../../src/features/city/city.model.js';
import AppError from '../../src/utils/AppError.js';

jest.mock('../../src/features/theater/theater.model.js');
jest.mock('../../src/features/theater/screen.model.js');
jest.mock('../../src/features/city/city.model.js');

describe('Theater Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTheater', () => {
    it('should throw an error if city does not exist', async () => {
      City.findById.mockResolvedValue(null);

      await expect(
        theaterService.createTheater({ name: 'PVR', city: 'invalid_city_id', address: 'Main St' })
      ).rejects.toThrow(AppError);
    });

    it('should create a theater if city exists', async () => {
      City.findById.mockResolvedValue({ _id: 'city123', name: 'Mumbai' });
      Theater.create.mockResolvedValue({ _id: 'theater123', name: 'PVR', city: 'city123' });

      const theater = await theaterService.createTheater({
        name: 'PVR',
        city: 'city123',
        address: 'Main St',
      });

      expect(Theater.create).toHaveBeenCalledWith({
        name: 'PVR',
        city: 'city123',
        address: 'Main St',
      });
      expect(theater.name).toBe('PVR');
    });
  });
});
