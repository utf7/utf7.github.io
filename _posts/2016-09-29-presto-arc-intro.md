---
layout: post
title: Presto 架构
description: Presto 架构
categories: Presto
keywords: presto,big data
excerpt: Presto 架构介绍
---

## Presto Server

- Coordinator  
	担当 Master 角色，负责解析 SQL，生成查询计划，提交查询任务给 Worker 执行，管理 Worker 节点。
- Worker  
	执行任务和处理数据
	
## Data Source 

- Connector  
  Connector 是一个适配连接器，Presto 使用 Connector 去连接不同的数据源，比如 Hive 、关系型数据库等。可以通过实现自己的 Connector 去扩展数据源。
  
- Catalog  
	Catalog 多个 schema 的集合,表示通过 connector 获取的一种数据源，你可以使用 hive connector 的多个  catalog 来代表不同的 hive 集群数据源。常见的 catalog 为：mysql catalog,hive catalog 等

- Schema  
	表的集合，类似于 Hive、MySQL 中的 database。
	
- Table  
	类似于Hive中的table

查询 catalog 为 hive，数据库为 test，表为 table1 的语句为 

`select count(*) from hive.test.table1`

## Query Model  

- Statement  
	表示一个 SQL 查询语句
	
- Query  
	表示 Statement 经过解析，生成的执行计划，查询计划。在 Presto 集群中运行的查询，
	一个 Query 由多个 Stage 组成、Task、Driver、Split、Operator 和 Datasource 组成。
	
- Stage  
	查询执行阶段，一个 Query 会被拆分成具有层级关系的多个 Stage 执行,一个 Stage 就是查询执行计划的一部分。
	四种stage:  
	- Coordinator_Only:一般表示 DDL,DML 的 Stage。  
	- Single：用于聚合子 stages 数据，并最终将数据输出给终端用户。比如每个查询中的 Root Stage。    
	- Fixed：用于接收子 Stage 产生的数据，并在集群中对这些数据进行聚合或分组计算。    
	- Source：连接数据源，从数据源读取数据。    

- Exchange  
	连接不同的 Stage，用于不同 Stage 之间的数据交互  
	- Output Buffer:向下游提供数据，数据提供者  
	- Exchange Client：从上游读取数据，数据消费者  
	
- Task  
	Stage 有多个 Task 组成。Stage 并不会运行，只是负责管理 Task 和封装建模。Stage 实际运行的是 Task。每个Task 处理一个或者多个 Split。每个 Task 都有对应的输入和输出。
	
- Driver  
	Task 被分解成一个或者多个 Driver，并行执行多个 Driver 的方式来实现 Task 的并发执行。Driver 是作用于一个 Split 的一系列 Operator 的集合。一个 Driver 处理一个 Split，产生输出由 Task 收集并传递给下游的 Stage 中的一个 Task。一个 Driver 拥有一个输入和输出。
- Operator  
	Operator 表示对一个 Split 的一种操作。比如过滤、转换等。
    一个 Operator 一次读取一个 Split 的数据，将 Operator 所表示的计算、操作作用于 Split 的数据上，产生输出。每个 Operator 会以 Page 为最小处理单位分别读取输入数据和产生输出数据。Operator 每次只读取一个 Page,输出产生一个 Page
	
- Split  
	一个分片表示大的数据集合中的一个小子集,与 MapReduce 中的 Split 概念类似。
	
- Page    
	Presto 中处理的最小数据单元。一个 Page 对象包括多个 Block 对象，而每个 Block 对象是一个字节数组，存储一个字段的若干行。多个 Block 的横切的一行表示真实的一行数据。一个 Page 最大1MB，最多1 6x1024 行数据。

