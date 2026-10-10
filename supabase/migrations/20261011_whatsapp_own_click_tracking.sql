-- Our own WhatsApp tap tracking.
--
-- Until 2026-10-10 the only tap we could count was the invite's, through
-- Wamafy's redirect address (api.wamafy.com/r/…), which reported a `clicked`
-- status on its webhook. The number has since moved to our own account and
-- sends go to Meta directly, and Meta reports a tap to nobody: WhatsApp Manager
-- shows totals per template, never who.
--
-- So each message now carries its own code. The sender mints a random code,
-- adds it to the link tail it already supplies (…&wa=<code>.<button>), and
-- stores it on the message's row here. Every button lands on /invite; when that
-- page opens with a code, the site reports it through log_whatsapp_click() and
-- the row is stamped. People ▸ Call already draws the "clicked" mark from
-- clicked_at, so nothing in the panel changes.
--
-- Additive only: two nullable columns, one index, one function.

alter table public.whatsapp_sends
  add column if not exists click_token text,
  add column if not exists clicked_button smallint;

comment on column public.whatsapp_sends.click_token is
  'Random code carried in this message''s button links (…&wa=<code>.<button>). Set by the sender after the send is logged. NULL on messages with no link, and on every row before 2026-10-11.';
comment on column public.whatsapp_sends.clicked_button is
  'Which button was tapped FIRST, by its position in the template (0 = first). NULL if never tapped, or tapped before this column existed.';

-- One code, one message. Also what makes the lookup below an index hit.
create unique index if not exists whatsapp_sends_click_token_key
  on public.whatsapp_sends (click_token)
  where click_token is not null;

-- Called by the public site with the `wa` value from the address bar.
--
-- WHY ANON MAY CALL THIS, when every other writer of this table needs the log
-- secret: the code IS the proof. It is 96 random bits that exist only inside
-- one recipient's message, so holding it means holding that message. All a
-- caller can do with it is mark that one message as tapped, once.
--
-- It returns nothing either way, so it cannot be used to test whether a code
-- exists. A tap is recorded once: a refresh, a second tap, or the link opened
-- again later changes nothing and writes nothing.
create or replace function public.log_whatsapp_click(p_token text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_code     text;
  v_btn_txt  text;
  v_btn      smallint;
  v_id       bigint;
  v_mid      text;
  v_provider text;
begin
  if p_token is null or length(p_token) > 64 then return; end if;

  v_code    := split_part(p_token, '.', 1);
  v_btn_txt := split_part(p_token, '.', 2);
  -- base64url, the alphabet the senders mint in. Anything else is not ours.
  if v_code !~ '^[A-Za-z0-9_-]{12,40}$' then return; end if;
  if v_btn_txt ~ '^[0-9]$' then v_btn := v_btn_txt::smallint; end if;

  update public.whatsapp_sends
     set clicked_at     = now(),
         clicked_button = v_btn,
         updated_at     = now()
   where click_token = v_code
     and clicked_at is null
  returning id, message_id, provider into v_id, v_mid, v_provider;

  if v_id is null then return; end if;

  -- Same raw log the provider webhooks write to, so one place still holds every
  -- delivery, read and tap in the order they were learned.
  insert into public.whatsapp_send_events (provider, message_id, event, status, payload)
  values (v_provider, v_mid, 'message.click', 'clicked',
          jsonb_build_object('source', 'site', 'button', v_btn));
end;
$function$;

-- Naming PUBLIC matters: revoking from anon/authenticated alone leaves the
-- default PUBLIC grant in place and changes nothing.
revoke all on function public.log_whatsapp_click(text) from public, anon, authenticated;
grant execute on function public.log_whatsapp_click(text) to anon, authenticated;
