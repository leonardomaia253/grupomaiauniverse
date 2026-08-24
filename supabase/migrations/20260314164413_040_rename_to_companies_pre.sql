-- Rename purchases column
ALTER TABLE purchases RENAME COLUMN developer_id TO company_id;

-- Rename developer_customizations table and column
ALTER TABLE developer_customizations RENAME TO company_customizations;
ALTER TABLE company_customizations RENAME COLUMN developer_id TO company_id;;
