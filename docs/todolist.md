## 1、NodeManager 内存泄露分析 OOM（现在定位ExternalShuffle cache index 问题） 

#### 内存可以调稍微大一些，建议4->8~12G 
#### 内存在分析，代码在看，基本定位问题，待修改代码验证

## 2、DataNode 目录扫描优化，主要是3个方向：

#### 1、checkAndUpdate 锁优化 已经完成 
#### 2、scan  锁优化,去掉不必要的锁 已经完成
#### 3、多线程scan（和锁无关，但可以加速scan 性能）已经完成

#### 可以避免高峰期做DirectoryScanner 调度，offpeak（0，8）其他时间段做
#### 为啥会有diff ？ datanode 不同步，可能是磁盘太多？快太多？？？小文件太多？？？？还是？？？

## 3、HiveMeta 可能存在 内存泄露 GC hang 住，短期调内存，需要分析问题

