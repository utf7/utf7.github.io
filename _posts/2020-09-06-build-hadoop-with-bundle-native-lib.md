---
layout: post
title: 编译 hadoop3 并绑定 native 库
description: 编译 hadoop3 并绑定 native 库,snappy,zstd,isal
categories: [Hadoop]
keywords: hadoop,zstd,snappy,isal,ISA-L,编译hadoop,native
excerpt: hadoop,native
---

#  编译 hadoop3 并绑定 native 库
  
最近由于工作需要，需要编译hadoop3，hadoop 3本身编译比较简单；但是由于涉及到 native 库，社区提供的安装包中不包括 native 库，比如压缩算法的zstd、snappy 以及纠删码的ISA-L，所以会比较麻烦。 本文将介绍如何编译并绑定native库，记录一下，或许会对其他人有些帮助。



## 需要加入的native 

1、isa-l

用于纠删码

2、snappy

谷歌出品的 snappy 压缩算法，hadoop生态很常用的压缩算法。​

3、zstd
Facebook 出品的 zstd 压缩算法，也是近年来 Hadoop 生态常用压缩库，强烈推荐。

当然也可以根据需要添加一些其他的，比如 lzo 等等。


###  编译isa-l

```shell
git clone https://github.com/intel/isa-l.git
cd isa-l/
git tag
git checkout v2.29.0 -b v2.29
yum install -y yasm(已经安装则不需要）
yum install -y nasm（已经安装则不需要）
yum install -y help2man（已经安装则不需要）



./autogen.sh
./configure --prefix=/usr --libdir=/usr/lib64
make
make install
```



查看编译后的 lib ：


![](/images/posts/hadoop/build-hadoop-with-native/isal-lib.png "isal-lib.png")

### 编译zstd

```shell
https://github.com/facebook/zstd/tags 

下载源代码 这里是1.4.5

tar -zxvf zstd-1.4.5.tar.gz

cd zstd-1.4.5/

make && make install

注意 zstd 默认 在 /usr/local/lib 下面 
```


![](/images/posts/hadoop/build-hadoop-with-native/zstd-lib.png "zstd-lib.png")



### 编译snappy

笔者的环境中 snappy 已经有了，这里就不编译了

![](/images/posts/hadoop/build-hadoop-with-native/snappy-lib.png "snappy-lib.png")

如果没有的话，则执行如下命令可以安装：

```yum install snappy snappy-devel```




### 编译 protobuff

```
#如果编译protobuf报错： error: C++ preprocessor "/lib/cpp" fails sanity check
#则需要 yum install gcc-c++

wget https://github.com/protocolbuffers/protobuf/releases/download/v2.5.0/protobuf-2.5.0.tar.gz
tar -zxvf protobuf-2.5.0.tar.gz
cd protobuf-2.5.0
./configure
make
make check
make install
```

### cmake 

如果cmake 没有，或者版本过低的话，则执行如下
```
[ERROR] Failed to execute goal org.apache.hadoop:hadoop-maven-plugins:3.2.1-xima-2022021512:cmake-compile (cmake-compile) on project hadoop-common: Error executing CMake: Cannot run program "cmake" (in directory "/root/project/hadoop/hadoop-common-project/hadoop-common/target/native"): error=2, 没有那个文件或目录 -> [Help 1]

 yum install -y cmake3

 ln -s /usr/bin/cmake3 /usr/bin/cmake
 ```


### zlib

如果没有安装zlib的话，可以执行如下命令安装

```
ING] CMake Error at /usr/share/cmake3/Modules/FindPackageHandleStandardArgs.cmake:164 (message):
[WARNING]   Could NOT find ZLIB (missing: ZLIB_INCLUDE_DIR)

yum install -y zlib-devel
```

### 安装openssl

如果没有openssl的话，则
 ```
[WARNING] CMake Error at /usr/share/cmake3/Modules/FindPackageHandleStandardArgs.cmake:164 (message):
[WARNING]   Could NOT find OpenSSL, try to set the path to OpenSSL root folder in the
[WARNING]   system variable OPENSSL_ROOT_DIR (missing: OPENSSL_CRYPTO_LIBRARY

yum install -y  openssl-devel
```

### 编译hadoop3 

上面的库都编译好以后，我们开始编译 `hadoop3`，并且支持 `ISA-L,zstd,snappy`

#### 编译 hadoop3 同时绑定 zstd,snappy,isa-l

注意`zstd`与`isal` 和`snappy` 目录

```shell
mvn clean install -DskipTests -Pdist,native  -Dtar -Dbundle.snappy=true -Drequire.snappy=true  -Dsnappy.prefix=/usr/lib64  -Dsnappy.lib=/usr/lib64  -Drequire.zstd=true -Dbundle.zstd=true -Dzstd.lib=/usr/local/lib -Dbundle.isal=true -Drequire.isal=true -Disal.prefix=/usr/lib64 -Disal.lib=/usr/lib64  
```

bundle openssl 

```
mvn clean install -DskipTests -Pdist,native  -Dtar -Dbundle.snappy=true -Drequire.snappy=true  -Dsnappy.prefix=/usr/lib64  -Dsnappy.lib=/usr/lib64  -Drequire.zstd=true -Dbundle.zstd=true -Dzstd.lib=/usr/local/lib -Dbundle.isal=true -Drequire.isal=true -Disal.prefix=/usr/lib64 -Disal.lib=/usr/lib64  -Drequire.openssl=true -Dbundle.openssl=true -Dopenssl.lib=/usr/lib64
```

编译完成后，会在 hadoop-dist/target 目录下产生 hadoop-${version}.tar.gz 的包，如下图

![](/images/posts/hadoop/build-hadoop-with-native/hadoop-build-out-tar.png "hadoop-build-out-tar.png")

#### 查看 `native` 包是否存在：

![](/images/posts/hadoop/build-hadoop-with-native/native-list.png "native-list.png")

#### 验证 native 

`export HADOOP_HOME=/root/cyc/hadoop/hadoop-dist/target/hadoop-3.2.1/`

然后切换到 `bin` 目录 `cd bin`

执行 `hadoop checknative `

![](/images/posts/hadoop/build-hadoop-with-native/checknative.png "checknative.png")







### 错误处理：

 可能出现如下错误的解决办法：

yum install -y cyrus-sasl*（已经安装了cyrus 则不需要）



```verilog
[WARNING] -- valgrind location: MEMORYCHECK_COMMAND-NOTFOUND
[WARNING] CMake Error at main/native/libhdfspp/CMakeLists.txt:135 (message):
[WARNING]   Cound not find a SASL library (GSASL (gsasl) or Cyrus SASL (libsasl2).
[WARNING]   Install/configure one of them or define NO_SASL=1 in your cmake call
[WARNING]
[WARNING]
[WARNING] -- Configuring incomplete, errors occurred!
[WARNING] See also "/root/cyc/hadoop/hadoop-hdfs-project/hadoop-hdfs-native-client/target/CMakeFiles/CMakeOutput.log".
[WARNING] See also "/root/cyc/hadoop/hadoop-hdfs-project/hadoop-hdfs-native-client/target/CMakeFiles/CMakeError.log".
```



### 编译好的地址

编译 native 还是比较麻烦的，为了方便大家编译，我把在CentOS 7 中编译好的 native 放到了GitHub 上面，理论上centos/readhat 7 应该可以直接用。

仓库地址如下：

https://github.com/utf7/hadoop-native/tree/master/native



参考链接：

1. https://github.com/facebook/zstd
2. https://github.com/google/snappy
3. https://github.com/intel/isa-l
4. https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/NativeLibraries.html
5. https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HDFSErasureCoding.html
6. https://github.com/apache/hadoop/blob/rel/release-3.2.1/BUILDING.txt




