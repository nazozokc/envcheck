import { describe, it, expect } from 'bun:test';
import { nixChecker } from '../checkers/nix';
import { aptChecker } from '../checkers/apt';
import { pacmanChecker } from '../checkers/pacman';

describe('Checker Interface - Basic Structure', () => {
  describe('nixChecker', () => {
    it('should have a name property', () => {
      expect(nixChecker.name).toBe('nix');
    });

    it('should have isAvailable method', () => {
      expect(typeof nixChecker.isAvailable).toBe('function');
    });

    it('should have check method', () => {
      expect(typeof nixChecker.check).toBe('function');
    });
  });

  describe('aptChecker', () => {
    it('should have a name property', () => {
      expect(aptChecker.name).toBe('apt');
    });

    it('should have isAvailable method', () => {
      expect(typeof aptChecker.isAvailable).toBe('function');
    });

    it('should have check method', () => {
      expect(typeof aptChecker.check).toBe('function');
    });
  });

  describe('pacmanChecker', () => {
    it('should have a name property', () => {
      expect(pacmanChecker.name).toBe('pacman');
    });

    it('should have isAvailable method', () => {
      expect(typeof pacmanChecker.isAvailable).toBe('function');
    });

    it('should have check method', () => {
      expect(typeof pacmanChecker.check).toBe('function');
    });
  });
});