-- Security.md §2.2: wallet mutations must be locked/serialized. Both RPCs
-- are service_role-only — never callable from anon/authenticated (Rules.md #2).

create or replace function public.adjust_wallet_balance(
  p_user_id uuid,
  p_delta_cents bigint,
  p_type text,
  p_reference_job_id uuid default null,
  p_proof_url text default null,
  p_status text default 'completed'
) returns table(new_balance_cents bigint, transaction_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_current_balance bigint;
  v_new_balance bigint;
  v_tx_id uuid;
begin
  select balance_cents into v_current_balance from public.wallets where user_id = p_user_id for update;
  if not found then raise exception 'Wallet not found for user %', p_user_id; end if;
  v_new_balance := v_current_balance + p_delta_cents;
  if v_new_balance < 0 then raise exception 'INSUFFICIENT_BALANCE: current % delta %', v_current_balance, p_delta_cents; end if;
  update public.wallets set balance_cents = v_new_balance, updated_at = now() where user_id = p_user_id;
  insert into public.wallet_transactions (user_id, type, amount_cents, status, reference_job_id, proof_url)
  values (p_user_id, p_type, p_delta_cents, p_status, p_reference_job_id, p_proof_url) returning id into v_tx_id;
  return query select v_new_balance, v_tx_id;
end;
$$;
revoke execute on function public.adjust_wallet_balance from public, anon, authenticated;
grant execute on function public.adjust_wallet_balance to service_role;

create or replace function public.finalize_wallet_request(
  p_transaction_id uuid,
  p_approve boolean
) returns table(new_balance_cents bigint, new_status text)
language plpgsql security definer set search_path = public as $$
declare
  v_tx record;
  v_balance bigint;
  v_new_balance bigint;
begin
  select * into v_tx from public.wallet_transactions where id = p_transaction_id for update;
  if not found then raise exception 'Transaction % not found', p_transaction_id; end if;
  if v_tx.status <> 'pending' then raise exception 'ALREADY_RESOLVED: transaction % is already %', p_transaction_id, v_tx.status; end if;
  if v_tx.type not in ('deposit', 'withdrawal') then
    raise exception 'finalize_wallet_request only handles deposit/withdrawal, got %', v_tx.type;
  end if;
  if not p_approve then
    update public.wallet_transactions set status = 'failed' where id = p_transaction_id;
    select balance_cents into v_balance from public.wallets where user_id = v_tx.user_id;
    return query select v_balance, 'failed'::text;
  end if;
  select balance_cents into v_balance from public.wallets where user_id = v_tx.user_id for update;
  if not found then raise exception 'Wallet not found for user %', v_tx.user_id; end if;
  if v_tx.type = 'deposit' then
    v_new_balance := v_balance + v_tx.amount_cents;
  else
    v_new_balance := v_balance - v_tx.amount_cents;
    if v_new_balance < 0 then raise exception 'INSUFFICIENT_BALANCE: cannot withdraw % from %', v_tx.amount_cents, v_balance; end if;
  end if;
  update public.wallets set balance_cents = v_new_balance, updated_at = now() where user_id = v_tx.user_id;
  update public.wallet_transactions set status = 'completed' where id = p_transaction_id;
  return query select v_new_balance, 'completed'::text;
end;
$$;
revoke execute on function public.finalize_wallet_request from public, anon, authenticated;
grant execute on function public.finalize_wallet_request to service_role;
