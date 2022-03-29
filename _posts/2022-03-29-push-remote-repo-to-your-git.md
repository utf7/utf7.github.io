---
layout: post
title: 将github 代码push 到自己的仓库并保留commit log
description: 将github 代码push 到自己的仓库并保留commit log
categories: [git]
keywords: git
excerpt: 将github 代码push 到自己的仓库并保留commit log
---



## 1.将github 某个版本放到自己的仓库，保留commit log



```
git clone git@github.com:apache/hbase.git
cd hbase/
git tag
git checkout rel/2.4.11
git remote set-url origin ssh://xxx@gitlab.xx.com:port/bigdata/HBase
git remote -v
git branch test
git checkout test
git push origin test:2.4.11

 ```
