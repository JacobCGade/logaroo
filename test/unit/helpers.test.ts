import {yyyymmdd, yyyymmdd_hh, ensureFileExists, ensureIsDirectory} from "../../lib/logaroo/helpers";
import * as fsPromises from 'fs/promises';

jest.mock('fs/promises')

describe('Helpers', () => {
  describe('yyyymmdd', () => {
    it('formats current date correctly', () => {
      const mockDate = new Date(2024, 0, 24); // January 24, 2024
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as Date);

      const result = yyyymmdd();
      expect(result).toBe('20240124');
    });

    it('formats a single-digit day and month correctly', () => {
      const mockDate = new Date(2024, 8, 5); // September 5, 2024
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as Date);

      const result = yyyymmdd();
      expect(result).toBe('20240905');
    });
  });

  describe('yyyymmdd_hh', () => {
    it('formats current date and hour correctly', () => {
      // Mock the date and hour
      const mockDate = new Date(2024, 0, 24, 15); // January 24, 2024, 15:00 hours
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as Date);

      // Test the yyyymmdd part
      expect(yyyymmdd()).toBe('20240124');

      // Test the yyyymmdd_hh part
      const result = yyyymmdd_hh();
      expect(result).toBe('20240124_15');
    });

    it('formats a single-digit month, day and hour correctly', () => {
      // Mock a single-digit hour
      const mockDate = new Date(2024, 8, 5, 8); // September 5, 2024, 08:00 hours
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as Date);

      // Test the yyyymmdd part
      expect(yyyymmdd()).toBe('20240905');

      // Test the yyyymmdd_hh part
      const result = yyyymmdd_hh();
      expect(result).toBe('20240905_08');
    });
  });

  describe('ensureFileExists', () => {
    it('does nothing if the file already exists', async () => {
      // Mock fsPromises.stat to simulate an existing file
      // @ts-ignore
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({});

      await expect(ensureFileExists('path/to/existing/file')).resolves.toBeUndefined();

      expect(fsPromises.writeFile).not.toHaveBeenCalled();
    });

    it('creates the file if it does not exist', async () => {
      // Mock fsPromises.stat to throw ENOENT
      jest.spyOn(fsPromises, 'stat').mockRejectedValue({ code: 'ENOENT' });
      jest.spyOn(fsPromises, 'writeFile').mockResolvedValue();

      await expect(ensureFileExists('path/to/nonexistent/file')).resolves.toBeUndefined();

      expect(fsPromises.writeFile).toHaveBeenCalledWith('path/to/nonexistent/file', '', 'utf8');
    });

    it('throws an error for unexpected issues', async () => {
      // Mock fsPromises.stat to throw a generic error
      const error = new Error('Unexpected error');
      jest.spyOn(fsPromises, 'stat').mockRejectedValue(error);

      await expect(ensureFileExists('path/to/file')).rejects.toThrow(error);
    });
  });

  describe('ensureIsDirectory', () => {
    it('does nothing if the path is a directory', async () => {
      // @ts-ignore
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({ isDirectory: () => true });

      await expect(ensureIsDirectory('path/to/directory')).resolves.toBeUndefined();

      expect(fsPromises.mkdir).not.toHaveBeenCalled();
    })
    it('creates the directory if it does not exist', async () => {
      jest.spyOn(fsPromises, 'stat').mockRejectedValue({ code: 'ENOENT' });

      await expect(ensureIsDirectory('path/to/nonexistent/directory')).resolves.toBeUndefined();

      expect(fsPromises.mkdir).toHaveBeenCalledWith('path/to/nonexistent/directory', { recursive: true });
    })
    it('throws an error if the path is not a directory', async () => {
      // @ts-ignore
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({ isDirectory: () => false });

      await expect(ensureIsDirectory('path/to/file')).rejects.toThrow("The path \"path/to/file\" is not a directory.");
    })
  });



  afterEach(() => {
    jest.restoreAllMocks();
  });
})