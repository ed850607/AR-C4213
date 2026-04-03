# 明天从这里继续（C4213）

## 当前状态

- `public/manifest.json` 已更新为 **C4213安装说明书**，包含 7 步中文安装流程。
- `partModel` 路径已按 `models/step-1.glb` ~ `models/step-7.glb` 配置好。
- 已有模型文件：`step-1.glb`、`step-2.glb`、`step-3.glb`、`step-7.glb`。
- 待补模型文件：`step-4.glb`、`step-5.glb`、`step-6.glb`（否则对应步骤会显示占位方块）。

## 明天第一步就做这个

1. 把 `step-4.glb`、`step-5.glb`、`step-6.glb` 放到 `public/models/`。
2. 打开 `public/manifest.json`，把所有占位项补成实值：
   - `___ mm`
   - `木牙螺丝 ×__`
3. 启动预览并真机验证：

```bash
cd "J:\Users\Administrator\Desktop\cursor\AR说明书"
npm install
npm run dev
```

## 验收标准（简版）

- Step 1~7 都加载到真实模型（无占位方块）。
- 当前步骤高亮明显，螺丝可见。
- 文案与实际安装动作一致，最后一步完成页正常。

## 备注

- 若后续要实现“门轴侧选择后自动切换角落锚点”，需要改前端逻辑（当前尚未实现）。
- 详细进度归档见：`CHAT_ARCHIVE.md`。
