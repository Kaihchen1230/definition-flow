alter table demo_actor rename to demo_user;

alter table audit_event rename column actor_id to user_id;
