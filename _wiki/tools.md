---
layout: wiki
title: Common Tools
categories: tools
description: Common Tools
keywords: Common Tools
---

**目录**

* TOC
{:toc}


### Linux Commands

- 查看 Jvm 进程启动时间

 `salt 'xxx' cmd.run reset_system_locale=False 'ps -eo pid,comm,lstart,etime,time,args|grep NodeManager|grep -v grep' > x`
 
- 查看网卡

 `ethtool bond0`
 
 `lspci -vvv | grep Ethernet`
 
- 排序 
```
 -n 表示按照数值排序
 r 表示倒叙
 -k 2 表示第二列数值排序
 hdfs dfs -count -h hdfs://nn1/dw/test.db/table/day=2021-09-22/hour=22/*|sort -nr -k 2

cat test.txt |sort -hr -k 2  -k 3
```


### HBase

修改日志级别
```
 curl http://rs1:60030/logLevel?log=+org.apache.hadoop.metrics2\&level=WARN
 ```


 
