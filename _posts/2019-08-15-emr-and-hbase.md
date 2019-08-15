---
layout: post
title: EMR 与 HBase
description:  EMR 与 HBase
categories: EMR,Cloud,Hadoop、HBase
keywords: EMR,Cloud,Hadoop、HBase
excerpt:  EMR,Cloud,Hadoop、HBase
---

# EMR 与 HBase

## EMR 与 HBase 产品形态

EMR 与 HBase 主要有2种形态：

1、HBase 作为一个组件，存在与 EMR 中

2、HBase 作为单独的服务，直接提供服务

当然如果是第2种可能更多的还需要结合第一种形态使用。

比如 Bulkload/Spark 分析等 是EMR 一套集群，HBase 是一套集群

## EMR 主要厂家以及组件


| 云厂商 | 产品 | 组件 | 链接 |
| :---  | :---: | :---: | ---: |
| 亚马逊 | EMR | Hadoop、Flink、HBase、Hive、Phoenix、Zookeeper、Presto、Spark、Tez、Pig、Zeppelin、Tensorflow、Sqoop、Hue、Livy、Mahout、MXNet、Oozie| https://docs.aws.amazon.com/zh_cn/emr/latest/ReleaseGuide/emr-release-5x.html |
| 阿里云 | E-MapReduce | Hadoop、Spark、Hive、YARN、HDFS、HBase、Phoenix、Flink、Zoookeeper、Tez、Druid、Presto、Storm、Impala、Flume、Ranger、TF、Kafka、Pig、Sqoop、 | https://help.aliyun.com/document_detail/28073.html?spm=a2c4g.11186623.6.546.be7d2068xWi6GP |
| 华为云 | MapReduce服务 | Hadoop、Spark、HBase、Opentsdb、Hive、Tez、Hue、Flink、Kafka、Storm、KafkaManager、Flume | https://support.huaweicloud.com/productdesc-mrs/mrs_08_0005.html |
| 腾讯云 | 弹性MapReduce | Haoop、HBase、Flink、Hive、Hue、Ooize、Presto、Ranger、Spark、Sqoop、Storm、Tez、Zookeeper、Flume、Alluxio、Knox | https://cloud.tencent.com/document/product/589/20279 |
| 天翼云 | MapReduce服务 | Hadoop、Spark、HBase、Kafka、Storm | https://www.ctyun.cn/product/MapReduce https://www.ctyun.cn/help/qslist/1411 |



## EMR 与 HBase 产品形态

亚马逊、阿里云、华为云、腾讯云、天翼云 EMR产品中均包含 HBase 组件。

腾讯云之前除了EMR提供，还单独提供了云HBase，后来又取消了，以弹性MapReduce提供,主要原因是HBase 通常会和Hadoop其他组件结合使用。

阿里云提供[云数据库HBase版](https://cn.aliyun.com/product/hbase),放在了云计算基础 NOSQL 数据库

华为云提供[CloudTable](https://www.huaweicloud.com/product/cloudtable.html)其实就是HBase,放在EI企业智能，为什么放在这块主要是组织架构原因，MapReduce 服务也是放在这边。

## 版本链接

[亚马逊 EMR 版本](https://docs.aws.amazon.com/zh_cn/emr/latest/ReleaseGuide/emr-release-5x.html)

[阿里云 E-MapReduce 版本](https://help.aliyun.com/document_detail/28073.html?spm=a2c4g.11186623.6.546.be7d2068xWi6GP#title-b9j-f3m-75x)

[华为云 MapReduce服务 版本](https://support.huaweicloud.com/productdesc-mrs/mrs_08_0005.html)   
[腾讯云 弹性MapReduce 版本](https://cloud.tencent.com/document/product/589/20279)   
[天翼云 MapReduce服务 版本](https://www.ctyun.cn/help/qslist/1411)  版本未知，有[手册](http://oos.ctyunapi.cn/downfile/%E4%BA%A7%E5%93%81%E6%89%8B%E5%86%8C2018/MapReduce%E7%94%A8%E6%88%B7%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.pdf
)，也许可以看到版本


## HBase 是否适合提供云服务

HBase 功能方面：提供分布式 NOSQL 存储，高性能的写吞吐，还不错的读能力。业务场景也是比较丰富的，需求应该是一直在的。
HBase 架构方面：HBase 是分布式的、计算存储分离的，本身是比较适合提供云服务的。
HBase 应用场景： 物联网、明细记录、消息日志类、用户画像标签、金融风控、社交消息feed流、监控、小对象存储（视频、图片）、时序时空、海量实时分布式存储。 曾经的一个场景，最大存储单表近2PB（单副本GZIP压缩后）
HBase 生态：与Phoenix 结合提供SQL、二级索引；与 OpenTSDB 结合提供时序；GeoMesa 结合提供时空数据库功能；与 HGraphDB 结合提供图数据库功能；与 Kylin 结合提供 MOLAP；Spark 结合提供分析功能；Hive 其实也可以映射HBase 表来使用；还可与 Solr 结合提供全文索引功能。更多生态可以参考：[awesome-hbase](https://github.com/rayokota/awesome-hbase)

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



