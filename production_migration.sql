-- 1. Ensure the user exists (Idempotent)
INSERT INTO users (name, email, email_verified, image) 
VALUES ('merttekfidan', 'merttekfidan@gmail.com', NOW(), NULL) 
ON CONFLICT (email) DO NOTHING;

-- 2. Migrate existing orphan records (NULL user_id) to this user
UPDATE applications 
SET user_id = (SELECT id FROM users WHERE email = 'merttekfidan@gmail.com') 
WHERE user_id IS NULL;

-- 3. Verify the count (Optional)
SELECT COUNT(*) as migrated_apps 
FROM applications 
WHERE user_id = (SELECT id FROM users WHERE email = 'merttekfidan@gmail.com');
