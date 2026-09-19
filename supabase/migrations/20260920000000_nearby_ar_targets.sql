create or replace function public.nearby_ar_targets(
  player_lat double precision,
  player_lon double precision,
  radius_meters double precision default 100
)
returns table (
  tag text,
  entity_id text,
  mind_path text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision
)
language sql
stable
security invoker
set search_path = public
as $$
  with distances as (
    select
      target.tag,
      target.entity_id,
      target.mind_path,
      target.latitude,
      target.longitude,
      6371000 * 2 * asin(sqrt(least(1, greatest(0,
        power(sin(radians(target.latitude - player_lat) / 2), 2) +
        cos(radians(player_lat)) * cos(radians(target.latitude)) *
        power(sin(radians(target.longitude - player_lon) / 2), 2)
      )))) as distance_meters
    from public.ar_targets as target
    where target.active = true
  )
  select
    distances.tag,
    distances.entity_id,
    distances.mind_path,
    distances.latitude,
    distances.longitude,
    distances.distance_meters
  from distances
  where distances.distance_meters <= least(greatest(radius_meters, 1), 100)
  order by distances.distance_meters
  limit 20;
$$;

revoke all on function public.nearby_ar_targets(double precision, double precision, double precision) from public;
grant execute on function public.nearby_ar_targets(double precision, double precision, double precision) to authenticated;
