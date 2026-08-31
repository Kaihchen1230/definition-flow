alter table calculation_result add column if not exists engine_id varchar(120);
alter table calculation_result add column if not exists rule_set_version varchar(200);
