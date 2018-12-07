---
layout: post
title: Hive 设置压缩
description: Hive 如何设置压缩
categories: Hive
keywords: Hive,ORC,Parquet,SNAPPY,GZIP,压缩
---



1、Hive 设置压缩

生成的表压缩
临时文件压缩
输出压缩


ORC:

```sql
set hive.exec.compress.intermediate=true;
set hive.intermediate.compression.codec=org.apache.hadoop.io.compress.GzipCodec;
set hive.intermediate.compression.type=BLOCK;

set hive.exec.compress.output=true;
set mapreduce.output.fileoutputformat.compress=true;
set mapreduce.output.fileoutputformat.compress.type=BLOCK;
set mapreduce.output.fileoutputformat.compress.codec=org.apache.hadoop.io.compress.GzipCodec;

CREATE TABLE store_sales_zlib_orc STORED AS ORC TBLPROPERTIES("orc.compress"="ZLIB")AS  SELECT * FROM store_sales;

set hive.exec.compress.intermediate=true;
set hive.intermediate.compression.codec=org.apache.hadoop.io.compress.SnappyCodec;
set hive.intermediate.compression.type=BLOCK;

set hive.exec.compress.output=true;
set mapreduce.output.fileoutputformat.compress=true;
set mapreduce.output.fileoutputformat.compress.type=BLOCK;
set mapreduce.output.fileoutputformat.compress.codec=org.apache.hadoop.io.compress.SnappyCodec;
CREATE TABLE store_sales_zlib_snappy STORED AS ORC TBLPROPERTIES("orc.compress"="SNAPPY")AS  SELECT * FROM store_sales;

set hive.exec.compress.intermediate=false;
set hive.intermediate.compression.codec=org.apache.hadoop.io.compress.NONE;
set hive.intermediate.compression.type=BLOCK;

set hive.exec.compress.output=false;
set mapreduce.output.fileoutputformat.compress=false;
set mapreduce.output.fileoutputformat.compress.type=BLOCK;
set mapreduce.output.fileoutputformat.compress.codec=org.apache.hadoop.io.compress.NONE;

CREATE TABLE store_sales_zlib_none STORED AS ORC TBLPROPERTIES("orc.compress"="NONE")AS  SELECT * FROM store_sales;
```