---
layout: post
title: HDFS HA 初始化顺序
description: HDFS HA 初始化顺序
categories: [Hadoop]
keywords: HDFS,STARTUP
---


# HDFS HA 启动步骤


:warning: 注意该步骤是首次安装部署 hadoop 的操作，涉及到元数据格式化，请慎重

假设安装目录为 `/opt/apps` , 每步都需要 check 服务是否正常启动

### 启动 zookeeper（zookeeper 用户）:

```shell
/opt/apps/zookeeper/bin/zkServer.sh start

/opt/apps/bin/zkServer.sh status //确认是否启动
```



### 启动 hdfs:（hdfs 用户）

#### 启动 journalnode: 

```shell
/opt/apps/hadoop/bin/hdfs --daemon start journalnode

```



jps 确认是否启动

#### 启动namenode：

namenode 格式化：

第一个 nn 节点执行

```shell
hdfs namenode -format 

```



如果是联邦的话，需要指定cluserid

```shell
hdfs namenode -format -clusterId CID-xxxx-yyy-aaa-cvc-vdafdas

```



启动 active namenode

```shell
/opt/apps/hadoop/bin/hdfs --daemon start namenode

```



jps 以及查看日志看是否启动成功



第二个 nn 节点执行

拉取元数据

```shell
/opt/apps/hadoop/bin/hdfs --daemon namenode -bootstrapStandby

```

启动 standby namenode

```shell
/opt/apps/hadoop/bin/hdfs --daemon start namenode

```



jps 以及查看日志看是否启动成功



#### zkfc格式化：

在第一个nn节点执行即可：

```shell
hdfs zkfc -formatZK
```



注意：只需要格式化一次。



分别在2个 nn 上面启动 zkfc（zkfc 与nn在同在一个节点）



```
/opt/apps/hadoop/bin/hdfs --daemon  start zkfc

```



#### 启动datanode：

在所有节点启动 datanode

```shell
/opt/apps/hadoop/bin/hdfs --daemon  start datanode

```





### 启动 yarn（yarn）：

#### 启动 resourcemanager:

```shell
/opt/apps/hadoop/bin/yarn --daemon  start resourcemanager
```



#### 启动nodemanager：

```shell
/opt/apps/hadoop/bin/yarn --daemon  start nodemanager

#### 
```



#### 启动 jobhistory:

```shell
/opt/apps/hadoop/bin/mapred --daemon start historyserver
```

