
# PUX 进化观测站 - 部署指南

## 项目概述
这是一个产品设计师转型进度看板系统，支持：
- 试点成员进度提交
- 管理员后台（增删改查成员）
- 企业微信群消息推送
- 定时任务（周五提醒、周一汇总）

## 部署到 Vercel

### 1. 准备工作
确保你有：
- Vercel 账号
- 企业微信群机器人 Webhook 地址

### 2. 部署步骤

#### 方法一：通过 Vercel Dashboard 部署
1. 将此项目推送到 GitHub/GitLab/Bitbucket
2. 在 Vercel Dashboard 中导入项目
3. 配置环境变量：
   - `WECOM_WEBHOOK_URL`：知识地图推送群
   - `FEEDBACK_WEBHOOK_URL`：PUX 试点群
4. 点击部署

#### 方法二：通过 Vercel CLI 部署
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

### 3. 部署后配置
1. 在 Vercel 项目设置中配置环境变量
2. 在 Vercel Cron Jobs 中确认定时任务已配置：
   - `/api/pux-friday-reminder`：每周五 16:00
   - `/api/pux-monday-digest`：每周一 09:30

## 使用说明

### 访问地址
- 进度提交页面：`https://your-domain.vercel.app/pux`
- 管理后台：`https://your-domain.vercel.app/pux-admin`

### 功能介绍
1. **进度提交页面**
   - 试点成员选择自己
   - 更新当前阶段和状态
   - 提交关联项目
   - 有进展时自动推送喜报到群

2. **管理后台**
   - 添加新试点成员
   - 编辑现有成员信息
   - 删除成员
   - 查看所有成员进度

3. **定时任务**
   - 每周五 16:00 提醒提交进度
   - 每周一 09:30 推送全景进度汇总

## 项目结构
```
pux-tracker/
├── api/
│   ├── lib.js                 # 公共库（企微接口、节假日等）
│   ├── pux-data.js           # 获取试点数据
│   ├── pux-save.js           # 保存进度
│   ├── pux-admin.js          # 管理员接口
│   ├── pux-friday-reminder.js  # 周五提醒
│   └── pux-monday-digest.js    # 周一汇总
├── public/
│   ├── pux-checkin.html      # 进度提交页面
│   └── pux-admin.html        # 管理后台页面
├── data/
│   └── pux_pilots.json       # 试点数据（自动生成）
├── vercel.json               # Vercel 配置
├── package.json              # 项目依赖
└── DEPLOY.md                 # 部署说明
```

## 注意事项
- Vercel Serverless Functions 的文件系统是临时的，生产环境建议使用数据库
- 节假日列表在 `api/lib.js` 中配置
- 可以根据需要调整三个阶段的定义
