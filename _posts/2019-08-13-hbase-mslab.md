---
layout: post
title: HBase MSLAB
description: HBase MSLAB
categories: HBase
keywords: HBase,MSLAB
excerpt:  HBase MSLAB
---


##  HBase MSLAB


### HBase MSLAB 作用：

MemStoreChunkPool  主要是为了减少 MemStore 导致的 GC
思路是提前申请好一堆 Chunk，默认 2MB 一个，然后将插入的小Cell 放到 Chunk 中存储。
hbase.hregion.memstore.mslab.max.allocation 这个参数决定cell小于多少，放入到Chunk中，默认是256*1024，即256K。
当对象超过256KB的话，就没有必要使用chunk来存了。

从而减少小对象不断GC带来的压力。

### HBase MSLAB 参数以及初始化

RegionServer启动的时候，会调用 initializeMemStoreChunkCreator()方法初始化

```java

  protected void initializeMemStoreChunkCreator() {
    //是否启用MSLBA ,配置为：hbase.hregion.memstore.mslab.enabled默认为true
    if (MemStoreLAB.isEnabled(conf)) {
      // MSLAB is enabled. So initialize MemStoreChunkPool
      // By this time, the MemstoreFlusher is already initialized. We can get the global limits from
      // it.
      //获取MemStore 全局最大内存配置，heap为：hbase.regionserver.global.memstore.size，默认为0.4*最大堆
      //如果启用了MemStore Offheap ，属性 hbase.regionserver.offheap.global.memstore.size是否大于0 来决定是否启用offheap，
      //默认为0，即不启用offheap memstore
      //
      Pair<Long, MemoryType> pair = MemorySizeUtil.getGlobalMemStoreSize(conf);
      long globalMemStoreSize = pair.getFirst();
      boolean offheap = this.regionServerAccounting.isOffheap();
      // When off heap memstore in use, take full area for chunk pool.
      //offheap为1，
      //heap 根据参数：hbase.hregion.memstore.chunkpool.maxsize 来定，这个默认是1.0。
      float poolSizePercentage = offheap? 1.0F:
          conf.getFloat(MemStoreLAB.CHUNK_POOL_MAXSIZE_KEY, MemStoreLAB.POOL_MAX_SIZE_DEFAULT);
      //初始化chunk的百分比，hbase.hregion.memstore.chunkpool.initialsize 默认是0，线上被设置为0.5，即初始化50%    
      float initialCountPercentage = conf.getFloat(MemStoreLAB.CHUNK_POOL_INITIALSIZE_KEY,
          MemStoreLAB.POOL_INITIAL_SIZE_DEFAULT);
      //chunk的大小，配置参数：hbase.hregion.memstore.mslab.chunksize，默认是2MB    
      int chunkSize = conf.getInt(MemStoreLAB.CHUNK_SIZE_KEY, MemStoreLAB.CHUNK_SIZE_DEFAULT);
      // init the chunkCreator
      //初始化chunk，初始化主要通过ChunkCreator 来实现
      ChunkCreator chunkCreator =
          ChunkCreator.initialize(chunkSize, offheap, globalMemStoreSize, poolSizePercentage,
      initialCountPercentage, this.hMemManager);
    }
  }
  
```

ChunkCreator chunk 的初始化

ChunkCreator 调用init然后会new 一个ChunkCreator,最终调用initializePools 来初始化，
讲解初始化之前，先介绍一下ChunkCreator的主要数据结构，方便理解
ChunkCrator 的主要数据结构如下：

```java

  private Map<Integer, Chunk> chunkIdMap = new ConcurrentHashMap<Integer, Chunk>();

  private final boolean offheap;
  static ChunkCreator instance;

  static boolean chunkPoolDisabled = false;
  private MemStoreChunkPool dataChunksPool;
  private int chunkSize;
  private MemStoreChunkPool indexChunksPool;
  
  /**  chunkIdMap 创建的chunk的id和chunk对象的map，
   offheap：是否是offheap的
   instance  ChunkCreator 本身的示例，全局只有一个
   chunkSize， 一个chunk的大小，默认为2MB（2048*1024）
   Chunk的pool，分为：
   dataChunksPool 默认占0.9
   indexChunksPool 默认占0.1,这块参数其实有问题，后续说
   
   
```

类图：

![](/images/posts/hbase/hbase-mslab-uml1.png "HBase MSLAB 类图")

Chunk分为heap和offheap 2种实现，
Chunk 的数据结构是由data、id、size、fromPool
data:数据类型为ByteBuffer，实际存储HBase 写入MemStore 数据的地方
id:一个标记id
size：chunk 的大小
fromPool：是否存在pool中，通常都是true

MemStoreChunkPool
label:便签，一般分为index和data 
chunkSize：由多少个Chunk
maxCount：最大能容纳多少个Chunk，这个是根据算出来： maxCount = (int) (globalMemStoreSize * poolSizePercentage / chunkSize);
reclaimedChunks:可取回的chunk，其实是一个阻塞队列
poolSizePercentage:比例


initialize 方法如下：


```java
public static ChunkCreator initialize(int chunkSize, boolean offheap, long globalMemStoreSize,
                                        float poolSizePercentage, float initialCountPercentage,
                                        HeapMemoryManager heapMemoryManager) {
    if (instance != null) {
      return instance;
    }
    instance = new ChunkCreator(chunkSize, offheap, globalMemStoreSize, poolSizePercentage,
            initialCountPercentage, heapMemoryManager,
            MemStoreLABImpl.INDEX_CHUNK_PERCENTAGE_DEFAULT);
            //INDEX_CHUNK_PERCENTAGE_DEFAULT 这个地方写死了，虽然配置了hbase.hregion.memstore.mslab.indexchunksize
            //但是没用...可以改善一下，
    return instance;
  }
```

最后 ChunkCreator 调用了initializePools，初始化dataChunksPool和indexchunksPool


```java

  private void initializePools(int chunkSize, long globalMemStoreSize,
                               float poolSizePercentage, float indexChunkSizePercentage,
                               float initialCountPercentage,
                               HeapMemoryManager heapMemoryManager) {
    //dataChunksPool的label为data，indexChunkSizePercentage 默认是0.1，
    //所以就是比例是(1-0.1)*1.0=0.9,initialCountPercentage默认为0，线上设置了0.5                           
    this.dataChunksPool = initializePool("data", globalMemStoreSize,
            (1 - indexChunkSizePercentage) * poolSizePercentage,
            initialCountPercentage, chunkSize, heapMemoryManager);
    // The index chunks pool is needed only when the index type is CCM.
    // Since the pools are not created at all when the index type isn't CCM,
    // we don't need to check it here.
     //dataChunksPool的label为index，indexChunkSizePercentage 默认是0.1，
    //所以就是比例是(1-0.1)*1.0=0.1,其它和dataChunksPool一致
    this.indexChunksPool = initializePool("index", globalMemStoreSize,
            indexChunkSizePercentage * poolSizePercentage,
            initialCountPercentage, (int) (indexChunkSizePercentage * chunkSize),
            heapMemoryManager);
  }

```










