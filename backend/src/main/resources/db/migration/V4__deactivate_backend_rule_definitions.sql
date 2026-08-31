update definition_module
set active = false
where module_type in ('RULES', 'DERIVED_FACTS');
