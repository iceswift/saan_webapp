type Environment = Record<string, string | undefined>;

export function stagingPhones(env: Environment = process.env): string[] {
  return (env.STAGING_TEST_PHONES ?? "").split(",").map((p) => p.trim()).filter((p) => /^0\d{9}$/.test(p));
}

export function isStagingTestMode(env: Environment = process.env): boolean {
  return env.APP_ENV === "staging" && env.STAGING_TEST_MODE === "true" && stagingPhones(env).length > 0;
}

/** No real SMS adapter exists yet. Production must fail closed. */
export function canUseTestLogin(phone: string, env: Environment = process.env): boolean {
  if (env.APP_ENV === "staging") return isStagingTestMode(env) && stagingPhones(env).includes(phone);
  return env.NODE_ENV !== "production" && env.APP_ENV !== "production";
}

export function shouldUseMockPayments(env: Environment = process.env): boolean {
  if (env.APP_ENV === "staging") return isStagingTestMode(env) && env.PAYMENT_PROVIDER === "mock";
  return env.NODE_ENV !== "production" && env.APP_ENV !== "production" &&
    (!env.PAYMENT_PROVIDER || env.PAYMENT_PROVIDER === "mock");
}
