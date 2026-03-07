-- Row Level Security (RLS) Policies
-- Run this after 001_create_tables.sql

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE spi_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_on_one_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_team_analysis ENABLE ROW LEVEL SECURITY;

-- Helper function to get current employee
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID AS $$
    SELECT id FROM employees WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM employees
        WHERE auth_user_id = auth.uid()
        AND role = 'admin'
    )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM employees
        WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is team manager of specific employee
CREATE OR REPLACE FUNCTION is_team_manager_of(employee_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM employees e
        JOIN teams t ON e.team_id = t.id
        WHERE e.id = employee_id
        AND t.manager_id = get_current_employee_id()
    )
$$ LANGUAGE SQL SECURITY DEFINER;

-- Teams policies
CREATE POLICY "Teams are viewable by authenticated users"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Teams are editable by admins"
    ON teams FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Employees policies
CREATE POLICY "Employees are viewable by authenticated users"
    ON employees FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Employees are editable by admins"
    ON employees FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Employees are updatable by admins or self"
    ON employees FOR UPDATE
    TO authenticated
    USING (is_admin() OR id = get_current_employee_id())
    WITH CHECK (is_admin() OR id = get_current_employee_id());

CREATE POLICY "Employees are deletable by admins"
    ON employees FOR DELETE
    TO authenticated
    USING (is_admin());

-- Strengths policies
CREATE POLICY "Strengths are viewable by authenticated users"
    ON strengths FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Strengths are editable by admins"
    ON strengths FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- SPI Results policies
CREATE POLICY "SPI results are viewable by authenticated users"
    ON spi_results FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "SPI results are editable by admins"
    ON spi_results FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Careers policies
CREATE POLICY "Careers are viewable by authenticated users"
    ON careers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Careers are editable by admins or self"
    ON careers FOR INSERT
    TO authenticated
    WITH CHECK (is_admin() OR employee_id = get_current_employee_id());

CREATE POLICY "Careers are updatable by admins or self"
    ON careers FOR UPDATE
    TO authenticated
    USING (is_admin() OR employee_id = get_current_employee_id())
    WITH CHECK (is_admin() OR employee_id = get_current_employee_id());

CREATE POLICY "Careers are deletable by admins or self"
    ON careers FOR DELETE
    TO authenticated
    USING (is_admin() OR employee_id = get_current_employee_id());

-- Evaluations policies (sensitive - restricted access)
CREATE POLICY "Evaluations viewable by self, evaluator, team manager, or admin"
    ON evaluations FOR SELECT
    TO authenticated
    USING (
        is_admin()
        OR employee_id = get_current_employee_id()
        OR evaluator_id = get_current_employee_id()
        OR is_team_manager_of(employee_id)
    );

CREATE POLICY "Evaluations are editable by admins or evaluator"
    ON evaluations FOR INSERT
    TO authenticated
    WITH CHECK (is_admin() OR evaluator_id = get_current_employee_id());

CREATE POLICY "Evaluations are updatable by admins or evaluator"
    ON evaluations FOR UPDATE
    TO authenticated
    USING (is_admin() OR evaluator_id = get_current_employee_id())
    WITH CHECK (is_admin() OR evaluator_id = get_current_employee_id());

CREATE POLICY "Evaluations are deletable by admins"
    ON evaluations FOR DELETE
    TO authenticated
    USING (is_admin());

-- One-on-One Notes policies (sensitive - restricted access)
CREATE POLICY "1on1 notes viewable by self, manager, or admin"
    ON one_on_one_notes FOR SELECT
    TO authenticated
    USING (
        is_admin()
        OR employee_id = get_current_employee_id()
        OR manager_id = get_current_employee_id()
    );

CREATE POLICY "1on1 notes editable by manager or admin"
    ON one_on_one_notes FOR INSERT
    TO authenticated
    WITH CHECK (is_admin() OR manager_id = get_current_employee_id());

CREATE POLICY "1on1 notes updatable by manager or admin"
    ON one_on_one_notes FOR UPDATE
    TO authenticated
    USING (is_admin() OR manager_id = get_current_employee_id())
    WITH CHECK (is_admin() OR manager_id = get_current_employee_id());

CREATE POLICY "1on1 notes deletable by admin"
    ON one_on_one_notes FOR DELETE
    TO authenticated
    USING (is_admin());

-- AI Profiles policies
CREATE POLICY "AI profiles viewable by authenticated users"
    ON ai_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "AI profiles editable by admins"
    ON ai_profiles FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- AI Team Analysis policies
CREATE POLICY "AI team analysis viewable by authenticated users"
    ON ai_team_analysis FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "AI team analysis editable by admins"
    ON ai_team_analysis FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
