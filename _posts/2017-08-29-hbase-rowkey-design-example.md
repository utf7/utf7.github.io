---
layout: post
title: HBase rowkey 设计案例整理
description: HBase rowkey 设计案例整理
categories: HBase
keywords: HBase，big data，rowkey design，rowkey设计
---

## HBase rowkey 设计案例

### **滴滴出现 HBase rowkey 设计**

#### **订单状态表**

----------

◦ Rowkey: reverse(order_id) + (MAX_LONG – timestamp)  
◦ Columns: 该订单各种状态

#### **历史订单表**
----------
◦ Rowkey: reversed(passenger_id | driver_id) + (MAX_LONG – timestamp)  
◦ Columns: 用户在时间范围内的所有订单

#### **司机乘客轨迹**

----------

##### **通过ID查询轨迹**
◦ Rowkey: ID+Timestamp ◦  
◦ Column: 轨迹详细信息
◦ 提供java API给用户使用

##### **通过地理范围查找全部出现的轨迹 需要建立空间索引表**
GeoHash分区  
Rowkey: Reversed_geohash + Timestamp + ID 提供3种方式访问  
1. 小范围或短时间数据:API一次性查询, 延时小,成本低  
2. 中等范围或中等时间数据: 提供iterator/scanner批量查询结果,延时较高,成本低  
3. 大范围或者长时间数据:提供Base mapper等离线查询方法,延时高,成本高  

#### **特征模型特征**
----------
Rowkey: Salting+CityId+Type0+Type1+Type2+Timestamp  
Columns: Order, Feature HBase中的数据会每隔一段时间持久化至HDFS中,供新模型测试和新特征提取  


#### **监控数据**
----------
Rowkey: path / jobId  
Columns: 多列的相关信息  
