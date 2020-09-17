---
layout: post
title: NodeManager 启动失败问题处理
description: NodeManager 找不到 org.apache.spark.network.yarn.YarnShuffleService 
categories: [Hadoop]
keywords: hadoop,yarn,spark
excerpt: NodeManager 找不到 org.apache.spark.network.yarn.YarnShuffleService 问题处理
---


启动 NodeManager 报错

### 报错日志

```
20/09/16 15:47:20 ERROR nodemanager.NodeManager: Error starting NodeManager
java.lang.RuntimeException: java.lang.RuntimeException: java.lang.ClassNotFoundException: Class org.apache.spark.network.yarn.YarnShuffleService not found
        at org.apache.hadoop.conf.Configuration.getClass(Configuration.java:2670)
        at org.apache.hadoop.yarn.server.nodemanager.containermanager.AuxServices.serviceInit(AuxServices.java:270)
        at org.apache.hadoop.service.AbstractService.init(AbstractService.java:164)
        at org.apache.hadoop.service.CompositeService.serviceInit(CompositeService.java:108)
        at org.apache.hadoop.yarn.server.nodemanager.containermanager.ContainerManagerImpl.serviceInit(ContainerManagerImpl.java:323)
        at org.apache.hadoop.service.AbstractService.init(AbstractService.java:164)
        at org.apache.hadoop.service.CompositeService.serviceInit(CompositeService.java:108)
        at org.apache.hadoop.yarn.server.nodemanager.NodeManager.serviceInit(NodeManager.java:516)
        at org.apache.hadoop.service.AbstractService.init(AbstractService.java:164)
        at org.apache.hadoop.yarn.server.nodemanager.NodeManager.initAndStartNodeManager(NodeManager.java:974)
        at org.apache.hadoop.yarn.server.nodemanager.NodeManager.main(NodeManager.java:1054)
Caused by: java.lang.RuntimeException: java.lang.ClassNotFoundException: Class org.apache.spark.network.yarn.YarnShuffleService not found
        at org.apache.hadoop.conf.Configuration.getClass(Configuration.java:2638)
        at org.apache.hadoop.conf.Configuration.getClass(Configuration.java:2662)
        ... 10 more
Caused by: java.lang.ClassNotFoundException: Class org.apache.spark.network.yarn.YarnShuffleService not found
        at org.apache.hadoop.conf.Configuration.getClassByName(Configuration.java:2542)
        at org.apache.hadoop.conf.Configuration.getClass(Configuration.java:2636)
        ... 11 more
```

### 查看配置

```xml
  <property>
    <name>yarn.nodemanager.aux-services.spark_shuffle.class</name>
    <value>org.apache.spark.network.yarn.YarnShuffleService</value>
  </property>
```



### 解决办法

  

原来的是配置的 `spark_shuffle`，但是 `NodeManager` 启动没有知道这个包导致

 `${SPARK_HOME}/yarn/spark-3.0.1-yarn-shuffle.jar` 拷贝到  `${HADOOP_HOME}/share/hadoop/yarn/lib/`

:: warn

 注意是  **yarn/lib/**  而不是直接 **yarn/** 目录下 
:: 



启动 `NodeManager` 解决

`${HADOOP_HOME}/bin/yarn --daemon start nodemanager`


