---
layout: post
title: 安装 Phoenix 
description: Phoenix 
categories: Phoenix
keywords: Phoenix,big data,hbase
excerpt: Phoenix 安装
---


## **一、安装配置 Phoenix**

下载tar后解压phoenix

tar -zxvf phoenix-4.10.0-HBase-1.1.tar.gz

在解压目录找到如下文件 phoenix-4.10.0-HBase-1.1-server.jar

将上面 jar 文件 放到 HBase 所有节点的HBase_HOME的lib目录下。

增加如下属性到每个RegionServer的hbase-site.xml中（可以通过HC配置）
配置参数


```xml
<property>
    <name>hbase.regionserver.wal.codec</name>
    <value>org.apache.hadoop.hbase.regionserver.wal.IndexedWALEditCodec</value>
</property>
<property>  
    <name>hbase.region.server.rpc.scheduler.factory.class</name>  
    <value>org.apache.hadoop.hbase.ipc.PhoenixRpcSchedulerFactory</value>  
    <description>Factory to create the Phoenix RPC Scheduler that uses separate queues for index and metadata updates</description> 
</property> 
<property>  
    <name>hbase.rpc.controllerfactory.class</name> 
    <value>org.apache.hadoop.hbase.ipc.controller.ServerRpcControllerFactory</value>
    <description>Factory to create the Phoenix RPC Scheduler that uses separate queues for index and metadata updates</description> 
</property>
```

保存，然后重启HBase 集群使配置生效。 

## **二、sqlline 访问 Phoenix**

启动sqlline

```bash
{phoenix_home}/bin/sqlline.py  zookeepr1,zookeepr2,zookeepr3：2181：/hbase
```

例子

```bash
!tables
CREATE TABLE IF NOT EXISTS user(id INTEGER NOT NULL PRIMARY KEY,name VARCHAR(20));
UPSERT INTO USER VALUES(1,'user1');
SELECT * FROM user;
```

## **三、安装常见问题**

#### 1、JDK版本问题：

执行sqlline.py出现:

```java
NoClassDefFoundError/ClassNotFoundException
./sqlline.py zk1,zk2,zk3:2181
Exception in thread "main" java.lang.NoClassDefFoundError: sqlline/SqlLine
Caused by: java.lang.ClassNotFoundException: sqlline.SqlLine
    at java.net.URLClassLoader$1.run(URLClassLoader.java:217)
    at java.security.AccessController.doPrivileged(Native Method)
    at java.net.URLClassLoader.findClass(URLClassLoader.java:205)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:323)
    at sun.misc.Launcher$AppClassLoader.loadClass(Launcher.java:294)
    at java.lang.ClassLoader.loadClass(ClassLoader.java:268)
Could not find the main class: sqlline.SqlLine. Program will exit.
```
原因：安装环境中默认的JDK版本太低。

验证Java 版本：

```bash
java -version
java version "1.6.0_28"
OpenJDK Runtime Environment (IcedTea6 1.13.0pre) (rhel-1.66.1.13.0.el6-x86_64)
OpenJDK 64-Bit Server VM (build 23.25-b01, mixed mode)
```

需要设置export JAVA_HOME为 1.7或者以上的JDK

```bash
export JAVA_HOME=/usr/jdk64/jdk1.7.0_67
```

加入到环境变量中