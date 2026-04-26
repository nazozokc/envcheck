import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import { nixChecker } from '../checkers/nix';
import { aptChecker } from '../checkers/apt';
import { pacmanChecker } from '../checkers/pacman';
import { dnfChecker } from '../checkers/dnf';
import { zypperChecker } from '../checkers/zypper';
import { apkChecker } from '../checkers/apk';
import { cargoChecker } from '../checkers/cargo';
import { pipChecker } from '../checkers/pip';
import { scoopChecker } from '../checkers/scoop';
import { wingetChecker } from '../checkers/winget';
import { brewChecker } from '../checkers/brew';

// Mock execa globally
vi.mock('execa', async () => {
  const actual = await vi.importActual('execa');
  return {
    ...actual,
    default: vi.fn(),
  };
});

describe('Checker Interface - Basic Structure', () => {
  const checkers = [
    nixChecker,
    aptChecker,
    pacmanChecker,
    dnfChecker,
    zypperChecker,
    apkChecker,
    cargoChecker,
    pipChecker,
    scoopChecker,
    wingetChecker,
    brewChecker,
  ];

  checkers.forEach(checker => {
    describe(`${checker.name}Checker`, () => {
      it('should have a name property', () => {
        expect(checker.name).toBeDefined();
        expect(typeof checker.name).toBe('string');
      });

      it('should have isAvailable method', () => {
        expect(typeof checker.isAvailable).toBe('function');
      });

      it('should have check method', () => {
        expect(typeof checker.check).toBe('function');
      });
    });
  });
});

describe('Checker Functionality', () => {
  // Get the mocked execa
  const mockExeca = require('execa').default;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Simple Checkers (apt, pacman, dnf, zypper, apk, cargo, pip)', () => {
    const simpleCheckers = [
      { checker: aptChecker, command: ['dpkg'] },
      { checker: pacmanChecker, command: ['pacman'] },
      { checker: dnfChecker, command: ['dnf'] },
      { checker: zypperChecker, command: ['zypper'] },
      { checker: apkChecker, command: ['apk'] },
      { checker: cargoChecker, command: ['cargo', 'install', '--list'] },
      { checker: pipChecker, command: ['pip', 'show'] },
    ];

    simpleCheckers.forEach(({ checker, command }) => {
      describe(`${checker.name}Checker`, () => {
        it('should return true for isAvailable when command succeeds', async () => {
          mockExeca.mockResolvedValueOnce({});
          const result = await checker.isAvailable();
          expect(result).toBe(true);
          expect(mockExeca).toHaveBeenCalledWith(command[0], [...command.slice(1), '--version']);
        });

        it('should return false for isAvailable when command fails', async () => {
          mockExeca.mockRejectedValueOnce(new Error('command not found'));
          const result = await checker.isAvailable();
          expect(result).toBe(false);
        });

        it('should return true for check when package check succeeds', async () => {
          mockExeca.mockResolvedValueOnce({});
          const result = await checker.check('testpkg');
          expect(result).toBe(true);
          expect(mockExeca).toHaveBeenCalledWith(command[0], [...command.slice(1), 'testpkg']);
        });

        it('should return false for check when package check fails', async () => {
          mockExeca.mockRejectedValueOnce(new Error('package not found'));
          const result = await checker.check('testpkg');
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('List Checkers (brew)', () => {
    describe('brewChecker', () => {
      it('should return true for isAvailable when brew command succeeds', async () => {
        mockExeca.mockResolvedValueOnce({});
        const result = await brewChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('brew', ['--version']);
      });

      it('should return false for isAvailable when brew command fails', async () => {
        mockExeca.mockRejectedValueOnce(new Error('command not found'));
        const result = await brewChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is in list', async () => {
        mockExeca.mockResolvedValueOnce({ stdout: 'git\nnode\npython\n' });
        const result = await brewChecker.check('node');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('brew', ['list']);
      });

      it('should return false for check when package is not in list', async () => {
        mockExeca.mockResolvedValueOnce({ stdout: 'git\npython\n' });
        const result = await brewChecker.check('node');
        expect(result).toBe(false);
      });
    });
  });

  describe('Special Checkers (nix, scoop, winget)', () => {
    describe('nixChecker', () => {
      it('should return true for isAvailable when nix command succeeds', async () => {
        mockExeca.mockResolvedValueOnce({});
        const result = await nixChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('nix', ['--version']);
      });

      it('should return false for isAvailable when nix command fails', async () => {
        mockExeca.mockRejectedValueOnce(new Error('command not found'));
        const result = await nixChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is found via nix-env', async () => {
        mockExeca.mockResolvedValueOnce({});
        const result = await nixChecker.check('nodejs');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('nix-env', ['-q', 'nodejs']);
      });

      it('should return true for check when package is found via nix profile list', async () => {
        mockExeca
          .mockRejectedValueOnce(new Error('package not found')) // nix-env fails
          .mockResolvedValueOnce({ stdout: 'nodejs\nnpm\n' }); // nix profile list succeeds
        
        const result = await nixChecker.check('nodejs');
        expect(result).toBe(true);
      });

      it('should return false for check when package not found in either method', async () => {
        mockExeca
          .mockRejectedValueOnce(new Error('package not found')) // nix-env fails
          .mockRejectedValueOnce(new Error('command failed')); // nix profile list fails
        
        const result = await nixChecker.check('nonexistent');
        expect(result).toBe(false);
      });
    });

    describe('scoopChecker', () => {
      it('should return true for isAvailable when scoop command succeeds', async () => {
        mockExeca.mockResolvedValueOnce({});
        const result = await scoopChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('scoop', ['--version']);
      });

      it('should return false for isAvailable when scoop command fails', async () => {
        mockExeca.mockRejectedValueOnce(new Error('command not found'));
        const result = await scoopChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is found in scoop list', async () => {
        mockExeca.mockResolvedValueOnce({ stdout: 'git 2.40.0\nnode 18.17.0\n' });
        const result = await scoopChecker.check('node');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('scoop', ['list']);
      });

      it('should return false for check when package is not found in scoop list', async () => {
        mockExeca.mockResolvedValueOnce({ stdout: 'git 2.40.0\npython 3.11.0\n' });
        const result = await scoopChecker.check('node');
        expect(result).toBe(false);
      });
    });

    describe('wingetChecker', () => {
      it('should return true for isAvailable when winget command succeeds', async () => {
        mockExeca.mockResolvedValueOnce({});
        const result = await wingetChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('winget', ['--version']);
      });

      it('should return false for isAvailable when winget command fails', async () => {
        mockExeca.mockRejectedValueOnce(new Error('command not found'));
        const result = await wingetChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is found in winget list', async () => {
        mockExeca.mockResolvedValueOnce({ stdout: 'Git.Git 2.40.0\nNodejs.NodeJS 18.17.0\n' });
        const result = await wingetChecker.check('Nodejs.NodeJS');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('winget', ['list']);
      });

      it('should return false for check when package is not found in winget list', async () => {
        mockExeca.mockResolvedValueOnce({ stdout: 'Git.Git 2.40.0\nPython.Python 3.11.0\n' });
        const result = await wingetChecker.check('Nodejs.NodeJS');
        expect(result).toBe(false);
      });
    });
  });
});
