/*
  # Create projects table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `flow` (text) - Type van analyse flow (start/improve)
      - `data` (jsonb) - Project data en voortgang
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `projects` table
    - Add policy for public read/write access (anonieme gebruikers)
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy voor openbare toegang (lezen en schrijven voor iedereen)
CREATE POLICY "Public access for projects"
  ON projects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Index voor betere performance
CREATE INDEX IF NOT EXISTS projects_flow_idx ON projects(flow);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);