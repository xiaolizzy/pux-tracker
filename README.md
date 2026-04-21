# PUX 转型看板系统

一个完整的产品设计师转型进度跟踪系统，支持 PUX 进度收集、PO 协作反馈和可视化看板展示。

## 功能特性

### 📊 看板展示
- 卡片式展示所有 PUX 成员的三步转型进度
- 可视化状态标识：待开始、进行中、已完成
- 展示关联项目和完成时间
- 显示 PO 协作反馈

### 📝 PUX 进度收集
- 选择 PUX 成员
- 选择当前步骤（第一步/第二步/第三步）
- 选择状态（进行中/已完成）
- 输入关联项目名称
- 添加详细说明（可选）

### 💬 PO 协作反馈
- 输入 PO 姓名
- 选择反馈的 PUX 成员
- 业务指标评价（正向/中性/负向）
- 协作效率评价（提高/持平/降低）
- 项目进展描述
- 下一步计划建议
- 总体评价

### ⚙️ 管理后台
- PUX 成员管理（增删）
- 备选 PUX 管理（增删）
- 配置产品/业务和 PO 对应关系

## 三步转型定义

### 第一步：直接和研发对齐任务
从单纯的设计交付，转变为直接与研发团队对齐任务，理解技术实现和业务逻辑。

### 第二步：自己产生想法并推进
主动思考业务问题，提出产品想法，并能够推动想法落地实施。

### 第三步：从想法到 demo 甚至到推广运营
独立完成从想法构思、产品原型、技术实现到运营推广的完整产品闭环。

## 技术架构

### 前端
- 纯 HTML + CSS + JavaScript
- 响应式设计，支持多设备访问
- 美观的渐变设计

### 后端
- Vercel Serverless Functions
- Node.js 18.x
- JSON 文件存储（data/pux_data.json）

### 部署
- Vercel 自动部署
- 支持 Git 集成

## 快速开始

### 方式一：Vercel Dashboard 部署（推荐）

1. 将项目推送到 GitHub/GitLab/Bitbucket
2. 访问 vercel.com，点击 "Import Project"
3. 选择你的项目仓库
4. 点击 "Deploy"
5. 等待部署完成后，访问生成的域名

### 方式二：Vercel CLI 部署

1. 全局安装 Vercel CLI
```bash
npm install -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 进入项目目录并部署
```bash
cd pux-tracker
vercel --prod
```

## 项目结构

```
pux-tracker/
├── api/                      # Serverless Functions
│   ├── lib.js              # 公共库
│   ├── get_data.js         # 获取数据
│   ├── save_pux_progress.js # 保存 PUX 进度
│   ├── save_po_feedback.js # 保存 PO 反馈
│   └── admin.js            # 管理后台接口
├── public/                  # 静态文件
│   └── index.html          # 主页面
├── data/                    # 数据存储
│   └── pux_data.json       # 数据文件（自动生成）
├── vercel.json             # Vercel 配置
├── package.json            # 项目配置
└── README.md               # 说明文档
```

## API 接口

### GET /api/get_data
获取所有看板数据

### POST /api/save_pux_progress
保存 PUX 进度
```json
{
  "pux_id": "pux_001",
  "step": 1,
  "status": "completed",
  "project": "新人 Landing 页面重构",
  "description": "详细说明"
}
```

### POST /api/save_po_feedback
保存 PO 协作反馈
```json
{
  "po_name": "锐仔",
  "pux_id": "pux_001",
  "business_metric": "positive",
  "business_metric_comment": "KPI 提升 20%",
  "collaboration_efficiency": "high",
  "collaboration_efficiency_comment": "效率显著提升",
  "project_progress": "项目进展顺利",
  "next_plan": "下一步继续优化",
  "overall_comment": "非常优秀的 PUX"
}
```

### POST /api/admin
管理后台接口
```json
{
  "action": "add_pux",
  "payload": {
    "name": "容若",
    "product_business": "Coohom/AI Native",
    "po_name": "锐仔"
  }
}
```

支持的 action:
- `add_pux` - 添加 PUX 成员
- `update_pux` - 更新 PUX 成员
- `delete_pux` - 删除 PUX 成员
- `add_backup` - 添加备选 PUX
- `update_backup` - 更新备选 PUX
- `delete_backup` - 删除备选 PUX

## 初始化数据

系统已预置以下 PUX 成员：
- 容若 - Coohom/AI Native - 锐仔
- 图伊 - Coohom/商业增长 - 锐仔
- 沧耳 - Aholo 平台 - 邪神
- 柠木 - Coohom/企业产品 - 九一
- 神乐 - 酷家乐工具/make - 拾厘
- 看看 - 棚拍 - 努努

备选 PUX：
- 葡萄 - 酷家乐工具/工业仿真 - 织墨
- 瑶一 - 建筑结构/户型 - 米兔
- 雨落 - Coohom/商业增长&平台工具 - 霄凡/锐仔
- 藜漫 - 酷家乐工具/KAF - 乃量/天哲

## 使用说明

### 访问看板
部署成功后，访问根域名即可看到看板展示。

### 收集 PUX 进度
1. 点击 "PUX 进度收集" 导航按钮
2. 选择 PUX 成员
3. 填写当前步骤、状态、项目信息
4. 点击 "提交进度"

### 收集 PO 协作反馈
1. 点击 "PO 协作反馈" 导航按钮
2. 填写 PO 姓名，选择 PUX 成员
3. 评价业务指标和协作效率
4. 填写项目进展和下一步计划
5. 点击 "提交反馈"

### 管理成员
1. 点击 "管理后台" 导航按钮
2. 可以添加/删除 PUX 成员和备选 PUX
3. 配置对应的产品/业务和 PO

## 注意事项

1. **数据持久化**：当前使用 JSON 文件存储数据，适合小规模使用。生产环境建议使用数据库。
2. **权限控制**：当前没有身份认证功能，建议在内部网络使用。
3. **备份数据**：定期备份 data/pux_data.json 文件。
4. **Vercel 限制**：Vercel Serverless Functions 有运行时间限制，不适合处理大量数据。

## 扩展建议

1. **用户认证**：接入 OAuth 或简单的密码登录
2. **数据库**：迁移到 MongoDB 或 PostgreSQL
3. **数据可视化**：添加进度统计图表
4. **通知功能**：集成企业微信机器人，自动通知进度更新
5. **历史记录**：展示完整的进度变更历史
6. **数据导出**：支持导出 Excel 或 CSV 格式

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
