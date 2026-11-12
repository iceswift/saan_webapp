-- Provision the disposable customer only on the Lab 5 database and migration role.
DO $lab5$
BEGIN
    IF current_database() = 'saan' AND current_user = 'saan_app' THEN
        INSERT INTO public."User" ("id", "phone", "name", "role")
        VALUES ('lab5-en021-customer', 'lab5-en021-test', 'Lab 5 Test Customer', 'CUSTOMER')
        ON CONFLICT ("id") DO NOTHING;

        IF NOT EXISTS (
            SELECT 1
            FROM public."User"
            WHERE "id" = 'lab5-en021-customer'
              AND "phone" = 'lab5-en021-test'
              AND "name" = 'Lab 5 Test Customer'
              AND "role" = 'CUSTOMER'
              AND "deletedAt" IS NULL
        ) THEN
            RAISE EXCEPTION 'Lab 5 customer ID belongs to an unexpected record';
        END IF;
    END IF;
END;
$lab5$;
