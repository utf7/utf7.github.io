---
layout: post
title: salt 中执行 awk 注意事项
description: salt 中执行 awk 注意事项
categories: [Salt]
keywords: Salt/awk
excerpt: salt 中执行 awk 注意事项
---

使用 `salt` 执行 awk 时，发现会执行失败

```
salt "*" cmd.run " ps -ef|grep NodeManager|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print $2}'|xargs lsof -p|grep REG|grep /usr/lib/locale/locale-archive"

```

会发现执行失败
$2 前面需要加转义符号

```
salt "*" cmd.run " ps -ef|grep NodeManager|grep -v grep|grep org.apache.hadoop.yarn.server.nodemanager.NodeManager|awk '{print \$2}'|xargs lsof -p|grep REG|grep /usr/lib/locale/locale-archive"

```
