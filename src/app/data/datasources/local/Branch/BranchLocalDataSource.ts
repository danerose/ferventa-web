const ACTIVE_BRANCH_ID_KEY = 'ferventa_active_branch';
const ACTIVE_BRANCH_NAME_KEY = 'ferventa_active_branch_name';
const PUBLIC_BRANCH_ID_KEY = 'ferventa_public_branch';

export class BranchLocalDataSource {
  getActiveBranchId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_BRANCH_ID_KEY);
    } catch {
      return null;
    }
  }

  getActiveBranchName(): string | null {
    try {
      return localStorage.getItem(ACTIVE_BRANCH_NAME_KEY);
    } catch {
      return null;
    }
  }

  saveActiveBranch(id: string | null, name?: string | null): void {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_BRANCH_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_BRANCH_ID_KEY);
      }

      if (name) {
        localStorage.setItem(ACTIVE_BRANCH_NAME_KEY, name);
      } else if (name === null) {
        localStorage.removeItem(ACTIVE_BRANCH_NAME_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  getPublicBranchId(): string | null {
    try {
      return localStorage.getItem(PUBLIC_BRANCH_ID_KEY);
    } catch {
      return null;
    }
  }

  savePublicBranchId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(PUBLIC_BRANCH_ID_KEY, id);
      } else {
        localStorage.removeItem(PUBLIC_BRANCH_ID_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }
}
