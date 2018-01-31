---
layout: post
title: HMaster 启动流程
description: HMaster 启动流程
categories: HBase
keywords: HBase，HMaster,big data
---

## HMaster 启动流程

本篇将分析 HMaster 启动流程，代码分析基于 Apache-HBase 1.1.3 

### **HMaster**
	
HMaster 启动代码为HMaster.java，main 方法负责启动
代码主要为 HMaster 和 HMasterCommandLine 类  

代码如下：
```java
 public static void main(String [] args) {
    VersionInfo.logVersion();
    new HMasterCommandLine(HMaster.class).doMain(args);
  }
```


1、首先 VersionInfo.logVersion() 打印版本信息
2、new HMasterCommandLine，调用 doMain 方法进行启动

doMain方法代码如下：
int ret = ToolRunner.run(HBaseConfiguration.create(), this, args);

主要涉及2步：
1、加载配置文件
2、启动 HMaster

#### **配置加载和检查**

配置文件加载，使用 HBaseConfiguration.create() 会加载配置文件。
加载过程中还会做版本检查和集群内存参数配置检查

代码如下

```java
  public static Configuration create() {
    Configuration conf = new Configuration();
    // In case HBaseConfiguration is loaded from a different classloader than
    // Configuration, conf needs to be set with appropriate class loader to resolve
    // HBase resources.
    conf.setClassLoader(HBaseConfiguration.class.getClassLoader());
    return addHbaseResources(conf);
  }

```

注意这里会使用 HBaseConfiguration 的 ClassLoader 来加载配置文件
加载配置文件方法如下：
1）先加载 hbase-default.xml
2）加载 hbase-site.xml
3）检查默认版本//默认不检查
4）检查集群内存配置

代码如下：  

```java
  public static Configuration addHbaseResources(Configuration conf) {
    conf.addResource("hbase-default.xml");//（1）
    conf.addResource("hbase-site.xml");//（2）

    checkDefaultsVersion(conf);//（3）
    HeapMemorySizeUtil.checkForClusterFreeMemoryLimit(conf);//（4）
    return conf;
  }
```  

##### **集群内存配置限制检查**

加载配置文件的过程中还会读取配置文件中关于集群内存的配置，进行检查。  
条件是 MemStore和BlockCache的堆内存相加不能超过最大堆内存的0.8

MemStore 内存为：
hbase.regionserver.global.memstore.size(新)/hbase.regionserver.global.memstore.upperLimit（旧，已废弃） 决定  
BlockCache：
主要与L1 Cache 和L2 Cache（heap）决定。
L1 cache 都是堆内存，由参数hfile.block.cache.size控制

L2 Cache 取决于hbase.bucketcache.ioengine的配置，
如果为ofheap的话，则由hbase.bucketcache.size
这里多说一句 HBase L2 Cache 支持 heap，offheap，file:path三种，
前 2 个对应 JVM 堆内和堆外内存 cache，第三个 file 表示使用文件系统作为 L2 缓存，如SSD

三种L2 Cache 分别对应三种 IOEngine,ByteBufferIOEngine(heap),ByteBufferIOEngine(offheap),FileIOEngine
ByteBufferIOEngine(heap)，调用 ByteBuffer.allocate 在堆内分配内存。
ByteBufferIOEngine(offheap)调用，ByteBuffer.allocateDirect（调用 unsafe 直接在堆外分配内存)

L2Cache 引擎选择
```java
  private IOEngine getIOEngineFromName(String ioEngineName, long capacity)
      throws IOException {
    if (ioEngineName.startsWith("file:"))
      return new FileIOEngine(ioEngineName.substring(5), capacity);
    else if (ioEngineName.startsWith("offheap"))
      return new ByteBufferIOEngine(capacity, true);
    else if (ioEngineName.startsWith("heap"))
      return new ByteBufferIOEngine(capacity, false);
    else
      throw new IllegalArgumentException(
          "Don't understand io engine name for cache - prefix with file:, heap or offheap");
  }
```  

ByteBufferIOEngine 堆内和堆外内存分配  
```java
  public ByteBufferArray(long capacity, boolean directByteBuffer) {
    this.bufferSize = DEFAULT_BUFFER_SIZE;
    if (this.bufferSize > (capacity / 16))
      this.bufferSize = (int) roundUp(capacity / 16, 32768);
    this.bufferCount = (int) (roundUp(capacity, bufferSize) / bufferSize);
    buffers = new ByteBuffer[bufferCount + 1];
    locks = new Lock[bufferCount + 1];
    for (int i = 0; i <= bufferCount; i++) {
      locks[i] = new ReentrantLock();
      if (i < bufferCount) {
        buffers[i] = directByteBuffer ? ByteBuffer.allocateDirect(bufferSize)
            : ByteBuffer.allocate(bufferSize);
      } else {
        buffers[i] = ByteBuffer.allocate(0);
      }

    }
  }
```

大家有兴趣可以看一下 JDK 的 ByteBuffer 和 DirectByteBuffer 类的具体实现。

扯远了。。。

#### **启动HMaster**

上步骤中配置文件加载和检查后，开始调用 HMasterCommandLine 的 run 方法启动 HMaster

1）解析检查启动选项
2）启动HMaster

如果command 解析为start,则调用HMasterCommandLine的startHMaster()方法代码启动HMater
我们来看一下startHMaster的流程
1)判断集群启动模式
2）根据不同的默认启动

HBase 集群分为 local 和 distributed 两种模式，
根据 hbase.cluster.distributed 是否为 true，
如果不是，则为 local模式，local 通常也不会使用，这里我们不关心，
我们来看一下集群模式的启动代码
startHMaster()的核心代码如下
```java
        CoordinatedStateManager csm =
          CoordinatedStateManagerFactory.getCoordinatedStateManager(conf);
        HMaster master = HMaster.constructMaster(masterClass, conf, csm);
        if (master.isStopped()) {
          LOG.info("Won't bring the Master up as a shutdown is requested");
          return 1;
        }
        master.start();
        master.join();
        if(master.isAborted())
          throw new RuntimeException("HMaster Aborted");
```
首先实例化 CoordinatedStateManager 这个类，这个类目前是通过 Zookeeper 来实现的，
用于协调管理状态相关的东西。然后实例化 HMaster，这里很重要，
HMaster 继承了 HRegionServer ，所以可以理解成 HMaster 也是一个特殊的RegionServer

实例化 HMaster 代码如下 


```java
  public HMaster(final Configuration conf, CoordinatedStateManager csm) {
    super(conf, csm);
    //初始化一些参数
    // Disable usage of meta replicas in the master
    this.conf.setBoolean(HConstants.USE_META_REPLICAS, false);

    Replication.decorateMasterConfiguration(this.conf);

    // Hack! Maps DFSClient => Master for logs.  HDFS made this
    // config param for task trackers, but we can piggyback off of it.
    if (this.conf.get("mapreduce.task.attempt.id") == null) {
      this.conf.set("mapreduce.task.attempt.id", "hb_m_" + this.serverName.toString());
    }

    // should we check the compression codec type at master side, default true, HBASE-6370
    this.masterCheckCompression = conf.getBoolean("hbase.master.check.compression", true);

    // should we check encryption settings at master side, default true
    this.masterCheckEncryption = conf.getBoolean("hbase.master.check.encryption", true);

    this.metricsMaster = new MetricsMaster(new MetricsMasterWrapperImpl(this));

    // Check configuration to see whether procedure is disabled (not execute at all),
    // unused (not used to execute DDL, but executor starts to complete unfinished operations
    // in procedure store, or enabled (default behavior).
    String procedureConfString = conf.get("hbase.master.procedure.tableddl", "enabled");
    if (procedureConfString.equalsIgnoreCase("disabled")) {
      LOG.info("Master will use handler for new table DDL"
        + " and all unfinished table DDLs in procedure store will be disgarded.");
      this.procedureConf = ProcedureConf.PROCEDURE_FULLY_DISABLED;
    } else if (procedureConfString.equalsIgnoreCase("unused")) {
      LOG.info("Master will use handler for new table DDL"
        + " and all unfinished table DDLs in procedure store will continue to execute.");
      this.procedureConf = ProcedureConf.HANDLER_USED;
    } else {
      this.procedureConf = ProcedureConf.PROCEDURE_ENABLED;
    }
    // preload table descriptor at startup
    this.preLoadTableDescriptors = conf.getBoolean("hbase.master.preload.tabledescriptors", true);

    // Do we publish the status?

    boolean shouldPublish = conf.getBoolean(HConstants.STATUS_PUBLISHED,
        HConstants.STATUS_PUBLISHED_DEFAULT);
    Class<? extends ClusterStatusPublisher.Publisher> publisherClass =
        conf.getClass(ClusterStatusPublisher.STATUS_PUBLISHER_CLASS,
            ClusterStatusPublisher.DEFAULT_STATUS_PUBLISHER_CLASS,
            ClusterStatusPublisher.Publisher.class);

    if (shouldPublish) {
      if (publisherClass == null) {
        LOG.warn(HConstants.STATUS_PUBLISHED + " is true, but " +
            ClusterStatusPublisher.DEFAULT_STATUS_PUBLISHER_CLASS +
            " is not set - not publishing status");
      } else {
        clusterStatusPublisherChore = new ClusterStatusPublisher(this, conf, publisherClass);
        getChoreService().scheduleChore(clusterStatusPublisherChore);
      }
    }

    // Some unit tests don't need a cluster, so no zookeeper at all
    if (!conf.getBoolean("hbase.testing.nocluster", false)) {
      activeMasterManager = new ActiveMasterManager(zooKeeper, this.serverName, this);
      int infoPort = putUpJettyServer();
      startActiveMasterManager(infoPort);
    } else {
      activeMasterManager = null;
    }
  }
```




1）首先构建执行父类的构造方法，也就是HRegionServer的构造方法
  HRegionServer 构造方法完成如下几个事情
  ```java
    public HRegionServer(Configuration conf, CoordinatedStateManager csm)
      throws IOException, InterruptedException {
    this.fsOk = true;
    this.conf = conf;
	//1、检查压缩，执行压缩格式支持测试
    checkCodecs(this.conf);
    this.userProvider = UserProvider.instantiate(conf);
    //2、初始化超级用户信息
    Superusers.initialize(conf);
	//3、初始化设置短路读,这两个属性不能同时设置为true，
    //设置dfs.client.read.shortcircuit.buffer.size默认值为BLOCK_SIZE*2=128K
    FSUtils.setupShortCircuitRead(this.conf);dfs.client.read.shortcircuit.skip.checksum,hbase.regionserver.checksum.verify
  
    //3、设置hbase.meta.replicas.use 为false
    // Disable usage of meta replicas in the regionserver
    this.conf.setBoolean(HConstants.USE_META_REPLICAS, false);

    // Config'ed params
    //4、设置参数，1、默认重试次数，2、线程唤醒频率 3、Sleeper 线程检查频率
    this.numRetries = this.conf.getInt(HConstants.HBASE_CLIENT_RETRIES_NUMBER,
        HConstants.DEFAULT_HBASE_CLIENT_RETRIES_NUMBER);
    this.threadWakeFrequency = conf.getInt(HConstants.THREAD_WAKE_FREQUENCY, 10 * 1000);
    this.msgInterval = conf.getInt("hbase.regionserver.msginterval", 3 * 1000);

    //5、实例化Sleeper 线程，该线程用于检测进程停顿,
    this.sleeper = new Sleeper(this.msgInterval, this);

    //6、实例化NonceManager
    //nonceManager 用于处理append/increment 被客户端多次重试发送的情况
    //HBase Client RPC提交后，如果因为服务端响应超时，
    //则会重新发起请求直到重试或者达到重试次数失败。
    //多次RPC 发起append/increment可能会导致被多次操作的情况。
    //HBase的NonceManager用于处理这种情况。这个特性默认是开启的。
    //简单来讲，ClientProtos中有两个参数nonceGroup和nonce 会携带到RPC请求中，
    //这两个参数构成一个NonceKey，可以标记某个重复的请求。
    //处理increment和append的时候，会拿到这个NonceKey
    //从ServerNonceManager的nonces(ConcurrentHashMap)中判断是否存在，
    //如果存在则判断该Operation的状态：
     //DONT_PROCEED：已经被成功处理，不需要操作，直接忽略即可；
    //PROCEED：已经被处理，但失败,此时需要重新执行；
    //WAIT：还在处理，继续等待，根据处理结果来决定下一步操作；
    // 有兴趣可以看ServerNonceManager的代码，比较简单易懂
    boolean isNoncesEnabled = conf.getBoolean(HConstants.HBASE_RS_NONCES_ENABLED, true);
    this.nonceManager = isNoncesEnabled ? new ServerNonceManager(this.conf) : null;

    //7、初始化一些参数属性
    this.numRegionsToReport = conf.getInt(
      "hbase.regionserver.numregionstoreport", 10);

    this.operationTimeout = conf.getInt(
      HConstants.HBASE_CLIENT_OPERATION_TIMEOUT,
      HConstants.DEFAULT_HBASE_CLIENT_OPERATION_TIMEOUT);

    this.shortOperationTimeout = conf.getInt(
      HConstants.HBASE_RPC_SHORTOPERATION_TIMEOUT_KEY,
      HConstants.DEFAULT_HBASE_RPC_SHORTOPERATION_TIMEOUT);

    this.abortRequested = false;
    this.stopped = false;
    //8、实例化RPC服务
    rpcServices = createRpcServices();
    this.startcode = System.currentTimeMillis();
    if (this instanceof HMaster) {
      useThisHostnameInstead = conf.get(MASTER_HOSTNAME_KEY);
    } else {
      useThisHostnameInstead = conf.get(RS_HOSTNAME_KEY);
    }
    String hostName = shouldUseThisHostnameInstead() ? useThisHostnameInstead :
      rpcServices.isa.getHostName();
    serverName = ServerName.valueOf(hostName, rpcServices.isa.getPort(), startcode);

    //实例化RPCControllerFactory，用于RPC负载控制
    rpcControllerFactory = RpcControllerFactory.instantiate(this.conf);
    //实例化rpcRetryingCallerFactory,用于RPC重试
    rpcRetryingCallerFactory = RpcRetryingCallerFactory.instantiate(this.conf);

     // kerberos登录（zookeeper+regionServer)
    // login the zookeeper client principal (if using security)
    ZKUtil.loginClient(this.conf, HConstants.ZK_CLIENT_KEYTAB_FILE,
      HConstants.ZK_CLIENT_KERBEROS_PRINCIPAL, hostName);
    // login the server principal (if using secure Hadoop)
    login(userProvider, hostName);

    //实例化 RegionServerAccounting，该类用于统计全局 memstore 大小
    regionServerAccounting = new RegionServerAccounting();
    //实例化uncaughtExceptionHandler
    uncaughtExceptionHandler = new UncaughtExceptionHandler() {
      @Override
      public void uncaughtException(Thread t, Throwable e) {
        abort("Uncaught exception in service thread " + t.getName(), e);
      }
    };

    useZKForAssignment = ConfigUtil.useZKForAssignment(conf);

    // Set 'fs.defaultFS' to match the filesystem on hbase.rootdir else
    // underlying hadoop hdfs accessors will be going against wrong filesystem
    // (unless all is set to defaults).
    FSUtils.setFsDefault(this.conf, FSUtils.getRootDir(this.conf));
    // Get fs instance used by this RS.  Do we use checksum verification in the hbase? If hbase
    // checksum verification enabled, then automatically switch off hdfs checksum verification.
    boolean useHBaseChecksum = conf.getBoolean(HConstants.HBASE_CHECKSUM_VERIFICATION, true);
    //实例化 HFileSystem,这个是操作 HFILE 文件系统的类，
    //继续自 HDFS 的 FileSystem，用于读写 HDFS
    this.fs = new HFileSystem(this.conf, useHBaseChecksum);
    this.rootDir = FSUtils.getRootDir(this.conf);
    //实例化 FSTableDescriptors，这个是类是用用来操作读写 HDFS中表路径的定义，
    //临时文件目录的，如读写表的定义。
    //如启动时，将HDFS中的 ，tablePath/.tabledesc/.tableinfo.0000000001 
    //加载到内存中，这里RegionServer 对象的参数是 readonly,HMaster 是可写的
    this.tableDescriptors = new FSTableDescriptors(
      this.conf, this.fs, this.rootDir, !canUpdateTableDescriptor(), false);
    //实例化 ExecutorService，该类用于承载多个线程池，主要对象就是 Executor 的 map
    service = new ExecutorService(getServerName().toShortString());
    spanReceiverHost = SpanReceiverHost.getInstance(getConfiguration());


     //初始化 Zookeeper Coordination 相关内容
    // Some unit tests don't need a cluster, so no zookeeper at all
    if (!conf.getBoolean("hbase.testing.nocluster", false)) {
        //实例化zookeeperWatcher，canCreateBaseZNode只有Hmaster 才可以创建baseZNode
      // Open connection to zookeeper and set primary watcher
      zooKeeper = new ZooKeeperWatcher(conf, getProcessName() + ":" +
        rpcServices.isa.getPort(), this, canCreateBaseZNode());
      //实例化 ZkCoordinatedStateManager，这个类主要包括:
      //ZooKeeperWatcher，以及各种Coordination，包
     //splitLogWorkerCoordination，splitTransactionCoordination，
     //splitLogManagerCoordination，closeRegionCoordination，
	//openRegionCoordination，regionMergeCoordination,
	//通过ZooKeeperWatcher 监听zookeeper 相应的znode节点信息，
	//如果一旦发生变化，则做相应的操作,如修改znode状态等
      this.csm = (BaseCoordinatedStateManager) csm;
      this.csm.initialize(this);
      this.csm.start();

      
      //创建 TableLockManager，该类实现了一个分布式的表锁（通过zookeeper），
      //默认是开启的，表锁如修改schema的时候，需要锁表
      tableLockManager = TableLockManager.createTableLockManager(
        conf, zooKeeper, serverName);

      //实例化 MasterAddressTracker，用于跟踪 HMaster 的地址 ，
      //zonde 为${zookeeper.znode.parent}/master
      masterAddressTracker = new MasterAddressTracker(getZooKeeper(), this);
      //启动 MasterAddressTracker 
      masterAddressTracker.start();
 
      //用于追踪集群的状态，${zookeeper.znode.parent}/running
      clusterStatusTracker = new ClusterStatusTracker(zooKeeper, this);
      //启动 ClusterStatusTracker 
      clusterStatusTracker.start();
    }

    // 实例化 ConfigurationManager，该类用来实现动态加载配置，
    //目前 HBase 支持部分配置动态加载，如 Compaction 一些参数等；
    //未来会支持更多动态配置加载
    this.configurationManager = new ConfigurationManager();

    //启动RPCService, 最终调用RpcServer的start 方法启动，
    //此步骤主要是启动 responder、listener、scheduler 的 start()方法;
    //1)、Responder 用于向客户端发送 RPC 调用结果，
    //通过 JAVA NIO Selector+ loop 实现。
    //2、Listener 用于监听 RPC 端口，处理请求，
    // ServerSocketChannel+Selector+ ThreadPool（Reader)实现
    //3、scheduler 是一个 rpc 处理调度器，用于构建 hanlders,用于调度 处理CallRunner。
    //目前有两种实现， SimpleRpcScheduler 和 FifoRpcScheduler，
    //默认为SimpleRpcScheduler
    rpcServices.start();
    //启动 info web ui， 基于jetty 的 HttpServer，
    //如果是RegionServer 则启用RegionServer WebUI
    //如果是 HMaster 则启动 HMaster WEBUI
    putUpWebUI();
    this.walRoller = new LogRoller(this, this);
    this.choreService = new ChoreService(getServerName().toString());
  }
  ```

```java
初始化参数部分
//用于打印FATAL错误
 this.rsFatals = new MemoryBoundedLogMessageBuffer(
      conf.getLong("hbase.master.buffer.for.rs.fatals", 1*1024*1024));
	//meta replicas 设置为 false 
    // Disable usage of meta replicas in the master
    this.conf.setBoolean(HConstants.USE_META_REPLICAS, false);
    //初始化修改一些 replication 相关的参数，目前是hbase.master.logcleaner.plugins ，master 清理 WAL 的插件
    Replication.decorateMasterConfiguration(this.conf);

     //不知道什么意思。。。
    // Hack! Maps DFSClient => Master for logs.  HDFS made this
    // config param for task trackers, but we can piggyback off of it.
    if (this.conf.get("mapreduce.task.attempt.id") == null) {
      this.conf.set("mapreduce.task.attempt.id", "hb_m_" + this.serverName.toString());
    }
     //配置是否检查压缩支持
    // should we check the compression codec type at master side, default true, HBASE-6370
    this.masterCheckCompression = conf.getBoolean("hbase.master.check.compression", true);
    //配置是否检查加密支持
    // should we check encryption settings at master side, default true
    this.masterCheckEncryption = conf.getBoolean("hbase.master.check.encryption", true);


```



