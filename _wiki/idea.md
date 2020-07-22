---
layout: wiki
title: Idea
categories: Idea
description: Idea
keywords: Idea
---

### HBase

**HTAP 想法**
1. HBase 通过 replication 或者 compaction 机制生成一份 parquet 文件，用于分析，支持只选择部分列以及该列的 类型 schema 定义

**Compaction 改进**
2. HBase compaction 时候，分级存储， L0 -> FLUSH SSD/不设置压缩 L1 根据compaction 选择的文件判断，如果小于某个值，则SSD+不压缩
如果大于某个阈值，则 HDD+不压缩 ，再大于某个值 HDD+压缩

