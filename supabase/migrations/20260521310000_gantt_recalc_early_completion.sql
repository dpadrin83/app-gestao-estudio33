-- Recálculo: se a predecessora foi concluída ANTES do início planejado,
-- a próxima etapa começa no mesmo dia do fim real (encurta o cronograma).
-- Caso contrário mantém +1 dia entre etapas (ex.: fim 20 → início 21).

create or replace function public.recalculate_project_schedule(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_start date;
  v_end date;
  v_max_pred_end date;
begin
  for r in
    with recursive deps as (
      select a.id, 0 as depth
      from public.activities a
      where a.project_id = p_project_id
        and not exists (
          select 1 from public.activity_dependencies d
          where d.activity_id = a.id
        )
      union all
      select d.activity_id, deps.depth + 1
      from public.activity_dependencies d
      join deps on deps.id = d.predecessor_id
      join public.activities a on a.id = d.activity_id
      where a.project_id = p_project_id
    ),
    ranked as (
      select id, max(depth) as depth
      from deps
      group by id
    )
    select a.*
    from public.activities a
    left join ranked rk on rk.id = a.id
    where a.project_id = p_project_id
    order by coalesce(rk.depth, 0), a.sort_order, a.created_at
  loop
    if r.status = 'completed' or r.actual_end_date is not null then
      continue;
    end if;

    select max(
      case
        when p.status = 'completed'
          and p.actual_end_date is not null
          and p.actual_end_date < p.planned_start_date
        then public.activity_effective_end(p) + coalesce(d.lag_days, 0)
        else public.activity_effective_end(p) + coalesce(d.lag_days, 0) + 1
      end
    )
    into v_max_pred_end
    from public.activity_dependencies d
    join public.activities p on p.id = d.predecessor_id
    where d.activity_id = r.id;

    if v_max_pred_end is not null and r.actual_start_date is null then
      v_start := v_max_pred_end;
      v_end := v_start + greatest(r.estimated_duration_days, 1) - 1;
      if r.kind = 'milestone' then
        v_end := v_start;
      end if;

      update public.activities
      set
        planned_start_date = v_start,
        planned_end_date = v_end,
        status = case
          when status = 'completed' then status
          when v_end < current_date and status in ('not_started', 'in_progress') then 'delayed'
          when status = 'delayed' and v_end >= current_date and actual_start_date is null then 'not_started'
          else status
        end
      where id = r.id;
    elsif r.actual_start_date is not null then
      v_end := r.planned_start_date + greatest(r.estimated_duration_days, 1) - 1;
      if r.kind = 'milestone' then
        v_end := r.planned_start_date;
      end if;

      update public.activities
      set planned_end_date = v_end
      where id = r.id
        and planned_end_date = r.planned_start_date + greatest(r.estimated_duration_days, 1) - 1;
    end if;
  end loop;

  update public.activities
  set status = 'delayed'
  where project_id = p_project_id
    and status in ('not_started', 'in_progress')
    and planned_end_date < current_date;
end;
$$;
