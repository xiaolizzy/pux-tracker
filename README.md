# PUX 全景进化看板

这是原 `localhost:3001/pux-dashboard` 的可部署版本，保留原来的白底绿色看板 UI，并改造成 Vercel 友好的静态页面 + Serverless API。

## 页面

- `/pux-dashboard`: PUX 全景进化看板
- `/pux`: PUX 进度同步表单
- `/admin`: 管理后台，可新增、修改、删除 PUX 成员，维护产品业务和 PO
- `/api/pux/data`: 获取看板数据
- `/api/pux/save`: 保存进度并推送企业微信
- `/api/pux/admin`: 管理后台保存名单和业务信息

## Vercel 配置

- Framework Preset: `Other`
- Build Command: `npm run build`
- Output Directory: 留空
- Install Command: `npm install`

## 环境变量

复制 `.env.example` 并在 Vercel Project Settings 中配置：

- `SUPABASE_URL`: Supabase 项目地址
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key，用于服务端持久化
- `SUPABASE_STATE_TABLE`: 默认 `pux_dashboard_state`
- `FEEDBACK_WEBHOOK_URL`: 企业微信群机器人 webhook
- `WECOM_MENTION_ALL`: 是否 @所有人，默认 `false`
- `PUBLIC_BASE_URL`: 线上域名，用于企业微信消息中的看板链接

## Supabase 初始化

在 Supabase SQL Editor 执行：

```sql
create table if not exists public.pux_dashboard_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pux_dashboard_state enable row level security;

drop policy if exists "service role can manage pux dashboard state" on public.pux_dashboard_state;
create policy "service role can manage pux dashboard state"
  on public.pux_dashboard_state
  for all
  using (true)
  with check (true);
```

首次访问 `/api/pux/data` 时，如果 Supabase 中还没有数据，系统会用 `pux-tracker/pux_pilots.json` 自动初始化一份。

## 本地预览

```bash
npm install
npm run dev
```

如果没有配置 Supabase，本地仍可打开看板，但进度保存不会持久化到线上数据库。
