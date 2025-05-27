const rawEnv = import.meta.env;

const skipBranches = ['staging', 'main'];

function getEnv(): typeof rawEnv {
  if (
    rawEnv.VITE_PAGES_BRANCH &&
    !skipBranches.includes(rawEnv.VITE_PAGES_BRANCH)
  ) {
    return {
      ...rawEnv,
      VITE_SERVER_URL: `https://${rawEnv.VITE_PAGES_BRANCH}-server.john-200.workers.dev`,
      VITE_PUBLIC_MEDIA_URL: `https://${rawEnv.VITE_PAGES_BRANCH}-storage.john-200.workers.dev/storage/public`,
      VITE_STORAGE_SERVICE_URL: `https://${rawEnv.VITE_PAGES_BRANCH}-storage.john-200.workers.dev`,
      VITE_WEBSITE_URL: `https://${rawEnv.VITE_PAGES_BRANCH}-main.john-200.workers.dev`,
    };
  }
  return rawEnv;
}

export const env = getEnv();
