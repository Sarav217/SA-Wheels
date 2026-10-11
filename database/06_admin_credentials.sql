-- Admin login credentials for the separate Admin Login.
-- Run this script after 01-05. It is safe to run more than once.
--
-- Admins sign in with ADMIN.USERNAME and a PBKDF2 hash in ADMIN.PASSWORD_HASH.
-- No plaintext admin password is stored anywhere in the database.
--
-- Demo login (for local development only):
--   Username: admin
--   Password: Admin@123
--
-- To change the password, generate a new hash and update the row:
--   java -cp out com.busticket.util.PasswordHasher "NewPassword"
--   UPDATE admin SET password_hash = '<printed hash>' WHERE username = 'admin';

-- 1. Add the username and password hash columns (skip if they already exist).
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE admin ADD (username VARCHAR2(50), password_hash VARCHAR2(200))';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column already exists
            RAISE;
        END IF;
END;
/

-- 2. Make sure the account linked to the admin exists in USERS.
--    Its USERS.PASSWORD is a placeholder so it cannot be used on the passenger login.
MERGE INTO users target
USING (SELECT 'admin@busticket.com' email FROM dual) source
ON (target.email = source.email)
WHEN NOT MATCHED THEN
    INSERT (full_name, email, password, phone_number)
    VALUES ('System Administrator', 'admin@busticket.com', 'ADMIN-ACCOUNT-USE-ADMIN-LOGIN', '9876543212');

-- 3. Create or update the demo admin with username "admin".
--    The hash below is PBKDF2-HMAC-SHA256 (210000 iterations) of the demo password.
MERGE INTO admin target
USING (
    SELECT user_id,
           'admin' username,
           'pbkdf2$210000$WxnQhlSz0ZxoE3ertdFjJA==$Re36qQCGa0rFvM0b6QBA+KKqVZZLDYmeeifN/8BBh8I=' password_hash
    FROM users
    WHERE email = 'admin@busticket.com'
) source
ON (target.user_id = source.user_id)
WHEN MATCHED THEN
    UPDATE SET target.username = source.username,
               target.password_hash = source.password_hash
WHEN NOT MATCHED THEN
    INSERT (user_id, admin_role, username, password_hash)
    VALUES (source.user_id, 'ADMIN', source.username, source.password_hash);

-- 4. Remove any plaintext password left on admin-linked USERS rows.
UPDATE users
SET password = 'ADMIN-ACCOUNT-USE-ADMIN-LOGIN'
WHERE user_id IN (SELECT user_id FROM admin);

-- 5. Give any other existing admin rows a username so the columns can be NOT NULL.
--    Their PASSWORD_HASH stays a non-matching marker until a real hash is set.
UPDATE admin
SET username = 'admin' || admin_id
WHERE username IS NULL;

UPDATE admin
SET password_hash = 'NOT-SET'
WHERE password_hash IS NULL;

-- 6. Require the new columns and keep admin usernames unique.
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE admin MODIFY (username NOT NULL, password_hash NOT NULL)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1442 THEN -- ORA-01442: column is already NOT NULL
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE admin ADD CONSTRAINT uq_admin_username UNIQUE (username)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE NOT IN (-2261, -2264) THEN -- constraint already exists
            RAISE;
        END IF;
END;
/

COMMIT;

-- Check the result. PASSWORD_HASH should start with "pbkdf2$".
SELECT admin_id, username, admin_role, SUBSTR(password_hash, 1, 14) AS hash_prefix
FROM admin;
