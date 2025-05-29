import * as dotenv from 'dotenv';
import { Client } from 'pg';

// Load environment variables
dotenv.config();

async function fixSessionColumn() {
  // Create a direct pg client without using TypeORM, using the known working credentials
  const client = new Client({
    host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || process.env.DB_PORT || '5432', 10),
    user: 'authcakes_user', // Use the known working username
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD, // Password from env
    database: 'authcakes', // Use the known working database name
    // Disable SSL by default unless explicitly enabled
    ssl:
      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log('Connecting to database...');
    console.log(
      `Using connection: ${client.host}:${client.port}/${client.database}`,
    );
    await client.connect();
    console.log('Connected to database successfully');

    // Check if sessions table exists
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `);

    const tableExists = checkTableResult.rows[0].exists;
    if (!tableExists) {
      console.log('Sessions table does not exist, no fix needed.');
      return;
    }

    // Check if revokedBy column exists
    const checkColumnResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions' 
        AND column_name = 'revokedBy'
      );
    `);

    const columnExists = checkColumnResult.rows[0].exists;
    if (!columnExists) {
      console.log(
        'revokedBy column does not exist in sessions table, no fix needed.',
      );
      return;
    }

    console.log('Fixing revokedBy column type...');

    // Drop any foreign keys or constraints that might reference this column
    await client.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        FOR constraint_name IN
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = 'sessions' AND ccu.column_name = 'revokedBy'
        LOOP
          EXECUTE 'ALTER TABLE sessions DROP CONSTRAINT IF EXISTS ' || constraint_name;
        END LOOP;
      END;
      $$;
    `);

    // Modify the column type to VARCHAR(128)
    await client.query(`
      ALTER TABLE sessions 
      ALTER COLUMN "revokedBy" TYPE VARCHAR(128) USING "revokedBy"::VARCHAR(128);
    `);

    console.log('Successfully fixed revokedBy column type!');
  } catch (error) {
    console.error('Error fixing session column:', error);
    // Print environment variables for debugging
    console.log('Environment variables (sanitized):');
    console.log(
      `PG_HOST/DB_HOST: ${process.env.PG_HOST || process.env.DB_HOST || 'not set'}`,
    );
    console.log(
      `PG_PORT/DB_PORT: ${process.env.PG_PORT || process.env.DB_PORT || 'not set'}`,
    );
    console.log(
      `PG_USER/DB_USER: ${process.env.PG_USER || process.env.PG_USERNAME || process.env.DB_USERNAME || process.env.DB_USER ? '[set]' : 'not set'}`,
    );
    console.log(
      `PG_DATABASE/DB_DATABASE: ${process.env.PG_DATABASE || process.env.DB_DATABASE || 'not set'}`,
    );
  } finally {
    // Close database client connection
    try {
      if (client) {
        await client.end();
        console.log('Database connection closed.');
      }
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the function
fixSessionColumn().catch(console.error);
