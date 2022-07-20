---
layout: post
title: 大数据资源使用效率统计
description: 大数据资源使用效率统计
categories: [大数据]
keywords: 大数据,Spark,YARN,hadoop
excerpt:大数据资源使用效率统计
---


大数据资源使用情况统计：

物理内存使用率：
物理CPU使用率：

物理 CPU使用率（白天/晚上）：
物理 内存使用率（白天/晚上）：

YARN CPU使用率：
YARN 内存使用率：

YARN CPU使用率（白天/晚上）：
YARN 内存使用率（白天/晚上）：

Spark 相关：  
每秒 Container 数量  
每天 Spark 任务数量. 
平均每个 Spark 任务 executor 数量. 
平均每个 Spark Executor 申请的堆内存(spark.executor.memory). 
平均每个 Spark Executor 申请的堆外内存（spark.executor.memoryoverhead). 
平均每个 Spark Executor 申请的 Cores 数量(spark.executor.cores). 
平均每个 Spark Executor Core 对应的内存比例(spark.executor.memory=8G,spark.executor.cores=4，则为2). 
平均每个 Spark Executor 申请的总内存（spark.executor.memory+spark.executor.memoryoverhead）. 
平均 Spark Executor 堆内存使用率 sum(executor.max_heap_used*executorNum)/sum(spark.executor.memory*executorNum) 注意算法. 
平均 Spark Executor 堆外内存使用率 sum(executor.max_offheap_used*executorNum)/sum(spark.executor.memoryoverhead*executorNum) 注意算法. 
平均 Spark Executor 总内存使用率   sum((executor.max_offheap_used+executor.max_heap_used)*executorNum)/sum((spark.executor.memory+spark.executor.memoryoverhead)*executorNum) 注意算法
(不太严谨，堆内外的峰值内存不一定同时出现）. 

平均每个Spark 任务的 Task 数量. 
平均每个Spark shuffle 读的数据量. 
平均每个Spark shuffle 写的数据量. 
。。。。
