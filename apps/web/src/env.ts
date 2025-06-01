const rawEnv = import.meta.env;

function getEnv(): typeof rawEnv {
  return rawEnv;
}

export const env = getEnv();
