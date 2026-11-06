# 当前状态

版本：**0.5.4**。计算基线：**1.0.1211**（对应 `package.json` 与 `vendor/manifest.json`）。线上发布记录以[GitHub Releases](https://github.com/yukixz/deepveinidle-buddy/releases)与[Greasy Fork](https://greasyfork.org/zh-CN/scripts/601896-deepveinidle-buddy)为准，历史变更见[更新说明](../CHANGELOG.md)。

功能与计算规则统一见[面板规则](panel.md)，模块和上游来源见[技术方案](technical.md)。工作区存档保持 `version=2`，新增字段的兼容与降级限制见[存储与恢复](panel.md#存储与恢复)。

## 当前版本变更

- 整理文档分工，合并重复规则，修正过期描述与引用。
- 收藏（制造）的「金属锭展开为矿石」扩展为「展开半成品」：清单增加切割宝石，配套步骤统一显示「配套制造」，装备和工具不展开。沿用原库存、缺口、品质与计算规则及 `expandMetalBars` 存档字段，存档格式不变。

## 验证与边界

半成品展开的验证覆盖宝石库存共享、品质隔离、成本与时间、动作合并、锁定／未知库存、开关恢复，以及装备和工具不展开；浏览器场景覆盖宝石配套步骤和采购显示。发布准备执行锁定依赖安装、单元、构建和完整浏览器门禁；本轮实际结果及线上核验以发布任务摘要为准。

发布门禁与日常入口见[构建与发布](releasing.md#日常入口)。本地结果路径：

- `.test-artifacts/release-task/summary.json`：发布任务阶段、结果及诊断日志路径。
- `.test-artifacts/verification/summary.json`：浏览器场景结果。

这些文件可能来自历史运行，不能作为本次验证结果；线上结果需查看对应 Actions 与 Release。本地诊断不提交。

隔离浏览器不代替真实脚本管理器、账号、Android／iOS 真机、安全区域、系统键盘及长期运行验收。本次未进行这些验收。
