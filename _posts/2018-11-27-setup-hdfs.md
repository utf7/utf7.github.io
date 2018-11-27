---
layout: post
title: HDFS HA 初始化顺序
description: HDFS HA 初始化顺序
categories: HADOOP，HDFS
keywords: HDFS,STARTUP
---



1、删除namenode、datanode数据

rm -rf /hdd1/hadoop/hdfs/data/*
rm -rf /hdd2/hadoop/hdfs/data/*

2、格式化zkfc

在active nn节点执行:
hdfs zkfc -formatZK

3、启动journalnode

在jn1、jn2、jn3上分别执行
sbin/hadoop-daemon.sh start journalnode

4、格式化namenode 并启动NN

在active nn1执行：
hdfs namenode -format
sbin/hadoop-daemon.sh start namenode

5、执行bootstrapStandby 并启动NN
nn2执行：
hdfs namenode -bootstrapStandby
sbin/hadoop-daemon.sh start namenode

6、启动ZKFC

7、启动DN