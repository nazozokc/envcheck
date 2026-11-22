import { beforeEach, describe, expect, it, vi } from 'vitest';
import { execa } from 'execa';
import { nixChecker } from '../checkers/nix.js';
import { aptChecker } from '../checkers/apt.js';
import { pacmanChecker } from '../checkers/pacman.js';
import { dnfChecker } from '../checkers/dnf.js';
import { zypperChecker } from '../checkers/zypper.js';
import { apkChecker } from '../checkers/apk.js';
import { cargoChecker } from '../checkers/cargo.js';
import { pipChecker } from '../checkers/pip.js';
import { scoopChecker } from '../checkers/scoop.js';
import { wingetChecker } from '../checkers/winget.js';
import { brewChecker } from '../checkers/brew.js';

vi.mock('execa', async (importOriginal) => {
  const actual = await importOriginal<typeof import('execa')>();
  return { ...actual, execa: vi.fn() };
});

const mockExeca = vi.mocked(execa);

const resolveOnce = (stdout = ''): void => {
  mockExeca.mockResolvedValueOnce({
    stdout,
  } as unknown as Awaited<ReturnType<typeof execa>>);
};

const rejectOnce = (): void => {
  mockExeca.mockRejectedValueOnce(new Error('command failed'));
};

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

  checkers.forEach((checker) => {
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
  beforeEach(() => {
    vi.resetAllMocks();
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
        const [binary, ...args] = command as [string, ...string[]];

        it('should return true for isAvailable when command succeeds', async () => {
          resolveOnce();
          const result = await checker.isAvailable();
          expect(result).toBe(true);
          expect(mockExeca).toHaveBeenCalledWith(binary, ['--version']);
        });

        it('should return false for isAvailable when command fails', async () => {
          rejectOnce();
          const result = await checker.isAvailable();
          expect(result).toBe(false);
        });

        it('should return true for check when package check succeeds', async () => {
          resolveOnce();
          const result = await checker.check('testpkg');
          expect(result).toBe(true);
          expect(mockExeca).toHaveBeenCalledWith(binary, [...args, 'testpkg']);
        });

        it('should return false for check when package check fails', async () => {
          rejectOnce();
          const result = await checker.check('testpkg');
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('List Checkers (brew)', () => {
    describe('brewChecker', () => {
      it('should return true for isAvailable when brew command succeeds', async () => {
        resolveOnce();
        const result = await brewChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('brew', ['--version']);
      });

      it('should return false for isAvailable when brew command fails', async () => {
        rejectOnce();
        const result = await brewChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is in list', async () => {
        resolveOnce('git\nnode\npython\n');
        const result = await brewChecker.check('node');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('brew', ['list']);
      });

      it('should return false for check when package is not in list', async () => {
        resolveOnce('git\npython\n');
        const result = await brewChecker.check('node');
        expect(result).toBe(false);
      });
    });
  });

  describe('Special Checkers (nix, scoop, winget)', () => {
    describe('nixChecker', () => {
      it('should return true for isAvailable when nix command succeeds', async () => {
        resolveOnce();
        const result = await nixChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('nix', ['--version']);
      });

      it('should return false for isAvailable when nix command fails', async () => {
        rejectOnce();
        const result = await nixChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is found via nix-env', async () => {
        resolveOnce();
        const result = await nixChecker.check('nodejs');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('nix-env', ['-q', 'nodejs']);
      });

      it('should return true for check when package is found via nix profile list', async () => {
        rejectOnce(); // nix-env fails
        resolveOnce('nodejs\nnpm\n'); // nix profile list succeeds

        const result = await nixChecker.check('nodejs');
        expect(result).toBe(true);
      });

      it('should return false for check when package not found in either method', async () => {
        rejectOnce(); // nix-env fails
        rejectOnce(); // nix profile list fails

        const result = await nixChecker.check('nonexistent');
        expect(result).toBe(false);
      });
    });

    describe('scoopChecker', () => {
      it('should return true for isAvailable when scoop command succeeds', async () => {
        resolveOnce();
        const result = await scoopChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('scoop', ['--version']);
      });

      it('should return false for isAvailable when scoop command fails', async () => {
        rejectOnce();
        const result = await scoopChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is found in scoop list', async () => {
        resolveOnce('git 2.40.0\nnode 18.17.0\n');
        const result = await scoopChecker.check('node');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('scoop', ['list']);
      });

      it('should return false for check when package is not found in scoop list', async () => {
        resolveOnce('git 2.40.0\npython 3.11.0\n');
        const result = await scoopChecker.check('node');
        expect(result).toBe(false);
      });
    });

    describe('wingetChecker', () => {
      it('should return true for isAvailable when winget command succeeds', async () => {
        resolveOnce();
        const result = await wingetChecker.isAvailable();
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('winget', ['--version']);
      });

      it('should return false for isAvailable when winget command fails', async () => {
        rejectOnce();
        const result = await wingetChecker.isAvailable();
        expect(result).toBe(false);
      });

      it('should return true for check when package is found in winget list', async () => {
        resolveOnce('Git.Git 2.40.0\nNodejs.NodeJS 18.17.0\n');
        const result = await wingetChecker.check('Nodejs.NodeJS');
        expect(result).toBe(true);
        expect(mockExeca).toHaveBeenCalledWith('winget', ['list']);
      });

      it('should return false for check when package is not found in winget list', async () => {
        resolveOnce('Git.Git 2.40.0\nPython.Python 3.11.0\n');
        const result = await wingetChecker.check('Nodejs.NodeJS');
        expect(result).toBe(false);
      });
    });
  });
});
