# 对话归档（需求与技术决策摘要）

> 本文档为项目相关聊天的中文摘要，便于厂家留档；**不替代** Cursor 中的完整聊天记录（如需逐字备份请在 Cursor 中导出对话）。

## 需求摘要

- **形态**：无需安装 App，**手机浏览器**扫码打开即可使用。
- **流程**：扫码 → 授权**后置摄像头** → 全屏相机画面 → 叠加**虚拟成品**（门、油烟机、衣柜、家具、尾翼等）→ 用户调整**大小、位置、方向**并确认，**锁定画面/场景坐标系** → 分步展示**零件、测量尺寸、工具与安装动画、配件** → **下一步** 切换步骤；已装步骤**虚化**，当前步骤**高亮** → 直至装配完成。
- **语言**：厂家可用中文沟通；**终端用户界面与说明文案以英语为主**。
- **厂家资产**：可提供全部三维模型；上线格式统一为 **glTF 2.0 / `.glb`**（见 `CONTENT_SPEC.md`）。
- **兼容**：尽量覆盖常见手机；过旧设备通过检测提示升级或进入降级模式。
- **托管**：使用 **GitHub**（GitHub Pages，HTTPS，便于二维码链接）。

## 本地路径约定

- 项目根目录：`J:\Users\Administrator\Desktop\cursor\AR说明书\`（桌面在 J 盘，父文件夹为 `cursor`）。

## 技术选型

| 项目 | 选择 |
|------|------|
| 构建 | Vite + TypeScript |
| 三维 | Three.js（GLB 加载、步骤高亮/虚化） |
| 真 AR | WebXR `immersive-ar`（在支持的设备上可选） |
| 降级 | `getUserMedia` 全屏相机 + 半透明 WebGL 叠加；不支持时再降级为纯 3D |

## 后续操作（开发者/厂家）

1. 安装 [Node.js LTS](https://nodejs.org/) 后，在本目录执行 `npm install`、`npm run dev`（开发）、`npm run build`（构建）。
2. 将仓库推送到 GitHub，按 `README.md` 启用 GitHub Pages（Source 选 **GitHub Actions**）。
3. 将二维码指向 Pages 的 **https** 地址。

## 工程状态（执行记录）

- 已在 `J:/Users/Administrator/Desktop/cursor/AR说明书` 创建 Vite + TypeScript + Three.js 工程、示例 `manifest.json`、GitHub Actions 部署工作流与英文 `README` / `CONTENT_SPEC.md`。
- 若本机未安装 Node.js，请先安装后再运行 `npm install`。

## 2026-03-31 进度补充（C4213 项目）

- 已将 `public/manifest.json` 改为 **C4213安装说明书**，共 **7 步**中文流程，字段结构与前端代码匹配。
- `partModel` 已配置为：
  - `models/step-1.glb`
  - `models/step-2.glb`
  - `models/step-3.glb`
  - `models/step-4.glb`
  - `models/step-5.glb`
  - `models/step-6.glb`
  - `models/step-7.glb`
- 用户当前 `public/models` 已有：`step-1.glb`、`step-2.glb`、`step-3.glb`、`step-7.glb`；`step-4/5/6.glb` 仍需补齐或改为复用现有模型路径。
- 已确认现有代码逻辑：
  - 若步骤 `partModel` 为空或加载失败，会显示占位几何体。
  - 当前步骤会整体高亮（并非只高亮螺丝子网格）。
  - 尚未实现“门轴侧 left/right 选择后自动切换角落锚点”的专用逻辑。

## 明日开工 TODO（按优先级）

1. 补齐或确认 `step-4.glb`、`step-5.glb`、`step-6.glb`（建议每步一个状态模型）。
2. 在 `public/manifest.json` 内把占位文本补成实值：
   - `___ mm`
   - `木牙螺丝 ×__`
3. 运行联调：
   - `npm install`（首次）
   - `npm run dev`
   - 手机端逐步验证 Step 1~7 的模型、文案与高亮显示。
4. 若需“门轴侧动态切换角落锚点”，新增交互与步骤放置逻辑（需改代码）。
