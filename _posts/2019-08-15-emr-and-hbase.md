---
layout: post
title: EMR 与 HBase
description:  EMR 与 HBase
categories: EMR
keywords: EMR,Cloud,HBase
excerpt:  EMR,Cloud,HBase
---

# EMR 与 HBase

## EMR 与 HBase 产品形态

EMR 与 HBase 主要有2种形态：

1、HBase 作为一个组件，存在与 EMR 中

2、HBase 作为单独的服务，直接提供服务

当然如果是第2种可能更多的还需要结合第一种形态使用。

比如 Bulkload/Spark 分析等 是EMR 一套集群，HBase 是一套集群



## 云商家 EMR 与开源的关系说明：


#### 亚马逊：

基于开源,是否修改代码未知，推测可能会修改支持S3相关的内容。

#### 阿里云：

> 我们基于开源 Hadoop 的版本，在完全不改变原有接口的基础上，加入了我们的 emr-core 组件，深度支持阿里云的 OSS。这个组件的版本会跟在 Hadoop 版本后。

#### 腾讯云：

> 弹性 MapReduce 结合云技术和 Hadoop、Hive、Spark、Storm 等社区开源技术，为您提供安全、低成本、高可靠、> 可弹性伸缩的云端 Hadoop 服务。

应该是基于开源。

#### 华为云：

> MRS服务拥有强大的Hadoop内核团队，基于华为FusionInsight大数据企业级平台构筑。

#### 天翼云：

> MRS 基于开源软件 Hadoop 进行功能增强、Spark 内存计算引擎、HBase 分布式存储数据
库以及 Hive 数据仓库框架，提供海量数据的分析计算与存储能力。


## 云厂商 EMR 组件版本信息

| **组件** | **亚马逊**  | **阿里云**  | **腾讯云** | **华为云**  | **天翼云** |
| :------------  |:---------------:|:---------------:|:---------------:|:---------------:| -----:|
| 产品 | EMR  | E-MapReduce  |  弹性 MapReduce | MapReduce 服务  | MapReduce 服务 |
| 版本 |  emr-5.25.0  | EMR-3.20.0  |  EMR-V2.1.0 |  MRS 2.0.1  | 版本未知 |
| 发布时间 | 2019.5  | 2019.7  |  2019.5 | 2019.6  | 未知 |
| 迭代周期 | 每月  | 每月  |  1-2月 | 2月左右  | 未知 |
| Hadoop  | 2.8.5 | 2.8.5 | 2.8.4 | 3.1.1 | 2.7.2 |
| HBase   | 1.4.9 | 1.4.9 | 1.3.1 | 2.1.1 | 1.0.2 |
| Hive    | 2.3.5 | 3.1.1 | 2.3.3 | 3.1.0 | 1.2.1 |
| Spark   | 2.4.3 | 2.4.2 | 2.3.2 | 2.3.2 | 2.1.0 |
| Presto  | 0.220 | 0.213 | 0.215 | 308 | N/A |
| Tez   | 0.9.2 | 0.9.1 | 0.8.5 | 0.9.1 | N/A |
| Zookeeper | 3.4.14 | 3.4.13 | 3.4.9 |  N/A | N/A |
| Flink   | 1.8.0 | 1.7.2 | 1.4.2 | N/A | N/A |
| Kafka   | N/A | 2.11 | N/A | 1.1.0 | 版本未知 |
| Storm   | N/A | 1.2.2 | 1.1.0 | 1.2.1 | 版本未知 |
| Flume | N/A | 1.8.0 | 1.8.0 | 1.6.0 | 版本未知 |
| Hue    | 4.4.0 | 4.1.0 | 4.4.0 | 3.11.0 | 版0本未知 |
| Phoenix | 4.14.1 |  4.14.1 | N/A | N/A | N/A |
| Sqoop | 1.4.7 | 1.4.7 | 1.4.7 |  N/A | N/A |
| Oozie | 5.1.0 | 5.1.0 | 4.3.1 | N/A | N/A |
| Ranger |  N/A | 1.2.0 | 0.7.1 | N/A | N/A |
|Tensorflow | 1.13.1 | 1.8.0 |  N/A |  N/A | N/A |
| MXNet | 1.4.0 | N/A |  N/A |  N/A | N/A |
| Mahout | 0.13.0 | N/A | N/A | 0.7.1| N/A |
| Impala  | N/A | 2.12.2 | N/A | N/A | N/A |
| Druid   | N/A | 0.13.0 | N/A | N/A | N/A |
| Pig | 0.17.0 | 0.14.0 |  N/A |  N/A |N/A |
| Alluxio | N/A | N/A | 1.8.1 | N/A  | N/A |
| Loader | N/A | N/A |  N/A | 2.0.0 | 版本未知 |
| Livy | 0.6.0 | 0.6.0 | N/A | N/A | N/A |
| Zeppelin |0.8.1 | 0.8.1 | N/A | N/A | N/A |
| Ganglia  | 3.7.2 | 3.7.2 | 3.7.2 | N/A | N/A |
| JupyterHub | 0.9.6 | N/A | N/A| N/A  | N/A |
| Jupyter | N/A | 4.4.0 | N/A | N/A | N/A |
| Knox    | N/A | 1.1.0 | N/A | N/A | N/A |
| Apache DS  | N/A  | 2.0.0 | N/A | N/A | N/A |
| Analytics Zoo | N/A  | 0.2.0 | N/A | N/A | N/A |
| Superset | N/A  | 0.28.1 | N/A | N/A | N/A |
| OS | *版本未知* | CentOS 7.4 | *版本未知* | *版本未知* | *版本未知* |
| **组件** | **亚马逊**  | **阿里云**  | **腾讯云** | **华为云**  | **天翼云** |



HBase 是否单独作为产品？

| **组件** | **阿里云**  |**华为云**  |  **腾讯云** | **天翼云** | **亚马逊**  |
| :------------  |:---------------:|:---------------:|:---------------:|:---------------:| -----:|
| 产品 |  云数据库 HBase 版 | 表格存储服务 CloudTable | N/A | N/A | N/A |
 
 
**注意**

*N/A 表示无；版本未知表示有此组件，但不清楚具体版本*

*统计时间为2019.8.16，有些云厂商有多个版本分支同时进行，这里只列出的最新主干分支*


## EMR 与 HBase 产品形态

亚马逊、阿里云、华为云、腾讯云、天翼云 EMR产品中均包含 HBase 组件。

腾讯云之前除了EMR提供，还单独提供了云HBase，后来又取消了，以弹性MapReduce提供,主要原因是HBase 通常会和Hadoop其他组件结合使用。

阿里云提供[云数据库HBase版](https://cn.aliyun.com/product/hbase),放在了云计算基础 NOSQL 数据库

华为云提供[CloudTable](https://www.huaweicloud.com/product/cloudtable.html)其实就是HBase,放在EI企业智能，为什么放在这块主要是组织架构原因，MapReduce 服务也是放在这边。


## HBase 是否适合提供云服务

#### HBase 功能方面

提供分布式 NOSQL 存储，高性能的写吞吐，还不错的读能力。业务场景也是比较丰富的，需求应该是一直在的。

#### HBase 架构方面

HBase 是分布式的、计算存储分离的，本身是比较适合提供云服务的。

#### HBase 应用场景

物联网、明细记录、消息日志类、用户画像标签、金融风控、社交消息feed流、监控、小对象存储（视频、图片）、时序时空、海量实时分布式存储。 

如笔者公司使用HBase 存储手机详单数据，最大存储单表近2PB（单副本GZIP压缩后）。

#### HBase 生态

与Phoenix 结合提供SQL、二级索引；与 OpenTSDB 结合提供时序；GeoMesa 结合提供时空数据库功能；与 HGraphDB 结合提供图数据库功能；与 Kylin 结合提供 MOLAP；Spark 结合提供分析功能；Hive 其实也可以映射HBase 表来使用；还可与 Solr 结合提供全文索引功能。更多生态可以参考：[awesome-hbase](https://github.com/rayokota/awesome-hbase)

## 问题：

1、本身没有独立的存储，依赖 HDFS，所以通常需要维护一套HDFS 系统

2、依赖 ZK ，需要维护一套 ZK。

以上2点不像类似 MongoDB 和 Cassandra 不依赖与其他外部组件，部署维护其他相对比较简单，HBase 复杂度会高很多，部署以及维护的成本也大。
虽然架构上面是计算存储分离的，但是存储这块与云存储结合并不是很好，虽然架构上计算存储分离，相比也比较适合云原生，但云原生的“不纯粹” 。
虽然 HBase 一直在去ZK和HDFS，也在推动支持更多的文件系统，比如S3，但仍然任重道远。
如 AWS 中使用 HBase + S3,仍然需要部署一套 HDFS 系统，原因是S3不支持 flush/hflush 接口，而前者是 HBase 写 WAL 需要依赖的。
![](/images/posts/hbase/hbase_s3.png "HBase on S3")

具体可参考 [HBase on Amazon S3](https://docs.aws.amazon.com/zh_cn/emr/latest/ReleaseGuide/emr-hbase-s3.html)

3、自身功能方面：目前 HBase 并没有内置SQL、二级索引等易于使用的功能,这块还是依赖生态组件来解决。这点往往会带来设计和使用上面的复杂度。
这点上 与 MongoDB 和 Cassandra 相比，差了很多。

4、易用性：HBase 对使用者有一点的要求，比如对rowkey设计，预先分区等；而且提供的 原生 API 也比较原始往往通过API 的 get/scan/put/delete 接口实现。与常规的数据库 SQL select/insert/update/delete 易用性差距还很大。

5、稳定性：HBase 稳定性这块相比其他数据库差距还是很明显的。



## ***链接***


AWS EMR ：<https://docs.aws.amazon.com/zh_cn/emr/latest/ReleaseGuide/emr-release-5x.html>

阿里云  E-MapReduce ：<https://help.aliyun.com/product/28066.html?spm=a2c4g.11174283.6.540.722b3d79Tt6gVH>

华为云 MapReduce服务 ：<https://support.huaweicloud.com/productdesc-mrs/mrs_08_0005.html>

腾讯云 弹性MapReduce ：< https://cloud.tencent.com/document/product/589/20279>

天翼云 MapReduce服务 ：<https://www.ctyun.cn/help/list/1407>

华为云 表格存储服务 CloudTable  <https://www.huaweicloud.com/product/cloudtable.html>

阿里云 云数据库 HBase 版 <https://cn.aliyun.com/product/hbase?spm=a2c4g.11186623.cwnn_jpze.64.125b40acDBGNlH>

