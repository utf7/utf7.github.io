---
layout: post
title: EMR 与 HBase
description:  EMR 与 HBase
categories: EMR,Cloud,Hadoop、HBase
keywords: EMR,Cloud,Hadoop、HBase
excerpt:  EMR,Cloud,Hadoop、HBase
---


## EMR 主要厂家以及组件


|云厂商 | 产品 | 组件 | 链接|
| :-: | :-: | :-: | :-: |

| 亚马逊 | EMR | Hadoop、Flink、HBase、Hive、Phoenix、Zookeeper、Presto、Spark、Tez、Pig、Zeppelin、Tensorflow、Sqoop、Hue、Livy、Mahout、MXNet、Oozie| https://docs.aws.amazon.com/zh_cn/emr/latest/ReleaseGuide/emr-release-5x.html |

| 阿里云 | E-MapReduce | Hadoop、Spark、Hive、YARN、HDFS、HBase、Phoenix、Flink、Zoookeeper、Tez、Druid、Presto、Storm、Impala、Flume、Ranger、TF、Kafka、Pig、Sqoop、 | https://help.aliyun.com/document_detail/28073.html?spm=a2c4g.11186623.6.546.be7d2068xWi6GP |

| 华为云 | MapReduce服务 | Hadoop、Spark、HBase、Opentsdb、Hive、Tez、Hue、Flink、Kafka、Storm、KafkaManager、Flume | https://support.huaweicloud.com/productdesc-mrs/mrs_08_0005.html |

| 腾讯云 | 弹性MapReduce |Haoop、HBase、Flink、Hive、Hue、Ooize、Presto、Ranger、Spark、Sqoop、Storm、Tez、Zookeeper、Flume、Alluxio、Knox | https://cloud.tencent.com/document/product/589/20279 |

| 天翼云 | MapReduce服务 |Hadoop、Spark、HBase、Kafka、Storm | https://www.ctyun.cn/product/MapReduce https://www.ctyun.cn/help/qslist/1411 |



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
