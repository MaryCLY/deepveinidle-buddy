# 当前状态

版本：**0.5.8**。计算基线：**1.0.1214**（对应 `package.json` 与 `vendor/manifest.json`）。线上发布记录以[GitHub Releases](https://github.com/yukixz/deepveinidle-buddy/releases)与[Greasy Fork](https://greasyfork.org/zh-CN/scripts/601896-deepveinidle-buddy)为准，历史变更见[更新说明](../CHANGELOG.md)。

功能与计算规则统一见[面板规则](panel.md)，模块和上游来源见[技术方案](technical.md)。工作区存档保持 `version=2`，新增字段的兼容与降级限制见[存储与恢复](panel.md#存储与恢复)。

## 当前版本变更

### 工作区待发布

收藏（制造）将「展开半成品」改为「考虑自制半成品」。旧存档已开启的角色会自动参与比价，部分原需自制的缺口可能改为直购。严格自制更便宜且安排了配套制造时，采购材料行显示暗金色「自制」，可用细铜边次选购买按钮预填替代购买草稿。[设计规格](superpowers/specs/2026-11-12-consider-crafting-intermediates-design.md)

桌面无头 Chrome 使用同一 70 级合成角色、5,119 行候选、两个收藏目标和固定行情，交替测量开关，预热后各取 35 组中位数。全量候选重建关闭／开启为 38.8／39.3 ms，候选缓存命中时为 10.7／10.3 ms，固定单重算为 0.115／0.160 ms（每组 40 次）。以上只计计算，不含绘制或游戏网络时间。

本次工作区通过 229 项单元测试与本地构建。桌面无头 Chrome 通过助手模式、成本阈值、供应筛选、游戏预填和移动表格五组场景，共 88 项检查，包含 390px 窄屏标记布局。真实账号与移动真机尚未验证此功能。

### 已发布基线 0.5.8

制造、收藏与半成品按动作技能选择绑定精通页。技能未绑定或所指页不存在时使用当前页，已拥有的空页按零分配计算。客户端分页不完整时可回退到同角色服务器快照，客户端恢复后重新使用实时数据。用户存档保持 version=2。[完整规格](superpowers/specs/2026-11-12-skill-mastery-pages-design.md)

## 验证与边界

0.5.8-beta.1 曾在桌面 Chrome 真实账号核对收藏（制造）的四个配方，制箭、锻造和草药的秒／点均与绑定页复算一致。其后的分页异常回退修复已通过自动化回归。移动真机及长期运行尚待验收。

发布门禁与日常入口见[构建与发布](releasing.md#日常入口)。本地结果路径：

- `.test-artifacts/release-task/summary.json`：发布任务阶段、结果及诊断日志路径。
- `.test-artifacts/verification/summary.json`：浏览器场景结果。

这些文件可能来自历史运行，不能作为本次验证结果；线上结果需查看对应 Actions 与 Release。本地诊断不提交。
