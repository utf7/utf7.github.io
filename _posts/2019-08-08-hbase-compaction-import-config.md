---
layout: post
title: HBase Compaction 参数调优
description: HBase Compaction 重要的参数说明以及调优
categories: HBase
keywords: HBase,Compaction
excerpt: HBase Compaction 重要参数调优
---


## **HBase compaction 调优**

Compaction的主要目的： 

1、将多个HFile 合并为较大HFile，从而提高查询性能  
2、减少HFile 数量，减少小文件对HDFS 影响  
3、提高Region初始化速度  


### hbase.hstore.compaction.min

当某个列族下的HFile 文件数量超过这个值，则会触发 minor compaction操作
默认是3，比较小，建议设置10-15
这个值影响是：
设置过小会导致合并文件太频繁，特别是频繁bulkload 或者数据量比较大的情况下
设置过大又会导致一个列族下面的HFile 数量比较多，影响查询效率

进阶：
这个值的设置还和业务数据的特点有关系，比如类似详单云系统，业务逻辑是
按月建表，每个月建一个表，rowkey是reverse（手机号码)+时间戳
数据每3-5分钟导入一次。查询逻辑是根据手机号码+时间段查询
通常手机流量使用情况会某个号码会不断的产生，所以一个手机号码产生的数据基本上会按照分布在很多HFile中。
如果hbase.hstore.compaction.min 设置过大的话，则一个查询时候会访问较多的 HFile 影响查询效率。
这种业务就不适合设置的特别大。

相反如果是类似只查询某段时间的日志业务，查询的数据都比较集中，也就是查询只会发生在一个HFile或者相邻的2个HFile 中。
此时合并文件，对查询效率的提升影响不大。则可以将该值设置的大一些，减少合并对系统的影响。


### hbase.hstore.compaction.max

一次最多可以合并多少个HFile，默认为 10
限制某个列族下面选择最多可选择多少个文件来进行合并
注意需要满足条件hbase.hstore.compaction.max > hbase.hstore.compaction.min


### hbase.hstore.compaction.max.size

默认Long最大值，minor_compact 时 HFile 大小超过这个值则不会被选中合并
用来限制防止过大的HFile被选中合并，减少写放大以及提高合并速度

### hbase.hstore.compaction.min.size

默认 memstore 大小，minor_compact 时 HFile 小于这个值，则一定会被选中
可用来优化尽量多的选择合并小的文件

### hbase.regionserver.thread.compaction.small

默认1，每个RS的  minor compaction线程数，其实不是很准确，这个线程主要是看参与合并的HFile数据量
有可能minor compaction数据量较大会使用compaction.large
提高线程可提高HFile 合并效率


### hbase.regionserver.thread.compaction.large

默认1，每个RS的 major compaction线程数，其实不是很准确，这个线程主要是看参与合并的HFile数据量
有可能minor compaction数据量较大会使用compaction.large
提高线程可提高 HFile 合并效率

### Hbase.hregion.majorcompaction

默认：86400000

关闭hbase major compaction，业务低谷手动执行









