# GitHub Actions 成本与适用性指南

## 适合的任务
- 后端/前端：单测、集成测试、lint、构建、发布前校验。
- 移动端：Android/ iOS 的编译、单元测试、静态检查（lint/ktlint/detekt/SwiftLint 等）。
- 轻量 E2E：API/契约测试、小规模无头浏览器测试。

## 不适合或需谨慎的任务
- 长时间或重资源任务（>6 小时、需 GPU/大内存）。
- 真机/模拟器密集型 UI 测试（需设备云，自托管更合适）。
- 大型模型训练或持续自博弈（建议自托管 runner 或专门的云 GPU）。

## 费用与配额（2025-12 参考）
- 公共仓库：GitHub 托管 runner 分钟**不限量**。
- 私有仓库（个人/组织计划常见额度）：
  - Free：月 2,000 分钟，artifact 存储 500MB。
  - Pro：月 3,000 分钟，artifact 存储 2GB。
  - Team：月 50,000 分钟，artifact 存储 50GB。
  - Enterprise：起始 50,000 分钟，可按需增购。
- 计费系数（耗用额度倍率）：
  - Linux runner：1×
  - Windows runner：2×
  - macOS runner：10×（含 iOS 构建）
- 并发上限：Free/Pro 默认 20；Team/Enterprise 更高（可在组织级设置中查看/调整）。
- 自托管 runner：不消耗 GitHub 分钟，但需自担机器成本和维护。
- 存储：超过配额后按超出部分计费；artifact/log 默认保留 90 天，可缩短以省存储。

## 成本估算示例
- Linux 30 分钟作业 → 30 分钟额度。
- Windows 30 分钟作业 → 60 分钟额度（×2）。
- macOS 30 分钟作业 → 300 分钟额度（×10）。

## 控制成本的做法
- 优先使用 Linux runner；仅在需要 Xcode/iOS 时用 macOS。
- 缩短流水线：拆分步骤、早失败（fail-fast）、避免无谓的 sleep。
- 充分使用缓存（actions/cache）、依赖锁定和增量构建。
- 控制调度频率：仅在需要时触发，或通过条件/路径过滤。
- Artifact/日志：仅上传必要文件，缩短保留天数，必要时压缩。
- 对 GPU/真机需求：使用自托管 runner 或设备云，把 Actions 作为触发与结果收集层。

## 移动端特别说明
- Android：可在 Linux runner 构建/lint/单测；轻量 emulator 可尝试但耗时、易不稳定。
- iOS：需 macOS runner（费用 10×）；适合编译、单元/静态检查、打包归档；UI/真机测试需设备云。
- 真机测试：GitHub Actions 本身无设备池，需接入 BrowserStack、App Center、AWS Device Farm 等。

## 何时选择自托管 runner
- 需要 GPU、大内存或稳定的长时训练/自博弈。
- 有自有真机/模拟器农场，或需内网访问/专有依赖。
- 需要可预测的性能与成本，可按需弹性扩容。

## 快速选型建议
- 代码质量、常规构建：GitHub Actions（Linux）。
- 移动端编译/单测/静态检查：必要时用 macOS（注意 10× 成本）。
- 真机/UI 密集：设备云或自托管 runner，Actions 负责触发与收集结果。
- 重训练/GPU：自托管或云 GPU，Actions 只做编排与产物上传。

